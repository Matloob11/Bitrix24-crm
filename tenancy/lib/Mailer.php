<?php

declare(strict_types=1);

final class TenancyMail
{
	/**
	 * @return array{ok:bool, error?:string}
	 */
	public static function send(string $to, string $subject, string $body, ?string $pdfBinary = null, string $pdfName = 'tenancy-contract.pdf'): array
	{
		$to = trim($to);
		if ($to === '' || !filter_var($to, FILTER_VALIDATE_EMAIL)) {
			return ['ok' => false, 'error' => 'Invalid email'];
		}

		$user = tenancy_env('TENANCY_SMTP_EMAIL');
		$pass = preg_replace('/\s+/', '', tenancy_env('TENANCY_SMTP_APP_PASSWORD')) ?? '';
		if ($user === '' || $pass === '') {
			return ['ok' => false, 'error' => 'Tenancy SMTP is not configured.'];
		}

		$host = tenancy_env('TENANCY_SMTP_HOST', 'smtp.gmail.com');
		$port = (int)tenancy_env('TENANCY_SMTP_PORT', '587');
		$fromName = tenancy_env('TENANCY_SMTP_FROM_NAME', 'A7 Group Real Estate');

		$errno = 0;
		$errstr = '';
		$fp = @stream_socket_client(
			'tcp://' . $host . ':' . $port,
			$errno,
			$errstr,
			20,
			STREAM_CLIENT_CONNECT
		);
		if (!is_resource($fp)) {
			return ['ok' => false, 'error' => 'SMTP connect failed: ' . $errstr];
		}
		stream_set_timeout($fp, 20);

		$expect = static function ($fp, string $code) use (&$last): bool {
			$last = '';
			while (($line = fgets($fp, 512)) !== false) {
				$last .= $line;
				if (isset($line[3]) && $line[3] === ' ') {
					break;
				}
			}
			return str_starts_with($last, $code);
		};
		$cmd = static function ($fp, string $line) {
			fwrite($fp, $line . "\r\n");
		};

		$last = '';
		if (!$expect($fp, '220')) {
			fclose($fp);
			return ['ok' => false, 'error' => 'SMTP banner failed'];
		}
		$cmd($fp, 'EHLO crm.a7grouprealestatedxb.com');
		if (!$expect($fp, '250')) {
			fclose($fp);
			return ['ok' => false, 'error' => 'EHLO failed'];
		}
		$cmd($fp, 'STARTTLS');
		if (!$expect($fp, '220')) {
			fclose($fp);
			return ['ok' => false, 'error' => 'STARTTLS not accepted'];
		}
		if (!stream_socket_enable_crypto($fp, true, STREAM_CRYPTO_METHOD_TLS_CLIENT)) {
			fclose($fp);
			return ['ok' => false, 'error' => 'TLS handshake failed'];
		}
		$cmd($fp, 'EHLO crm.a7grouprealestatedxb.com');
		if (!$expect($fp, '250')) {
			fclose($fp);
			return ['ok' => false, 'error' => 'EHLO after TLS failed'];
		}
		$cmd($fp, 'AUTH LOGIN');
		if (!$expect($fp, '334')) {
			fclose($fp);
			return ['ok' => false, 'error' => 'AUTH not accepted'];
		}
		$cmd($fp, base64_encode($user));
		if (!$expect($fp, '334')) {
			fclose($fp);
			return ['ok' => false, 'error' => 'SMTP username rejected'];
		}
		$cmd($fp, base64_encode($pass));
		if (!$expect($fp, '235')) {
			fclose($fp);
			return ['ok' => false, 'error' => 'SMTP login failed'];
		}
		$cmd($fp, 'MAIL FROM:<' . $user . '>');
		if (!$expect($fp, '250')) {
			fclose($fp);
			return ['ok' => false, 'error' => 'MAIL FROM rejected'];
		}
		$cmd($fp, 'RCPT TO:<' . $to . '>');
		if (!$expect($fp, '250')) {
			fclose($fp);
			return ['ok' => false, 'error' => 'Recipient rejected'];
		}
		$cmd($fp, 'DATA');
		if (!$expect($fp, '354')) {
			fclose($fp);
			return ['ok' => false, 'error' => 'DATA not accepted'];
		}

		$headers = [
			'From: ' . $fromName . ' <' . $user . '>',
			'To: <' . $to . '>',
			'Subject: ' . self::encodeHeader($subject),
			'MIME-Version: 1.0',
		];
		if ($pdfBinary !== null && $pdfBinary !== '') {
			$boundary = 'bnd' . bin2hex(random_bytes(8));
			$safeName = preg_replace('/[^\w.\-]+/', '_', $pdfName) ?: 'contract.pdf';
			$headers[] = 'Content-Type: multipart/mixed; boundary="' . $boundary . '"';
			$b64 = chunk_split(base64_encode($pdfBinary), 76, "\r\n");
			$data = implode("\r\n", $headers) . "\r\n\r\n"
				. '--' . $boundary . "\r\n"
				. "Content-Type: text/plain; charset=UTF-8\r\n"
				. "Content-Transfer-Encoding: 8bit\r\n\r\n"
				. $body . "\r\n"
				. '--' . $boundary . "\r\n"
				. "Content-Type: application/pdf; name=\"" . $safeName . "\"\r\n"
				. "Content-Disposition: attachment; filename=\"" . $safeName . "\"\r\n"
				. "Content-Transfer-Encoding: base64\r\n\r\n"
				. $b64
				. '--' . $boundary . "--\r\n.";
		} else {
			$headers[] = 'Content-Type: text/plain; charset=UTF-8';
			$headers[] = 'Content-Transfer-Encoding: 8bit';
			$data = implode("\r\n", $headers) . "\r\n\r\n" . $body . "\r\n.";
		}
		$cmd($fp, $data);
		if (!$expect($fp, '250')) {
			fclose($fp);
			return ['ok' => false, 'error' => 'Message not accepted'];
		}
		$cmd($fp, 'QUIT');
		fclose($fp);
		return ['ok' => true];
	}

	public static function contractPdf(string $to, string $name, string $role, array $row, string $pdfBinary, string $pdfName): array
	{
		$unit = trim((string)($row['title'] ?? 'the property'));
		$who = $name !== '' ? $name : $role;
		$subject = 'Tenancy contract — please sign';
		$body = "Hello {$who},\n\n"
			. "A7 Group Real Estate (broker) has prepared a tenancy contract ({$unit}).\n"
			. "The filled PDF is attached. Please review and sign.\n\n"
			. "A7 Group Real Estate\nDubai\n";
		return self::send($to, $subject, $body, $pdfBinary, $pdfName);
	}

	private static function encodeHeader(string $text): string
	{
		if (preg_match('/[^\x20-\x7E]/', $text)) {
			return '=?UTF-8?B?' . base64_encode($text) . '?=';
		}
		return $text;
	}
}
