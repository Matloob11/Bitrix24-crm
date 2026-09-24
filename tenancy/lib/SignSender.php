<?php

declare(strict_types=1);

use Bitrix\Main\Engine\CurrentUser;
use Bitrix\Main\Loader;
use Bitrix\Sign\Item\Fs\FileCollection;
use Bitrix\Sign\Service\Container;
use Bitrix\Sign\Type\BlankScenario;
use Bitrix\Sign\Type\Member\EntityType;
use Bitrix\Sign\Type\Member\Role;

final class TenancySign
{
	/**
	 * @param array<string, mixed> $data
	 * @return array{ok:bool, url?:string, error?:string, documentId?:int}
	 */
	public static function send(array $data, string $pdfBinary, int $userId): array
	{
		if (!Loader::includeModule('sign')) {
			return ['ok' => false, 'error' => 'Sign module is not installed.'];
		}

		$user = CurrentUser::get();
		$email = (string)($user->getEmail() ?? '');
		if ($email === '') {
			return ['ok' => false, 'error' => 'Your Bitrix user has no email. Add it in your profile — Sign cannot send without it.'];
		}

		$dir = rtrim(sys_get_temp_dir(), '/\\');
		$stamp = $userId . '-' . time();
		$pdfPath = $dir . '/tenancy-' . $stamp . '.pdf';
		if (file_put_contents($pdfPath, $pdfBinary) === false) {
			return ['ok' => false, 'error' => 'Could not write the PDF file.'];
		}

		$pageIds = self::savePages($pdfPath, $pdfBinary);
		@unlink($pdfPath);
		if ($pageIds === []) {
			return ['ok' => false, 'error' => 'Could not save the contract pages in Bitrix.'];
		}

		$container = Container::instance();
		$blankService = method_exists($container, 'getSignBlankService')
			? $container->getSignBlankService()
			: $container->getBlankService();
		$blankResult = $blankService->createFromFileIds($pageIds, BlankScenario::B2B);
		if (!$blankResult->isSuccess()) {
			$legacy = new \Bitrix\Sign\File($pageIds[0]);
			$fsFile = \Bitrix\Sign\Item\Fs\File::createByLegacyFile($legacy);
			$blankResult = $blankService->createFromFile(
				new FileCollection($fsFile),
				BlankScenario::B2B
			);
		}
		if (!$blankResult->isSuccess()) {
			return ['ok' => false, 'error' => self::err($blankResult, 'Could not create the Sign template.')];
		}
		$blankId = (int)$blankResult->getId();

		$title = self::title($data);
		$entityId = self::createSmartEntity($title, $userId);
		$entityType = class_exists(\Bitrix\Sign\Type\Document\EntityType::class)
			? \Bitrix\Sign\Type\Document\EntityType::SMART
			: 'SMART';
		$docService = $container->getDocumentService();
		$reg = self::register($docService, $blankId, $userId, $title, $entityId, $entityType);
		if (!$reg->isSuccess()) {
			return ['ok' => false, 'error' => self::err($reg, 'Could not register the Sign document.')];
		}

		$payload = $reg->getData();
		$documentId = (int)($payload['documentId'] ?? $payload['id'] ?? 0);
		if ($documentId <= 0 && method_exists($reg, 'getId')) {
			$documentId = (int)$reg->getId();
		}
		$document = $documentId > 0 ? $docService->getById($documentId) : null;
		if ($document === null && method_exists($docService, 'getByUid') && !empty($payload['uid'])) {
			$document = $docService->getByUid((string)$payload['uid']);
		}
		if ($document === null || empty($document->uid)) {
			return ['ok' => false, 'error' => 'Sign document was created but the link is missing.'];
		}

		$entityId = (int)($document->entityId ?? 0);
		if ($entityId <= 0) {
			$entityId = (int)($payload['entityId'] ?? 0);
		}
		if ($entityId <= 0) {
			$entityId = self::createSmartEntity($title, $userId);
			if ($entityId > 0) {
				$document->entityId = $entityId;
				self::touchDocument($container, $docService, $document);
				$fresh = $docService->getById((int)$document->id);
				if ($fresh !== null) {
					$document = $fresh;
					$entityId = (int)($document->entityId ?? $entityId);
				}
			}
		}

		$members = $container->getMemberService();
		$members->addForDocument(
			$document->uid,
			EntityType::USER,
			$userId,
			1,
			0,
			null,
			Role::ASSIGNEE
		);

		$sendTo = self::sendTo($data);
		$party = 2;
		$ownerAdded = false;
		$tenantAdded = false;
		if ($sendTo === 'owner' || $sendTo === 'both') {
			$ownerAdded = self::addSigner($members, $document->uid, $party, [
				'entity' => 'contact',
				'id' => (int)($data['landlordId'] ?? 0),
				'name' => (string)($data['landlordName'] ?? ''),
				'email' => (string)($data['landlordEmail'] ?? ''),
				'phone' => (string)($data['landlordPhone'] ?? ''),
			]);
			if ($ownerAdded) {
				$party++;
			}
		}
		if ($sendTo === 'tenant' || $sendTo === 'both') {
			$tenantType = (string)($data['tenantEntity'] ?? 'contact');
			$tenantAdded = self::addSigner($members, $document->uid, $party, [
				'entity' => in_array($tenantType, ['company', 'contact'], true) ? $tenantType : 'contact',
				'id' => (int)($data['tenantId'] ?? 0),
				'name' => (string)($data['tenantName'] ?? ''),
				'email' => (string)($data['tenantEmail'] ?? ''),
				'phone' => (string)($data['tenantPhone'] ?? ''),
			]);
		}

		if ($entityId <= 0) {
			for ($i = 0; $i < 3 && $entityId <= 0; $i++) {
				usleep(250000);
				$fresh = $docService->getById((int)$document->id);
				if ($fresh !== null) {
					$document = $fresh;
					$entityId = (int)($document->entityId ?? 0);
				}
			}
		}

		$url = '';
		if (method_exists($docService, 'getEditUrl') && $entityId > 0) {
			try {
				$edit = $docService->getEditUrl($document);
				if (is_string($edit) && $edit !== '') {
					$url = $edit;
				}
			} catch (\Throwable $e) {
				try {
					$edit = $docService->getEditUrl($entityId);
					if (is_string($edit) && $edit !== '') {
						$url = $edit;
					}
				} catch (\Throwable $e2) {
					$url = '';
				}
			}
		}
		if ($url === '' && $entityId > 0) {
			$url = '/sign/doc/' . $entityId . '/';
		}
		if ($url === '' && (int)$document->id > 0) {
			return [
				'ok' => true,
				'url' => '/sign/',
				'documentId' => (int)$document->id,
				'entityId' => $entityId,
				'sendTo' => self::sendTo($data),
				'uid' => (string)$document->uid,
				'warning' => 'Document created on Sign board. Open e-Signature and search: ' . $title,
			];
		}
		if ($url === '') {
			return [
				'ok' => false,
				'error' => 'Contract was prepared but Sign did not create a document card. Open Sign board and look for: ' . $title,
				'documentId' => (int)$document->id,
			];
		}

		return [
			'ok' => true,
			'url' => $url,
			'documentId' => (int)$document->id,
			'entityId' => $entityId,
			'sendTo' => self::sendTo($data),
			'uid' => (string)$document->uid,
		];
	}

	public static function sendTo(array $data): string
	{
		$v = strtolower(trim((string)($data['sendTo'] ?? 'tenant')));
		return in_array($v, ['owner', 'tenant', 'both'], true) ? $v : 'tenant';
	}

	/**
	 * @param array{entity:string,id:int,name:string,email:string,phone:string} $who
	 */
	private static function addSigner(object $members, string $uid, int $party, array $who): bool
	{
		$id = (int)$who['id'];
		$entity = $who['entity'];
		if ($id <= 0) {
			$id = TenancyCrm::ensureContact($who['name'], $who['email'], $who['phone']);
			$entity = 'contact';
		}
		if ($id <= 0) {
			return false;
		}
		$entityType = $entity === 'company' ? EntityType::COMPANY : EntityType::CONTACT;
		try {
			$members->addForDocument(
				$uid,
				$entityType,
				$id,
				$party,
				0,
				null,
				Role::SIGNER
			);
			return true;
		} catch (\Throwable $e) {
			return false;
		}
	}

	/**
	 * @return list<int>
	 */
	private static function savePages(string $pdfPath, string $pdfBinary): array
	{
		$images = self::pdfToJpegs($pdfPath);
		$ids = [];
		foreach ($images as $i => $jpeg) {
			$id = self::saveBitrixFile($jpeg, 'tenancy-page-' . ($i + 1) . '.jpg', 'image/jpeg');
			if ($id > 0) {
				$ids[] = $id;
			}
		}
		if ($ids !== []) {
			return $ids;
		}
		$id = self::saveBitrixFile($pdfBinary, 'tenancy-contract.pdf', 'application/pdf');
		return $id > 0 ? [$id] : [];
	}

	/**
	 * @return list<string>
	 */
	private static function pdfToJpegs(string $pdfPath): array
	{
		$outDir = rtrim(sys_get_temp_dir(), '/\\') . '/tenancy-pp-' . uniqid('', true);
		@mkdir($outDir, 0700, true);
		$prefix = $outDir . '/page';
		$cmds = [
			'pdftoppm -jpeg -r 150 ' . escapeshellarg($pdfPath) . ' ' . escapeshellarg($prefix),
			'pdftocairo -jpeg -r 150 ' . escapeshellarg($pdfPath) . ' ' . escapeshellarg($prefix),
			'convert -density 150 ' . escapeshellarg($pdfPath) . ' ' . escapeshellarg($prefix . '.jpg'),
		];
		foreach ($cmds as $cmd) {
			$bin = strtok($cmd, ' ');
			if ($bin && self::binExists($bin)) {
				@exec($cmd . ' 2>/dev/null');
				$found = self::collectJpegs($outDir);
				if ($found !== []) {
					return $found;
				}
			}
		}
		if (class_exists(\Imagick::class)) {
			try {
				$im = new \Imagick();
				$im->setResolution(150, 150);
				$im->readImage($pdfPath);
				$n = 0;
				foreach ($im as $page) {
					$page->setImageFormat('jpeg');
					$page->setImageCompressionQuality(85);
					$path = sprintf('%s/page-%02d.jpg', $outDir, ++$n);
					$page->writeImage($path);
				}
				$im->clear();
				$found = self::collectJpegs($outDir);
				if ($found !== []) {
					return $found;
				}
			} catch (\Throwable $e) {
				// fall through
			}
		}
		self::wipeDir($outDir);
		return [];
	}

	private static function binExists(string $bin): bool
	{
		if ($bin === '') {
			return false;
		}
		if (is_executable($bin) || is_executable('/usr/bin/' . $bin)) {
			return true;
		}
		$path = @exec('command -v ' . escapeshellarg($bin) . ' 2>/dev/null');
		return is_string($path) && $path !== '';
	}

	/**
	 * @return list<string>
	 */
	private static function collectJpegs(string $dir): array
	{
		$files = array_merge(
			glob($dir . '/*.jpg') ?: [],
			glob($dir . '/*.jpeg') ?: [],
			glob($dir . '/*.JPG') ?: []
		);
		$files = array_values(array_unique($files));
		sort($files, SORT_NATURAL);
		$out = [];
		foreach ($files as $file) {
			$data = file_get_contents($file);
			if (is_string($data) && strlen($data) > 1000) {
				$out[] = $data;
			}
		}
		if ($out !== []) {
			self::wipeDir($dir);
		}
		return $out;
	}

	private static function wipeDir(string $dir): void
	{
		foreach (glob($dir . '/*') ?: [] as $f) {
			@unlink($f);
		}
		@rmdir($dir);
	}

	private static function saveBitrixFile(string $binary, string $name, string $type): int
	{
		$path = rtrim(sys_get_temp_dir(), '/\\') . '/' . uniqid('tenancy-', true) . '-' . $name;
		if (file_put_contents($path, $binary) === false) {
			return 0;
		}
		$fileArray = \CFile::MakeFileArray($path);
		if (!is_array($fileArray)) {
			@unlink($path);
			return 0;
		}
		$fileArray['MODULE_ID'] = 'sign';
		$fileArray['name'] = $name;
		$fileArray['type'] = $type;
		$id = (int)\CFile::SaveFile($fileArray, 'sign');
		@unlink($path);
		return $id;
	}

	private static function createSmartEntity(string $title, int $userId): int
	{
		if (!Loader::includeModule('crm') || !class_exists(\CCrmOwnerType::class)) {
			return 0;
		}
		$crmType = new \ReflectionClass(\CCrmOwnerType::class);
		$typeId = $crmType->hasConstant('SmartDocument') ? (int)$crmType->getConstant('SmartDocument') : 0;
		if ($typeId <= 0) {
			return 0;
		}
		$factory = \Bitrix\Crm\Service\Container::getInstance()->getFactory($typeId);
		if ($factory === null) {
			return 0;
		}
		try {
			$item = $factory->createItem();
			$item->set('TITLE', $title);
			$item->set('ASSIGNED_BY_ID', $userId);
			$op = $factory->getAddOperation($item);
			if (method_exists($op, 'disableCheckAccess')) {
				$op->disableCheckAccess();
			}
			$result = $op->launch();
			return $result->isSuccess() ? (int)$item->getId() : 0;
		} catch (\Throwable $e) {
			return 0;
		}
	}

	private static function register(object $docService, int $blankId, int $userId, string $title, int $entityId, string $entityType): \Bitrix\Main\Result
	{
		$ref = new \ReflectionMethod($docService, 'register');
		$args = [];
		foreach ($ref->getParameters() as $p) {
			$name = strtolower($p->getName());
			if (str_contains($name, 'blank')) {
				$args[] = $blankId;
			} elseif (str_contains($name, 'created') || $name === 'userid' || str_contains($name, 'user')) {
				$args[] = $userId;
			} elseif (str_contains($name, 'title')) {
				$args[] = $title;
			} elseif (str_contains($name, 'entityid') || $name === 'entity_id') {
				$args[] = $entityId > 0 ? $entityId : ($p->isOptional() ? $p->getDefaultValue() : null);
			} elseif (str_contains($name, 'entitytype') || $name === 'entity_type') {
				$args[] = $entityType;
			} elseif (str_contains($name, 'astemplate') || str_contains($name, 'as_template')) {
				$args[] = false;
			} elseif ($p->isOptional()) {
				$args[] = $p->getDefaultValue();
			} else {
				$args[] = null;
			}
		}
		try {
			$result = $ref->invokeArgs($docService, $args);
			return $result instanceof \Bitrix\Main\Result ? $result : new \Bitrix\Main\Result();
		} catch (\Throwable $e) {
			return $docService->register($blankId, $userId, $title);
		}
	}

	private static function touchDocument(object $container, object $docService, object $document): void
	{
		foreach (['update', 'updateDocument', 'save'] as $method) {
			if (method_exists($docService, $method)) {
				try {
					$docService->{$method}($document);
					return;
				} catch (\Throwable $e) {
					// try next
				}
			}
		}
		if (method_exists($container, 'getDocumentRepository')) {
			try {
				$container->getDocumentRepository()->update($document);
			} catch (\Throwable $e) {
				// ignore
			}
		}
	}

	private static function title(array $data): string
	{
		$unit = trim((string)($data['propertyNo'] ?? $data['building'] ?? 'Unit'));
		$sendTo = self::sendTo($data);
		$who = match ($sendTo) {
			'owner' => trim((string)($data['landlordName'] ?? 'Owner')),
			'tenant' => trim((string)($data['tenantName'] ?? 'Tenant')),
			default => 'Owner + Tenant',
		};
		return 'Tenancy Contract — ' . $unit . ' — ' . $who;
	}

	private static function err(\Bitrix\Main\Result $result, string $fallback): string
	{
		$msgs = $result->getErrorMessages();
		return $msgs !== [] ? implode(' ', $msgs) : $fallback;
	}
}
