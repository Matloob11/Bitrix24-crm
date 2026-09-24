<?
require($_SERVER["DOCUMENT_ROOT"]."/bitrix/header.php");
$APPLICATION->SetTitle("A7 3CX Click To Call Handler");
?><?php
declare(strict_types=1);

/**
 * A7 Group Bitrix24 -> 3CX click-to-call bridge.
 *
 * This file is intended to be hosted on the Bitrix24 on-premise server and used
 * as the local app install/event handler for ONEXTERNALCALLSTART.
 */

const A7_3CX_BASE_URL = 'https://a7properties.3cx.ae:5001';
const A7_3CX_CLIENT_ID = 'clicktocallapp';
const A7_3CX_CLIENT_SECRET = 'fY2gkEdXkTz9gj1BiIGwH0HnZJqAdwT1';
const A7_3CX_EXTENSION = '100';
const A7_HANDLER_URL = 'https://crm.a7grouprealestatedxb.com/a7_3cx_click_to_call.php';
const A7_CONFIG_FILE = '/home/bitrix/www/upload/a7_3cx_click_to_call_config.json';
const A7_LOG_FILE = '/home/bitrix/www/upload/a7_3cx_click_to_call.log';

header('Content-Type: application/json; charset=utf-8');

function a7_log(string $message, array $context = []): void
{
    $safeContext = $context;
    foreach (['access_token', 'refresh_token', 'client_secret', 'application_token'] as $secretKey) {
        if (isset($safeContext[$secretKey])) {
            $safeContext[$secretKey] = '***';
        }
    }

    @file_put_contents(
        A7_LOG_FILE,
        json_encode([
            'time' => date('c'),
            'message' => $message,
            'context' => $safeContext,
        ], JSON_UNESCAPED_SLASHES) . PHP_EOL,
        FILE_APPEND
    );
}

function a7_json(array $payload, int $statusCode = 200): void
{
    http_response_code($statusCode);
    echo json_encode($payload, JSON_UNESCAPED_SLASHES);
    exit;
}

function a7_request_value(string $key, $default = null)
{
    return $_POST[$key] ?? $_GET[$key] ?? $default;
}

function a7_read_config(): array
{
    if (!is_readable(A7_CONFIG_FILE)) {
        return [];
    }

    $decoded = json_decode((string) file_get_contents(A7_CONFIG_FILE), true);
    return is_array($decoded) ? $decoded : [];
}

function a7_write_config(array $config): void
{
    @file_put_contents(
        A7_CONFIG_FILE,
        json_encode($config, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES)
    );
}

function a7_http_json(string $method, string $url, array $headers = [], $body = null): array
{
    $curl = curl_init($url);
    $headerLines = ['Accept: application/json'];
    foreach ($headers as $name => $value) {
        $headerLines[] = $name . ': ' . $value;
    }

    curl_setopt_array($curl, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_CUSTOMREQUEST => strtoupper($method),
        CURLOPT_HTTPHEADER => $headerLines,
        CURLOPT_TIMEOUT => 30,
        CURLOPT_CONNECTTIMEOUT => 10,
    ]);

    if ($body !== null) {
        $encodedBody = is_string($body) ? $body : json_encode($body, JSON_UNESCAPED_SLASHES);
        curl_setopt($curl, CURLOPT_POSTFIELDS, $encodedBody);
    }

    $raw = curl_exec($curl);
    $error = curl_error($curl);
    $status = (int) curl_getinfo($curl, CURLINFO_HTTP_CODE);
    curl_close($curl);

    $json = json_decode((string) $raw, true);
    return [
        'ok' => $error === '' && $status >= 200 && $status < 300,
        'status' => $status,
        'raw' => $raw,
        'json' => is_array($json) ? $json : null,
        'error' => $error,
    ];
}

function a7_bitrix_call(string $method, array $params, array $auth): array
{
    $accessToken = (string)($auth['access_token'] ?? '');
    $domain = (string)($auth['domain'] ?? ($_SERVER['HTTP_HOST'] ?? ''));
    $endpoint = (string)($auth['client_endpoint'] ?? '');

    if ($accessToken === '') {
        return ['ok' => false, 'status' => 0, 'json' => null, 'error' => 'Missing Bitrix access token'];
    }

    if ($endpoint === '') {
        $endpoint = 'https://' . $domain . '/rest/';
    }

    $url = rtrim($endpoint, '/') . '/' . $method . '.json';
    $params['auth'] = $accessToken;

    return a7_http_json(
        'POST',
        $url,
        ['Content-Type' => 'application/json'],
        $params
    );
}

function a7_3cx_token(): string
{
    $body = http_build_query([
        'grant_type' => 'client_credentials',
        'client_id' => A7_3CX_CLIENT_ID,
        'client_secret' => A7_3CX_CLIENT_SECRET,
    ]);

    $response = a7_http_json(
        'POST',
        rtrim(A7_3CX_BASE_URL, '/') . '/connect/token',
        ['Content-Type' => 'application/x-www-form-urlencoded'],
        $body
    );

    if (!$response['ok'] || empty($response['json']['access_token'])) {
        a7_log('3CX token failed', ['status' => $response['status'], 'error' => $response['error'], 'raw' => (string)$response['raw']]);
        throw new RuntimeException('Unable to authenticate with 3CX Call Control API');
    }

    return (string) $response['json']['access_token'];
}

function a7_3cx_make_call(string $destination, array $attachedData = []): array
{
    $token = a7_3cx_token();
    $base = rtrim(A7_3CX_BASE_URL, '/');
    $extension = rawurlencode(A7_3CX_EXTENSION);
    $headers = [
        'Authorization' => 'Bearer ' . $token,
        'Content-Type' => 'application/json',
    ];

    $devices = a7_http_json('GET', $base . '/callcontrol/' . $extension . '/devices', [
        'Authorization' => 'Bearer ' . $token,
    ]);

    $payload = [
        'destination' => $destination,
        'timeout' => 30,
        'timeoutSec' => 30,
        'attachedData1' => $attachedData,
        'attacheddata' => $attachedData,
    ];

    if ($devices['ok'] && is_array($devices['json']) && !empty($devices['json'][0]['device_id'])) {
        $deviceId = rawurlencode((string) $devices['json'][0]['device_id']);
        $deviceResponse = a7_http_json(
            'POST',
            $base . '/callcontrol/' . $extension . '/devices/' . $deviceId . '/makecall',
            $headers,
            $payload
        );

        if ($deviceResponse['ok']) {
            return $deviceResponse;
        }

        a7_log('3CX device makecall failed, falling back to DN makecall', [
            'status' => $deviceResponse['status'],
            'raw' => (string)$deviceResponse['raw'],
        ]);
    }

    return a7_http_json(
        'POST',
        $base . '/callcontrol/' . $extension . '/makecall',
        $headers,
        $payload
    );
}

function a7_auth_from_request(): array
{
    $auth = $_POST['auth'] ?? $_GET['auth'] ?? [];
    return is_array($auth) ? $auth : [];
}

function a7_handle_install(): void
{
    $auth = a7_auth_from_request();
    if (empty($auth['access_token'])) {
        a7_json(['success' => false, 'message' => 'Missing Bitrix install auth'], 400);
    }

    $config = a7_read_config();
    $config['installed_at'] = date('c');
    $config['domain'] = $auth['domain'] ?? ($_SERVER['HTTP_HOST'] ?? '');
    $config['application_token'] = $auth['application_token'] ?? ($config['application_token'] ?? '');
    a7_write_config($config);

    $bind = a7_bitrix_call('event.bind', [
        'EVENT' => 'ONEXTERNALCALLSTART',
        'HANDLER' => A7_HANDLER_URL . '?action=event',
    ], $auth);

    $line = a7_bitrix_call('telephony.externalLine.add', [
        'NUMBER' => 'A7-3CX-100',
        'NAME' => 'A7 3CX Click-to-Call',
        'CRM_AUTO_CREATE' => 'N',
    ], $auth);

    a7_log('install complete', [
        'bind_ok' => $bind['ok'],
        'bind_status' => $bind['status'],
        'line_ok' => $line['ok'],
        'line_status' => $line['status'],
        'line_result' => $line['json']['result'] ?? null,
    ]);

    a7_json([
        'success' => true,
        'message' => 'A7 3CX Click-to-Call app installed',
        'event_bind_ok' => $bind['ok'],
        'external_line_ok' => $line['ok'],
        'external_line' => $line['json']['result'] ?? null,
    ]);
}

function a7_handle_event(): void
{
    $event = (string)($_POST['event'] ?? $_GET['event'] ?? '');
    $data = $_POST['data'] ?? $_GET['data'] ?? [];
    $auth = a7_auth_from_request();
    $config = a7_read_config();

    if ($event !== 'ONEXTERNALCALLSTART') {
        a7_json(['success' => true, 'message' => 'Ignored event', 'event' => $event]);
    }

    if (!is_array($data)) {
        $data = [];
    }

    if (!empty($config['application_token']) && !empty($auth['application_token'])) {
        if (!hash_equals((string)$config['application_token'], (string)$auth['application_token'])) {
            a7_log('invalid application token');
            a7_json(['success' => false, 'message' => 'Invalid application token'], 403);
        }
    }

    $phone = (string)($data['PHONE_NUMBER_INTERNATIONAL'] ?? $data['PHONE_NUMBER'] ?? '');
    $callId = (string)($data['CALL_ID'] ?? '');
    $userId = (string)($data['USER_ID'] ?? '');

    if ($phone === '') {
        a7_json(['success' => false, 'message' => 'Missing phone number'], 400);
    }

    try {
        $makeCall = a7_3cx_make_call($phone, [
            'bitrix_call_id' => $callId,
            'bitrix_user_id' => $userId,
        ]);

        if (!$makeCall['ok']) {
            a7_log('3CX makecall failed', ['phone' => $phone, 'status' => $makeCall['status'], 'raw' => (string)$makeCall['raw']]);
            if ($callId !== '' && $userId !== '') {
                a7_bitrix_call('telephony.externalCall.finish', [
                    'CALL_ID' => $callId,
                    'USER_ID' => $userId,
                    'DURATION' => 0,
                    'STATUS_CODE' => '603',
                    'ADD_TO_CHAT' => 1,
                ], $auth);
            }
            a7_json(['success' => false, 'message' => '3CX makecall failed'], 502);
        }

        a7_log('3CX makecall started', [
            'phone' => $phone,
            'bitrix_call_id' => $callId,
            'bitrix_user_id' => $userId,
            'threecx_status' => $makeCall['status'],
        ]);

        // Keep the Bitrix call record from hanging. A later recording-sync pass can
        // attach the actual 3CX recording to this CALL_ID when available.
        $finish = null;
        if ($callId !== '' && $userId !== '') {
            $finish = a7_bitrix_call('telephony.externalCall.finish', [
                'CALL_ID' => $callId,
                'USER_ID' => $userId,
                'DURATION' => 0,
                'STATUS_CODE' => '200',
                'ADD_TO_CHAT' => 1,
            ], $auth);
        }

        a7_json([
            'success' => true,
            'message' => '3CX call started',
            'threecx_status' => $makeCall['status'],
            'bitrix_finish_ok' => is_array($finish) ? $finish['ok'] : null,
        ]);
    } catch (Throwable $e) {
        a7_log('event handler exception', ['error' => $e->getMessage()]);
        a7_json(['success' => false, 'message' => $e->getMessage()], 500);
    }
}

$action = (string) a7_request_value('action', '');

if ($action === 'install' || isset($_REQUEST['install'])) {
    a7_handle_install();
}

if ($action === 'event' || (string)($_REQUEST['event'] ?? '') === 'ONEXTERNALCALLSTART') {
    a7_handle_event();
}

a7_json([
    'success' => true,
    'message' => 'A7 3CX handler is online',
    'installed' => is_readable(A7_CONFIG_FILE),
]);
<?require($_SERVER["DOCUMENT_ROOT"]."/bitrix/footer.php");?>