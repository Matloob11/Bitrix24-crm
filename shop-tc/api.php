<?php

declare(strict_types=1);

require $_SERVER['DOCUMENT_ROOT'] . '/bitrix/modules/main/include/prolog_before.php';

require_once $_SERVER['DOCUMENT_ROOT'] . '/tenancy/lib/bootstrap.php';
require_once __DIR__ . '/lib/PdfMaker.php';
require_once __DIR__ . '/lib/Tracker.php';
require_once __DIR__ . '/lib/CrmSearch.php';
require_once __DIR__ . '/lib/DealRules.php';
require_once __DIR__ . '/lib/Roles.php';

tenancy_require_login();

$method = $_SERVER['REQUEST_METHOD'] ?? '';
$raw = file_get_contents('php://input') ?: '';
$payload = json_decode($raw, true);
if (!is_array($payload) || $payload === []) {
	$payload = $_POST;
}
$action = (string)($payload['action'] ?? $_GET['action'] ?? $_POST['action'] ?? '');

if ($method === 'GET' && in_array($action, ['list', 'get', 'download'], true)) {
	try {
		if ($action === 'list') {
			tenancy_json(shop_tc_list());
		}
		if ($action === 'get') {
			tenancy_json(shop_tc_get($_GET));
		}
		if ($action === 'download') {
			shop_tc_download($_GET);
		}
	} catch (\Throwable $e) {
		tenancy_json(['ok' => false, 'error' => $e->getMessage()], 500);
	}
}

if ($method !== 'POST') {
	tenancy_json(['ok' => false, 'error' => 'POST only'], 405);
}

try {
	if ($action === 'save') {
		tenancy_json(shop_tc_save($payload));
	}
	if ($action === 'get') {
		tenancy_json(shop_tc_get($payload));
	}
	if ($action === 'list') {
		tenancy_json(shop_tc_list());
	}
	if ($action === 'search') {
		tenancy_json(shop_tc_search($payload));
	}
	if ($action === 'lookup') {
		tenancy_json(shop_tc_lookup($payload));
	}
	if ($action === 'upload') {
		tenancy_json(shop_tc_upload($_POST, $_FILES));
	}
	tenancy_json(['ok' => false, 'error' => 'Unknown action'], 400);
} catch (\Throwable $e) {
	tenancy_json(['ok' => false, 'error' => $e->getMessage()], 500);
}

/**
 * @return list<string>
 */
function shop_tc_keys(): array
{
	$keys = [
		'dealId', 'dealType', 'dateClosed', 'dealValue', 'fileRef', 'agentCount',
		'reviewedBy', 'reviewDate', 'dealSource',
		'clientName', 'clientType', 'eidNumber', 'eidExpiry', 'nationality',
		'passportNumber', 'passportExpiry', 'passportIssuedBy',
		'companyName', 'tradeLicence', 'signatoryName', 'signatoryEid',
		'clientMobile', 'clientEmail', 'idCopies', 'idVerifiedBy',
		'propertyType', 'community', 'building', 'unitNo', 'plotNo',
		'sizeSqft', 'bedsBaths', 'titleDeed', 'spaNo', 'ejariNo', 'dewaNo',
		'ownerName', 'ownerPhone', 'mgmtRef', 'ownerInstruction', 'notes',
		'totalCommission', 'vatPercent', 'vatAmount', 'grossCommission',
		'companySharePct', 'companyShareAed', 'agentSharePct', 'agentShareAed',
		'result', 'passedCount', 'failedCount', 'naCount', 'failReason',
		'reviewerName', 'reviewerSign', 'countersignName', 'countersignSign',
		'commissionLocked',
	];
	for ($i = 1; $i <= shop_tc_agent_limit(); $i++) {
		foreach (shop_tc_agent_parts() as $part) {
			$keys[] = 'agent' . $i . $part;
		}
	}
	for ($n = 1; $n <= 14; $n++) {
		$keys[] = 'check' . $n;
		$keys[] = 'check' . $n . 'Evidence';
		$keys[] = 'check' . $n . 'FileId';
		$keys[] = 'check' . $n . 'FileName';
	}
	return $keys;
}

/**
 * @param array<string, mixed> $payload
 * @return array<string, string>
 */
function shop_tc_fields(array $payload): array
{
	$out = [];
	foreach (shop_tc_keys() as $key) {
		$out[$key] = trim((string)($payload[$key] ?? ''));
	}
	if ($out['clientType'] !== 'company') {
		$out['clientType'] = $out['clientType'] === 'individual' ? 'individual' : '';
	}
	if ($out['clientType'] === 'company' && $out['clientName'] === '' && $out['companyName'] !== '') {
		$out['clientName'] = $out['companyName'];
	}
	if ($out['dealType'] === 'Off-plan' && $out['titleDeed'] === '' && $out['spaNo'] !== '') {
		$out['titleDeed'] = $out['spaNo'];
	}
	if ($out['idCopies'] !== 'no') {
		$out['idCopies'] = $out['idCopies'] === 'yes' ? 'yes' : '';
	}
	$out['commissionLocked'] = $out['commissionLocked'] === 'yes' ? 'yes' : '';
	if (!in_array($out['result'], ['pass', 'fail'], true)) {
		$out['result'] = '';
	}
	for ($n = 1; $n <= 14; $n++) {
		$st = strtoupper($out['check' . $n]);
		$out['check' . $n] = in_array($st, ['P', 'F', 'NA'], true) ? $st : '';
		$out['check' . $n . 'Evidence'] = shop_tc_evidence_type(
			$out['check' . $n . 'Evidence'],
			$out['check' . $n . 'FileName']
		);
		$fileId = (int)$out['check' . $n . 'FileId'];
		$out['check' . $n . 'FileId'] = $fileId > 0 ? (string)$fileId : '';
	}
	$p = $f = $na = 0;
	for ($n = 1; $n <= 14; $n++) {
		if ($out['check' . $n] === 'P') {
			$p++;
		} elseif ($out['check' . $n] === 'F') {
			$f++;
		} elseif ($out['check' . $n] === 'NA') {
			$na++;
		}
	}
	$out['passedCount'] = (string)$p;
	$out['failedCount'] = (string)$f;
	$out['naCount'] = (string)$na;
	$out['agentCount'] = (string)shop_tc_agent_count($out);
	return $out;
}

/**
 * @return list<string>
 */
function shop_tc_agent_parts(): array
{
	return ['Name', 'EmpId', 'Office', 'Role', 'Contact', 'Split', 'Amount'];
}

function shop_tc_agent_limit(): int
{
	return 20;
}

/**
 * @param array<string, mixed> $src
 */
function shop_tc_agent_count(array $src): int
{
	$declared = (int)($src['agentCount'] ?? 0);
	$last = 0;
	for ($i = 1; $i <= shop_tc_agent_limit(); $i++) {
		$name = trim((string)($src['agent' . $i . 'Name'] ?? ''));
		$split = trim((string)($src['agent' . $i . 'Split'] ?? ''));
		$amount = trim((string)($src['agent' . $i . 'Amount'] ?? ''));
		if ($name !== '' || $split !== '' || $amount !== '') {
			$last = $i;
		}
	}
	return min(shop_tc_agent_limit(), max(1, $declared, $last));
}

function shop_tc_pdf_filename(array $fields): string
{
	$bits = ['DealScout'];
	foreach (['dealId', 'fileRef', 'clientName'] as $key) {
		$part = preg_replace('/[^\w]+/', '_', (string)($fields[$key] ?? '')) ?? '';
		$part = trim($part, '_');
		if ($part !== '') {
			$bits[] = $part;
		}
	}
	return implode('-', $bits) . '.pdf';
}

function shop_tc_title(array $fields): string
{
	$ref = trim((string)($fields['dealId'] ?? $fields['fileRef'] ?? $fields['clientName'] ?? 'Deal'));
	$type = trim((string)($fields['dealType'] ?? ''));
	$title = 'Deal Scouting — ' . ($ref !== '' ? $ref : 'Deal');
	if ($type !== '') {
		$title .= ' — ' . $type;
	}
	return $title;
}

function shop_tc_store_pdf(string $binary, string $name): int
{
	$path = rtrim(sys_get_temp_dir(), '/\\') . '/' . uniqid('deal-scout-', true) . '.pdf';
	if (file_put_contents($path, $binary) === false) {
		return 0;
	}
	$fileArray = \CFile::MakeFileArray($path);
	if (!is_array($fileArray)) {
		@unlink($path);
		return 0;
	}
	$fileArray['name'] = $name;
	$fileArray['MODULE_ID'] = 'deal_scout';
	$id = (int)\CFile::SaveFile($fileArray, 'deal_scout');
	@unlink($path);
	return $id;
}

/**
 * @param array<string, mixed> $payload
 * @return array<string, mixed>
 */
function shop_tc_save(array $payload): array
{
	$me = DealScoutRoles::current();
	$incoming = shop_tc_fields($payload);
	$existingId = trim((string)($payload['id'] ?? ''));
	$existingRow = $existingId !== '' ? ShopTcTracker::get($existingId) : null;
	$existingFields = is_array($existingRow['fields'] ?? null) ? $existingRow['fields'] : [];
	$existingWf = is_array($existingRow['workflow'] ?? null) ? $existingRow['workflow'] : [];
	$isNew = $existingRow === null;
	$profile = $isNew ? $me : DealScoutRoles::forCard($me, $existingWf);
	$merged = DealScoutRules::recompute(DealScoutRoles::merge($existingFields, $incoming, $profile));
	$workflow = DealScoutRoles::stamp($existingWf, $profile, $existingFields, $merged);

	$errors = shop_tc_sod_errors($profile, $existingFields, $merged, $existingWf);
	$errors = array_merge($errors, DealScoutRoles::validateSave($profile, $merged, $workflow, $isNew));
	if ($errors !== []) {
		return ['ok' => false, 'error' => implode(' ', array_values(array_unique($errors)))];
	}

	$pdf = DealScoutPdf::make($merged);
	$pdfName = shop_tc_pdf_filename($merged);
	$pdfFileId = shop_tc_store_pdf($pdf, $pdfName);
	if ($pdfFileId <= 0) {
		return ['ok' => false, 'error' => 'Could not save the PDF.'];
	}

	$row = [
		'title' => shop_tc_title($merged),
		'stage' => ShopTcTracker::STAGE_SHOP,
		'fields' => $merged,
		'workflow' => $workflow,
		'pdfFileId' => $pdfFileId,
		'pdfName' => $pdfName,
		'ownerName' => $merged['ownerName'],
		'tenantName' => $merged['clientName'],
	];

	if (!$isNew) {
		ShopTcTracker::update($existingId, $row);
		$trackId = $existingId;
	} else {
		$trackId = ShopTcTracker::add($row);
	}

	$saved = ShopTcTracker::get($trackId) ?? [];
	return [
		'ok' => true,
		'id' => $trackId,
		'pdfName' => $pdfName,
		'download' => '/shop-tc/api.php?action=download&id=' . rawurlencode($trackId),
		'stage' => ShopTcTracker::STAGE_SHOP,
		'stageLabel' => 'Deal scouting',
		'item' => shop_tc_card($saved),
		'workflow' => is_array($saved['workflow'] ?? null) ? $saved['workflow'] : $workflow,
		'permissions' => DealScoutRoles::forCard($me, is_array($saved['workflow'] ?? null) ? $saved['workflow'] : $workflow),
	];
}

/**
 * @param array<string, mixed> $src
 * @return array<string, mixed>
 */
function shop_tc_get(array $src): array
{
	$id = trim((string)($src['id'] ?? ''));
	$row = $id !== '' ? ShopTcTracker::get($id) : null;
	if ($row === null) {
		return ['ok' => false, 'error' => 'Card not found.'];
	}
	$me = DealScoutRoles::current();
	$wf = is_array($row['workflow'] ?? null) ? $row['workflow'] : [];
	return [
		'ok' => true,
		'id' => (string)$row['id'],
		'fields' => is_array($row['fields'] ?? null) ? $row['fields'] : [],
		'item' => shop_tc_card($row),
		'workflow' => $wf,
		'permissions' => DealScoutRoles::forCard($me, $wf),
	];
}

/**
 * @return array<string, mixed>
 */
function shop_tc_list(): array
{
	$items = [];
	foreach (ShopTcTracker::all() as $row) {
		$items[] = shop_tc_card($row);
	}
	return [
		'ok' => true,
		'columns' => ShopTcTracker::columns(),
		'items' => $items,
		'me' => DealScoutRoles::current(),
	];
}

/**
 * @param array<string, mixed> $row
 * @return array<string, mixed>
 */
function shop_tc_card(array $row): array
{
	$fields = is_array($row['fields'] ?? null) ? $row['fields'] : [];
	$id = (string)($row['id'] ?? '');
	$status = DealScoutRoles::status($row);
	return [
		'id' => $id,
		'title' => (string)($row['title'] ?? 'Deal scouting'),
		'stage' => ShopTcTracker::STAGE_SHOP,
		'stageLabel' => $status['label'],
		'tenantName' => (string)($fields['clientName'] ?? ''),
		'ownerName' => (string)($fields['ownerName'] ?? ''),
		'propertyNo' => (string)($fields['fileRef'] ?? $fields['unitNo'] ?? ''),
		'building' => (string)($fields['building'] ?? ''),
		'dateFrom' => (string)($fields['dateClosed'] ?? ''),
		'dateTo' => (string)($fields['dealType'] ?? ''),
		'annualRent' => (string)($fields['dealValue'] ?? ''),
		'result' => (string)($fields['result'] ?? ''),
		'status' => $status['id'],
		'statusLabel' => $status['label'],
		'dealId' => (string)($fields['dealId'] ?? ''),
		'agentNames' => DealScoutRules::agentNames($fields),
		'pdfName' => (string)($row['pdfName'] ?? ''),
		'download' => $id !== '' ? '/shop-tc/api.php?action=download&id=' . rawurlencode($id) : '',
		'editUrl' => $id !== '' ? '/shop-tc/?id=' . rawurlencode($id) : '/shop-tc/',
		'createdAt' => (int)($row['createdAt'] ?? 0),
		'updatedAt' => (int)($row['updatedAt'] ?? 0),
		'savedLabel' => DealScoutRules::whenLabel((int)($row['createdAt'] ?? 0)),
		'updatedLabel' => DealScoutRules::whenLabel((int)($row['updatedAt'] ?? 0)),
	];
}

/**
 * @param array<string, mixed> $payload
 * @return array<string, mixed>
 */
function shop_tc_search(array $payload): array
{
	$kind = (string)($payload['kind'] ?? '');
	$q = trim((string)($payload['q'] ?? ''));
	if (!in_array($kind, ['deal', 'party', 'company', 'unit', 'user'], true)) {
		return ['ok' => false, 'error' => 'Unknown CRM list.'];
	}
	return [
		'ok' => true,
		'kind' => $kind,
		'items' => DealScoutCrm::search($kind, $q),
	];
}

/**
 * @param array<string, mixed> $payload
 * @return array<string, mixed>
 */
function shop_tc_lookup(array $payload): array
{
	$kind = (string)($payload['kind'] ?? '');
	$id = (int)($payload['id'] ?? 0);
	$target = (string)($payload['target'] ?? '');
	if (!in_array($kind, ['deal', 'party', 'company', 'unit', 'user'], true)) {
		return ['ok' => false, 'error' => 'Unknown CRM item.'];
	}
	if ($id <= 0) {
		return ['ok' => false, 'error' => 'Pick an item from the list.'];
	}
	return [
		'ok' => true,
		'kind' => $kind,
		'fields' => DealScoutCrm::lookup($kind, $id, $target),
	];
}

/**
 * @param array<string, mixed> $post
 * @param array<string, mixed> $files
 * @return array<string, mixed>
 */
function shop_tc_upload(array $post, array $files): array
{
	$check = (int)($post['check'] ?? 0);
	if ($check < 1 || $check > 14) {
		return ['ok' => false, 'error' => 'Unknown checklist row.'];
	}
	$me = DealScoutRoles::current();
	$cardId = trim((string)($post['id'] ?? ''));
	$row = $cardId !== '' ? ShopTcTracker::get($cardId) : null;
	$wf = is_array($row['workflow'] ?? null) ? $row['workflow'] : [];
	$profile = $row ? DealScoutRoles::forCard($me, $wf) : $me;
	if (!DealScoutRoles::canUpload($profile, $check)) {
		return ['ok' => false, 'error' => 'Your role cannot attach evidence on check #' . $check . '.'];
	}
	if (in_array($check, [3, 4, 5], true)) {
		$sod = DealScoutRoles::sodErrors($wf, (int)$me['userId'], DealScoutRoles::COMPLIANCE);
		if ($sod !== []) {
			return ['ok' => false, 'error' => $sod[0]];
		}
	}
	if (in_array($check, [12, 13, 14], true)) {
		$sod = DealScoutRoles::sodErrors($wf, (int)$me['userId'], DealScoutRoles::ACCOUNTS);
		if ($sod !== []) {
			return ['ok' => false, 'error' => $sod[0]];
		}
	}
	$file = $files['file'] ?? null;
	if (!is_array($file) || (int)($file['error'] ?? UPLOAD_ERR_NO_FILE) !== UPLOAD_ERR_OK) {
		return ['ok' => false, 'error' => 'Choose a document to upload.'];
	}
	$size = (int)($file['size'] ?? 0);
	if ($size <= 0 || $size > 12 * 1024 * 1024) {
		return ['ok' => false, 'error' => 'File must be 12 MB or smaller.'];
	}
	$name = (string)($file['name'] ?? 'evidence');
	$ext = strtolower(pathinfo($name, PATHINFO_EXTENSION));
	$types = [
		'pdf' => 'PDF',
		'jpg' => 'JPG',
		'jpeg' => 'JPG',
		'png' => 'PNG',
		'webp' => 'WEBP',
		'doc' => 'DOC',
		'docx' => 'DOCX',
	];
	if (!isset($types[$ext])) {
		return ['ok' => false, 'error' => 'Upload PDF, JPG, PNG, DOC or DOCX.'];
	}
	$tmp = (string)($file['tmp_name'] ?? '');
	if ($tmp === '' || !is_uploaded_file($tmp)) {
		return ['ok' => false, 'error' => 'Upload failed. Try again.'];
	}
	$file['name'] = $name;
	$file['MODULE_ID'] = 'deal_scout';
	$fileId = (int)\CFile::SaveFile($file, 'deal_scout');
	if ($fileId <= 0) {
		return ['ok' => false, 'error' => 'Could not store the document.'];
	}
	return [
		'ok' => true,
		'check' => $check,
		'fileId' => $fileId,
		'fileName' => $name,
		'type' => $types[$ext],
	];
}

/**
 * @param array<string, mixed> $profile
 * @param array<string, string> $before
 * @param array<string, string> $after
 * @param array<string, mixed> $workflow
 * @return list<string>
 */
function shop_tc_sod_errors(array $profile, array $before, array $after, array $workflow): array
{
	$uid = (int)($profile['userId'] ?? 0);
	$errors = [];
	$changed = static function (array $keys) use ($before, $after): bool {
		foreach ($keys as $key) {
			if (trim((string)($before[$key] ?? '')) !== trim((string)($after[$key] ?? ''))) {
				return true;
			}
		}
		return false;
	};
	$checkKeys = static function (array $nums): array {
		$keys = [];
		foreach ($nums as $n) {
			$keys[] = 'check' . $n;
		}
		return $keys;
	};

	if ($changed($checkKeys([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11])) || $changed(['reviewedBy', 'reviewDate', 'idVerifiedBy', 'reviewerName', 'reviewerSign'])) {
		$errors = array_merge($errors, DealScoutRoles::sodErrors($workflow, $uid, DealScoutRoles::COMPLIANCE));
	}
	if ($changed($checkKeys([12, 13, 14])) || $changed(['commissionLocked'])) {
		$errors = array_merge($errors, DealScoutRoles::sodErrors($workflow, $uid, DealScoutRoles::ACCOUNTS));
	}
	if ($changed(DealScoutRoles::splitFields())) {
		$errors = array_merge($errors, DealScoutRoles::sodErrors($workflow, $uid, DealScoutRoles::MANAGER));
	}
	if ($changed(['countersignName', 'countersignSign'])) {
		$errors = array_merge($errors, DealScoutRoles::sodErrors($workflow, $uid, DealScoutRoles::MALIK));
	}
	return $errors;
}

function shop_tc_evidence_type(string $type, string $fileName): string
{
	$allowed = ['PDF', 'JPG', 'PNG', 'WEBP', 'DOC', 'DOCX'];
	$type = strtoupper(trim($type));
	if (in_array($type, $allowed, true)) {
		return $type;
	}
	$ext = strtolower(pathinfo($fileName, PATHINFO_EXTENSION));
	$map = [
		'pdf' => 'PDF',
		'jpg' => 'JPG',
		'jpeg' => 'JPG',
		'png' => 'PNG',
		'webp' => 'WEBP',
		'doc' => 'DOC',
		'docx' => 'DOCX',
	];
	return $map[$ext] ?? '';
}

/**
 * @param array<string, mixed> $src
 */
function shop_tc_download(array $src): void
{
	$id = trim((string)($src['id'] ?? ''));
	$row = $id !== '' ? ShopTcTracker::get($id) : null;
	if ($row === null) {
		http_response_code(404);
		header('Content-Type: text/plain; charset=utf-8');
		echo 'Card not found.';
		exit;
	}
	$fields = is_array($row['fields'] ?? null) ? $row['fields'] : [];
	$bytes = $fields !== [] ? DealScoutPdf::make($fields) : '';
	if ($bytes === '') {
		http_response_code(404);
		header('Content-Type: text/plain; charset=utf-8');
		echo 'PDF is missing.';
		exit;
	}
	$name = (string)($row['pdfName'] ?? 'deal-scouting.pdf');
	header('Content-Type: application/pdf');
	header('Content-Disposition: attachment; filename="' . $name . '"');
	header('Content-Length: ' . strlen($bytes));
	echo $bytes;
	exit;
}
