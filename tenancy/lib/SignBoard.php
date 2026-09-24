<?php

declare(strict_types=1);

use Bitrix\Main\Loader;
use Bitrix\Sign\Service\Container;

final class TenancySignBoard
{
	/**
	 * @return list<array<string, mixed>>
	 */
	public static function list(): array
	{
		if (!Loader::includeModule('sign')) {
			return [];
		}

		$conn = \Bitrix\Main\Application::getConnection();
		if (!$conn->isTableExists('b_sign_document')) {
			return [];
		}

		$res = $conn->query(
			"SELECT ID, TITLE, STATUS, ENTITY_ID, UID, CREATED_BY_ID, DATE_CREATE
			FROM b_sign_document
			WHERE TITLE LIKE 'Tenancy Contract%'
			ORDER BY ID DESC
			LIMIT 50"
		);
		$docs = [];
		$entityIds = [];
		while ($row = $res->fetch()) {
			$docs[] = $row;
			$eid = (int)($row['ENTITY_ID'] ?? 0);
			if ($eid > 0) {
				$entityIds[] = $eid;
			}
		}

		$crm = self::crmItems($entityIds);
		$out = [];
		foreach ($docs as $row) {
			$entityId = (int)($row['ENTITY_ID'] ?? 0);
			$crmItem = $crm[$entityId] ?? null;
			$stage = $crmItem
				? self::fromCrmStage((string)$crmItem['stage'])
				: TenancyTracker::normalize((string)($row['STATUS'] ?? 'draft'));
			$date = $row['DATE_CREATE'] ?? '';
			if (is_object($date) && method_exists($date, 'getTimestamp')) {
				$ts = (int)$date->getTimestamp();
			} else {
				$ts = strtotime((string)$date) ?: 0;
			}
			$out[] = [
				'source' => 'sign',
				'documentId' => (int)$row['ID'],
				'entityId' => $entityId,
				'uid' => (string)($row['UID'] ?? ''),
				'title' => (string)($crmItem['title'] ?? $row['TITLE'] ?? 'Document'),
				'stage' => $stage,
				'stageLabel' => TenancyTracker::label($stage),
				'signStatus' => (string)($row['STATUS'] ?? ''),
				'signUrl' => $entityId > 0 ? '/sign/doc/' . $entityId . '/' : '/sign/',
				'assignedId' => (int)($crmItem['assigned'] ?? $row['CREATED_BY_ID'] ?? 0),
				'createdAt' => $ts,
			];
		}
		return $out;
	}

	public static function entityIdForDocument(int $documentId): int
	{
		if ($documentId <= 0 || !Loader::includeModule('sign')) {
			return 0;
		}
		$conn = \Bitrix\Main\Application::getConnection();
		if (!$conn->isTableExists('b_sign_document')) {
			return 0;
		}
		$row = $conn->query(
			'SELECT ENTITY_ID FROM b_sign_document WHERE ID = ' . (int)$documentId . ' LIMIT 1'
		)->fetch();
		return $row ? (int)($row['ENTITY_ID'] ?? 0) : 0;
	}

	public static function stageForEntity(int $entityId): ?string
	{
		if ($entityId <= 0) {
			return null;
		}
		$crm = self::crmItems([$entityId]);
		if (!isset($crm[$entityId])) {
			return null;
		}
		return self::fromCrmStage((string)$crm[$entityId]['stage']);
	}

	public static function syncTrackerRow(array $row): ?array
	{
		$entityId = (int)($row['entityId'] ?? 0);
		if ($entityId <= 0) {
			return null;
		}
		$remote = self::stageForEntity($entityId);
		if ($remote === null) {
			return null;
		}
		$local = TenancyTracker::normalize((string)($row['stage'] ?? ''));
		if ($remote === $local) {
			return null;
		}
		return TenancyTracker::update((string)$row['id'], ['stage' => $remote]);
	}

	public static function moveCrm(int $entityId, string $stage): bool
	{
		if ($entityId <= 0 || !Loader::includeModule('crm')) {
			return false;
		}
		$factory = self::factory();
		if ($factory === null) {
			return false;
		}
		$item = $factory->getItem($entityId);
		if ($item === null) {
			return false;
		}
		$stageId = self::crmStageId($stage);
		if ($stageId === '') {
			return false;
		}
		try {
			$item->setStageId($stageId);
			$op = $factory->getUpdateOperation($item);
			if (method_exists($op, 'disableCheckAccess')) {
				$op->disableCheckAccess();
			}
			return $op->launch()->isSuccess();
		} catch (\Throwable $e) {
			return false;
		}
	}

	/**
	 * @param list<int> $ids
	 * @return array<int, array{title:string,stage:string,assigned:int}>
	 */
	private static function crmItems(array $ids): array
	{
		$ids = array_values(array_unique(array_filter($ids)));
		if ($ids === [] || !Loader::includeModule('crm')) {
			return [];
		}
		$factory = self::factory();
		if ($factory === null) {
			return [];
		}
		$out = [];
		try {
			$items = $factory->getItems([
				'filter' => ['@ID' => $ids],
				'select' => ['ID', 'TITLE', 'STAGE_ID', 'ASSIGNED_BY_ID'],
				'limit' => 60,
			]);
			foreach ($items as $item) {
				$id = (int)$item->getId();
				$out[$id] = [
					'title' => (string)$item->getTitle(),
					'stage' => (string)$item->getStageId(),
					'assigned' => (int)$item->getAssignedById(),
				];
			}
		} catch (\Throwable $e) {
			return [];
		}
		return $out;
	}

	private static function factory(): ?object
	{
		if (!class_exists(\CCrmOwnerType::class)) {
			return null;
		}
		$ref = new \ReflectionClass(\CCrmOwnerType::class);
		$typeId = $ref->hasConstant('SmartDocument') ? (int)$ref->getConstant('SmartDocument') : 0;
		if ($typeId <= 0) {
			return null;
		}
		return \Bitrix\Crm\Service\Container::getInstance()->getFactory($typeId);
	}

	private static function crmStageId(string $stage): string
	{
		$stage = TenancyTracker::normalize($stage);
		$map = [];
		$factory = self::factory();
		if ($factory !== null) {
			try {
				foreach ($factory->getStages() as $st) {
					$id = (string)$st->getStatusId();
					$name = strtolower((string)$st->getName());
					$key = TenancyTracker::normalize($name);
					if (str_contains($id, 'DRAFT')) {
						$key = TenancyTracker::STAGE_DRAFT;
					} elseif (str_contains($id, 'PROCESSING')) {
						$key = TenancyTracker::STAGE_REVIEW;
					} elseif (str_contains($id, 'SEMI')) {
						$key = TenancyTracker::STAGE_PARTIAL;
					} elseif (str_contains($id, 'NOTSIGNED') || str_contains($id, 'ARCHIVE')) {
						continue;
					} elseif (str_contains($id, 'SIGNED')) {
						$key = TenancyTracker::STAGE_SIGNED;
					} elseif (str_contains($id, 'SENT')) {
						$key = TenancyTracker::STAGE_SENT;
					}
					$map[$key] = $id;
				}
			} catch (\Throwable $e) {
				// fallback below
			}
		}
		return $map[$stage] ?? match ($stage) {
			TenancyTracker::STAGE_DRAFT => 'DT36_3:DRAFT',
			TenancyTracker::STAGE_REVIEW => 'DT36_3:PROCESSING',
			TenancyTracker::STAGE_SENT => 'DT36_3:SENT',
			TenancyTracker::STAGE_PARTIAL => 'DT36_3:SEMISIGNED',
			TenancyTracker::STAGE_SIGNED => 'DT36_3:SIGNED',
			default => '',
		};
	}

	private static function fromCrmStage(string $crmStageId): string
	{
		$id = strtoupper($crmStageId);
		if (str_contains($id, 'DRAFT')) {
			return TenancyTracker::STAGE_DRAFT;
		}
		if (str_contains($id, 'PROCESSING')) {
			return TenancyTracker::STAGE_REVIEW;
		}
		if (str_contains($id, 'SEMI')) {
			return TenancyTracker::STAGE_PARTIAL;
		}
		if (str_contains($id, 'SENT')) {
			return TenancyTracker::STAGE_SENT;
		}
		if (str_contains($id, 'NOTSIGNED') || str_contains($id, 'ARCHIVE')) {
			return TenancyTracker::STAGE_DRAFT;
		}
		if (str_contains($id, 'SIGNED')) {
			return TenancyTracker::STAGE_SIGNED;
		}
		return TenancyTracker::STAGE_DRAFT;
	}
}
