<?php

declare(strict_types=1);

use Bitrix\Crm\Service\Container as CrmContainer;
use Bitrix\Main\Loader;

final class TenancyCrm
{
	public static function item(int $entityTypeId, int $id): ?array
	{
		if (!Loader::includeModule('crm')) {
			return null;
		}
		$factory = CrmContainer::getInstance()->getFactory($entityTypeId);
		if ($factory === null) {
			return null;
		}
		$item = $factory->getItem($id);
		if ($item === null) {
			return null;
		}
		return $item->getData();
	}

	public static function title(int $entityTypeId, mixed $id): string
	{
		$id = (int)$id;
		if ($id <= 0) {
			return '';
		}
		$row = self::item($entityTypeId, $id);
		return trim((string)($row['TITLE'] ?? $row['title'] ?? ''));
	}

	public static function contact(int $id): ?array
	{
		if (!Loader::includeModule('crm') || $id <= 0) {
			return null;
		}
		$res = \CCrmContact::GetListEx(
			[],
			['ID' => $id, 'CHECK_PERMISSIONS' => 'Y'],
			false,
			false,
			['ID', 'NAME', 'LAST_NAME', 'FULL_NAME']
		);
		$row = $res ? $res->Fetch() : false;
		if (!$row) {
			return null;
		}
		$emails = [];
		$phones = [];
		$mf = \CCrmFieldMulti::GetList([], ['ENTITY_ID' => 'CONTACT', 'ELEMENT_ID' => $id]);
		while ($mf && ($m = $mf->Fetch())) {
			if ($m['TYPE_ID'] === 'EMAIL' && $m['VALUE']) {
				$emails[] = $m['VALUE'];
			}
			if ($m['TYPE_ID'] === 'PHONE' && $m['VALUE']) {
				$phones[] = $m['VALUE'];
			}
		}
		$name = trim((string)($row['FULL_NAME'] ?? '') ?: trim(($row['NAME'] ?? '') . ' ' . ($row['LAST_NAME'] ?? '')));
		return [
			'id' => (int)$row['ID'],
			'name' => $name,
			'email' => $emails[0] ?? '',
			'phone' => $phones[0] ?? '',
			'emails' => $emails,
			'phones' => $phones,
			'duplicates' => self::contactDuplicates($name, (int)$row['ID']),
		];
	}

	public static function company(int $id): ?array
	{
		if (!Loader::includeModule('crm') || $id <= 0) {
			return null;
		}
		$res = \CCrmCompany::GetListEx(
			[],
			['ID' => $id, 'CHECK_PERMISSIONS' => 'Y'],
			false,
			false,
			['ID', 'TITLE']
		);
		$row = $res ? $res->Fetch() : false;
		if (!$row) {
			return null;
		}
		$emails = [];
		$phones = [];
		$mf = \CCrmFieldMulti::GetList([], ['ENTITY_ID' => 'COMPANY', 'ELEMENT_ID' => $id]);
		while ($mf && ($m = $mf->Fetch())) {
			if ($m['TYPE_ID'] === 'EMAIL' && $m['VALUE']) {
				$emails[] = $m['VALUE'];
			}
			if ($m['TYPE_ID'] === 'PHONE' && $m['VALUE']) {
				$phones[] = $m['VALUE'];
			}
		}
		return [
			'id' => (int)$row['ID'],
			'name' => (string)$row['TITLE'],
			'email' => $emails[0] ?? '',
			'phone' => $phones[0] ?? '',
		];
	}

	public static function lead(int $id): ?array
	{
		if (!Loader::includeModule('crm') || $id <= 0) {
			return null;
		}
		$res = \CCrmLead::GetListEx(
			[],
			['ID' => $id, 'CHECK_PERMISSIONS' => 'Y'],
			false,
			false,
			['ID', 'TITLE', 'NAME', 'LAST_NAME', 'COMPANY_TITLE']
		);
		$row = $res ? $res->Fetch() : false;
		if (!$row) {
			return null;
		}
		$emails = [];
		$phones = [];
		$mf = \CCrmFieldMulti::GetList([], ['ENTITY_ID' => 'LEAD', 'ELEMENT_ID' => $id]);
		while ($mf && ($m = $mf->Fetch())) {
			if ($m['TYPE_ID'] === 'EMAIL' && $m['VALUE']) {
				$emails[] = $m['VALUE'];
			}
			if ($m['TYPE_ID'] === 'PHONE' && $m['VALUE']) {
				$phones[] = $m['VALUE'];
			}
		}
		$name = trim((string)($row['TITLE'] ?: trim(($row['NAME'] ?? '') . ' ' . ($row['LAST_NAME'] ?? ''))));
		return [
			'id' => (int)$row['ID'],
			'name' => $name,
			'email' => $emails[0] ?? '',
			'phone' => $phones[0] ?? '',
		];
	}

	public static function ownerUnit(int $id): ?array
	{
		$row = self::item(1112, $id);
		if ($row === null) {
			return null;
		}
		$get = static fn(string $a, string $b) => $row[$a] ?? $row[$b] ?? '';
		$buildingId = (int)($row['UF_CRM_21_1761836766'] ?? $row['ufCrm21_1761836766'] ?? 0);
		$locationId = (int)($row['UF_CRM_21_1760535808'] ?? $row['ufCrm21_1760535808'] ?? 0);
		$ownerFirst = (string)$get('UF_CRM_21_1758009535002', 'ufCrm21_1758009535002');
		$ownerLast = (string)$get('UF_CRM_21_1758009542122', 'ufCrm21_1758009542122');
		return [
			'id' => $id,
			'title' => (string)($row['TITLE'] ?? $row['title'] ?? ''),
			'unitNo' => (string)$get('UF_CRM_21_1761837638901', 'ufCrm21_1761837638901'),
			'ownerName' => trim($ownerFirst . ' ' . $ownerLast),
			'ownerPhone' => (string)$get('UF_CRM_21_1758009551211', 'ufCrm21_1758009551211'),
			'ownerEmail' => (string)$get('UF_CRM_21_1758009557723', 'ufCrm21_1758009557723'),
			'building' => self::title(1082, $buildingId),
			'location' => self::title(1050, $locationId),
			'plotNo' => (string)$get('UF_CRM_21_1760537872927', 'ufCrm21_1760537872927'),
			'size' => (string)$get('UF_CRM_21_1761836951413', 'ufCrm21_1761836951413'),
		];
	}

	/**
	 * @return list<array{id:int,name:string}>
	 */
	private static function contactDuplicates(string $name, int $exceptId): array
	{
		$name = trim($name);
		if ($name === '') {
			return [];
		}
		$res = \CCrmContact::GetListEx(
			[],
			['%NAME' => $name, 'CHECK_PERMISSIONS' => 'Y'],
			false,
			['nTopCount' => 5],
			['ID', 'FULL_NAME', 'NAME', 'LAST_NAME']
		);
		$out = [];
		while ($res && ($row = $res->Fetch())) {
			$id = (int)$row['ID'];
			if ($id === $exceptId) {
				continue;
			}
			$out[] = [
				'id' => $id,
				'name' => (string)($row['FULL_NAME'] ?: trim(($row['NAME'] ?? '') . ' ' . ($row['LAST_NAME'] ?? ''))),
			];
		}
		return $out;
	}

	public static function ensureContact(string $name, string $email, string $phone): int
	{
		if (!Loader::includeModule('crm')) {
			return 0;
		}
		$email = trim($email);
		$name = trim($name);
		$phone = trim($phone);
		if ($email !== '') {
			$dup = \CCrmFieldMulti::GetList([], ['ENTITY_ID' => 'CONTACT', 'TYPE_ID' => 'EMAIL', 'VALUE' => $email]);
			if ($dup && ($row = $dup->Fetch())) {
				return (int)($row['ELEMENT_ID'] ?? 0);
			}
		}
		$parts = preg_split('/\s+/', $name !== '' ? $name : 'Signer', 2) ?: ['Signer'];
		$fields = [
			'NAME' => $parts[0],
			'LAST_NAME' => $parts[1] ?? '',
			'OPENED' => 'Y',
			'FM' => [],
		];
		if ($email !== '') {
			$fields['FM']['EMAIL'] = ['n0' => ['VALUE' => $email, 'VALUE_TYPE' => 'WORK']];
		}
		if ($phone !== '') {
			$fields['FM']['PHONE'] = ['n0' => ['VALUE' => $phone, 'VALUE_TYPE' => 'WORK']];
		}
		$contact = new \CCrmContact(false);
		$id = (int)$contact->Add($fields, true, ['DISABLE_USER_FIELD_CHECK' => true]);
		return $id > 0 ? $id : 0;
	}
}
