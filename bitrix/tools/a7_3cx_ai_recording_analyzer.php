<?php

/**
 * A7 3CX recording AI analyzer for Bitrix24.
 *
 * Upload the generated version of this file to:
 * /bitrix/tools/a7_3cx_ai_recording_analyzer.php
 */

const A7_AI_3CX_BASE_URL = 'https://a7properties.3cx.ae:5001';
const A7_AI_3CX_CLIENT_ID = 'recordings';
const A7_AI_3CX_CLIENT_SECRET = 'zD9eoPBqSnLnf1mXRKTjEWs3AyKFru1K';
const A7_AI_BITRIX_WEBHOOK_URL = 'https://crm.a7grouprealestatedxb.com/rest/1/h7mdv4vm9leu4agu/';
const A7_AI_OPENAI_API_KEY = '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';
const A7_AI_ANALYSIS_MODEL = 'gpt-4o-mini';
const A7_AI_TRANSCRIBE_MODEL = 'gpt-4o-transcribe-diarize';
const A7_AI_TRANSCRIBE_FALLBACK_MODEL = 'gpt-4o-mini-transcribe';
const A7_AI_HANDLER_URL = 'https://crm.a7grouprealestatedxb.com/bitrix/tools/a7_3cx_ai_recording_analyzer.php';
const A7_AI_LOG_FILE = '/home/bitrix/www/upload/a7_3cx_ai_recording_analyzer.log';
const A7_AI_STATE_FILE = '/home/bitrix/www/upload/a7_3cx_ai_recording_analyzer_state.json';
const A7_AI_TMP_DIR = '/home/bitrix/www/upload/a7_3cx_ai_tmp';
const A7_AI_LOCK_FILE = '/home/bitrix/www/upload/a7_3cx_ai_recording_analyzer.lock';
const A7_AI_MIN_RUN_SECONDS = 300;
const A7_AI_MAX_LIMIT_PER_RUN = 10;
const A7_AI_MAX_WRITES_PER_RUN = 1;
const A7_AI_MAX_WRITES_PER_HOUR = 12;
const A7_AI_MAX_WRITES_PER_DAY = 80;
const A7_AI_RECORDING_READY_DELAY_SECONDS = 300;
const A7_AI_MAX_AUDIO_BYTES = 20971520;
const A7_AI_STORED_SCORE_LIMIT = 200;
const A7_AI_MIN_AUDIO_SECONDS = 2;
const A7_AI_OWNER_DATA_ENTITY_TYPE_ID = 1042;
const A7_AI_OWNER_DATA_CATEGORY_ID = 14;

const A7_LEAD_FIELD_LEAD_TYPE = 'UF_CRM_1756638760279';
const A7_LEAD_FIELD_REQUIREMENT_CATEGORY = 'UF_CRM_1733420318709';
const A7_LEAD_FIELD_BEDROOMS = 'UF_CRM_1731838126127';
const A7_LEAD_FIELD_PROPERTY_TYPE = 'UF_CRM_1731838348693';
const A7_LEAD_FIELD_TIMELINE = 'UF_CRM_1739869968682';
const A7_LEAD_FIELD_PURPOSE = 'UF_CRM_LEAD_1737031634747';
const A7_LEAD_FIELD_MEETING_MODE = 'UF_CRM_1731838790184';
const A7_LEAD_FIELD_BUDGET_RANGE = 'UF_CRM_1740043316741';
const A7_LEAD_FIELD_CONTACT_METHOD = 'UF_CRM_1752318875141';

function a7_ai_is_direct_request(): bool
{
    $script = realpath((string)($_SERVER['SCRIPT_FILENAME'] ?? ''));
    $self = realpath(__FILE__);
    return $script !== false && $self !== false && $script === $self;
}

if (a7_ai_is_direct_request() && !headers_sent()) {
    header('Content-Type: application/json; charset=utf-8');
}

function a7_ai_log(string $message, array $context = []): void
{
    $safe = $context;
    foreach (['api_key', 'openai_api_key', 'client_secret', 'access_token', 'Authorization'] as $key) {
        if (isset($safe[$key])) {
            $safe[$key] = '***';
        }
    }

    @file_put_contents(
        A7_AI_LOG_FILE,
        json_encode([
            'time' => date('c'),
            'message' => $message,
            'context' => $safe,
        ], JSON_UNESCAPED_SLASHES) . PHP_EOL,
        FILE_APPEND
    );
}

function a7_ai_json(array $payload, int $statusCode = 200): void
{
    while (ob_get_level() > 0) {
        ob_end_clean();
    }

    if (!headers_sent()) {
        header('Content-Type: application/json; charset=utf-8');
        http_response_code($statusCode);
    }

    echo json_encode($payload, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    exit;
}

function a7_ai_text(string $text, int $statusCode = 200, string $contentType = 'text/plain; charset=utf-8'): void
{
    while (ob_get_level() > 0) {
        ob_end_clean();
    }

    if (!headers_sent()) {
        header('Content-Type: ' . $contentType);
        http_response_code($statusCode);
    }

    echo $text;
    exit;
}

function a7_ai_request_value(string $key, $default = null)
{
    return $_POST[$key] ?? $_GET[$key] ?? $default;
}

function a7_ai_secret(string $value, string $name): string
{
    $value = trim($value);
    if ($value === '' || strpos($value, '__') === 0) {
        throw new RuntimeException('Missing config: ' . $name);
    }
    return $value;
}

function a7_ai_http_json(string $method, string $url, array $headers = [], $body = null, int $timeout = 60): array
{
    $headerLines = ['Accept: application/json'];
    foreach ($headers as $name => $value) {
        $headerLines[] = $name . ': ' . $value;
    }

    $encodedBody = null;
    if ($body !== null) {
        $encodedBody = is_string($body) ? $body : json_encode($body, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    }

    if (!function_exists('curl_init')) {
        $contextOptions = [
            'http' => [
                'method' => strtoupper($method),
                'header' => implode("\r\n", $headerLines),
                'ignore_errors' => true,
                'timeout' => $timeout,
            ],
        ];

        if ($encodedBody !== null) {
            $contextOptions['http']['content'] = $encodedBody;
        }

        $raw = @file_get_contents($url, false, stream_context_create($contextOptions));
        $status = 0;
        if (isset($http_response_header) && is_array($http_response_header)) {
            foreach ($http_response_header as $line) {
                if (preg_match('/^HTTP\/\S+\s+(\d{3})\b/', (string)$line, $matches)) {
                    $status = (int)$matches[1];
                    break;
                }
            }
        }

        $error = '';
        if ($raw === false) {
            $lastError = error_get_last();
            $error = is_array($lastError) ? (string)($lastError['message'] ?? '') : 'HTTP request failed';
            $raw = '';
        }

        $json = json_decode((string)$raw, true);
        return [
            'ok' => $error === '' && $status >= 200 && $status < 300,
            'status' => $status,
            'raw' => (string)$raw,
            'json' => is_array($json) ? $json : null,
            'error' => $error,
        ];
    }

    $curl = curl_init($url);
    curl_setopt_array($curl, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_CUSTOMREQUEST => strtoupper($method),
        CURLOPT_HTTPHEADER => $headerLines,
        CURLOPT_TIMEOUT => $timeout,
        CURLOPT_CONNECTTIMEOUT => 15,
    ]);

    if ($encodedBody !== null) {
        curl_setopt($curl, CURLOPT_POSTFIELDS, $encodedBody);
    }

    $raw = curl_exec($curl);
    $error = curl_error($curl);
    $status = (int)curl_getinfo($curl, CURLINFO_HTTP_CODE);
    curl_close($curl);

    $json = json_decode((string)$raw, true);
    return [
        'ok' => $error === '' && $status >= 200 && $status < 300,
        'status' => $status,
        'raw' => (string)$raw,
        'json' => is_array($json) ? $json : null,
        'error' => $error,
    ];
}

function a7_ai_http_raw(string $method, string $url, array $headers = [], $body = null, int $timeout = 120): array
{
    $headerLines = [];
    foreach ($headers as $name => $value) {
        $headerLines[] = $name . ': ' . $value;
    }

    $encodedBody = null;
    if ($body !== null) {
        $encodedBody = is_string($body) ? $body : json_encode($body, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    }

    if (!function_exists('curl_init')) {
        $contextOptions = [
            'http' => [
                'method' => strtoupper($method),
                'header' => implode("\r\n", $headerLines),
                'ignore_errors' => true,
                'timeout' => $timeout,
            ],
        ];

        if ($encodedBody !== null) {
            $contextOptions['http']['content'] = $encodedBody;
        }

        $raw = @file_get_contents($url, false, stream_context_create($contextOptions));
        $status = 0;
        $contentType = '';
        if (isset($http_response_header) && is_array($http_response_header)) {
            foreach ($http_response_header as $line) {
                if (preg_match('/^HTTP\/\S+\s+(\d{3})\b/', (string)$line, $matches)) {
                    $status = (int)$matches[1];
                } elseif (stripos((string)$line, 'Content-Type:') === 0) {
                    $contentType = trim(substr((string)$line, strlen('Content-Type:')));
                }
            }
        }

        $error = '';
        if ($raw === false) {
            $lastError = error_get_last();
            $error = is_array($lastError) ? (string)($lastError['message'] ?? '') : 'HTTP request failed';
            $raw = '';
        }

        return [
            'ok' => $error === '' && $status >= 200 && $status < 300,
            'status' => $status,
            'raw' => (string)$raw,
            'content_type' => $contentType,
            'error' => $error,
        ];
    }

    $curl = curl_init($url);
    curl_setopt_array($curl, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_CUSTOMREQUEST => strtoupper($method),
        CURLOPT_HTTPHEADER => $headerLines,
        CURLOPT_TIMEOUT => $timeout,
        CURLOPT_CONNECTTIMEOUT => 15,
    ]);

    if ($encodedBody !== null) {
        curl_setopt($curl, CURLOPT_POSTFIELDS, $encodedBody);
    }

    $raw = curl_exec($curl);
    $error = curl_error($curl);
    $status = (int)curl_getinfo($curl, CURLINFO_HTTP_CODE);
    $contentType = (string)curl_getinfo($curl, CURLINFO_CONTENT_TYPE);
    curl_close($curl);

    return [
        'ok' => $error === '' && $status >= 200 && $status < 300,
        'status' => $status,
        'raw' => (string)$raw,
        'content_type' => $contentType,
        'error' => $error,
    ];
}

function a7_ai_multipart(string $url, array $fields, string $fileField, string $filePath, string $fileName, string $mimeType, int $timeout = 240): array
{
    $apiKey = a7_ai_secret(A7_AI_OPENAI_API_KEY, 'A7_AI_OPENAI_API_KEY');
    if (!is_readable($filePath)) {
        throw new RuntimeException('OpenAI audio upload file is not readable');
    }

    if (function_exists('curl_init') && class_exists('CURLFile')) {
        $post = $fields;
        $post[$fileField] = new CURLFile($filePath, $mimeType, $fileName);

        $curl = curl_init($url);
        curl_setopt_array($curl, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_POST => true,
            CURLOPT_HTTPHEADER => [
                'Authorization: Bearer ' . $apiKey,
            ],
            CURLOPT_POSTFIELDS => $post,
            CURLOPT_TIMEOUT => $timeout,
            CURLOPT_CONNECTTIMEOUT => 20,
        ]);

        $raw = curl_exec($curl);
        $error = curl_error($curl);
        $status = (int)curl_getinfo($curl, CURLINFO_HTTP_CODE);
        $contentType = (string)curl_getinfo($curl, CURLINFO_CONTENT_TYPE);
        curl_close($curl);

        $json = json_decode((string)$raw, true);
        return [
            'ok' => $error === '' && $status >= 200 && $status < 300,
            'status' => $status,
            'raw' => (string)$raw,
            'json' => is_array($json) ? $json : null,
            'content_type' => $contentType,
            'error' => $error,
        ];
    }

    $boundary = '----A7AI' . bin2hex(function_exists('random_bytes') ? random_bytes(12) : pack('H*', md5((string)microtime(true))));
    $body = '';
    foreach ($fields as $name => $value) {
        if (is_array($value) || is_object($value)) {
            $value = json_encode($value, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
        }
        $safeName = str_replace(['\\', '"'], ['\\\\', '\\"'], (string)$name);
        $body .= '--' . $boundary . "\r\n";
        $body .= 'Content-Disposition: form-data; name="' . $safeName . '"' . "\r\n\r\n";
        $body .= (string)$value . "\r\n";
    }

    $safeFileField = str_replace(['\\', '"'], ['\\\\', '\\"'], $fileField);
    $safeFileName = str_replace(['\\', '"'], ['\\\\', '\\"'], $fileName);
    $rawFile = (string)file_get_contents($filePath);
    $body .= '--' . $boundary . "\r\n";
    $body .= 'Content-Disposition: form-data; name="' . $safeFileField . '"; filename="' . $safeFileName . '"' . "\r\n";
    $body .= 'Content-Type: ' . $mimeType . "\r\n\r\n";
    $body .= $rawFile . "\r\n";
    $body .= '--' . $boundary . '--' . "\r\n";

    return a7_ai_http_json(
        'POST',
        $url,
        [
            'Authorization' => 'Bearer ' . $apiKey,
            'Content-Type' => 'multipart/form-data; boundary=' . $boundary,
        ],
        $body,
        $timeout
    );
}

function a7_ai_bitrix_call(string $method, array $params = []): array
{
    $webhook = a7_ai_secret(A7_AI_BITRIX_WEBHOOK_URL, 'A7_AI_BITRIX_WEBHOOK_URL');
    return a7_ai_http_json(
        'POST',
        rtrim($webhook, '/') . '/' . $method . '.json',
        ['Content-Type' => 'application/json'],
        $params,
        60
    );
}

function a7_ai_3cx_token(): string
{
    $base = a7_ai_secret(A7_AI_3CX_BASE_URL, 'A7_AI_3CX_BASE_URL');
    $clientId = a7_ai_secret(A7_AI_3CX_CLIENT_ID, 'A7_AI_3CX_CLIENT_ID');
    $clientSecret = a7_ai_secret(A7_AI_3CX_CLIENT_SECRET, 'A7_AI_3CX_CLIENT_SECRET');

    $response = a7_ai_http_json(
        'POST',
        rtrim($base, '/') . '/connect/token',
        ['Content-Type' => 'application/x-www-form-urlencoded'],
        http_build_query([
            'grant_type' => 'client_credentials',
            'client_id' => $clientId,
            'client_secret' => $clientSecret,
        ]),
        30
    );

    if (!$response['ok'] || empty($response['json']['access_token'])) {
        a7_ai_log('3CX token failed', [
            'status' => $response['status'],
            'error' => $response['error'],
            'raw' => mb_substr((string)$response['raw'], 0, 300),
        ]);
        throw new RuntimeException('Unable to authenticate with 3CX');
    }

    return (string)$response['json']['access_token'];
}

function a7_ai_3cx_get_json(string $path): array
{
    $base = a7_ai_secret(A7_AI_3CX_BASE_URL, 'A7_AI_3CX_BASE_URL');
    $token = a7_ai_3cx_token();
    if ($path === '' || $path[0] !== '/') {
        $path = '/' . $path;
    }

    return a7_ai_http_json('GET', rtrim($base, '/') . $path, [
        'Authorization' => 'Bearer ' . $token,
    ], null, 60);
}

function a7_ai_download_recording_file(int $recordingId): string
{
    if ($recordingId <= 0) {
        throw new RuntimeException('Recording id missing');
    }

    if (!is_dir(A7_AI_TMP_DIR)) {
        @mkdir(A7_AI_TMP_DIR, 0755, true);
    }

    $base = a7_ai_secret(A7_AI_3CX_BASE_URL, 'A7_AI_3CX_BASE_URL');
    $token = a7_ai_3cx_token();
    $url = rtrim($base, '/') . '/xapi/v1/Recordings/Pbx.DownloadRecording(recId=' . rawurlencode((string)$recordingId) . ')';

    $response = a7_ai_http_raw('GET', $url, [
        'Authorization' => 'Bearer ' . $token,
        'Accept' => 'audio/*, application/octet-stream',
    ], null, 180);

    if (!$response['ok'] || $response['raw'] === '') {
        a7_ai_log('3CX recording download failed', [
            'recording_id' => $recordingId,
            'status' => $response['status'],
            'error' => $response['error'],
        ]);
        throw new RuntimeException('Unable to download 3CX recording #' . $recordingId);
    }

    $bytes = strlen($response['raw']);
    if ($bytes > A7_AI_MAX_AUDIO_BYTES) {
        throw new RuntimeException('Recording audio is too large for AI analyzer: ' . $bytes . ' bytes');
    }

    $path = rtrim(A7_AI_TMP_DIR, '/') . '/3cx-recording-' . $recordingId . '.wav';
    if (@file_put_contents($path, $response['raw']) === false) {
        throw new RuntimeException('Unable to write temp audio file');
    }

    return $path;
}

function a7_ai_clean_phone(string $value): string
{
    $digits = preg_replace('/\D/', '', trim($value)) ?? '';
    if (strlen($digits) < 6) {
        return '';
    }
    if (strpos($digits, '00') === 0) {
        return substr($digits, 2);
    }
    if (strpos($digits, '0') === 0 && strlen($digits) === 10) {
        return '971' . substr($digits, 1);
    }
    return $digits;
}

function a7_ai_phone_variants(string $digits): array
{
    $digits = a7_ai_clean_phone($digits);
    if ($digits === '') {
        return [];
    }

    $values = [$digits, '+' . $digits];
    if (strpos($digits, '971') === 0 && strlen($digits) >= 11) {
        $values[] = '0' . substr($digits, 3);
        $values[] = substr($digits, 3);
    }

    return array_values(array_unique(array_filter($values)));
}

function a7_ai_looks_internal_extension(string $value): bool
{
    $digits = preg_replace('/\D/', '', trim($value)) ?? '';
    return strlen($digits) >= 2 && strlen($digits) <= 4;
}

function a7_ai_recording_parties(array $recording): array
{
    $candidateKeys = ['FromCallerNumber', 'FromDn', 'FromDisplayName', 'ToCallerNumber', 'ToDn', 'ToDisplayName'];
    $candidates = [];
    foreach ($candidateKeys as $key) {
        $value = trim((string)($recording[$key] ?? ''));
        if ($value !== '') {
            $candidates[] = $value;
        }
    }

    $internalExtension = '';
    foreach (['FromDn', 'ToDn', 'FromCallerNumber', 'ToCallerNumber'] as $key) {
        $value = trim((string)($recording[$key] ?? ''));
        if ($value !== '' && a7_ai_looks_internal_extension($value)) {
            $internalExtension = preg_replace('/\D/', '', $value) ?? $value;
            break;
        }
    }

    $knownTrunks = ['10000', '10001', '10002'];
    $external = [];
    foreach ($candidates as $candidate) {
        $digits = a7_ai_clean_phone($candidate);
        if ($digits === '' || a7_ai_looks_internal_extension($candidate) || in_array($digits, $knownTrunks, true)) {
            continue;
        }
        $external[] = ['raw' => $candidate, 'digits' => $digits];
    }

    $preferred = null;
    $callType = (string)($recording['CallType'] ?? '');
    if (stripos($callType, 'InboundExternal') !== false) {
        $fromDigits = a7_ai_clean_phone((string)($recording['FromCallerNumber'] ?? ''));
        foreach ($external as $candidate) {
            if ($fromDigits !== '' && $candidate['digits'] === $fromDigits) {
                $preferred = $candidate;
                break;
            }
        }
    } elseif (stripos($callType, 'OutboundExternal') !== false) {
        $toDigits = a7_ai_clean_phone((string)($recording['ToCallerNumber'] ?? ''));
        $toDnDigits = a7_ai_clean_phone((string)($recording['ToDn'] ?? ''));
        foreach ($external as $candidate) {
            if (($toDigits !== '' && $candidate['digits'] === $toDigits) || ($toDnDigits !== '' && $candidate['digits'] === $toDnDigits)) {
                $preferred = $candidate;
                break;
            }
        }
    }

    if ($preferred === null && !empty($external)) {
        $preferred = $external[0];
    }

    return [
        'internal_extension' => $internalExtension,
        'external_phone_digits' => is_array($preferred) ? (string)$preferred['digits'] : '',
        'external_phone_raw' => is_array($preferred) ? (string)$preferred['raw'] : '',
    ];
}

function a7_ai_mask_phone(string $value): string
{
    $text = trim($value);
    $digits = preg_replace('/\D/', '', $text) ?? '';
    if (strlen($digits) < 5) {
        return $text;
    }
    return substr($text, 0, min(4, strlen($text))) . '***' . substr($digits, -4);
}

function a7_ai_find_bitrix_lead_matches(string $phoneDigits): array
{
    $leadIds = [];
    $matchedBy = [];
    foreach (a7_ai_phone_variants($phoneDigits) as $variant) {
        $response = a7_ai_bitrix_call('crm.duplicate.findbycomm', [
            'entity_type' => 'LEAD',
            'type' => 'PHONE',
            'values' => [$variant],
        ]);

        $ids = $response['json']['result']['LEAD'] ?? [];
        if (is_array($ids) && !empty($ids)) {
            $matchedBy[] = ['value' => a7_ai_mask_phone($variant), 'count' => count($ids)];
            foreach ($ids as $id) {
                $leadIds[(int)$id] = (int)$id;
            }
        }
    }

    $leads = [];
    foreach (array_slice(array_values($leadIds), 0, 10) as $leadId) {
        $response = a7_ai_bitrix_call('crm.lead.get', ['id' => $leadId]);
        if ($response['ok'] && is_array($response['json']['result'] ?? null)) {
            $lead = $response['json']['result'];
            $leads[] = [
                'id' => (int)$leadId,
                'title' => (string)($lead['TITLE'] ?? ''),
                'assignedById' => (int)($lead['ASSIGNED_BY_ID'] ?? 0),
                'sourceId' => (string)($lead['SOURCE_ID'] ?? ''),
                'statusId' => (string)($lead['STATUS_ID'] ?? ''),
                'raw' => $lead,
            ];
        }
    }

    return [
        'leadIds' => array_values($leadIds),
        'leads' => $leads,
        'matchedBy' => $matchedBy,
    ];
}

function a7_ai_get_bitrix_user(int $userId): ?array
{
    if ($userId <= 0) {
        return null;
    }

    $response = a7_ai_bitrix_call('user.get', ['ID' => $userId]);
    if (!$response['ok'] || empty($response['json']['result'][0]) || !is_array($response['json']['result'][0])) {
        return null;
    }

    return $response['json']['result'][0];
}

function a7_ai_choose_best_lead(array $leads, string $internalExtension): ?array
{
    if (empty($leads)) {
        return null;
    }

    $internalExtension = preg_replace('/\D/', '', $internalExtension) ?? '';
    if ($internalExtension !== '') {
        foreach ($leads as $lead) {
            $user = a7_ai_get_bitrix_user((int)($lead['assignedById'] ?? 0));
            if (!$user) {
                continue;
            }
            $userExtension = preg_replace('/\D/', '', (string)($user['UF_PHONE_INNER'] ?? '')) ?? '';
            if ($userExtension !== '' && $userExtension === $internalExtension) {
                $lead['selectedBecause'] = 'lead_owner_extension_matches_3cx_recording';
                return $lead;
            }
        }
    }

    if (count($leads) === 1) {
        $lead = $leads[0];
        $lead['selectedBecause'] = 'single_bitrix_phone_match';
        return $lead;
    }

    return null;
}

function a7_ai_activity_origin_id(int $recordingId): string
{
    return 'A7_3CX_AI_REC_' . $recordingId;
}

function a7_ai_recording_activity_origin_id(int $recordingId): string
{
    return 'A7_3CX_REC_' . $recordingId;
}

function a7_ai_fetch_crm_entity(int $ownerTypeId, int $ownerId): ?array
{
    if ($ownerTypeId <= 0 || $ownerId <= 0) {
        return null;
    }

    if ($ownerTypeId === 1) {
        $response = a7_ai_bitrix_call('crm.lead.get', ['id' => $ownerId]);
        $lead = $response['json']['result'] ?? null;
        if (!$response['ok'] || !is_array($lead)) {
            return null;
        }

        return [
            'entityType' => 'lead',
            'ownerTypeId' => 1,
            'id' => $ownerId,
            'title' => (string)($lead['TITLE'] ?? ('Lead #' . $ownerId)),
            'assignedById' => (int)($lead['ASSIGNED_BY_ID'] ?? 0),
            'sourceId' => (string)($lead['SOURCE_ID'] ?? ''),
            'statusId' => (string)($lead['STATUS_ID'] ?? ''),
            'detailUrl' => '/crm/lead/details/' . $ownerId . '/',
            'raw' => $lead,
        ];
    }

    if ($ownerTypeId === A7_AI_OWNER_DATA_ENTITY_TYPE_ID) {
        $response = a7_ai_bitrix_call('crm.item.get', [
            'entityTypeId' => A7_AI_OWNER_DATA_ENTITY_TYPE_ID,
            'id' => $ownerId,
        ]);
        $item = $response['json']['result']['item'] ?? null;
        if (!$response['ok'] || !is_array($item) || (int)($item['categoryId'] ?? 0) !== A7_AI_OWNER_DATA_CATEGORY_ID) {
            return null;
        }

        return [
            'entityType' => 'owner_data',
            'ownerTypeId' => A7_AI_OWNER_DATA_ENTITY_TYPE_ID,
            'categoryId' => A7_AI_OWNER_DATA_CATEGORY_ID,
            'id' => $ownerId,
            'title' => (string)($item['title'] ?? ('Owner Data #' . $ownerId)),
            'assignedById' => (int)($item['assignedById'] ?? 0),
            'sourceId' => (string)($item['sourceId'] ?? ''),
            'statusId' => (string)($item['stageId'] ?? ''),
            'detailUrl' => '/crm/type/' . A7_AI_OWNER_DATA_ENTITY_TYPE_ID . '/details/' . $ownerId . '/',
            'raw' => $item,
        ];
    }

    return null;
}

function a7_ai_find_recording_binding(int $recordingId): ?array
{
    if ($recordingId <= 0) {
        return null;
    }

    foreach ([
        ['ORIGIN_ID' => a7_ai_recording_activity_origin_id($recordingId)],
        ['SUBJECT' => '3CX Recording #' . $recordingId],
    ] as $filter) {
        $response = a7_ai_bitrix_call('crm.activity.list', [
            'order' => ['ID' => 'DESC'],
            'filter' => $filter,
            'select' => [
                'ID',
                'OWNER_TYPE_ID',
                'OWNER_ID',
                'SUBJECT',
                'ORIGIN_ID',
                'DESCRIPTION',
                'DESCRIPTION_TYPE',
            ],
            'start' => 0,
        ]);

        $activities = $response['json']['result'] ?? [];
        if (!$response['ok'] || !is_array($activities)) {
            continue;
        }

        foreach ($activities as $activity) {
            if (!is_array($activity)) {
                continue;
            }

            $ownerTypeId = (int)($activity['OWNER_TYPE_ID'] ?? 0);
            $ownerId = (int)($activity['OWNER_ID'] ?? 0);
            $entity = a7_ai_fetch_crm_entity($ownerTypeId, $ownerId);
            if ($entity !== null) {
                return ['entity' => $entity, 'activity' => $activity];
            }
        }
    }

    return null;
}

function a7_ai_find_recording_activity(int $ownerTypeId, int $ownerId, int $recordingId): ?array
{
    if ($ownerTypeId <= 0 || $ownerId <= 0 || $recordingId <= 0) {
        return null;
    }

    foreach ([
        ['ORIGIN_ID' => a7_ai_recording_activity_origin_id($recordingId)],
        ['SUBJECT' => '3CX Recording #' . $recordingId],
    ] as $extraFilter) {
        $response = a7_ai_bitrix_call('crm.activity.list', [
            'order' => ['ID' => 'DESC'],
            'filter' => array_merge([
                'OWNER_TYPE_ID' => $ownerTypeId,
                'OWNER_ID' => $ownerId,
            ], $extraFilter),
            'select' => ['ID', 'SUBJECT', 'ORIGIN_ID', 'DESCRIPTION', 'DESCRIPTION_TYPE'],
            'start' => 0,
        ]);

        $result = $response['json']['result'] ?? [];
        if ($response['ok'] && is_array($result) && !empty($result[0]) && is_array($result[0])) {
            return $result[0];
        }
    }

    return null;
}

function a7_ai_activity_exists(int $ownerTypeId, int $ownerId, int $recordingId): bool
{
    if ($ownerTypeId <= 0 || $ownerId <= 0 || $recordingId <= 0) {
        return false;
    }

    if (a7_ai_stored_score($recordingId) !== null) {
        return true;
    }

    $response = a7_ai_bitrix_call('crm.activity.list', [
        'order' => ['ID' => 'DESC'],
        'filter' => [
            'OWNER_TYPE_ID' => $ownerTypeId,
            'OWNER_ID' => $ownerId,
            'ORIGIN_ID' => a7_ai_activity_origin_id($recordingId),
        ],
        'select' => ['ID', 'ORIGIN_ID', 'SUBJECT'],
        'start' => 0,
    ]);

    $result = $response['json']['result'] ?? [];
    return $response['ok'] && is_array($result) && !empty($result);
}

function a7_ai_allowed_codes(): array
{
    return [
        'source_id' => ['UC_KQ0WO3', 'UC_Y3VNS9', 'UC_APID5E'],
        'status_id' => ['NEW', 'IN_PROCESS', 'UC_MJDO60'],
        'lead_type_id' => ['972', '973', '1220'],
        'requirement_category_id' => ['381', '553', '1180', '382', '383'],
        'bedrooms_id' => ['26', '27', '28', '29', '30', '31', '32', '33', '1179', '1278'],
        'property_type_id' => ['34', '35', '36', '37', '38', '39', '40', '41', '384', '1637', '1641'],
        'timeline_id' => ['821', '822', '823', '824', '825', '826', '827'],
        'purpose_id' => ['804', '805', '806'],
        'meeting_mode_id' => ['42', '43'],
        'budget_range_id' => ['852', '853', '854', '855'],
        'contact_method_id' => ['952'],
    ];
}

function a7_ai_transcribe_file(string $filePath, int $recordingId): array
{
    $fields = [
        'model' => A7_AI_TRANSCRIBE_MODEL,
        'response_format' => 'diarized_json',
        'chunking_strategy' => 'auto',
    ];

    $response = a7_ai_multipart(
        'https://api.openai.com/v1/audio/transcriptions',
        $fields,
        'file',
        $filePath,
        '3cx-recording-' . $recordingId . '.wav',
        'audio/x-wav',
        360
    );

    if (!$response['ok']) {
        a7_ai_log('OpenAI diarized transcription failed, falling back', [
            'recording_id' => $recordingId,
            'status' => $response['status'],
            'raw' => mb_substr((string)$response['raw'], 0, 300),
        ]);

        $response = a7_ai_multipart(
            'https://api.openai.com/v1/audio/transcriptions',
            [
                'model' => A7_AI_TRANSCRIBE_FALLBACK_MODEL,
                'response_format' => 'json',
                'prompt' => 'Real estate sales call in English, Arabic, Hindi, Urdu, or mixed language. Preserve names, locations, property types, prices, bedrooms, timelines, and meeting details.',
            ],
            'file',
            $filePath,
            '3cx-recording-' . $recordingId . '.wav',
            'audio/x-wav',
            360
        );

        if (!$response['ok']) {
            a7_ai_log('OpenAI mini transcription failed, falling back to whisper', [
                'recording_id' => $recordingId,
                'status' => $response['status'],
                'raw' => mb_substr((string)$response['raw'], 0, 300),
            ]);

            $response = a7_ai_multipart(
                'https://api.openai.com/v1/audio/transcriptions',
                [
                    'model' => 'whisper-1',
                    'response_format' => 'json',
                    'prompt' => 'Real estate sales call in English, Arabic, Hindi, Urdu, or mixed language. Preserve names, locations, property types, prices, bedrooms, timelines, and meeting details.',
                ],
                'file',
                $filePath,
                '3cx-recording-' . $recordingId . '.wav',
                'audio/x-wav',
                360
            );
        }
    }

    if (!$response['ok']) {
        $rawPreview = trim(mb_substr((string)$response['raw'], 0, 180));
        throw new RuntimeException('OpenAI transcription failed: HTTP ' . $response['status'] . ($rawPreview !== '' ? ' - ' . $rawPreview : ''));
    }

    $json = $response['json'];
    if (is_array($json)) {
        $text = trim((string)($json['text'] ?? ''));
        $segments = [];
        foreach (($json['segments'] ?? []) as $segment) {
            if (is_array($segment)) {
                $segments[] = [
                    'speaker' => (string)($segment['speaker'] ?? ''),
                    'start' => $segment['start'] ?? null,
                    'end' => $segment['end'] ?? null,
                    'text' => (string)($segment['text'] ?? ''),
                ];
            }
        }

        if ($text === '' && !empty($segments)) {
            $parts = [];
            foreach ($segments as $segment) {
                $label = $segment['speaker'] !== '' ? $segment['speaker'] . ': ' : '';
                $parts[] = $label . $segment['text'];
            }
            $text = trim(implode("\n", $parts));
        }

        return [
            'text' => $text,
            'segments' => $segments,
            'model' => (string)($fields['model'] ?? A7_AI_TRANSCRIBE_MODEL),
            'raw_type' => 'json',
        ];
    }

    return [
        'text' => trim((string)$response['raw']),
        'segments' => [],
        'model' => A7_AI_TRANSCRIBE_FALLBACK_MODEL,
        'raw_type' => 'text',
    ];
}

function a7_ai_analysis_schema(): array
{
    $nullableString = ['type' => ['string', 'null']];
    return [
        'type' => 'object',
        'additionalProperties' => false,
        'required' => [
            'recording_summary',
            'language',
            'qualified',
            'call_outcome',
            'qualification_confidence',
            'broker_flag',
            'human_handover_required',
            'agent_score_percent',
            'client_score_percent',
            'overall_score_percent',
            'agent_strengths',
            'agent_improvements',
            'client_signals',
            'missing_questions',
            'next_action',
            'lead_update',
            'details',
            'transcript_quality_notes',
        ],
        'properties' => [
            'recording_summary' => ['type' => 'string'],
            'language' => ['type' => 'string'],
            'qualified' => ['type' => 'boolean'],
            'call_outcome' => ['type' => 'string', 'enum' => ['qualified', 'not_qualified', 'needs_human_review']],
            'qualification_confidence' => ['type' => 'number'],
            'broker_flag' => ['type' => 'boolean'],
            'human_handover_required' => ['type' => 'boolean'],
            'agent_score_percent' => ['type' => 'integer', 'minimum' => 0, 'maximum' => 100],
            'client_score_percent' => ['type' => 'integer', 'minimum' => 0, 'maximum' => 100],
            'overall_score_percent' => ['type' => 'integer', 'minimum' => 0, 'maximum' => 100],
            'agent_strengths' => ['type' => 'array', 'items' => ['type' => 'string']],
            'agent_improvements' => ['type' => 'array', 'items' => ['type' => 'string']],
            'client_signals' => ['type' => 'array', 'items' => ['type' => 'string']],
            'missing_questions' => ['type' => 'array', 'items' => ['type' => 'string']],
            'next_action' => ['type' => 'string'],
            'lead_update' => [
                'type' => 'object',
                'additionalProperties' => false,
                'required' => [
                    'source_id',
                    'status_id',
                    'lead_type_id',
                    'requirement_category_id',
                    'bedrooms_id',
                    'property_type_id',
                    'timeline_id',
                    'purpose_id',
                    'meeting_mode_id',
                    'budget_range_id',
                    'contact_method_id',
                    'confidence',
                    'fields_reason',
                ],
                'properties' => [
                    'source_id' => $nullableString,
                    'status_id' => $nullableString,
                    'lead_type_id' => $nullableString,
                    'requirement_category_id' => $nullableString,
                    'bedrooms_id' => $nullableString,
                    'property_type_id' => $nullableString,
                    'timeline_id' => $nullableString,
                    'purpose_id' => $nullableString,
                    'meeting_mode_id' => $nullableString,
                    'budget_range_id' => $nullableString,
                    'contact_method_id' => $nullableString,
                    'confidence' => ['type' => 'number'],
                    'fields_reason' => ['type' => 'string'],
                ],
            ],
            'details' => [
                'type' => 'object',
                'additionalProperties' => false,
                'required' => ['budget', 'location', 'property', 'bedrooms', 'timeline', 'purpose', 'meeting', 'contact_method'],
                'properties' => [
                    'budget' => $nullableString,
                    'location' => $nullableString,
                    'property' => $nullableString,
                    'bedrooms' => $nullableString,
                    'timeline' => $nullableString,
                    'purpose' => $nullableString,
                    'meeting' => $nullableString,
                    'contact_method' => $nullableString,
                ],
            ],
            'transcript_quality_notes' => ['type' => 'string'],
        ],
    ];
}

function a7_ai_analysis_prompt(array $recording, array $parties, array $entity, array $transcript): array
{
    $codes = [
        'Sources' => [
            'UC_KQ0WO3' => 'Property Finder WhatsApp',
            'UC_Y3VNS9' => 'Bayut WhatsApp',
            'UC_APID5E' => 'Default lead source',
        ],
        'Lead Type' => ['972' => 'Buyer', '973' => 'Seller', '1220' => 'Tenant'],
        'Requirement Category' => ['381' => 'Off-plan', '553' => 'Holiday / Short-term', '1180' => 'Tenant / Rental', '382' => 'Buyer', '383' => 'Landlord / Leasing'],
        'Bedrooms' => ['26' => 'Studio / 0 B/R', '27' => '1 B/R', '28' => '2 B/R', '29' => '3 B/R', '30' => '4 B/R', '31' => '5 B/R', '32' => '6 B/R', '33' => '7 B/R', '1179' => '7+ B/R', '1278' => 'Plot'],
        'Property Type' => ['34' => 'Apartment / Flat', '35' => 'Villa', '36' => 'Office', '37' => 'Building', '38' => 'Penthouse', '39' => 'Townhouse', '40' => 'Duplex', '41' => 'Triplex', '384' => 'Shop / Retail', '1637' => 'Plot / Land', '1641' => 'Warehouse'],
        'Timeline' => ['821' => '1 week', '822' => '2 weeks', '823' => '1 month', '824' => '2 months', '825' => '3 months', '826' => '6 months', '827' => '1 year'],
        'Purpose' => ['804' => 'Investor', '805' => 'Myself', '806' => 'Agent / Client / Broker'],
        'Meeting Mode' => ['42' => 'Offline / Physical / In-person / Viewing', '43' => 'Online / Zoom / Google Meet / Teams / Video'],
        'Budget Range' => ['852' => '1M+', '853' => '2M+', '854' => '3M+', '855' => '4M+'],
        'Contact Method' => ['952' => 'WhatsApp'],
        'Statuses' => ['NEW' => 'New', 'IN_PROCESS' => 'Qualified / In Process', 'UC_MJDO60' => 'Review / Human handover / Broker flag'],
    ];

    $context = [
        'recording' => [
            'id' => (int)($recording['Id'] ?? 0),
            'call_type' => (string)($recording['CallType'] ?? ''),
            'start_time' => (string)($recording['StartTime'] ?? ''),
            'end_time' => (string)($recording['EndTime'] ?? ''),
            'internal_extension' => $parties['internal_extension'],
            'external_phone_masked' => a7_ai_mask_phone($parties['external_phone_raw'] !== '' ? $parties['external_phone_raw'] : $parties['external_phone_digits']),
        ],
        'bitrix_entity' => [
            'entity_type' => (string)($entity['entityType'] ?? ''),
            'owner_type_id' => (int)($entity['ownerTypeId'] ?? 0),
            'id' => (int)$entity['id'],
            'title' => (string)$entity['title'],
            'assigned_by_id' => (int)$entity['assignedById'],
            'source_id' => (string)($entity['sourceId'] ?? ''),
            'status_id' => (string)($entity['statusId'] ?? ''),
        ],
        'allowed_codes' => $codes,
        'transcript_segments' => $transcript['segments'],
        'transcript_text' => mb_substr((string)$transcript['text'], 0, 28000),
    ];

    $system = 'You are a real estate sales call QA analyst for A7 Group. Analyze the transcript, score agent performance, client qualification, and CRM field classification. Use only the allowed Bitrix option IDs supplied by the user. If the transcript does not prove a field, return null for that field. Score agent based on greeting, discovery, budget, location, property type, timeline, objection handling, next action, politeness, and CRM usefulness. Score client based on clarity, intent, budget/timeline disclosure, and readiness. Broker/agent/client-broker signals should set broker_flag true and status_id UC_MJDO60.';
    $user = 'Return JSON only. Decide whether the client is qualified. If qualified and no broker flag, status_id should usually be IN_PROCESS. If broker flag or human review needed, status_id should be UC_MJDO60. If not qualified, status_id can be NEW. Context:' . "\n" . json_encode($context, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);

    return [
        ['role' => 'system', 'content' => $system],
        ['role' => 'user', 'content' => $user],
    ];
}

function a7_ai_decode_json_content(string $content): array
{
    $json = json_decode($content, true);
    if (is_array($json)) {
        return $json;
    }

    if (preg_match('/\{[\s\S]*\}/', $content, $matches)) {
        $json = json_decode($matches[0], true);
        if (is_array($json)) {
            return $json;
        }
    }

    throw new RuntimeException('OpenAI analysis did not return valid JSON');
}

function a7_ai_analyze_transcript(array $recording, array $parties, array $entity, array $transcript): array
{
    $apiKey = a7_ai_secret(A7_AI_OPENAI_API_KEY, 'A7_AI_OPENAI_API_KEY');
    $model = a7_ai_secret(A7_AI_ANALYSIS_MODEL, 'A7_AI_ANALYSIS_MODEL');
    $messages = a7_ai_analysis_prompt($recording, $parties, $entity, $transcript);

    $payload = [
        'model' => $model,
        'messages' => $messages,
        'temperature' => 0.1,
        'response_format' => [
            'type' => 'json_schema',
            'json_schema' => [
                'name' => 'a7_real_estate_call_analysis',
                'strict' => true,
                'schema' => a7_ai_analysis_schema(),
            ],
        ],
    ];

    $response = a7_ai_http_json(
        'POST',
        'https://api.openai.com/v1/chat/completions',
        [
            'Authorization' => 'Bearer ' . $apiKey,
            'Content-Type' => 'application/json',
        ],
        $payload,
        180
    );

    if (!$response['ok']) {
        a7_ai_log('OpenAI schema analysis failed, falling back to json_object', [
            'status' => $response['status'],
            'raw' => mb_substr((string)$response['raw'], 0, 300),
        ]);

        $payload['response_format'] = ['type' => 'json_object'];
        $response = a7_ai_http_json(
            'POST',
            'https://api.openai.com/v1/chat/completions',
            [
                'Authorization' => 'Bearer ' . $apiKey,
                'Content-Type' => 'application/json',
            ],
            $payload,
            180
        );
    }

    if (!$response['ok']) {
        throw new RuntimeException('OpenAI analysis failed: HTTP ' . $response['status']);
    }

    $content = (string)($response['json']['choices'][0]['message']['content'] ?? '');
    if ($content === '') {
        throw new RuntimeException('OpenAI analysis response was empty');
    }

    return a7_ai_normalize_analysis(a7_ai_decode_json_content($content));
}

function a7_ai_safe_int_percent($value): int
{
    $n = (int)$value;
    if ($n < 0) {
        return 0;
    }
    if ($n > 100) {
        return 100;
    }
    return $n;
}

function a7_ai_safe_code($value, array $allowed): ?string
{
    $value = trim((string)$value);
    if ($value === '') {
        return null;
    }
    return in_array($value, $allowed, true) ? $value : null;
}

function a7_ai_normalize_analysis(array $analysis): array
{
    $allowed = a7_ai_allowed_codes();
    $leadUpdate = is_array($analysis['lead_update'] ?? null) ? $analysis['lead_update'] : [];

    foreach ($allowed as $key => $allowedValues) {
        $leadUpdate[$key] = a7_ai_safe_code($leadUpdate[$key] ?? null, $allowedValues);
    }

    if (!empty($analysis['broker_flag']) || !empty($analysis['human_handover_required'])) {
        $leadUpdate['status_id'] = 'UC_MJDO60';
    } elseif (!empty($analysis['qualified']) && !$leadUpdate['status_id']) {
        $leadUpdate['status_id'] = 'IN_PROCESS';
    } elseif (!$leadUpdate['status_id']) {
        $leadUpdate['status_id'] = 'NEW';
    }

    $analysis['lead_update'] = $leadUpdate;
    $analysis['agent_score_percent'] = a7_ai_safe_int_percent($analysis['agent_score_percent'] ?? 0);
    $analysis['client_score_percent'] = a7_ai_safe_int_percent($analysis['client_score_percent'] ?? 0);
    $analysis['overall_score_percent'] = a7_ai_safe_int_percent($analysis['overall_score_percent'] ?? 0);
    $analysis['qualification_confidence'] = max(0, min(1, (float)($analysis['qualification_confidence'] ?? 0)));

    foreach (['agent_strengths', 'agent_improvements', 'client_signals', 'missing_questions'] as $key) {
        if (!is_array($analysis[$key] ?? null)) {
            $analysis[$key] = [];
        }
    }

    if (!is_array($analysis['details'] ?? null)) {
        $analysis['details'] = [];
    }

    return $analysis;
}

function a7_ai_html_list(array $items): string
{
    if (empty($items)) {
        return '<li>-</li>';
    }

    $html = '';
    foreach (array_slice($items, 0, 8) as $item) {
        $html .= '<li>' . htmlspecialchars((string)$item, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8') . '</li>';
    }
    return $html;
}

function a7_ai_public_list($items, int $limit = 12): array
{
    if (!is_array($items)) {
        return [];
    }

    $out = [];
    foreach (array_slice($items, 0, $limit) as $item) {
        if (is_array($item) || is_object($item)) {
            $out[] = mb_substr((string)json_encode($item, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE), 0, 500);
            continue;
        }

        $text = trim((string)$item);
        if ($text !== '') {
            $out[] = mb_substr($text, 0, 500);
        }
    }

    return $out;
}

function a7_ai_public_assoc($items, int $limit = 20): array
{
    if (!is_array($items)) {
        return [];
    }

    $out = [];
    foreach (array_slice($items, 0, $limit, true) as $key => $value) {
        if ($value === null || $value === '') {
            continue;
        }

        if (is_array($value) || is_object($value)) {
            $value = json_encode($value, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
        }

        $out[(string)$key] = mb_substr((string)$value, 0, 500);
    }

    return $out;
}

function a7_ai_score_payload(array $recording, array $entity, array $analysis, array $transcript): array
{
    $recordingId = (int)($recording['Id'] ?? 0);
    $ownerTypeId = (int)($entity['ownerTypeId'] ?? 0);
    $entityId = (int)($entity['id'] ?? 0);
    return [
        'recordingId' => $recordingId,
        'entityType' => (string)($entity['entityType'] ?? ''),
        'ownerTypeId' => $ownerTypeId,
        'entityId' => $entityId,
        'entityTitle' => (string)($entity['title'] ?? ''),
        'detailUrl' => (string)($entity['detailUrl'] ?? ''),
        'leadId' => $ownerTypeId === 1 ? $entityId : 0,
        'leadTitle' => $ownerTypeId === 1 ? (string)($entity['title'] ?? '') : '',
        'generatedAt' => date('c'),
        'callType' => (string)($recording['CallType'] ?? ''),
        'startTime' => (string)($recording['StartTime'] ?? ''),
        'endTime' => (string)($recording['EndTime'] ?? ''),
        'playbackUrl' => A7_AI_HANDLER_URL . '?action=recording&id=' . rawurlencode((string)$recordingId),
        'scores' => [
            'agent' => (int)($analysis['agent_score_percent'] ?? 0),
            'client' => (int)($analysis['client_score_percent'] ?? 0),
            'overall' => (int)($analysis['overall_score_percent'] ?? 0),
        ],
        'qualified' => (bool)($analysis['qualified'] ?? false),
        'callOutcome' => (string)($analysis['call_outcome'] ?? ''),
        'brokerFlag' => (bool)($analysis['broker_flag'] ?? false),
        'summary' => (string)($analysis['recording_summary'] ?? ''),
        'nextAction' => (string)($analysis['next_action'] ?? ''),
        'details' => a7_ai_public_assoc($analysis['details'] ?? []),
        'leadUpdate' => a7_ai_public_assoc($analysis['lead_update'] ?? []),
        'agentStrengths' => a7_ai_public_list($analysis['agent_strengths'] ?? []),
        'agentImprovements' => a7_ai_public_list($analysis['agent_improvements'] ?? []),
        'clientSignals' => a7_ai_public_list($analysis['client_signals'] ?? []),
        'missingQuestions' => a7_ai_public_list($analysis['missing_questions'] ?? []),
        'transcriptQuality' => (string)($analysis['transcript_quality_notes'] ?? ''),
        'transcript' => mb_substr((string)($transcript['text'] ?? ''), 0, 18000),
    ];
}

function a7_ai_stored_score(int $recordingId): ?array
{
    if ($recordingId <= 0) {
        return null;
    }

    $state = a7_ai_read_state();
    $score = $state['score_by_recording'][(string)$recordingId] ?? null;
    return is_array($score) ? $score : null;
}

function a7_ai_remember_score(int $recordingId, array $payload): void
{
    if ($recordingId <= 0) {
        return;
    }

    $state = a7_ai_read_state();
    $scores = $state['score_by_recording'] ?? [];
    if (!is_array($scores)) {
        $scores = [];
    }

    $scores[(string)$recordingId] = $payload;
    if (count($scores) > A7_AI_STORED_SCORE_LIMIT) {
        uasort($scores, static function ($a, $b) {
            return strcmp((string)($b['generatedAt'] ?? ''), (string)($a['generatedAt'] ?? ''));
        });
        $scores = array_slice($scores, 0, A7_AI_STORED_SCORE_LIMIT, true);
    }

    $state['score_by_recording'] = $scores;
    a7_ai_write_state($state);
}

function a7_ai_score_ready_marker(int $recordingId, int $overallScore): string
{
    return '<p style="display:none">A7_AI_SCORE_READY recording='
        . htmlspecialchars((string)$recordingId, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8')
        . ' overall='
        . htmlspecialchars((string)$overallScore, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8')
        . '</p>';
}

function a7_ai_description_with_score_marker(string $description, int $recordingId, int $overallScore): string
{
    $description = preg_replace('/<p[^>]*>\s*A7_AI_SCORE_READY\s+recording=' . preg_quote((string)$recordingId, '/') . '[^<]*<\/p>/i', '', $description) ?? $description;
    return rtrim($description) . "\n" . a7_ai_score_ready_marker($recordingId, $overallScore);
}

function a7_ai_text_from_html(string $html): string
{
    $html = preg_replace('/<\s*br\s*\/?>/i', "\n", $html) ?? $html;
    $html = preg_replace('/<\/(p|li|div|ul|ol|pre|h[1-6])>/i', "\n", $html) ?? $html;
    $text = html_entity_decode(strip_tags($html), ENT_QUOTES | ENT_HTML5, 'UTF-8');
    return trim(preg_replace("/[ \t]+\n/", "\n", $text) ?? $text);
}

function a7_ai_text_between(string $text, string $start, array $endLabels): string
{
    $pos = mb_stripos($text, $start);
    if ($pos === false) {
        return '';
    }

    $from = $pos + mb_strlen($start);
    $to = mb_strlen($text);
    foreach ($endLabels as $label) {
        $next = mb_stripos($text, $label, $from);
        if ($next !== false && $next < $to) {
            $to = $next;
        }
    }

    return trim(mb_substr($text, $from, $to - $from));
}

function a7_ai_score_from_legacy_description(int $recordingId, array $activity): ?array
{
    $description = (string)($activity['DESCRIPTION'] ?? '');
    if ($description === '') {
        return null;
    }

    $text = a7_ai_text_from_html($description);
    $agent = (int)(preg_match('/Agent score:\s*(\d+)%/i', $text, $m) ? $m[1] : 0);
    $client = (int)(preg_match('/Client score:\s*(\d+)%/i', $text, $m) ? $m[1] : 0);
    $overall = (int)(preg_match('/Overall score:\s*(\d+)%/i', $text, $m) ? $m[1] : 0);
    if ($agent <= 0 && $client <= 0 && $overall <= 0) {
        return null;
    }

    return [
        'recordingId' => $recordingId,
        'activityId' => (int)($activity['ID'] ?? 0),
        'generatedAt' => (string)($activity['LAST_UPDATED'] ?? ($activity['CREATED'] ?? '')),
        'legacy' => true,
        'scores' => [
            'agent' => a7_ai_safe_int_percent($agent),
            'client' => a7_ai_safe_int_percent($client),
            'overall' => a7_ai_safe_int_percent($overall),
        ],
        'qualified' => preg_match('/Qualified:\s*Yes/i', $text) === 1,
        'callOutcome' => trim((string)(preg_match('/Outcome:\s*(.+)/i', $text, $m) ? $m[1] : '')),
        'brokerFlag' => preg_match('/Broker flag:\s*Yes/i', $text) === 1,
        'summary' => a7_ai_text_between($text, 'Summary', ['Next action', 'Detected details', 'Bitrix field suggestions', 'Agent strengths']),
        'nextAction' => a7_ai_text_between($text, 'Next action', ['Detected details', 'Bitrix field suggestions', 'Agent strengths']),
        'details' => [],
        'leadUpdate' => [],
        'agentStrengths' => [],
        'agentImprovements' => [],
        'clientSignals' => [],
        'missingQuestions' => [],
        'transcriptQuality' => a7_ai_text_between($text, 'Transcript quality', ['Transcript']),
        'transcript' => mb_substr(a7_ai_text_between($text, 'Transcript', []), 0, 18000),
    ];
}

function a7_ai_fetch_legacy_score(int $recordingId): ?array
{
    $response = a7_ai_bitrix_call('crm.activity.list', [
        'order' => ['ID' => 'DESC'],
        'filter' => ['ORIGIN_ID' => a7_ai_activity_origin_id($recordingId)],
        'select' => ['ID', 'SUBJECT', 'ORIGIN_ID', 'DESCRIPTION', 'CREATED', 'LAST_UPDATED'],
        'start' => 0,
    ]);

    $result = $response['json']['result'] ?? [];
    if (!$response['ok'] || !is_array($result) || empty($result[0]) || !is_array($result[0])) {
        return null;
    }

    $score = a7_ai_score_from_legacy_description($recordingId, $result[0]);
    if ($score !== null) {
        a7_ai_remember_score($recordingId, $score);
    }
    return $score;
}

function a7_ai_state_for_status(array $state): array
{
    $scores = $state['score_by_recording'] ?? [];
    if (!is_array($scores)) {
        $scores = [];
    }

    unset($state['score_by_recording']);
    $state['storedScoreCount'] = count($scores);
    $latest = null;
    foreach ($scores as $score) {
        if (!is_array($score)) {
            continue;
        }
        if ($latest === null || strcmp((string)($score['generatedAt'] ?? ''), (string)($latest['generatedAt'] ?? '')) > 0) {
            $latest = $score;
        }
    }

    if ($latest !== null) {
        $state['latestStoredScore'] = [
            'recordingId' => (int)($latest['recordingId'] ?? 0),
            'generatedAt' => (string)($latest['generatedAt'] ?? ''),
            'overallScore' => (int)($latest['scores']['overall'] ?? 0),
        ];
    }

    return $state;
}

function a7_ai_activity_description(array $recording, array $lead, array $analysis, array $transcript): string
{
    $leadUpdate = $analysis['lead_update'] ?? [];
    $details = $analysis['details'] ?? [];
    $recordingId = (int)($recording['Id'] ?? 0);
    $playbackUrl = A7_AI_HANDLER_URL . '?action=recording&id=' . rawurlencode((string)$recordingId);
    $transcriptText = mb_substr((string)($transcript['text'] ?? ''), 0, 14000);

    $fieldLines = [];
    foreach ($leadUpdate as $key => $value) {
        if ($value !== null && $value !== '') {
            $fieldLines[] = htmlspecialchars($key . ': ' . $value, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
        }
    }

    $detailLines = [];
    foreach ($details as $key => $value) {
        if ($value !== null && $value !== '') {
            $detailLines[] = htmlspecialchars($key . ': ' . $value, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
        }
    }

    return '<p><b>AI call analysis synced from 3CX recording.</b></p>'
        . '<p><a href="' . htmlspecialchars($playbackUrl, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8') . '" target="_blank">Play 3CX recording</a></p>'
        . '<ul>'
        . '<li>Recording ID: ' . htmlspecialchars((string)$recordingId, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8') . '</li>'
        . '<li>Qualified: ' . (!empty($analysis['qualified']) ? 'Yes' : 'No') . '</li>'
        . '<li>Outcome: ' . htmlspecialchars((string)($analysis['call_outcome'] ?? ''), ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8') . '</li>'
        . '<li>Agent score: ' . (int)($analysis['agent_score_percent'] ?? 0) . '%</li>'
        . '<li>Client score: ' . (int)($analysis['client_score_percent'] ?? 0) . '%</li>'
        . '<li>Overall score: ' . (int)($analysis['overall_score_percent'] ?? 0) . '%</li>'
        . '<li>Broker flag: ' . (!empty($analysis['broker_flag']) ? 'Yes' : 'No') . '</li>'
        . '</ul>'
        . '<p><b>Summary</b><br>' . nl2br(htmlspecialchars((string)($analysis['recording_summary'] ?? ''), ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8')) . '</p>'
        . '<p><b>Next action</b><br>' . nl2br(htmlspecialchars((string)($analysis['next_action'] ?? ''), ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8')) . '</p>'
        . '<p><b>Detected details</b><br>' . implode('<br>', $detailLines) . '</p>'
        . '<p><b>Bitrix field suggestions</b><br>' . implode('<br>', $fieldLines) . '</p>'
        . '<p><b>Agent strengths</b></p><ul>' . a7_ai_html_list($analysis['agent_strengths'] ?? []) . '</ul>'
        . '<p><b>Agent improvements</b></p><ul>' . a7_ai_html_list($analysis['agent_improvements'] ?? []) . '</ul>'
        . '<p><b>Client signals</b></p><ul>' . a7_ai_html_list($analysis['client_signals'] ?? []) . '</ul>'
        . '<p><b>Missing questions</b></p><ul>' . a7_ai_html_list($analysis['missing_questions'] ?? []) . '</ul>'
        . '<p><b>Transcript quality</b><br>' . nl2br(htmlspecialchars((string)($analysis['transcript_quality_notes'] ?? ''), ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8')) . '</p>'
        . '<p><b>Transcript</b><br><pre style="white-space:pre-wrap">' . htmlspecialchars($transcriptText, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8') . '</pre></p>';
}

function a7_ai_add_activity(array $recording, array $entity, array $analysis, array $transcript): array
{
    $recordingId = (int)($recording['Id'] ?? 0);
    $ownerTypeId = (int)($entity['ownerTypeId'] ?? 0);
    $ownerId = (int)($entity['id'] ?? 0);
    $payload = a7_ai_score_payload($recording, $entity, $analysis, $transcript);
    a7_ai_remember_score($recordingId, $payload);

    $recordingActivity = is_array($entity['recordingActivity'] ?? null)
        ? $entity['recordingActivity']
        : a7_ai_find_recording_activity($ownerTypeId, $ownerId, $recordingId);
    if ($recordingActivity) {
        $activityId = (int)($recordingActivity['ID'] ?? 0);
        $description = a7_ai_description_with_score_marker(
            (string)($recordingActivity['DESCRIPTION'] ?? ''),
            $recordingId,
            (int)($payload['scores']['overall'] ?? 0)
        );

        $update = a7_ai_bitrix_call('crm.activity.update', [
            'id' => $activityId,
            'fields' => [
                'DESCRIPTION' => $description,
                'DESCRIPTION_TYPE' => 3,
            ],
        ]);

        if (!$update['ok']) {
            a7_ai_log('Bitrix recording activity score marker update failed', [
                'recording_id' => $recordingId,
                'owner_type_id' => $ownerTypeId,
                'owner_id' => $ownerId,
                'activity_id' => $activityId,
                'status' => $update['status'],
                'raw' => mb_substr((string)$update['raw'], 0, 300),
            ]);
        }

        return [
            'status' => 'created',
            'activityId' => $activityId,
            'mode' => $update['ok'] ? 'recording_activity_score_attached' : 'score_state_saved',
        ];
    }

    return [
        'status' => 'created',
        'activityId' => 0,
        'mode' => 'score_state_saved',
    ];
}

function a7_ai_lead_field_map(): array
{
    return [
        'source_id' => 'SOURCE_ID',
        'status_id' => 'STATUS_ID',
        'lead_type_id' => A7_LEAD_FIELD_LEAD_TYPE,
        'requirement_category_id' => A7_LEAD_FIELD_REQUIREMENT_CATEGORY,
        'bedrooms_id' => A7_LEAD_FIELD_BEDROOMS,
        'property_type_id' => A7_LEAD_FIELD_PROPERTY_TYPE,
        'timeline_id' => A7_LEAD_FIELD_TIMELINE,
        'purpose_id' => A7_LEAD_FIELD_PURPOSE,
        'meeting_mode_id' => A7_LEAD_FIELD_MEETING_MODE,
        'budget_range_id' => A7_LEAD_FIELD_BUDGET_RANGE,
        'contact_method_id' => A7_LEAD_FIELD_CONTACT_METHOD,
    ];
}

function a7_ai_is_empty_lead_value($value): bool
{
    if ($value === null) {
        return true;
    }
    if (is_array($value)) {
        return empty($value);
    }
    return trim((string)$value) === '';
}

function a7_ai_update_lead(array $lead, array $analysis, bool $overwrite): array
{
    if ((int)($lead['ownerTypeId'] ?? 1) !== 1 || (string)($lead['entityType'] ?? 'lead') !== 'lead') {
        return ['status' => 'skipped', 'reason' => 'lead_field_updates_not_applicable_to_owner_data'];
    }

    $rawLead = is_array($lead['raw'] ?? null) ? $lead['raw'] : [];
    $fields = [];
    $leadUpdate = is_array($analysis['lead_update'] ?? null) ? $analysis['lead_update'] : [];

    foreach (a7_ai_lead_field_map() as $analysisKey => $bitrixField) {
        $value = $leadUpdate[$analysisKey] ?? null;
        if ($value === null || $value === '') {
            continue;
        }

        $current = $rawLead[$bitrixField] ?? null;
        if ($overwrite || a7_ai_is_empty_lead_value($current) || $bitrixField === 'STATUS_ID') {
            $fields[$bitrixField] = $value;
        }
    }

    if (empty($fields)) {
        return ['status' => 'skipped', 'reason' => 'no_empty_fields_to_update'];
    }

    $response = a7_ai_bitrix_call('crm.lead.update', [
        'id' => (int)$lead['id'],
        'fields' => $fields,
        'params' => ['REGISTER_SONET_EVENT' => 'Y'],
    ]);

    if (!$response['ok']) {
        return [
            'status' => 'failed',
            'reason' => 'crm_lead_update_failed',
            'bitrixStatus' => $response['status'],
            'raw' => mb_substr((string)$response['raw'], 0, 300),
            'fields' => $fields,
        ];
    }

    return ['status' => 'updated', 'fields' => $fields];
}

function a7_ai_fetch_recordings(int $limit, int $recordingId = 0): array
{
    if ($recordingId > 0) {
        $path = '/xapi/v1/Recordings?$filter=Id%20eq%20' . rawurlencode((string)$recordingId) . '&$top=1';
    } else {
        if ($limit <= 0) {
            $limit = 10;
        }
        if ($limit > A7_AI_MAX_LIMIT_PER_RUN) {
            $limit = A7_AI_MAX_LIMIT_PER_RUN;
        }
        $path = '/xapi/v1/Recordings?$orderby=StartTime%20desc&$top=' . $limit;
    }

    $response = a7_ai_3cx_get_json($path);
    if (!$response['ok'] || !is_array($response['json']['value'] ?? null)) {
        throw new RuntimeException('Unable to fetch 3CX recordings');
    }

    return $response['json']['value'];
}

function a7_ai_process_recording(array $recording, bool $dryRun, bool $updateLead, bool $overwriteLead): array
{
    $recordingId = (int)($recording['Id'] ?? 0);
    if (!$dryRun && a7_ai_stored_score($recordingId) !== null) {
        return [
            'recordingId' => $recordingId,
            'callType' => (string)($recording['CallType'] ?? ''),
            'startTime' => (string)($recording['StartTime'] ?? ''),
            'endTime' => (string)($recording['EndTime'] ?? ''),
            'internalExtension' => '',
            'externalPhone' => '',
            'bitrixLeadIds' => [],
            'selectedLead' => null,
            'selectedEntity' => null,
            'matchedBy' => [],
            'sync' => ['status' => 'skipped', 'reason' => 'already_ai_analyzed_cached'],
        ];
    }

    $parties = a7_ai_recording_parties($recording);
    $ageSeconds = a7_ai_recording_age_seconds($recording);
    $durationSeconds = a7_ai_recording_duration_seconds($recording);
    if (!$dryRun && $ageSeconds !== null && $ageSeconds < A7_AI_RECORDING_READY_DELAY_SECONDS) {
        return [
            'recordingId' => $recordingId,
            'callType' => (string)($recording['CallType'] ?? ''),
            'startTime' => (string)($recording['StartTime'] ?? ''),
            'endTime' => (string)($recording['EndTime'] ?? ''),
            'internalExtension' => $parties['internal_extension'],
            'externalPhone' => a7_ai_mask_phone($parties['external_phone_raw'] !== '' ? $parties['external_phone_raw'] : $parties['external_phone_digits']),
            'bitrixLeadIds' => [],
            'selectedLead' => null,
            'selectedEntity' => null,
            'matchedBy' => [],
            'sync' => [
                'status' => 'skipped',
                'reason' => 'recording_ready_delay',
                'ageSeconds' => $ageSeconds,
                'requiredAgeSeconds' => A7_AI_RECORDING_READY_DELAY_SECONDS,
            ],
        ];
    }

    if (!$dryRun && $durationSeconds !== null && $durationSeconds < A7_AI_MIN_AUDIO_SECONDS) {
        return [
            'recordingId' => $recordingId,
            'callType' => (string)($recording['CallType'] ?? ''),
            'startTime' => (string)($recording['StartTime'] ?? ''),
            'endTime' => (string)($recording['EndTime'] ?? ''),
            'internalExtension' => $parties['internal_extension'],
            'externalPhone' => a7_ai_mask_phone($parties['external_phone_raw'] !== '' ? $parties['external_phone_raw'] : $parties['external_phone_digits']),
            'bitrixLeadIds' => [],
            'selectedLead' => null,
            'selectedEntity' => null,
            'matchedBy' => [],
            'sync' => [
                'status' => 'skipped',
                'reason' => 'recording_too_short_for_ai',
                'durationSeconds' => $durationSeconds,
                'requiredDurationSeconds' => A7_AI_MIN_AUDIO_SECONDS,
            ],
        ];
    }

    $binding = a7_ai_find_recording_binding($recordingId);
    $entity = is_array($binding['entity'] ?? null) ? $binding['entity'] : null;
    if ($entity !== null && is_array($binding['activity'] ?? null)) {
        $entity['recordingActivity'] = $binding['activity'];
    }

    $isLead = $entity !== null && (int)($entity['ownerTypeId'] ?? 0) === 1;
    $row = [
        'recordingId' => $recordingId,
        'callType' => (string)($recording['CallType'] ?? ''),
        'startTime' => (string)($recording['StartTime'] ?? ''),
        'endTime' => (string)($recording['EndTime'] ?? ''),
        'durationSeconds' => $durationSeconds,
        'internalExtension' => $parties['internal_extension'],
        'externalPhone' => a7_ai_mask_phone($parties['external_phone_raw'] !== '' ? $parties['external_phone_raw'] : $parties['external_phone_digits']),
        'bitrixLeadIds' => $isLead ? [(int)$entity['id']] : [],
        'selectedLead' => $isLead ? [
            'id' => (int)$entity['id'],
            'title' => (string)$entity['title'],
            'assignedById' => (int)$entity['assignedById'],
            'selectedBecause' => 'recording_activity_binding',
        ] : null,
        'selectedEntity' => $entity ? [
            'entityType' => (string)($entity['entityType'] ?? ''),
            'ownerTypeId' => (int)($entity['ownerTypeId'] ?? 0),
            'id' => (int)$entity['id'],
            'title' => (string)$entity['title'],
            'assignedById' => (int)$entity['assignedById'],
            'detailUrl' => (string)($entity['detailUrl'] ?? ''),
            'selectedBecause' => 'recording_activity_binding',
        ] : null,
        'matchedBy' => $entity ? [['type' => 'recording_activity_binding']] : [],
    ];

    if (!$entity) {
        $row['sync'] = [
            'status' => 'skipped',
            'reason' => 'recording_activity_not_synced_yet',
        ];
        return $row;
    }

    if (a7_ai_activity_exists((int)$entity['ownerTypeId'], (int)$entity['id'], $recordingId)) {
        $row['sync'] = ['status' => 'skipped', 'reason' => 'already_ai_analyzed'];
        return $row;
    }

    if ($dryRun) {
        $row['sync'] = ['status' => 'would_analyze'];
        return $row;
    }

    $audioPath = '';
    try {
        $audioPath = a7_ai_download_recording_file($recordingId);
        $transcript = a7_ai_transcribe_file($audioPath, $recordingId);
        $analysis = a7_ai_analyze_transcript($recording, $parties, $entity, $transcript);
        $activity = a7_ai_add_activity($recording, $entity, $analysis, $transcript);
        $leadUpdate = $updateLead ? a7_ai_update_lead($entity, $analysis, $overwriteLead) : ['status' => 'skipped', 'reason' => 'updateLead_disabled'];

        $row['analysis'] = [
            'qualified' => (bool)($analysis['qualified'] ?? false),
            'callOutcome' => (string)($analysis['call_outcome'] ?? ''),
            'agentScore' => (int)($analysis['agent_score_percent'] ?? 0),
            'clientScore' => (int)($analysis['client_score_percent'] ?? 0),
            'overallScore' => (int)($analysis['overall_score_percent'] ?? 0),
            'brokerFlag' => (bool)($analysis['broker_flag'] ?? false),
            'nextAction' => (string)($analysis['next_action'] ?? ''),
            'leadUpdate' => $analysis['lead_update'] ?? [],
        ];
        $row['sync'] = [
            'status' => ($activity['status'] ?? '') === 'created' ? 'created' : 'failed',
            'activity' => $activity,
            'leadUpdate' => $leadUpdate,
        ];
    } catch (Throwable $e) {
        a7_ai_log('AI recording process failed', [
            'recording_id' => $recordingId,
            'owner_type_id' => (int)$entity['ownerTypeId'],
            'owner_id' => (int)$entity['id'],
            'error' => $e->getMessage(),
        ]);
        $row['sync'] = ['status' => 'failed', 'reason' => $e->getMessage()];
    } finally {
        if ($audioPath !== '' && is_file($audioPath)) {
            @unlink($audioPath);
        }
    }

    return $row;
}

function a7_ai_read_state(): array
{
    if (!is_readable(A7_AI_STATE_FILE)) {
        return [];
    }
    $json = json_decode((string)file_get_contents(A7_AI_STATE_FILE), true);
    return is_array($json) ? $json : [];
}

function a7_ai_write_state(array $state): void
{
    @file_put_contents(A7_AI_STATE_FILE, json_encode($state, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE));
}

function a7_ai_int_between(int $value, int $min, int $max): int
{
    if ($value < $min) {
        return $min;
    }
    if ($value > $max) {
        return $max;
    }
    return $value;
}

function a7_ai_lock_acquire()
{
    $handle = @fopen(A7_AI_LOCK_FILE, 'c');
    if (!$handle) {
        return null;
    }

    if (!@flock($handle, LOCK_EX | LOCK_NB)) {
        @fclose($handle);
        return null;
    }

    @ftruncate($handle, 0);
    @fwrite($handle, json_encode(['pid' => getmypid(), 'time' => date('c')]));
    return $handle;
}

function a7_ai_lock_release($handle): void
{
    if (is_resource($handle)) {
        @flock($handle, LOCK_UN);
        @fclose($handle);
    }
}

function a7_ai_rate_prepare(array &$state): void
{
    $hour = date('Y-m-d-H');
    $day = date('Y-m-d');
    if (($state['rate_hour'] ?? '') !== $hour) {
        $state['rate_hour'] = $hour;
        $state['rate_hour_writes'] = 0;
    }
    if (($state['rate_day'] ?? '') !== $day) {
        $state['rate_day'] = $day;
        $state['rate_day_writes'] = 0;
    }
}

function a7_ai_rate_remaining(array &$state): array
{
    a7_ai_rate_prepare($state);
    $hourUsed = (int)($state['rate_hour_writes'] ?? 0);
    $dayUsed = (int)($state['rate_day_writes'] ?? 0);
    $hourRemaining = max(0, A7_AI_MAX_WRITES_PER_HOUR - $hourUsed);
    $dayRemaining = max(0, A7_AI_MAX_WRITES_PER_DAY - $dayUsed);
    return [
        'hourUsed' => $hourUsed,
        'dayUsed' => $dayUsed,
        'hourRemaining' => $hourRemaining,
        'dayRemaining' => $dayRemaining,
        'allowedNow' => min($hourRemaining, $dayRemaining),
    ];
}

function a7_ai_rate_register(array &$state, int $created): void
{
    if ($created <= 0) {
        return;
    }

    a7_ai_rate_prepare($state);
    $state['rate_hour_writes'] = (int)($state['rate_hour_writes'] ?? 0) + $created;
    $state['rate_day_writes'] = (int)($state['rate_day_writes'] ?? 0) + $created;
}

function a7_ai_recording_age_seconds(array $recording): ?int
{
    $value = (string)($recording['EndTime'] ?? ($recording['StartTime'] ?? ''));
    if ($value === '') {
        return null;
    }

    $timestamp = strtotime($value);
    if ($timestamp === false) {
        return null;
    }

    return time() - $timestamp;
}

function a7_ai_recording_duration_seconds(array $recording): ?float
{
    $start = (string)($recording['StartTime'] ?? '');
    $end = (string)($recording['EndTime'] ?? '');
    if ($start === '' || $end === '') {
        return null;
    }

    $startTs = strtotime($start);
    $endTs = strtotime($end);
    if ($startTs === false || $endTs === false) {
        return null;
    }

    return max(0, $endTs - $startTs);
}

function a7_ai_guarded_skip(string $reason, array $extra = []): array
{
    return array_merge([
        'success' => true,
        'ran' => false,
        'reason' => $reason,
        'dryRun' => false,
        'checkedRecordings' => 0,
        'createdCount' => 0,
        'skippedCount' => 0,
        'failedCount' => 0,
        'updateLead' => false,
        'overwriteLead' => false,
        'rows' => [],
    ], $extra);
}

function a7_ai_run_guarded(int $limit, bool $dryRun, int $maxWrites, bool $updateLead, bool $overwriteLead, int $recordingId = 0, string $source = 'manual'): array
{
    $limit = a7_ai_int_between($limit <= 0 ? A7_AI_MAX_LIMIT_PER_RUN : $limit, 1, A7_AI_MAX_LIMIT_PER_RUN);
    $maxWrites = a7_ai_int_between($maxWrites, 0, A7_AI_MAX_WRITES_PER_RUN);

    if ($dryRun) {
        return a7_ai_run($limit, true, 0, $updateLead, $overwriteLead, $recordingId, $source);
    }

    if ($maxWrites <= 0) {
        return a7_ai_guarded_skip('max_writes_zero');
    }

    $lock = a7_ai_lock_acquire();
    if (!$lock) {
        return a7_ai_guarded_skip('lock_busy');
    }

    try {
        $state = a7_ai_read_state();
        $now = time();
        $lastAttemptTs = (int)($state['last_attempt_ts'] ?? 0);
        if ($recordingId <= 0 && $lastAttemptTs > 0 && ($now - $lastAttemptTs) < A7_AI_MIN_RUN_SECONDS) {
            return a7_ai_guarded_skip('throttled', [
                'lastAttempt' => (string)($state['last_attempt'] ?? ''),
                'nextAllowedInSeconds' => A7_AI_MIN_RUN_SECONDS - ($now - $lastAttemptTs),
            ]);
        }

        $rate = a7_ai_rate_remaining($state);
        if ($rate['allowedNow'] <= 0) {
            $state['last_attempt_ts'] = $now;
            $state['last_attempt'] = date('c', $now);
            a7_ai_write_state($state);
            return a7_ai_guarded_skip('write_rate_limited', ['rate' => $rate]);
        }

        $maxWrites = min($maxWrites, (int)$rate['allowedNow']);
        $state['last_attempt_ts'] = $now;
        $state['last_attempt'] = date('c', $now);
        a7_ai_write_state($state);

        $result = a7_ai_run($limit, false, $maxWrites, $updateLead, $overwriteLead, $recordingId, $source);
        $created = (int)($result['createdCount'] ?? 0);

        $state = a7_ai_read_state();
        a7_ai_rate_register($state, $created);
        $state['last_guarded_run'] = date('c');
        $state['last_guarded_result'] = [
            'source' => $source,
            'limit' => $limit,
            'maxWrites' => $maxWrites,
            'createdCount' => $created,
            'checkedRecordings' => (int)($result['checkedRecordings'] ?? 0),
        ];
        a7_ai_write_state($state);

        $result['ran'] = true;
        $result['guard'] = [
            'minRunSeconds' => A7_AI_MIN_RUN_SECONDS,
            'maxLimitPerRun' => A7_AI_MAX_LIMIT_PER_RUN,
            'maxWritesPerRun' => A7_AI_MAX_WRITES_PER_RUN,
            'maxWritesPerHour' => A7_AI_MAX_WRITES_PER_HOUR,
            'maxWritesPerDay' => A7_AI_MAX_WRITES_PER_DAY,
            'readyDelaySeconds' => A7_AI_RECORDING_READY_DELAY_SECONDS,
            'maxAudioBytes' => A7_AI_MAX_AUDIO_BYTES,
            'rate' => a7_ai_rate_remaining($state),
        ];
        return $result;
    } finally {
        a7_ai_lock_release($lock);
    }
}

function a7_ai_run(int $limit, bool $dryRun, int $maxWrites, bool $updateLead, bool $overwriteLead, int $recordingId = 0, string $source = 'manual'): array
{
    if ($maxWrites < 0) {
        $maxWrites = 0;
    }
    if ($maxWrites > A7_AI_MAX_WRITES_PER_RUN) {
        $maxWrites = A7_AI_MAX_WRITES_PER_RUN;
    }

    $recordings = a7_ai_fetch_recordings($limit, $recordingId);
    $rows = [];
    $created = 0;
    $failed = 0;
    $skipped = 0;

    foreach ($recordings as $recording) {
        if (!is_array($recording)) {
            continue;
        }

        if (!$dryRun && $created >= $maxWrites) {
            $rows[] = [
                'recordingId' => (int)($recording['Id'] ?? 0),
                'sync' => ['status' => 'skipped', 'reason' => 'max_writes_reached'],
            ];
            $skipped++;
            continue;
        }

        $row = a7_ai_process_recording($recording, $dryRun, $updateLead, $overwriteLead);
        $status = (string)($row['sync']['status'] ?? '');
        if ($status === 'created') {
            $created++;
        } elseif ($status === 'failed') {
            $failed++;
        } else {
            $skipped++;
        }
        $rows[] = $row;
    }

    $state = a7_ai_read_state();
    $state['last_run'] = date('c');
    $state['last_source'] = $source;
    $state['last_result'] = [
        'checkedRecordings' => count($rows),
        'createdCount' => $created,
        'skippedCount' => $skipped,
        'failedCount' => $failed,
        'dryRun' => $dryRun,
    ];
    a7_ai_write_state($state);

    return [
        'success' => true,
        'dryRun' => $dryRun,
        'checkedRecordings' => count($rows),
        'createdCount' => $created,
        'skippedCount' => $skipped,
        'failedCount' => $failed,
        'updateLead' => $updateLead,
        'overwriteLead' => $overwriteLead,
        'rows' => $rows,
    ];
}

function a7_ai_require_bitrix_admin(): int
{
    if (!defined('NO_KEEP_STATISTIC')) {
        define('NO_KEEP_STATISTIC', true);
    }
    if (!defined('NOT_CHECK_PERMISSIONS')) {
        define('NOT_CHECK_PERMISSIONS', false);
    }

    $documentRoot = rtrim((string)($_SERVER['DOCUMENT_ROOT'] ?? '/home/bitrix/www'), '/');
    $prolog = $documentRoot . '/bitrix/modules/main/include/prolog_before.php';
    if (is_readable($prolog)) {
        require_once $prolog;
    }

    global $USER;
    if (!is_object($USER) || !method_exists($USER, 'IsAuthorized') || !$USER->IsAuthorized()) {
        a7_ai_json(['success' => false, 'message' => 'Bitrix admin login required'], 401);
    }

    if (!method_exists($USER, 'IsAdmin') || !$USER->IsAdmin()) {
        a7_ai_json(['success' => false, 'message' => 'Bitrix admin required'], 403);
    }

    return (int)$USER->GetID();
}

function a7_ai_require_bitrix_user_for_recording(): void
{
    if (!defined('NO_KEEP_STATISTIC')) {
        define('NO_KEEP_STATISTIC', true);
    }
    if (!defined('NOT_CHECK_PERMISSIONS')) {
        define('NOT_CHECK_PERMISSIONS', false);
    }

    $documentRoot = rtrim((string)($_SERVER['DOCUMENT_ROOT'] ?? '/home/bitrix/www'), '/');
    $prolog = $documentRoot . '/bitrix/modules/main/include/prolog_before.php';
    if (is_readable($prolog)) {
        require_once $prolog;
    }

    global $USER;
    if (!is_object($USER) || !method_exists($USER, 'IsAuthorized') || !$USER->IsAuthorized()) {
        a7_ai_json(['success' => false, 'message' => 'Bitrix login required'], 401);
    }
}

function a7_ai_require_bitrix_user_for_action(): int
{
    a7_ai_require_bitrix_user_for_recording();

    if (strtoupper((string)($_SERVER['REQUEST_METHOD'] ?? 'GET')) === 'POST'
        && function_exists('check_bitrix_sessid')
        && !check_bitrix_sessid()
    ) {
        a7_ai_json(['success' => false, 'message' => 'Invalid Bitrix session'], 403);
    }

    global $USER;
    return is_object($USER) && method_exists($USER, 'GetID') ? (int)$USER->GetID() : 0;
}

function a7_ai_handle_run(): void
{
    a7_ai_require_bitrix_admin();
    $limit = (int)a7_ai_request_value('limit', A7_AI_MAX_LIMIT_PER_RUN);
    $recordingId = (int)a7_ai_request_value('id', 0);
    $dryRunValue = strtolower(trim((string)a7_ai_request_value('dryRun', '1')));
    $dryRun = !in_array($dryRunValue, ['0', 'false', 'no'], true);

    if (!$dryRun && (string)a7_ai_request_value('confirm', '') !== 'A7_AI_ANALYZE') {
        a7_ai_json(['success' => false, 'message' => 'Write mode requires confirm=A7_AI_ANALYZE'], 400);
    }

    $maxWrites = (int)a7_ai_request_value('maxWrites', $dryRun ? 0 : A7_AI_MAX_WRITES_PER_RUN);
    $updateLead = in_array(strtolower((string)a7_ai_request_value('updateLead', '1')), ['1', 'y', 'yes', 'true'], true);
    $overwriteLead = in_array(strtolower((string)a7_ai_request_value('overwriteLead', '0')), ['1', 'y', 'yes', 'true'], true);

    try {
        a7_ai_json(a7_ai_run_guarded($limit, $dryRun, $maxWrites, $updateLead, $overwriteLead, $recordingId, 'manual'));
    } catch (Throwable $e) {
        a7_ai_log('Manual AI run failed', ['error' => $e->getMessage()]);
        a7_ai_json(['success' => false, 'message' => $e->getMessage()], 500);
    }
}

function a7_ai_handle_analyze(): void
{
    a7_ai_require_bitrix_user_for_action();
    if (strtoupper((string)($_SERVER['REQUEST_METHOD'] ?? 'GET')) !== 'POST') {
        a7_ai_json(['success' => false, 'message' => 'Analyze requires POST'], 405);
    }

    $recordingId = (int)a7_ai_request_value('id', 0);
    if ($recordingId <= 0) {
        a7_ai_json(['success' => false, 'message' => 'Recording id missing'], 400);
    }

    try {
        a7_ai_json(a7_ai_run_guarded(1, false, 1, true, false, $recordingId, 'manual_button'));
    } catch (Throwable $e) {
        a7_ai_log('Button AI analyze failed', ['recording_id' => $recordingId, 'error' => $e->getMessage()]);
        a7_ai_json(['success' => false, 'message' => $e->getMessage()], 500);
    }
}

function a7_3cx_ai_recording_agent(): string
{
    @set_time_limit(0);

    $expression = a7_ai_agent_expression();
    $state = a7_ai_read_state();

    if (($state['agent_enabled'] ?? 'Y') !== 'Y') {
        $state['agent_mode'] = 'disabled';
        $state['last_agent_skip'] = date('c');
        a7_ai_write_state($state);
        return $expression;
    }

    $limit = (int)($state['agent_limit'] ?? A7_AI_MAX_LIMIT_PER_RUN);
    $maxWrites = (int)($state['agent_max_writes'] ?? A7_AI_MAX_WRITES_PER_RUN);
    $updateLead = (string)($state['agent_update_lead'] ?? 'Y') === 'Y';
    $overwriteLead = (string)($state['agent_overwrite_lead'] ?? 'N') === 'Y';

    try {
        $result = a7_ai_run_guarded($limit, false, $maxWrites, $updateLead, $overwriteLead, 0, 'bitrix_ai_agent');
        $state = a7_ai_read_state();
        $state['agent_mode'] = 'auto';
        $state['agent_last_run'] = date('c');
        $state['agent_last_error'] = '';
        $state['agent_last_result'] = [
            'checkedRecordings' => (int)($result['checkedRecordings'] ?? 0),
            'createdCount' => (int)($result['createdCount'] ?? 0),
            'skippedCount' => (int)($result['skippedCount'] ?? 0),
            'failedCount' => (int)($result['failedCount'] ?? 0),
            'ran' => (bool)($result['ran'] ?? true),
            'reason' => (string)($result['reason'] ?? ''),
        ];
        a7_ai_write_state($state);
    } catch (Throwable $e) {
        $state = a7_ai_read_state();
        $state['agent_mode'] = 'auto';
        $state['agent_last_run'] = date('c');
        $state['agent_last_error'] = $e->getMessage();
        a7_ai_write_state($state);
        a7_ai_log('AI recording auto-agent failed', ['error' => $e->getMessage()]);
    }

    return $expression;
}

function a7_ai_agent_expression(): string
{
    return 'call_user_func(function(){include_once $_SERVER["DOCUMENT_ROOT"]."/bitrix/tools/a7_3cx_ai_recording_analyzer.php"; return a7_3cx_ai_recording_agent();});';
}

function a7_ai_agent_rows(string $expression): array
{
    if (!class_exists('CAgent')) {
        return [];
    }

    $rows = [];
    $result = CAgent::GetList(['ID' => 'DESC'], ['=NAME' => $expression]);
    if (is_object($result) && method_exists($result, 'Fetch')) {
        while ($row = $result->Fetch()) {
            $rows[] = [
                'ID' => (int)($row['ID'] ?? 0),
                'ACTIVE' => (string)($row['ACTIVE'] ?? ''),
                'AGENT_INTERVAL' => (int)($row['AGENT_INTERVAL'] ?? 0),
                'IS_PERIOD' => (string)($row['IS_PERIOD'] ?? ''),
                'LAST_EXEC' => (string)($row['LAST_EXEC'] ?? ''),
                'NEXT_EXEC' => (string)($row['NEXT_EXEC'] ?? ''),
            ];
        }
    }

    return $rows;
}

function a7_ai_handle_agent_install(): void
{
    a7_ai_require_bitrix_admin();
    if (!class_exists('CAgent')) {
        a7_ai_json(['success' => false, 'message' => 'Bitrix CAgent class not available'], 500);
    }

    $interval = (int)a7_ai_request_value('interval', A7_AI_MIN_RUN_SECONDS);
    if ($interval < A7_AI_MIN_RUN_SECONDS) {
        $interval = A7_AI_MIN_RUN_SECONDS;
    }
    if ($interval > 900) {
        $interval = 900;
    }

    $limit = (int)a7_ai_request_value('limit', A7_AI_MAX_LIMIT_PER_RUN);
    if ($limit <= 0) {
        $limit = A7_AI_MAX_LIMIT_PER_RUN;
    }
    if ($limit > A7_AI_MAX_LIMIT_PER_RUN) {
        $limit = A7_AI_MAX_LIMIT_PER_RUN;
    }

    $maxWrites = (int)a7_ai_request_value('maxWrites', A7_AI_MAX_WRITES_PER_RUN);
    if ($maxWrites <= 0) {
        $maxWrites = A7_AI_MAX_WRITES_PER_RUN;
    }
    if ($maxWrites > A7_AI_MAX_WRITES_PER_RUN) {
        $maxWrites = A7_AI_MAX_WRITES_PER_RUN;
    }

    $updateLead = in_array(strtolower((string)a7_ai_request_value('updateLead', '1')), ['1', 'y', 'yes', 'true'], true);
    $overwriteLead = in_array(strtolower((string)a7_ai_request_value('overwriteLead', '0')), ['1', 'y', 'yes', 'true'], true);

    $expression = a7_ai_agent_expression();
    CAgent::RemoveAgent($expression, '');

    $nextExec = '';
    if (function_exists('ConvertTimeStamp')) {
        $nextExec = ConvertTimeStamp(time() + 60, 'FULL');
    }

    $agentId = CAgent::AddAgent($expression, '', 'N', $interval, '', 'Y', $nextExec, 100, false, false);
    if (!$agentId) {
        a7_ai_json(['success' => false, 'message' => 'Unable to add AI analyzer Bitrix agent'], 500);
    }

    $state = a7_ai_read_state();
    $state['agent_mode'] = 'auto';
    $state['agent_enabled'] = 'Y';
    $state['agent_interval'] = $interval;
    $state['agent_limit'] = $limit;
    $state['agent_max_writes'] = $maxWrites;
    $state['agent_update_lead'] = $updateLead ? 'Y' : 'N';
    $state['agent_overwrite_lead'] = $overwriteLead ? 'Y' : 'N';
    $state['agent_installed_at'] = date('c');
    $state['agent_last_error'] = '';
    a7_ai_write_state($state);

    a7_ai_json([
        'success' => true,
        'enabled' => true,
        'message' => 'AI auto analyzer agent installed',
        'manualOnly' => false,
        'agentId' => (int)$agentId,
        'intervalSeconds' => $interval,
        'limit' => $limit,
        'maxWrites' => $maxWrites,
        'updateLead' => $updateLead,
        'overwriteLead' => $overwriteLead,
        'agentRows' => a7_ai_agent_rows($expression),
    ]);
}

function a7_ai_handle_status(): void
{
    a7_ai_require_bitrix_admin();
    $state = a7_ai_read_state();
    a7_ai_json([
        'success' => true,
        'configured' => [
            'threecxBaseUrl' => strpos(A7_AI_3CX_BASE_URL, '__') !== 0,
            'threecxClientId' => strpos(A7_AI_3CX_CLIENT_ID, '__') !== 0,
            'threecxClientSecret' => strpos(A7_AI_3CX_CLIENT_SECRET, '__') !== 0,
            'bitrixWebhook' => strpos(A7_AI_BITRIX_WEBHOOK_URL, '__') !== 0,
            'openaiApiKey' => strpos(A7_AI_OPENAI_API_KEY, '__') !== 0,
            'analysisModel' => A7_AI_ANALYSIS_MODEL,
            'transcribeModel' => A7_AI_TRANSCRIBE_MODEL,
        ],
        'guard' => [
            'minRunSeconds' => A7_AI_MIN_RUN_SECONDS,
            'maxLimitPerRun' => A7_AI_MAX_LIMIT_PER_RUN,
            'maxWritesPerRun' => A7_AI_MAX_WRITES_PER_RUN,
            'maxWritesPerHour' => A7_AI_MAX_WRITES_PER_HOUR,
            'maxWritesPerDay' => A7_AI_MAX_WRITES_PER_DAY,
            'recordingReadyDelaySeconds' => A7_AI_RECORDING_READY_DELAY_SECONDS,
            'minAudioSeconds' => A7_AI_MIN_AUDIO_SECONDS,
            'maxAudioBytes' => A7_AI_MAX_AUDIO_BYTES,
            'manualOnly' => false,
        ],
        'ownerData' => [
            'enabled' => true,
            'entityTypeId' => A7_AI_OWNER_DATA_ENTITY_TYPE_ID,
            'categoryId' => A7_AI_OWNER_DATA_CATEGORY_ID,
            'matchingSource' => 'synced_recording_activity_binding',
            'automaticScore' => true,
            'leadFieldUpdatesApplied' => false,
        ],
        'state' => a7_ai_state_for_status($state),
        'agentRows' => a7_ai_agent_rows(a7_ai_agent_expression()),
    ]);
}

function a7_ai_handle_score(): void
{
    a7_ai_require_bitrix_user_for_recording();
    $recordingId = (int)a7_ai_request_value('id', 0);
    if ($recordingId <= 0) {
        a7_ai_json(['success' => false, 'message' => 'Recording id missing'], 400);
    }

    $score = a7_ai_stored_score($recordingId);
    if ($score === null) {
        $score = a7_ai_fetch_legacy_score($recordingId);
    }

    if ($score === null) {
        a7_ai_json([
            'success' => true,
            'found' => false,
            'recordingId' => $recordingId,
        ]);
    }

    a7_ai_json([
        'success' => true,
        'found' => true,
        'recordingId' => $recordingId,
        'score' => $score,
    ]);
}

function a7_ai_handle_recording_download(): void
{
    a7_ai_require_bitrix_user_for_recording();
    $recordingId = (int)a7_ai_request_value('id', 0);
    if ($recordingId <= 0) {
        a7_ai_json(['success' => false, 'message' => 'Recording id missing'], 400);
    }

    $path = '';
    try {
        $path = a7_ai_download_recording_file($recordingId);
        $raw = (string)file_get_contents($path);
        while (ob_get_level() > 0) {
            ob_end_clean();
        }
        if (!headers_sent()) {
            http_response_code(200);
            header('Content-Type: audio/x-wav');
            header('Content-Disposition: inline; filename="3cx-recording-' . $recordingId . '.wav"');
            header('Content-Length: ' . strlen($raw));
            header('Cache-Control: private, max-age=300');
        }
        echo $raw;
        exit;
    } catch (Throwable $e) {
        a7_ai_json(['success' => false, 'message' => $e->getMessage()], 500);
    } finally {
        if ($path !== '' && is_file($path)) {
            @unlink($path);
        }
    }
}

function a7_ai_route(): void
{
    $action = (string)a7_ai_request_value('action', 'status');
    if ($action === 'status') {
        a7_ai_handle_status();
    }
    if ($action === 'run' || $action === 'dryrun') {
        if ($action === 'dryrun') {
            $_GET['dryRun'] = '1';
        }
        a7_ai_handle_run();
    }
    if ($action === 'analyze') {
        a7_ai_handle_analyze();
    }
    if ($action === 'agent-install') {
        a7_ai_handle_agent_install();
    }
    if ($action === 'score') {
        a7_ai_handle_score();
    }
    if ($action === 'recording') {
        a7_ai_handle_recording_download();
    }
    a7_ai_json(['success' => false, 'message' => 'Unknown action'], 404);
}

if (a7_ai_is_direct_request()) {
    a7_ai_route();
}

?>
