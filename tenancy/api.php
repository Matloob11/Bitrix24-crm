<?php

declare(strict_types=1);

require $_SERVER['DOCUMENT_ROOT'] . '/bitrix/modules/main/include/prolog_before.php';

require_once __DIR__ . '/lib/bootstrap.php';
require_once __DIR__ . '/lib/CrmLookup.php';
require_once __DIR__ . '/lib/PdfMaker.php';
require_once __DIR__ . '/lib/SignSender.php';
require_once __DIR__ . '/lib/SignBoard.php';
require_once __DIR__ . '/lib/Mailer.php';
require_once __DIR__ . '/lib/Tracker.php';
require_once __DIR__ . '/lib/Whatsapp.php';

tenancy_require_login();

$method = $_SERVER['REQUEST_METHOD'] ?? '';
$raw = file_get_contents('php://input') ?: '';
$payload = json_decode($raw, true);
if (!is_array($payload) || $payload === []) {
	$payload = $_POST;
}
$action = (string)($payload['action'] ?? $_GET['action'] ?? '');

if ($method === 'GET' && in_array($action, ['list', 'context', 'download'], true)) {
	try {
		if ($action === 'list') {
			tenancy_json(tenancy_list());
		}
		if ($action === 'context') {
			tenancy_json(tenancy_context($_GET));
		}
		if ($action === 'download') {
			tenancy_download($_GET);
		}
	} catch (\Throwable $e) {
		tenancy_json(['ok' => false, 'error' => $e->getMessage()], 500);
	}
}

if ($method !== 'POST') {
	tenancy_json(['ok' => false, 'error' => 'POST only'], 405);
}

try {
	if ($action === 'lookup') {
		tenancy_json(tenancy_lookup($payload));
	}
	if ($action === 'send' || $action === 'prepare') {
		tenancy_json(tenancy_prepare($payload));
	}
	if ($action === 'save') {
		tenancy_json(tenancy_save_board($payload));
	}
	if ($action === 'whatsapp') {
		tenancy_json(tenancy_whatsapp_action($payload));
	}
	if ($action === 'email') {
		tenancy_json(tenancy_email_action($payload));
	}
	if ($action === 'list') {
		tenancy_json(tenancy_list());
	}
	if ($action === 'context') {
		tenancy_json(tenancy_context($payload));
	}
	if ($action === 'stage') {
		tenancy_json(tenancy_stage($payload));
	}
	tenancy_json(['ok' => false, 'error' => 'Unknown action'], 400);
} catch (\Throwable $e) {
	tenancy_json(['ok' => false, 'error' => $e->getMessage()], 500);
}

/**
 * @param array<string, mixed> $payload
 * @return array<string, mixed>
 */
function tenancy_lookup(array $payload): array
{
	$entity = (string)($payload['entity'] ?? '');
	$id = (int)($payload['id'] ?? 0);
	if ($id <= 0) {
		return ['ok' => false, 'error' => 'Missing id', 'found' => false];
	}

	$info = match ($entity) {
		'contact' => TenancyCrm::contact($id),
		'company' => TenancyCrm::company($id),
		'lead' => TenancyCrm::lead($id),
		'dynamic-1112', 'dynamic_1112', 'unit' => TenancyCrm::ownerUnit($id),
		default => null,
	};

	if ($info === null) {
		return [
			'ok' => true,
			'found' => false,
			'message' => 'This record is not in Bitrix CRM.',
		];
	}

	return [
		'ok' => true,
		'found' => true,
		'message' => 'Found in Bitrix CRM.',
		'data' => $info,
	];
}

/**
 * @param array<string, mixed> $payload
 * @return array<string, mixed>
 */
function tenancy_normalize(array $payload): array
{
	foreach (['annualRent', 'contractValue', 'deposit', 'contractDate', 'dateFrom', 'dateTo', 'tenantEmail', 'landlordEmail', 'tenantName', 'landlordName', 'tenantPhone', 'landlordPhone', 'propertyNo', 'building', 'template'] as $key) {
		$payload[$key] = trim((string)($payload[$key] ?? ''));
	}
	if ($payload['template'] === '') {
		$payload['template'] = 'ejari';
	}
	if ($payload['dateFrom'] === '' && $payload['contractDate'] !== '') {
		$payload['dateFrom'] = $payload['contractDate'];
	}
	if ($payload['dateTo'] === '' && $payload['dateFrom'] !== '') {
		$from = \DateTime::createFromFormat('Y-m-d', $payload['dateFrom']);
		if ($from instanceof \DateTime) {
			$from->modify('+1 year')->modify('-1 day');
			$payload['dateTo'] = $from->format('Y-m-d');
		}
	}
	if ($payload['contractValue'] === '') {
		$payload['contractValue'] = $payload['annualRent'];
	}
	if ($payload['deposit'] === '') {
		$base = (float)preg_replace('/[^\d.]/', '', $payload['contractValue'] !== '' ? $payload['contractValue'] : $payload['annualRent']);
		if ($base > 0) {
			$payload['deposit'] = (string)round($base * 0.05, 2);
		}
	}
	return $payload;
}

function tenancy_pdf_filename(array $payload): string
{
	$bits = ['Tenancy'];
	foreach (['propertyNo', 'tenantName', 'dateFrom'] as $key) {
		$part = preg_replace('/[^\w]+/', '_', (string)($payload[$key] ?? '')) ?? '';
		$part = trim($part, '_');
		if ($part !== '') {
			$bits[] = $part;
		}
	}
	return implode('-', $bits) . '.pdf';
}

/**
 * Build the filled PDF from the form and store it. Does not open Sign.
 *
 * @param array<string, mixed> $payload
 * @return array<string, mixed>
 */
function tenancy_prepare(array $payload): array
{
	$payload = tenancy_normalize($payload);
	$required = ['tenantName', 'landlordName', 'dateFrom', 'dateTo', 'annualRent'];
	foreach ($required as $field) {
		if (trim((string)($payload[$field] ?? '')) === '') {
			return ['ok' => false, 'error' => 'Please fill ' . $field . '.'];
		}
	}

	$pdf = TenancyPdf::make($payload);
	$pdfName = tenancy_pdf_filename($payload);
	$pdfFileId = tenancy_store_pdf($pdf, $pdfName);
	if ($pdfFileId <= 0) {
		return ['ok' => false, 'error' => 'Could not save the PDF.'];
	}

	$fields = [
		'title' => 'Tenancy Contract — ' . trim((string)($payload['propertyNo'] ?? $payload['building'] ?? 'Unit')),
		'stage' => TenancyTracker::STAGE_DRAFT,
		'sendTo' => 'whatsapp',
		'template' => (string)$payload['template'],
		'documentId' => 0,
		'entityId' => 0,
		'signUrl' => '',
		'ownerName' => (string)$payload['landlordName'],
		'tenantName' => (string)$payload['tenantName'],
		'ownerEmail' => (string)$payload['landlordEmail'],
		'tenantEmail' => (string)$payload['tenantEmail'],
		'ownerPhone' => (string)($payload['landlordPhone'] ?? ''),
		'tenantPhone' => (string)($payload['tenantPhone'] ?? ''),
		'pdfFileId' => $pdfFileId,
		'pdfName' => $pdfName,
		'signedFileId' => 0,
		'signedFileName' => '',
	];

	$existingId = trim((string)($payload['id'] ?? ''));
	$existing = $existingId !== '' ? TenancyTracker::get($existingId) : null;
	if ($existing !== null) {
		if (empty($fields['documentId']) && !empty($existing['documentId'])) {
			$fields['documentId'] = (int)$existing['documentId'];
		}
		if (empty($fields['entityId']) && !empty($existing['entityId'])) {
			$fields['entityId'] = (int)$existing['entityId'];
		}
		if ($fields['signUrl'] === '' && !empty($existing['signUrl'])) {
			$fields['signUrl'] = (string)$existing['signUrl'];
		}
		TenancyTracker::update($existingId, $fields);
		$trackId = $existingId;
	} else {
		$trackId = TenancyTracker::add($fields);
	}

	return [
		'ok' => true,
		'id' => $trackId,
		'trackId' => $trackId,
		'pdfName' => $pdfName,
		'download' => '/tenancy/api.php?action=download&id=' . rawurlencode($trackId),
		'stage' => TenancyTracker::STAGE_DRAFT,
	];
}

/**
 * @return array<string, mixed>
 */
function tenancy_list(): array
{
	$tracked = [];
	foreach (TenancyTracker::all() as $row) {
		TenancySignBoard::syncTrackerRow($row);
	}
	foreach (TenancyTracker::all() as $row) {
		$stage = TenancyTracker::normalize((string)($row['stage'] ?? 'draft'));
		$item = [
			'id' => (string)$row['id'],
			'source' => 'form',
			'title' => (string)($row['title'] ?? 'Tenancy contract'),
			'stage' => $stage,
			'stageLabel' => TenancyTracker::label($stage),
			'documentId' => (int)($row['documentId'] ?? 0),
			'entityId' => (int)($row['entityId'] ?? 0),
			'signUrl' => (string)($row['signUrl'] ?? ''),
			'download' => !empty($row['pdfFileId'])
				? tenancy_download_url((string)$row['id'], (string)($row['stage'] ?? ''))
				: '',
			'ownerName' => (string)($row['ownerName'] ?? ''),
			'tenantName' => (string)($row['tenantName'] ?? ''),
			'pdfName' => (string)($row['pdfName'] ?? ''),
			'createdAt' => (int)($row['createdAt'] ?? 0),
		];
		$tracked[] = $item;
	}

	$used = [];
	$items = [];
	foreach (TenancySignBoard::list() as $sign) {
		$match = null;
		if ((int)$sign['entityId'] > 0) {
			$match = TenancyTracker::findByEntityId((int)$sign['entityId']);
		}
		if ($match === null && (int)$sign['documentId'] > 0) {
			$match = TenancyTracker::findByDocumentId((int)$sign['documentId']);
		}
		$item = [
			'id' => $match ? (string)$match['id'] : 'sign-' . $sign['documentId'],
			'source' => $match ? 'both' : 'sign',
			'title' => (string)$sign['title'],
			'stage' => (string)$sign['stage'],
			'stageLabel' => (string)$sign['stageLabel'],
			'documentId' => (int)$sign['documentId'],
			'entityId' => (int)$sign['entityId'],
			'signUrl' => (string)$sign['signUrl'],
			'download' => $match
				? tenancy_download_url((string)$match['id'], (string)($match['stage'] ?? ''))
				: '',
			'ownerName' => (string)($match['ownerName'] ?? ''),
			'tenantName' => (string)($match['tenantName'] ?? ''),
			'pdfName' => (string)($match['pdfName'] ?? ''),
			'createdAt' => (int)$sign['createdAt'],
			'signStatus' => (string)$sign['signStatus'],
		];
		$items[] = $item;
		if ($match) {
			$used[(string)$match['id']] = true;
		}
	}
	foreach ($tracked as $item) {
		if (!empty($used[$item['id']])) {
			continue;
		}
		$items[] = $item;
	}
	usort($items, static fn($a, $b) => (int)$b['createdAt'] <=> (int)$a['createdAt']);

	return [
		'ok' => true,
		'columns' => TenancyTracker::columns(),
		'items' => $items,
	];
}

/**
 * Save filled PDF onto the Sign board (Draft or Under review).
 *
 * @param array<string, mixed> $payload
 * @return array<string, mixed>
 */
function tenancy_save_board(array $payload): array
{
	global $USER;
	$stage = TenancyTracker::normalize((string)($payload['stage'] ?? 'draft'));
	if ($stage !== TenancyTracker::STAGE_REVIEW) {
		$stage = TenancyTracker::STAGE_DRAFT;
	}
	$prepared = tenancy_prepare($payload);
	if (empty($prepared['ok'])) {
		return $prepared;
	}
	$row = TenancyTracker::get((string)$prepared['id']);
	if ($row === null) {
		return ['ok' => false, 'error' => 'Could not save the contract.'];
	}

	$pdf = tenancy_pdf_bytes($row);
	$signError = '';
	if ($pdf !== '' && is_object($USER)) {
		$sign = TenancySign::send($payload, $pdf, (int)$USER->GetID());
		if (!empty($sign['ok'])) {
			TenancyTracker::update((string)$row['id'], [
				'documentId' => (int)($sign['documentId'] ?? 0),
				'entityId' => (int)($sign['entityId'] ?? 0),
				'signUrl' => (string)($sign['url'] ?? ''),
				'stage' => $stage,
			]);
			$entityId = (int)($sign['entityId'] ?? 0);
			if ($entityId > 0) {
				TenancySignBoard::moveCrm($entityId, $stage);
			}
			if (!empty($sign['warning'])) {
				$signError = (string)$sign['warning'];
			}
		} else {
			$signError = (string)($sign['error'] ?? 'Sign board was not updated.');
			TenancyTracker::update((string)$row['id'], ['stage' => $stage]);
		}
	} else {
		TenancyTracker::update((string)$row['id'], ['stage' => $stage]);
	}

	$updated = TenancyTracker::get((string)$row['id']);
	$signUrl = (string)($updated['signUrl'] ?? '');

	return [
		'ok' => true,
		'id' => $row['id'],
		'download' => $prepared['download'],
		'pdfName' => $prepared['pdfName'],
		'stage' => $stage,
		'stageLabel' => TenancyTracker::label($stage),
		'signUrl' => $signUrl,
		'signError' => $signError,
		'entityId' => (int)($updated['entityId'] ?? 0),
		'documentId' => (int)($updated['documentId'] ?? 0),
	];
}

/**
 * @param array<string, mixed> $payload
 * @return array<string, mixed>
 */
function tenancy_stage(array $payload): array
{
	$id = trim((string)($payload['id'] ?? ''));
	$stage = TenancyTracker::normalize(trim((string)($payload['stage'] ?? '')));
	if ($id === '' || !TenancyTracker::isKnown($stage)) {
		return ['ok' => false, 'error' => 'Pick a contract and a stage.'];
	}

	$entityId = (int)($payload['entityId'] ?? 0);
	$documentId = (int)($payload['documentId'] ?? 0);
	$current = str_starts_with($id, 'sign-') ? null : TenancyTracker::get($id);
	if ($current === null && str_starts_with($id, 'sign-')) {
		$documentId = $documentId > 0 ? $documentId : (int)substr($id, 5);
		if ($entityId <= 0 && $documentId > 0) {
			$entityId = TenancySignBoard::entityIdForDocument($documentId);
		}
	}
	if ($current !== null) {
		$entityId = $entityId > 0 ? $entityId : (int)($current['entityId'] ?? 0);
		$documentId = $documentId > 0 ? $documentId : (int)($current['documentId'] ?? 0);
	}

	if ($current === null && $entityId <= 0) {
		return ['ok' => false, 'error' => 'Contract not found.'];
	}

	$patch = ['stage' => $stage];
	if ($stage === TenancyTracker::STAGE_SIGNED && $current !== null && $entityId <= 0) {
		$file = tenancy_save_signed_upload();
		if ($file === null && (int)($current['signedFileId'] ?? 0) <= 0) {
			return ['ok' => false, 'error' => 'Upload the signed PDF, or move a Sign document.'];
		}
		if ($file !== null) {
			$patch['signedFileId'] = $file['id'];
			$patch['signedFileName'] = $file['name'];
		}
	}

	$updated = $current !== null ? TenancyTracker::update($id, $patch) : ['stage' => $stage, 'entityId' => $entityId, 'documentId' => $documentId];
	if ($entityId > 0) {
		TenancySignBoard::moveCrm($entityId, $stage);
	}
	if ($updated === null) {
		return ['ok' => false, 'error' => 'Could not update the stage.'];
	}
	$updated['stageLabel'] = TenancyTracker::label($stage);
	$updated['stage'] = $stage;
	$updated['entityId'] = $entityId;
	$updated['documentId'] = $documentId;
	return ['ok' => true, 'item' => $updated];
}

/**
 * @return array{id:int,name:string}|null
 */
function tenancy_save_signed_upload(): ?array
{
	$file = $_FILES['signedPdf'] ?? $_FILES['file'] ?? null;
	if (!is_array($file) || (int)($file['error'] ?? UPLOAD_ERR_NO_FILE) === UPLOAD_ERR_NO_FILE) {
		return null;
	}
	if ((int)$file['error'] !== UPLOAD_ERR_OK || empty($file['tmp_name'])) {
		return null;
	}
	$name = (string)($file['name'] ?? 'signed.pdf');
	$ext = strtolower(pathinfo($name, PATHINFO_EXTENSION));
	if (!in_array($ext, ['pdf', 'jpg', 'jpeg', 'png'], true)) {
		throw new \RuntimeException('Upload a PDF or image of the signed contract.');
	}
	$fileArray = [
		'name' => $name,
		'type' => (string)($file['type'] ?? 'application/pdf'),
		'tmp_name' => $file['tmp_name'],
		'error' => (int)$file['error'],
		'size' => (int)($file['size'] ?? 0),
		'MODULE_ID' => 'main',
	];
	$id = (int)\CFile::SaveFile($fileArray, 'tenancy');
	return $id > 0 ? ['id' => $id, 'name' => $name] : null;
}

/**
 * @param array<string, mixed> $src
 */
function tenancy_row_from(array $src): ?array
{
	$id = trim((string)($src['id'] ?? $src['tenancy'] ?? ''));
	if ($id !== '') {
		$row = TenancyTracker::get($id);
		if ($row !== null) {
			return $row;
		}
	}
	$entityId = (int)($src['entityId'] ?? 0);
	return $entityId > 0 ? TenancyTracker::findByEntityId($entityId) : null;
}

function tenancy_store_pdf(string $binary, string $name): int
{
	$path = rtrim(sys_get_temp_dir(), '/\\') . '/' . uniqid('tenancy-pdf-', true) . '.pdf';
	if (file_put_contents($path, $binary) === false) {
		return 0;
	}
	$fileArray = \CFile::MakeFileArray($path);
	if (!is_array($fileArray)) {
		@unlink($path);
		return 0;
	}
	$fileArray['name'] = $name;
	$fileArray['MODULE_ID'] = 'tenancy';
	$id = (int)\CFile::SaveFile($fileArray, 'tenancy');
	@unlink($path);
	return $id;
}

function tenancy_pdf_bytes(array $row, bool $preferSigned = false): string
{
	if ($preferSigned) {
		$signedId = (int)($row['signedFileId'] ?? 0);
		if ($signedId > 0) {
			$path = \CFile::GetPath($signedId);
			if (is_string($path) && $path !== '') {
				$full = (str_starts_with($path, '/') ? (string)$_SERVER['DOCUMENT_ROOT'] : '') . $path;
				if (is_readable($full)) {
					return (string)file_get_contents($full);
				}
			}
		}
	}
	$fileId = (int)($row['pdfFileId'] ?? 0);
	if ($fileId <= 0) {
		return '';
	}
	$path = \CFile::GetPath($fileId);
	if (!is_string($path) || $path === '') {
		return '';
	}
	$full = (str_starts_with($path, '/') ? (string)$_SERVER['DOCUMENT_ROOT'] : '') . $path;
	return is_readable($full) ? (string)file_get_contents($full) : '';
}

/**
 * @param array<string, mixed> $src
 * @return array<string, mixed>
 */
function tenancy_context(array $src): array
{
	$row = tenancy_row_from($src);
	if ($row === null) {
		return ['ok' => false, 'error' => 'No tenancy contract linked to this Sign document.'];
	}
	return [
		'ok' => true,
		'id' => $row['id'],
		'title' => $row['title'] ?? '',
		'ownerName' => $row['ownerName'] ?? '',
		'tenantName' => $row['tenantName'] ?? '',
		'ownerEmail' => $row['ownerEmail'] ?? '',
		'tenantEmail' => $row['tenantEmail'] ?? '',
		'hasOwnerPhone' => tenancy_phone_digits((string)($row['ownerPhone'] ?? '')) !== '',
		'hasTenantPhone' => tenancy_phone_digits((string)($row['tenantPhone'] ?? '')) !== '',
		'hasOwnerEmail' => (string)($row['ownerEmail'] ?? '') !== '',
		'hasTenantEmail' => (string)($row['tenantEmail'] ?? '') !== '',
		'download' => '/tenancy/api.php?action=download&id=' . rawurlencode((string)$row['id']),
	];
}

function tenancy_download_url(string $id, string $stage = ''): string
{
	$url = '/tenancy/api.php?action=download&id=' . rawurlencode($id);
	if (TenancyTracker::normalize($stage) === TenancyTracker::STAGE_SIGNED) {
		$url .= '&signed=1';
	}
	return $url;
}

/**
 * @param array<string, mixed> $src
 */
function tenancy_download(array $src): void
{
	$row = tenancy_row_from($src);
	if ($row === null) {
		http_response_code(404);
		header('Content-Type: text/plain');
		echo 'Contract PDF not found.';
		exit;
	}
	$wantSigned = !empty($src['signed']) || TenancyTracker::normalize((string)($row['stage'] ?? '')) === TenancyTracker::STAGE_SIGNED;
	$bytes = tenancy_pdf_bytes($row, $wantSigned);
	if ($bytes === '') {
		http_response_code(404);
		header('Content-Type: text/plain');
		echo 'PDF file missing.';
		exit;
	}
	$name = $wantSigned && !empty($row['signedFileName'])
		? (string)$row['signedFileName']
		: (string)($row['pdfName'] ?? 'tenancy-contract.pdf');
	header('Content-Type: application/pdf');
	header('Content-Disposition: attachment; filename="' . str_replace('"', '', $name) . '"');
	header('Content-Length: ' . strlen($bytes));
	echo $bytes;
	exit;
}

/**
 * @param array<string, mixed> $payload
 * @return array<string, mixed>
 */
function tenancy_whatsapp_action(array $payload): array
{
	$party = (string)($payload['party'] ?? 'tenant') === 'owner' ? 'owner' : 'tenant';
	$prepared = tenancy_prepare($payload);
	if (empty($prepared['ok'])) {
		return $prepared;
	}
	$row = TenancyTracker::get((string)$prepared['id']);
	if ($row === null) {
		return ['ok' => false, 'error' => 'Could not save the contract.'];
	}
	$data = array_merge($payload, [
		'landlordName' => $row['ownerName'] ?? '',
		'tenantName' => $row['tenantName'] ?? '',
		'landlordPhone' => $row['ownerPhone'] ?? '',
		'tenantPhone' => $row['tenantPhone'] ?? '',
		'propertyNo' => $payload['propertyNo'] ?? ($row['title'] ?? ''),
	]);
	$out = TenancyWhatsapp::send($party, $data);
	if (empty($out['ok'])) {
		return $out;
	}
	$stage = TenancyTracker::STAGE_SENT;
	TenancyTracker::update((string)$row['id'], ['stage' => $stage]);
	$entityId = (int)($row['entityId'] ?? 0);
	if ($entityId > 0) {
		TenancySignBoard::moveCrm($entityId, $stage);
	}
	$out['id'] = $row['id'];
	$out['download'] = $prepared['download'];
	$out['pdfName'] = $prepared['pdfName'];
	$out['stage'] = $stage;
	return $out;
}

/**
 * @param array<string, mixed> $payload
 * @return array<string, mixed>
 */
function tenancy_email_action(array $payload): array
{
	$row = tenancy_row_from($payload);
	if ($row === null) {
		return ['ok' => false, 'error' => 'Contract not found.'];
	}
	$party = (string)($payload['party'] ?? 'tenant') === 'owner' ? 'owner' : 'tenant';
	$patch = [];
	if (trim((string)($payload['tenantEmail'] ?? '')) !== '') {
		$patch['tenantEmail'] = trim((string)$payload['tenantEmail']);
	}
	if (trim((string)($payload['landlordEmail'] ?? '')) !== '') {
		$patch['ownerEmail'] = trim((string)$payload['landlordEmail']);
	}
	if ($patch !== []) {
		$row = TenancyTracker::update((string)$row['id'], $patch) ?? $row;
	}
	$to = $party === 'owner' ? (string)($row['ownerEmail'] ?? '') : (string)($row['tenantEmail'] ?? '');
	$name = $party === 'owner' ? (string)($row['ownerName'] ?? '') : (string)($row['tenantName'] ?? '');
	if ($to === '') {
		return ['ok' => false, 'error' => 'Add the ' . $party . ' email below, then try again.'];
	}
	$pdf = tenancy_pdf_bytes($row);
	if ($pdf === '') {
		return ['ok' => false, 'error' => 'PDF is missing. Fill the form again.'];
	}
	$nameFile = (string)($row['pdfName'] ?? 'tenancy-contract.pdf');
	$sent = TenancyMail::contractPdf($to, $name, $party, $row, $pdf, $nameFile);
	if (!$sent['ok']) {
		return $sent;
	}
	$stage = $party === 'owner' ? TenancyTracker::STAGE_OWNER : TenancyTracker::STAGE_TENANT;
	TenancyTracker::update((string)$row['id'], ['stage' => $stage]);
	return ['ok' => true, 'mailed' => $to, 'stage' => $stage];
}
