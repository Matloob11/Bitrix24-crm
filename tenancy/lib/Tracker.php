<?php

declare(strict_types=1);

final class TenancyTracker
{
	public const STAGE_DRAFT = 'draft';
	public const STAGE_REVIEW = 'review';
	public const STAGE_SENT = 'sent';
	public const STAGE_PARTIAL = 'partial';
	public const STAGE_SIGNED = 'signed';

	/** @deprecated use STAGE_DRAFT */
	public const STAGE_SIGN = 'draft';
	/** @deprecated use STAGE_SENT */
	public const STAGE_OWNER = 'sent';
	/** @deprecated use STAGE_SENT */
	public const STAGE_TENANT = 'sent';

	/**
	 * @return list<array{id:string,label:string}>
	 */
	public static function columns(): array
	{
		return [
			['id' => self::STAGE_DRAFT, 'label' => 'Draft'],
			['id' => self::STAGE_REVIEW, 'label' => 'Under review'],
			['id' => self::STAGE_SENT, 'label' => 'Sent'],
			['id' => self::STAGE_PARTIAL, 'label' => 'Partially signed'],
			['id' => self::STAGE_SIGNED, 'label' => 'Signed'],
		];
	}

	public static function normalize(string $stage): string
	{
		$stage = strtolower(trim($stage));
		return match ($stage) {
			'sign', 'draft', 'new', 'uploaded', 'ready' => self::STAGE_DRAFT,
			'review', 'processing', 'under_review', 'human_review' => self::STAGE_REVIEW,
			'owner_contract', 'tenant_contract', 'sent', 'signing' => self::STAGE_SENT,
			'partial', 'semisigned', 'partially_signed' => self::STAGE_PARTIAL,
			'signed', 'done' => self::STAGE_SIGNED,
			default => $stage !== '' ? $stage : self::STAGE_DRAFT,
		};
	}

	public static function isKnown(string $stage): bool
	{
		$n = self::normalize($stage);
		return in_array($n, [
			self::STAGE_DRAFT,
			self::STAGE_REVIEW,
			self::STAGE_SENT,
			self::STAGE_PARTIAL,
			self::STAGE_SIGNED,
		], true);
	}

	/**
	 * @return list<array<string, mixed>>
	 */
	public static function all(): array
	{
		$rows = self::read();
		usort($rows, static fn($a, $b) => (int)($b['createdAt'] ?? 0) <=> (int)($a['createdAt'] ?? 0));
		return array_slice($rows, 0, 60);
	}

	/**
	 * @param array<string, mixed> $row
	 */
	public static function add(array $row): string
	{
		$id = 'tc-' . time() . '-' . bin2hex(random_bytes(3));
		$row['id'] = $id;
		$row['createdAt'] = time();
		if (isset($row['stage'])) {
			$row['stage'] = self::normalize((string)$row['stage']);
		}
		$rows = self::read();
		$rows[] = $row;
		self::write($rows);
		return $id;
	}

	/**
	 * @param array<string, mixed> $patch
	 * @return array<string, mixed>|null
	 */
	public static function update(string $id, array $patch): ?array
	{
		if (isset($patch['stage'])) {
			$patch['stage'] = self::normalize((string)$patch['stage']);
		}
		$rows = self::read();
		foreach ($rows as $i => $row) {
			if ((string)($row['id'] ?? '') !== $id) {
				continue;
			}
			$rows[$i] = array_merge($row, $patch);
			self::write($rows);
			return $rows[$i];
		}
		return null;
	}

	public static function get(string $id): ?array
	{
		foreach (self::read() as $row) {
			if ((string)($row['id'] ?? '') === $id) {
				return $row;
			}
		}
		return null;
	}

	public static function label(string $stage): string
	{
		return match (self::normalize($stage)) {
			self::STAGE_DRAFT => 'Draft',
			self::STAGE_REVIEW => 'Under review',
			self::STAGE_SENT => 'Sent',
			self::STAGE_PARTIAL => 'Partially signed',
			self::STAGE_SIGNED => 'Signed',
			default => $stage,
		};
	}

	public static function findByEntityId(int $entityId): ?array
	{
		if ($entityId <= 0) {
			return null;
		}
		foreach (self::read() as $row) {
			if ((int)($row['entityId'] ?? 0) === $entityId) {
				return $row;
			}
		}
		return null;
	}

	public static function findByDocumentId(int $documentId): ?array
	{
		if ($documentId <= 0) {
			return null;
		}
		foreach (self::read() as $row) {
			if ((int)($row['documentId'] ?? 0) === $documentId) {
				return $row;
			}
		}
		return null;
	}

	public static function fromSendTo(string $sendTo): string
	{
		return self::STAGE_SENT;
	}

	/**
	 * @return list<array<string, mixed>>
	 */
	private static function read(): array
	{
		$path = self::path();
		if (!is_readable($path)) {
			return [];
		}
		$data = json_decode((string)file_get_contents($path), true);
		return is_array($data) ? $data : [];
	}

	/**
	 * @param list<array<string, mixed>> $rows
	 */
	private static function write(array $rows): void
	{
		$dir = tenancy_data_dir();
		if (!is_dir($dir)) {
			@mkdir($dir, 0700, true);
		}
		file_put_contents(self::path(), json_encode($rows, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT), LOCK_EX);
	}

	private static function path(): string
	{
		return tenancy_data_dir() . '/contracts.json';
	}
}
