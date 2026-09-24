<?php

declare(strict_types=1);

use Bitrix\Crm\Service\Container as CrmContainer;
use Bitrix\Main\Loader;

require_once $_SERVER['DOCUMENT_ROOT'] . '/tenancy/lib/CrmLookup.php';

final class DealScoutCrm
{
	public const UNIT_TYPE = 1112;

	/**
	 * @return list<array{id:int,kind:string,title:string,subtitle:string}>
	 */
	public static function search(string $kind, string $q): array
	{
		$q = trim($q);
		return match ($kind) {
			'deal' => self::searchDeals($q),
			'party' => self::searchParties($q),
			'company' => self::searchCompanies($q),
			'unit' => self::searchUnits($q),
			'user' => self::searchUsers($q),
			default => [],
		};
	}

	/**
	 * @return array<string, string>
	 */
	public static function lookup(string $kind, int $id, string $target = ''): array
	{
		if ($id <= 0) {
			return [];
		}
		return match ($kind) {
			'deal' => self::dealFields($id),
			'party' => self::partyFields($id, $target),
			'company' => str_starts_with($target, 'owner')
				? self::ownerFromCompany($id)
				: self::companyFields($id),
			'unit' => self::unitFields($id),
			'user' => self::userFields($id, $target),
			default => [],
		};
	}

	/**
	 * @return list<array{id:int,kind:string,title:string,subtitle:string}>
	 */
	private static function searchDeals(string $q): array
	{
		if (!Loader::includeModule('crm')) {
			return [];
		}
		$filter = ['CHECK_PERMISSIONS' => 'Y'];
		if ($q !== '') {
			if (ctype_digit($q)) {
				$filter['ID'] = (int)$q;
			} else {
				$filter['%TITLE'] = $q;
			}
		}
		$res = \CCrmDeal::GetListEx(
			['ID' => 'DESC'],
			$filter,
			false,
			['nTopCount' => 30],
			['ID', 'TITLE', 'OPPORTUNITY', 'CLOSEDATE', 'TYPE_ID', 'STAGE_ID']
		);
		$out = [];
		while ($res && ($row = $res->Fetch())) {
			$id = (int)$row['ID'];
			$title = trim((string)($row['TITLE'] ?? ''));
			$bits = ['Deal #' . $id];
			if ((string)($row['OPPORTUNITY'] ?? '') !== '') {
				$bits[] = 'AED ' . $row['OPPORTUNITY'];
			}
			if ((string)($row['CLOSEDATE'] ?? '') !== '') {
				$bits[] = (string)$row['CLOSEDATE'];
			}
			$out[] = [
				'id' => $id,
				'kind' => 'deal',
				'title' => $title !== '' ? $title : ('Deal #' . $id),
				'subtitle' => implode(' · ', $bits),
			];
		}
		return $out;
	}

	/**
	 * @return list<array{id:int,kind:string,title:string,subtitle:string}>
	 */
	private static function searchParties(string $q): array
	{
		$out = [];
		if (!Loader::includeModule('crm')) {
			return $out;
		}
		$contactFilter = ['CHECK_PERMISSIONS' => 'Y'];
		if ($q !== '') {
			$contactFilter[] = [
				'LOGIC' => 'OR',
				'%NAME' => $q,
				'%LAST_NAME' => $q,
			];
		}
		$contacts = \CCrmContact::GetListEx(
			['ID' => 'DESC'],
			$contactFilter,
			false,
			['nTopCount' => 20],
			['ID', 'FULL_NAME', 'NAME', 'LAST_NAME']
		);
		while ($contacts && ($row = $contacts->Fetch())) {
			$name = trim((string)($row['FULL_NAME'] ?: trim(($row['NAME'] ?? '') . ' ' . ($row['LAST_NAME'] ?? ''))));
			$out[] = [
				'id' => (int)$row['ID'],
				'kind' => 'party',
				'title' => $name !== '' ? $name : ('Contact #' . $row['ID']),
				'subtitle' => 'Contact #' . $row['ID'],
			];
		}
		$companyFilter = ['CHECK_PERMISSIONS' => 'Y'];
		if ($q !== '') {
			$companyFilter['%TITLE'] = $q;
		}
		$companies = \CCrmCompany::GetListEx(
			['ID' => 'DESC'],
			$companyFilter,
			false,
			['nTopCount' => 10],
			['ID', 'TITLE']
		);
		while ($companies && ($row = $companies->Fetch())) {
			$out[] = [
				'id' => (int)$row['ID'],
				'kind' => 'company',
				'title' => (string)$row['TITLE'],
				'subtitle' => 'Company #' . $row['ID'],
			];
		}
		return $out;
	}

	/**
	 * @return list<array{id:int,kind:string,title:string,subtitle:string}>
	 */
	private static function searchCompanies(string $q): array
	{
		if (!Loader::includeModule('crm')) {
			return [];
		}
		$filter = ['CHECK_PERMISSIONS' => 'Y'];
		if ($q !== '') {
			$filter['%TITLE'] = $q;
		}
		$res = \CCrmCompany::GetListEx(
			['ID' => 'DESC'],
			$filter,
			false,
			['nTopCount' => 25],
			['ID', 'TITLE']
		);
		$out = [];
		while ($res && ($row = $res->Fetch())) {
			$out[] = [
				'id' => (int)$row['ID'],
				'kind' => 'company',
				'title' => (string)$row['TITLE'],
				'subtitle' => 'Company #' . $row['ID'],
			];
		}
		return $out;
	}

	/**
	 * @return list<array{id:int,kind:string,title:string,subtitle:string}>
	 */
	private static function searchUnits(string $q): array
	{
		if (!Loader::includeModule('crm')) {
			return [];
		}
		$factory = CrmContainer::getInstance()->getFactory(self::UNIT_TYPE);
		if ($factory === null) {
			return [];
		}
		$params = [
			'select' => ['ID', 'TITLE'],
			'order' => ['ID' => 'DESC'],
			'limit' => 30,
		];
		if ($q !== '') {
			$params['filter'] = [
				'LOGIC' => 'OR',
				'%TITLE' => $q,
				'%UF_CRM_21_1761837638901' => $q,
			];
		}
		$out = [];
		foreach ($factory->getItems($params) as $item) {
			$id = (int)$item->getId();
			$title = trim((string)$item->getTitle());
			$out[] = [
				'id' => $id,
				'kind' => 'unit',
				'title' => $title !== '' ? $title : ('Property #' . $id),
				'subtitle' => 'Property #' . $id,
			];
		}
		return $out;
	}

	/**
	 * @return list<array{id:int,kind:string,title:string,subtitle:string}>
	 */
	private static function searchUsers(string $q): array
	{
		$filter = ['=ACTIVE' => 'Y'];
		if ($q !== '') {
			$filter[] = [
				'LOGIC' => 'OR',
				'%NAME' => $q,
				'%LAST_NAME' => $q,
				'%LOGIN' => $q,
				'%EMAIL' => $q,
			];
		}
		$res = \Bitrix\Main\UserTable::getList([
			'select' => ['ID', 'NAME', 'LAST_NAME', 'LOGIN', 'EMAIL'],
			'filter' => $filter,
			'order' => ['ID' => 'DESC'],
			'limit' => 25,
		]);
		$out = [];
		while ($row = $res->fetch()) {
			$name = trim((string)($row['NAME'] ?? '') . ' ' . (string)($row['LAST_NAME'] ?? ''));
			if ($name === '') {
				$name = (string)($row['LOGIN'] ?? ('User #' . $row['ID']));
			}
			$sub = array_filter([(string)($row['LOGIN'] ?? ''), (string)($row['EMAIL'] ?? '')]);
			$out[] = [
				'id' => (int)$row['ID'],
				'kind' => 'user',
				'title' => $name,
				'subtitle' => $sub !== [] ? implode(' · ', $sub) : ('User #' . $row['ID']),
			];
		}
		return $out;
	}

	/**
	 * @return array<string, string>
	 */
	private static function ownerFromCompany(int $id): array
	{
		$company = TenancyCrm::company($id);
		if ($company === null) {
			return [];
		}
		return array_filter([
			'ownerName' => $company['name'],
			'ownerPhone' => $company['phone'],
		]);
	}

	/**
	 * @return array<string, string>
	 */
	private static function dealFields(int $id): array
	{
		if (!Loader::includeModule('crm')) {
			return [];
		}
		$res = \CCrmDeal::GetListEx(
			[],
			['ID' => $id, 'CHECK_PERMISSIONS' => 'Y'],
			false,
			false,
			[
				'ID', 'TITLE', 'OPPORTUNITY', 'CLOSEDATE', 'TYPE_ID', 'SOURCE_ID',
				'CONTACT_ID', 'COMPANY_ID', 'ASSIGNED_BY_ID', 'COMMENTS',
			]
		);
		$row = $res ? $res->Fetch() : false;
		if (!$row) {
			return [];
		}
		$fields = [
			'dealId' => (string)$row['ID'],
			'fileRef' => trim((string)($row['TITLE'] ?? '')),
			'dealValue' => self::money((string)($row['OPPORTUNITY'] ?? '')),
			'dateClosed' => self::ymd((string)($row['CLOSEDATE'] ?? '')),
			'dealType' => self::mapDealType((string)($row['TYPE_ID'] ?? '')),
			'dealSource' => self::statusName('SOURCE', (string)($row['SOURCE_ID'] ?? '')),
		];
		$contactId = (int)($row['CONTACT_ID'] ?? 0);
		if ($contactId > 0) {
			$fields = array_merge($fields, self::contactClientFields($contactId));
		}
		$companyId = (int)($row['COMPANY_ID'] ?? 0);
		if ($companyId > 0) {
			$company = TenancyCrm::company($companyId);
			if ($company !== null) {
				$fields['companyName'] = $company['name'];
				if ($contactId <= 0) {
					$fields['clientName'] = $company['name'];
					$fields['clientType'] = 'company';
					$fields['clientMobile'] = $company['phone'];
					$fields['clientEmail'] = $company['email'];
				}
			}
		}
		$assigned = (int)($row['ASSIGNED_BY_ID'] ?? 0);
		if ($assigned > 0) {
			$fields = array_merge($fields, self::userFields($assigned, 'agent1Name'));
			$fields['agentCount'] = $fields['agentCount'] ?? '1';
			if (($fields['reviewedBy'] ?? '') === '') {
				$fields['reviewedBy'] = $fields['agent1Name'] ?? '';
			}
		}
		return array_filter($fields, static fn($v) => $v !== null && trim((string)$v) !== '');
	}

	/**
	 * @return array<string, string>
	 */
	private static function partyFields(int $id, string $target): array
	{
		if (str_starts_with($target, 'owner')) {
			$contact = TenancyCrm::contact($id);
			if ($contact === null) {
				$company = TenancyCrm::company($id);
				return $company ? ['ownerName' => $company['name'], 'ownerPhone' => $company['phone']] : [];
			}
			return [
				'ownerName' => $contact['name'],
				'ownerPhone' => $contact['phone'],
			];
		}
		$contact = TenancyCrm::contact($id);
		if ($contact !== null) {
			return self::contactClientFields($id);
		}
		return self::companyFields($id);
	}

	/**
	 * @return array<string, string>
	 */
	private static function contactClientFields(int $id): array
	{
		$contact = TenancyCrm::contact($id);
		if ($contact === null) {
			return [];
		}
		return array_filter([
			'clientName' => $contact['name'],
			'clientType' => 'individual',
			'clientMobile' => $contact['phone'],
			'clientEmail' => $contact['email'],
		]);
	}

	/**
	 * @return array<string, string>
	 */
	private static function companyFields(int $id): array
	{
		$company = TenancyCrm::company($id);
		if ($company === null) {
			return [];
		}
		return array_filter([
			'companyName' => $company['name'],
			'clientType' => 'company',
			'clientName' => $company['name'],
			'clientMobile' => $company['phone'],
			'clientEmail' => $company['email'],
		]);
	}

	/**
	 * @return array<string, string>
	 */
	private static function unitFields(int $id): array
	{
		$unit = TenancyCrm::ownerUnit($id);
		if ($unit === null) {
			return [];
		}
		return array_filter([
			'fileRef' => trim($unit['title']),
			'unitNo' => trim($unit['unitNo']),
			'building' => trim($unit['building']),
			'community' => trim($unit['location']),
			'plotNo' => trim($unit['plotNo']),
			'sizeSqft' => trim($unit['size']),
			'ownerName' => trim($unit['ownerName']),
			'ownerPhone' => trim($unit['ownerPhone']),
		], static fn($v) => $v !== '');
	}

	/**
	 * @return array<string, string>
	 */
	private static function userFields(int $id, string $target): array
	{
		$user = \CUser::GetByID($id)->Fetch();
		if (!$user) {
			return [];
		}
		$name = trim((string)($user['NAME'] ?? '') . ' ' . (string)($user['LAST_NAME'] ?? ''));
		if ($name === '') {
			$name = (string)($user['LOGIN'] ?? '');
		}
		$phone = trim((string)($user['WORK_PHONE'] ?? '') ?: (string)($user['PERSONAL_MOBILE'] ?? '') ?: (string)($user['PERSONAL_PHONE'] ?? ''));
		if (preg_match('/^agent(\d+)Name$/', $target, $m) === 1) {
			$i = $m[1];
			return array_filter([
				'agent' . $i . 'Name' => $name,
				'agent' . $i . 'EmpId' => (string)$id,
				'agent' . $i . 'Contact' => $phone,
			]);
		}
		$key = $target !== '' ? $target : 'reviewedBy';
		return [$key => $name];
	}

	private static function mapDealType(string $typeId): string
	{
		$name = strtolower(self::statusName('DEAL_TYPE', $typeId) . ' ' . $typeId);
		if (str_contains($name, 'rent') || str_contains($name, 'lease') || str_contains($name, 'tenan')) {
			return 'Rental';
		}
		if (str_contains($name, 'off') && str_contains($name, 'plan')) {
			return 'Off-plan';
		}
		if (str_contains($name, 'resale') || str_contains($name, 'sale') || str_contains($name, 'secondary')) {
			return 'Resale';
		}
		return '';
	}

	private static function statusName(string $entity, string $id): string
	{
		if ($id === '' || !Loader::includeModule('crm')) {
			return '';
		}
		$list = \CCrmStatus::GetStatusList($entity);
		return trim((string)($list[$id] ?? ''));
	}

	private static function ymd(string $value): string
	{
		$value = trim($value);
		if ($value === '') {
			return '';
		}
		if (preg_match('/^\d{4}-\d{2}-\d{2}/', $value) === 1) {
			return substr($value, 0, 10);
		}
		$ts = 0;
		if (function_exists('MakeTimeStamp')) {
			$ts = (int)MakeTimeStamp($value);
		}
		if ($ts <= 0) {
			$ts = (int)strtotime($value);
		}
		return $ts > 0 ? date('Y-m-d', $ts) : '';
	}

	private static function money(string $value): string
	{
		$n = (float)preg_replace('/[^\d.-]/', '', $value);
		return $n > 0 ? (string)round($n, 2) : '';
	}
}
