<?php

declare(strict_types=1);

function tenancy_env(string $key, string $default = ''): string
{
	static $vars = null;
	if ($vars === null) {
		$vars = [];
		$paths = [
			dirname(__DIR__, 2) . '/.env',
			__DIR__ . '/../.env',
			($_SERVER['DOCUMENT_ROOT'] ?? '') . '/../tenancy.env',
		];
		foreach ($paths as $path) {
			if ($path === '/../tenancy.env' || !is_readable($path)) {
				continue;
			}
			foreach (file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) ?: [] as $line) {
				$line = trim($line);
				if ($line === '' || str_starts_with($line, '#')) {
					continue;
				}
				$pos = strpos($line, '=');
				if ($pos === false) {
					continue;
				}
				$k = trim(substr($line, 0, $pos));
				$v = trim(substr($line, $pos + 1), " \t\"'");
				$vars[$k] = $v;
			}
		}
	}

	return $vars[$key] ?? $default;
}

function tenancy_require_login(): void
{
	global $USER;
	if (!is_object($USER) || !$USER->IsAuthorized()) {
		http_response_code(401);
		header('Content-Type: application/json; charset=utf-8');
		echo json_encode(['ok' => false, 'error' => 'Please log in to Bitrix first.']);
		exit;
	}
}

function tenancy_json(array $data, int $code = 200): void
{
	http_response_code($code);
	header('Content-Type: application/json; charset=utf-8');
	echo json_encode($data, JSON_UNESCAPED_UNICODE);
	exit;
}

function tenancy_data_dir(): string
{
	$doc = (string)($_SERVER['DOCUMENT_ROOT'] ?? '');
	$outside = $doc !== '' ? dirname($doc) . '/tenancy-data' : '';
	$local = dirname(__DIR__) . '/data';
	$dir = ($outside !== '' && (is_dir($outside) || @mkdir($outside, 0700, true))) ? $outside : $local;
	if (!is_dir($dir)) {
		@mkdir($dir, 0700, true);
	}
	return $dir;
}

function tenancy_portal_url(string $path = '/'): string
{
	$base = rtrim(tenancy_env('BITRIX_BASE_URL', 'https://crm.a7grouprealestatedxb.com'), '/');
	if ($path === '' || $path[0] !== '/') {
		$path = '/' . $path;
	}
	return $base . $path;
}

function tenancy_phone_digits(string $phone): string
{
	$d = preg_replace('/\D+/', '', $phone) ?? '';
	if (str_starts_with($d, '00')) {
		$d = substr($d, 2);
	}
	if (strlen($d) === 10 && str_starts_with($d, '0')) {
		$d = '971' . substr($d, 1);
	} elseif (strlen($d) === 9 && str_starts_with($d, '5')) {
		$d = '971' . $d;
	}
	return $d;
}
