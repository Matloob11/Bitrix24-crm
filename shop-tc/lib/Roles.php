<?php

declare(strict_types=1);

final class DealScoutRoles
{
	public const AGENT = 'agent';
	public const MANAGER = 'manager';
	public const COMPLIANCE = 'compliance';
	public const ACCOUNTS = 'accounts';
	public const OPS = 'ops';
	public const IT = 'it';
	public const MALIK = 'malik';

	private const SALES_DEPTS = [26, 32, 33, 41, 42, 43, 45, 46, 47, 48, 50, 51, 52, 54, 60, 61, 62, 63, 65, 66, 67, 68, 69, 70, 71];
	private const FINANCE_DEPTS = [2];
	private const ADMIN_DEPTS = [15];
	private const OPS_DEPTS = [16];
	private const IT_DEPTS = [31];
	private const MALIK_IDS = [1, 32];
	private const MANAGER_IDS = [2297, 2551, 2560];

	private const LABELS = [
		self::AGENT => 'Sales Agent',
		self::MANAGER => 'Sales Manager / Team Leader',
		self::COMPLIANCE => 'Compliance Officer',
		self::ACCOUNTS => 'Accounts / Finance',
		self::OPS => 'Ops Coordinator',
		self::IT => 'IT',
		self::MALIK => 'Malik',
	];

	/**
	 * @return array<string, mixed>
	 */
	public static function current(): array
	{
		global $USER;
		if (!is_object($USER) || !$USER->IsAuthorized()) {
			return self::fromRoles(0, '', []);
		}

		$id = (int)$USER->GetID();
		$name = trim((string)($USER->GetFullName() ?: $USER->GetLogin()));
		$position = '';
		$deptIds = [];
		$deptNames = [];

		$by = \CUser::GetByID($id);
		$row = is_object($by) ? $by->Fetch() : false;
		if (is_array($row)) {
			$position = trim((string)($row['WORK_POSITION'] ?? ''));
			if ($name === '') {
				$name = trim((string)($row['NAME'] ?? '') . ' ' . (string)($row['LAST_NAME'] ?? ''));
			}
			$raw = $row['UF_DEPARTMENT'] ?? [];
			if (!is_array($raw)) {
				$raw = $raw !== '' && $raw !== null ? [(int)$raw] : [];
			}
			foreach ($raw as $deptId) {
				$deptId = (int)$deptId;
				if ($deptId > 0) {
					$deptIds[] = $deptId;
				}
			}
		}

		$deptNames = self::deptNames($deptIds);
		$groups = array_map('intval', (array)\CUser::GetUserGroup($id));
		$roles = self::detect($id, $name, $position, $deptIds, $deptNames, $groups);
		return self::fromRoles($id, $name, $roles);
	}

	/**
	 * @param list<int> $deptIds
	 * @param list<string> $deptNames
	 * @param list<int> $groupIds
	 * @return list<string>
	 */
	public static function detect(
		int $userId,
		string $name,
		string $position,
		array $deptIds,
		array $deptNames,
		array $groupIds
	): array {
		$roles = [];
		$blob = strtolower(trim($name . ' ' . $position . ' ' . implode(' ', $deptNames)));

		if (
			in_array($userId, self::MALIK_IDS, true)
			|| (bool)preg_match('/managing director|\bchairman\b|\bceo\b/', strtolower($position))
			|| (bool)preg_match('/\babdul\s+malik\b/', strtolower($name))
		) {
			$roles[] = self::MALIK;
		}

		if (
			self::inDepts($deptIds, self::FINANCE_DEPTS)
			|| (bool)preg_match('/\bfinance\b|\baccounts?\b|\baccountant\b/', $blob)
		) {
			$roles[] = self::ACCOUNTS;
		}

		if ((bool)preg_match('/\bcompliance\b/', $blob)) {
			$roles[] = self::COMPLIANCE;
		}

		if (self::inDepts($deptIds, self::IT_DEPTS) || (bool)preg_match('/\bit department\b|\binformation tech/', $blob)) {
			$roles[] = self::IT;
		}

		if (
			!in_array(self::MALIK, $roles, true)
			&& (
				self::inDepts($deptIds, self::OPS_DEPTS)
				|| self::inDepts($deptIds, self::ADMIN_DEPTS)
				|| (bool)preg_match('/\bops\b|coordinator|\bpro\b|help desk/', $blob)
			)
		) {
			$roles[] = self::OPS;
		}

		if (
			in_array($userId, self::MANAGER_IDS, true)
			|| (bool)preg_match('/team\s*lead|sales\s*manager|\bt\.?l\.?\b|head of sales/', $blob)
		) {
			$roles[] = self::MANAGER;
		}

		if (
			self::inDepts($deptIds, self::SALES_DEPTS)
			|| in_array(11, $groupIds, true)
			|| (bool)preg_match('/\bsales\b|re-?sale|off[\s-]?plan|\bleasing\b|\brental\b/', $blob)
		) {
			$roles[] = self::AGENT;
		}

		if ($roles === [] && in_array(12, $groupIds, true)) {
			$roles[] = self::AGENT;
		}

		return array_values(array_unique($roles));
	}

	/**
	 * @param list<string> $roles
	 * @return array<string, mixed>
	 */
	public static function fromRoles(int $userId, string $name, array $roles): array
	{
		$has = static fn(string $role): bool => in_array($role, $roles, true);
		$checks = [];
		$uploads = [];
		if ($has(self::COMPLIANCE)) {
			$checks = array_merge($checks, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);
			$uploads = array_merge($uploads, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);
		}
		if ($has(self::IT)) {
			$checks = array_merge($checks, [3, 4, 5]);
			$uploads = array_merge($uploads, [3, 4, 5, 6]);
		}
		if ($has(self::OPS)) {
			$checks = array_merge($checks, [9]);
			$uploads = array_merge($uploads, [9]);
		}
		if ($has(self::AGENT)) {
			$uploads = array_merge($uploads, [8, 9, 10, 11]);
		}
		if ($has(self::ACCOUNTS)) {
			$checks = array_merge($checks, [12, 13, 14]);
			$uploads = array_merge($uploads, [12, 13, 14]);
		}
		$checks = array_values(array_unique($checks));
		$uploads = array_values(array_unique($uploads));
		sort($checks);
		sort($uploads);

		$writable = [];
		if ($has(self::AGENT)) {
			$writable = array_merge($writable, self::agentFields());
		}
		if ($has(self::MANAGER)) {
			$writable = array_merge($writable, self::splitFields());
		}
		if ($has(self::COMPLIANCE)) {
			$writable = array_merge($writable, [
				'reviewedBy', 'reviewDate', 'idVerifiedBy', 'failReason',
				'reviewerName', 'reviewerSign',
			]);
		}
		if ($has(self::ACCOUNTS)) {
			$writable = array_merge($writable, [
				'totalCommission', 'vatPercent', 'companySharePct', 'agentSharePct',
				'commissionLocked', 'failReason',
			]);
		}
		if ($has(self::MALIK)) {
			$writable = array_merge($writable, ['countersignName', 'countersignSign']);
		}
		$writable = array_values(array_unique($writable));

		$sections = [
			'deal' => self::section('Deal information', self::AGENT, $has(self::AGENT)),
			'review' => self::section('Reviewed by / date', self::COMPLIANCE, $has(self::COMPLIANCE)),
			'client' => self::section('Client identification', self::AGENT, $has(self::AGENT)),
			'idverify' => self::section('ID verified by', self::COMPLIANCE, $has(self::COMPLIANCE)),
			'property' => self::section('Property details', self::AGENT, $has(self::AGENT)),
			'commission' => self::section(
				'Commission & VAT',
				$has(self::ACCOUNTS) ? self::ACCOUNTS : self::AGENT,
				$has(self::AGENT) || $has(self::ACCOUNTS)
			),
			'split' => self::section('Agent split', self::MANAGER, $has(self::MANAGER)),
			'checks-system' => self::section('System checks 1–2', self::COMPLIANCE, $has(self::COMPLIANCE)),
			'checks-comms' => self::section('Communication checks 3–5', self::IT, $has(self::COMPLIANCE) || $has(self::IT)),
			'checks-docs' => self::section('Documentation checks 6–11', self::COMPLIANCE, $has(self::COMPLIANCE) || $has(self::OPS)),
			'checks-money' => self::section('Money checks 12–14', self::ACCOUNTS, $has(self::ACCOUNTS)),
			'sign-reviewer' => self::section('Reviewed by signature', self::COMPLIANCE, $has(self::COMPLIANCE)),
			'sign-malik' => self::section('Malik countersign', self::MALIK, $has(self::MALIK)),
		];

		$roleLabels = [];
		foreach ($roles as $role) {
			$roleLabels[] = self::LABELS[$role] ?? $role;
		}

		return [
			'userId' => $userId,
			'name' => $name,
			'roles' => $roles,
			'roleLabels' => $roleLabels,
			'writable' => $writable,
			'checks' => $checks,
			'uploads' => $uploads,
			'sections' => $sections,
			'canCreate' => $has(self::AGENT),
			'canAddAgent' => $has(self::MANAGER),
			'canSignReviewer' => $has(self::COMPLIANCE),
			'canSignMalik' => $has(self::MALIK),
			'canLockCommission' => $has(self::ACCOUNTS),
		];
	}

	/**
	 * @param array<string, mixed> $base
	 * @param array<string, mixed> $workflow
	 * @return array<string, mixed>
	 */
	public static function forCard(array $base, array $workflow): array
	{
		$uid = (int)($base['userId'] ?? 0);
		$roles = array_values(array_filter((array)($base['roles'] ?? []), 'is_string'));
		$agentId = self::wfUser($workflow, self::AGENT);
		$compId = self::wfUser($workflow, self::COMPLIANCE);
		$accId = self::wfUser($workflow, self::ACCOUNTS);
		$malikId = self::wfUser($workflow, self::MALIK);

		if ($malikId > 0) {
			return self::fromRoles($uid, (string)($base['name'] ?? ''), []);
		}
		if ($uid > 0 && $agentId === $uid) {
			$roles = array_values(array_intersect($roles, [self::AGENT]));
		}
		if ($uid > 0 && $compId === $uid) {
			$roles = array_values(array_diff($roles, [self::AGENT, self::ACCOUNTS, self::MALIK]));
		}
		if ($uid > 0 && $accId === $uid) {
			$roles = array_values(array_diff($roles, [self::AGENT, self::COMPLIANCE, self::MALIK]));
		}

		$profile = self::fromRoles($uid, (string)($base['name'] ?? ''), $roles);
		if ($compId > 0 && in_array(self::AGENT, $profile['roles'], true)) {
			$profile['writable'] = array_values(array_diff($profile['writable'], self::agentFields()));
			$profile['sections']['deal']['can'] = false;
			$profile['sections']['client']['can'] = false;
			$profile['sections']['property']['can'] = false;
			if (!$profile['canLockCommission']) {
				$profile['sections']['commission']['can'] = false;
				$profile['writable'] = array_values(array_diff(
					$profile['writable'],
					['totalCommission', 'vatPercent', 'companySharePct', 'agentSharePct']
				));
			}
		}
		return $profile;
	}

	/**
	 * @param array<string, string> $existing
	 * @param array<string, string> $incoming
	 * @param array<string, mixed> $profile
	 * @return array<string, string>
	 */
	public static function merge(array $existing, array $incoming, array $profile): array
	{
		$out = $existing === [] ? $incoming : $existing;
		foreach ((array)($profile['writable'] ?? []) as $key) {
			$key = (string)$key;
			if (array_key_exists($key, $incoming)) {
				$out[$key] = $incoming[$key];
			}
		}
		foreach ((array)($profile['checks'] ?? []) as $n) {
			$n = (int)$n;
			$key = 'check' . $n;
			if (array_key_exists($key, $incoming)) {
				$out[$key] = $incoming[$key];
			}
		}
		foreach ((array)($profile['uploads'] ?? []) as $n) {
			$n = (int)$n;
			foreach (['Evidence', 'FileId', 'FileName'] as $suf) {
				$key = 'check' . $n . $suf;
				if (array_key_exists($key, $incoming)) {
					$out[$key] = $incoming[$key];
				}
			}
		}
		return $out;
	}

	/**
	 * @param array<string, mixed> $workflow
	 * @param array<string, mixed> $profile
	 * @param array<string, string> $before
	 * @param array<string, string> $after
	 * @return array<string, mixed>
	 */
	public static function stamp(array $workflow, array $profile, array $before, array $after): array
	{
		$uid = (int)($profile['userId'] ?? 0);
		$name = (string)($profile['name'] ?? '');
		if ($uid <= 0) {
			return $workflow;
		}
		$mark = static function (array $wf, string $role) use ($uid, $name): array {
			if (self::wfUser($wf, $role) > 0) {
				return $wf;
			}
			$wf[$role] = [
				'userId' => $uid,
				'name' => $name,
				'at' => time(),
			];
			return $wf;
		};

		if (self::changed($before, $after, array_merge(self::agentFields(), self::uploadKeys([8, 9, 10, 11])))) {
			$workflow = $mark($workflow, self::AGENT);
		}
		if (self::changed($before, $after, self::splitFields())) {
			$workflow = $mark($workflow, self::MANAGER);
		}
		if (self::changed($before, $after, array_merge(
			['reviewedBy', 'reviewDate', 'idVerifiedBy', 'reviewerName', 'reviewerSign'],
			self::checkKeys([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]),
			self::uploadKeys([1, 2, 3, 4, 5, 6, 7])
		))) {
			if (in_array(self::COMPLIANCE, (array)$profile['roles'], true)) {
				$workflow = $mark($workflow, self::COMPLIANCE);
			} elseif (in_array(self::IT, (array)$profile['roles'], true) && self::changed($before, $after, array_merge(self::checkKeys([3, 4, 5]), self::uploadKeys([3, 4, 5, 6])))) {
				$workflow = $mark($workflow, self::IT);
			} elseif (in_array(self::OPS, (array)$profile['roles'], true) && self::changed($before, $after, array_merge(self::checkKeys([9]), self::uploadKeys([9])))) {
				$workflow = $mark($workflow, self::OPS);
			}
		}
		if (self::changed($before, $after, array_merge(
			['totalCommission', 'vatPercent', 'companySharePct', 'agentSharePct', 'commissionLocked'],
			self::checkKeys([12, 13, 14]),
			self::uploadKeys([12, 13, 14])
		))) {
			if (in_array(self::ACCOUNTS, (array)$profile['roles'], true)) {
				$workflow = $mark($workflow, self::ACCOUNTS);
			}
		}
		if (self::changed($before, $after, ['countersignName', 'countersignSign'])) {
			$workflow = $mark($workflow, self::MALIK);
		}
		return $workflow;
	}

	/**
	 * @param array<string, mixed> $profile
	 * @param array<string, string> $fields
	 * @param array<string, mixed> $workflow
	 * @return list<string>
	 */
	public static function validateSave(array $profile, array $fields, array $workflow, bool $isNew): array
	{
		$errors = [];
		$uid = (int)($profile['userId'] ?? 0);
		if ($isNew && empty($profile['canCreate'])) {
			return ['Only a sales agent can open a new deal file.'];
		}
		if ((array)($profile['writable'] ?? []) === [] && (array)($profile['checks'] ?? []) === [] && (array)($profile['uploads'] ?? []) === []) {
			return ['Your role cannot change this file.'];
		}
		if (self::wfUser($workflow, self::MALIK) > 0 && self::wfUser($workflow, self::MALIK) !== $uid) {
			return ['Malik has already signed this file. It is locked.'];
		}

		if (!empty($profile['canCreate']) && in_array('dealId', (array)$profile['writable'], true)) {
			$errors = array_merge($errors, DealScoutRules::validateAgent($fields));
		}
		if (!empty($profile['canAddAgent'])) {
			$errors = array_merge($errors, DealScoutRules::validateSplit($fields));
		}
		if (!empty($profile['canSignReviewer'])) {
			$signing = trim((string)($fields['reviewerName'] ?? '')) !== '' || trim((string)($fields['reviewerSign'] ?? '')) !== '';
			if ($signing && (trim((string)($fields['reviewerName'] ?? '')) === '' || trim((string)($fields['reviewerSign'] ?? '')) === '')) {
				$errors[] = 'Compliance signature needs both the reviewer name and signature.';
			}
			if ($signing && $uid > 0 && self::wfUser($workflow, self::AGENT) === $uid) {
				$errors[] = 'You filled this deal. Another person must review it.';
			}
		}
		if (!empty($profile['canSignMalik'])) {
			$name = trim((string)($fields['countersignName'] ?? ''));
			$sign = trim((string)($fields['countersignSign'] ?? ''));
			if ($name !== '' || $sign !== '') {
				if ($name === '' || $sign === '') {
					$errors[] = 'Malik countersign needs both the name and signature.';
				}
				$errors = array_merge($errors, self::malikGate($fields, $workflow, $uid));
			}
		}
		return $errors;
	}

	/**
	 * @param array<string, mixed> $workflow
	 * @return list<string>
	 */
	public static function sodErrors(array $workflow, int $userId, string $action): array
	{
		if ($userId <= 0) {
			return ['Not signed in.'];
		}
		$agent = self::wfUser($workflow, self::AGENT);
		$comp = self::wfUser($workflow, self::COMPLIANCE);
		$acc = self::wfUser($workflow, self::ACCOUNTS);
		if ($action === self::COMPLIANCE && $agent === $userId) {
			return ['The person who filled the deal cannot run the compliance check.'];
		}
		if ($action === self::ACCOUNTS && ($agent === $userId || $comp === $userId)) {
			return ['The person who filled or checked this deal cannot confirm the money.'];
		}
		if ($action === self::MALIK && ($agent === $userId || $comp === $userId || $acc === $userId)) {
			return ['Malik must be a fourth, independent person — not the agent, checker, or accounts.'];
		}
		if ($action === self::MANAGER && $agent === $userId) {
			return ['The agent cannot lock their own split. A sales manager or team leader must do it.'];
		}
		return [];
	}

	/**
	 * @param array<string, mixed> $row
	 * @return array<string, mixed>
	 */
	public static function status(array $row): array
	{
		$fields = is_array($row['fields'] ?? null) ? $row['fields'] : [];
		$wf = is_array($row['workflow'] ?? null) ? $row['workflow'] : [];
		$result = (string)($fields['result'] ?? '');
		if (self::wfUser($wf, self::MALIK) > 0 && $result === 'pass') {
			return ['id' => 'pass', 'label' => 'PASS — ready to release'];
		}
		if ($result === 'fail') {
			return ['id' => 'fail', 'label' => 'FAIL — on hold'];
		}
		if (self::wfUser($wf, self::MALIK) > 0) {
			return ['id' => 'signed', 'label' => 'Signed — awaiting result'];
		}
		if (self::wfUser($wf, self::ACCOUNTS) > 0) {
			return ['id' => 'await_malik', 'label' => 'Awaiting Malik'];
		}
		if (self::wfUser($wf, self::COMPLIANCE) > 0) {
			return ['id' => 'await_accounts', 'label' => 'Awaiting accounts'];
		}
		if (self::wfUser($wf, self::AGENT) > 0) {
			return ['id' => 'await_compliance', 'label' => 'Awaiting compliance'];
		}
		return ['id' => 'draft', 'label' => 'Agent draft'];
	}

	public static function canUpload(array $profile, int $check): bool
	{
		return $check >= 1 && $check <= 14 && in_array($check, (array)($profile['uploads'] ?? []), true);
	}

	public static function label(string $role): string
	{
		return self::LABELS[$role] ?? $role;
	}

	/**
	 * @return list<string>
	 */
	public static function agentFields(): array
	{
		return [
			'dealId', 'dealType', 'dateClosed', 'dealValue', 'fileRef', 'dealSource',
			'clientType', 'clientName', 'companyName', 'eidNumber', 'eidExpiry', 'nationality',
			'passportNumber', 'passportExpiry', 'passportIssuedBy',
			'tradeLicence', 'signatoryName', 'signatoryEid',
			'clientMobile', 'clientEmail', 'idCopies',
			'propertyType', 'community', 'building', 'unitNo', 'plotNo',
			'sizeSqft', 'bedsBaths', 'titleDeed', 'spaNo', 'ejariNo', 'dewaNo',
			'ownerName', 'ownerPhone', 'mgmtRef', 'ownerInstruction', 'notes',
			'totalCommission', 'vatPercent', 'companySharePct', 'agentSharePct',
		];
	}

	/**
	 * @return list<string>
	 */
	public static function splitFields(): array
	{
		$keys = ['agentCount'];
		for ($i = 1; $i <= 20; $i++) {
			foreach (['Name', 'EmpId', 'Office', 'Role', 'Contact', 'Split', 'Amount'] as $part) {
				$keys[] = 'agent' . $i . $part;
			}
		}
		return $keys;
	}

	/**
	 * @param array<string, mixed> $workflow
	 */
	public static function wfUser(array $workflow, string $role): int
	{
		$block = $workflow[$role] ?? null;
		if (!is_array($block)) {
			return 0;
		}
		return (int)($block['userId'] ?? 0);
	}

	/**
	 * @param array<string, string> $fields
	 * @param array<string, mixed> $workflow
	 * @return list<string>
	 */
	private static function malikGate(array $fields, array $workflow, int $userId): array
	{
		$errors = [];
		$agent = self::wfUser($workflow, self::AGENT);
		$comp = self::wfUser($workflow, self::COMPLIANCE);
		$acc = self::wfUser($workflow, self::ACCOUNTS);
		if ($comp <= 0 || trim((string)($fields['reviewerSign'] ?? '')) === '') {
			$errors[] = 'Compliance must finish the review and sign before Malik countersigns.';
		}
		if ($acc <= 0) {
			$errors[] = 'Accounts must confirm the money (checks 12–14) before Malik countersigns.';
		}
		for ($n = 12; $n <= 14; $n++) {
			if (!in_array((string)($fields['check' . $n] ?? ''), ['P', 'F', 'NA'], true)) {
				$errors[] = 'Accounts must answer checks 12–14 before Malik countersigns.';
				break;
			}
		}
		if ($userId > 0 && ($userId === $agent || $userId === $comp || $userId === $acc)) {
			$errors[] = 'Malik must be a different person from the agent, compliance officer, and accounts.';
		}
		$people = array_values(array_unique(array_filter([$agent, $comp, $acc, $userId], static fn($id) => $id > 0)));
		if (count($people) < 3) {
			$errors[] = 'At least three different people must touch this file before Malik signs.';
		}
		if (($fields['result'] ?? '') === 'fail' && trim((string)($fields['failReason'] ?? '')) === '') {
			$errors[] = 'This file is on hold. Add the failed check # and reason before signing.';
		}
		return $errors;
	}

	/**
	 * @param list<string> $keys
	 * @param array<string, string> $before
	 * @param array<string, string> $after
	 */
	private static function changed(array $before, array $after, array $keys): bool
	{
		foreach ($keys as $key) {
			$a = trim((string)($before[$key] ?? ''));
			$b = trim((string)($after[$key] ?? ''));
			if ($a !== $b) {
				return true;
			}
		}
		return false;
	}

	/**
	 * @param list<int> $nums
	 * @return list<string>
	 */
	private static function checkKeys(array $nums): array
	{
		$keys = [];
		foreach ($nums as $n) {
			$keys[] = 'check' . $n;
		}
		return $keys;
	}

	/**
	 * @param list<int> $nums
	 * @return list<string>
	 */
	private static function uploadKeys(array $nums): array
	{
		$keys = [];
		foreach ($nums as $n) {
			$keys[] = 'check' . $n . 'Evidence';
			$keys[] = 'check' . $n . 'FileId';
			$keys[] = 'check' . $n . 'FileName';
		}
		return $keys;
	}

	/**
	 * @return array{title:string,who:string,whoLabel:string,can:bool}
	 */
	private static function section(string $title, string $who, bool $can): array
	{
		return [
			'title' => $title,
			'who' => $who,
			'whoLabel' => self::LABELS[$who] ?? $who,
			'can' => $can,
		];
	}

	/**
	 * @param list<int> $have
	 * @param list<int> $want
	 */
	private static function inDepts(array $have, array $want): bool
	{
		return array_intersect($have, $want) !== [];
	}

	/**
	 * @param list<int> $deptIds
	 * @return list<string>
	 */
	private static function deptNames(array $deptIds): array
	{
		$names = [];
		if ($deptIds === [] || !class_exists('CIBlockSection')) {
			return $names;
		}
		if (!\CModule::IncludeModule('iblock')) {
			return $names;
		}
		$sec = \CIBlockSection::GetList([], ['ID' => $deptIds], false, ['ID', 'NAME']);
		while ($s = $sec->Fetch()) {
			$names[] = (string)($s['NAME'] ?? '');
		}
		return $names;
	}
}
