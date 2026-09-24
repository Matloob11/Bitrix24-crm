<?php

declare(strict_types=1);

final class TenancyPdf
{
	private const PAGE_W = 595.0;
	private const PAGE_H = 842.04;

	/**
	 * @param array<string, string> $data
	 */
	public static function make(array $data): string
	{
		$g = static fn(string $k): string => trim((string)($data[$k] ?? ''));
		$dir = dirname(__DIR__) . '/assets';
		$p1 = self::jpeg($dir . '/ejari-blank-p1.jpg');
		$p2 = self::jpeg($dir . '/ejari-blank-p2.jpg');

		$usage = strtolower($g('usage'));
		if (str_contains($usage, 'resid')) {
			$ux = 430.1;
			$uy = 743.7;
		} elseif (str_contains($usage, 'indus')) {
			$ux = 203.2;
			$uy = 744.6;
		} else {
			$ux = 314.8;
			$uy = 751.2;
		}

		$owner = $g('landlordName');
		$rent = self::moneyLine($g('annualRent'));
		$value = self::moneyLine($g('contractValue') !== '' ? $g('contractValue') : $g('annualRent'));
		$depositRaw = $g('deposit');
		$deposit = $depositRaw !== '' ? self::moneyShort($depositRaw) : '';
		$pay = strtoupper($g('paymentMode') !== '' ? $g('paymentMode') : '04 cheques');
		$type = strtoupper($g('propertyType') !== '' ? $g('propertyType') : 'SHOP');
		$loc = strtoupper($g('location'));

		$c1 = self::pageContent([
			self::text(54, 793, 10, self::longDate($g('contractDate') ?: $g('dateFrom'))),
			self::text(74, 728, 10, $owner),
			self::text(78, 706, 10, $owner),
			self::text(73, 684, 10, $g('tenantName')),
			self::text(88, 661, 8, $g('tenantEmail')),
			self::text(370, 661, 8, $g('landlordEmail')),
			self::text(88, 640, 8, $g('tenantPhone')),
			self::text(380, 640, 8, $g('landlordPhone')),
			self::text(112, 623, 10, $g('building')),
			self::text(376, 621, 10, $loc),
			self::text(98, 606, 10, $g('size')),
			self::text(317, 600, 10, $type),
			self::text(490, 602, 10, $g('propertyNo')),
			self::text(145, 579, 10, $g('dewaNo')),
			self::text(411, 579, 10, $g('plotNo')),
			self::text(121, 560, 10, self::longDate($g('dateFrom'))),
			self::text(370, 559, 10, self::longDate($g('dateTo'))),
			self::text(78, 538, 10, $rent),
			self::text(78, 516, 10, $value),
			self::text(121, 496, 8, $deposit),
			self::text(413, 495, 10, $pay),
		], 1, self::disc($ux, $uy, 2.8));

		$termOps = [];
		foreach (self::termLines() as $row) {
			$termOps[] = self::text($row[0], $row[1], 6, $row[2]);
		}
		$c2 = self::pageContent($termOps, 2, '');

		return self::assemble($p1, $p2, $c1, $c2);
	}

	/**
	 * @param list<string> $ops
	 */
	private static function pageContent(array $ops, int $imageNo, string $graphics = ''): string
	{
		$out = "q\n" . self::PAGE_W . " 0 0 " . self::PAGE_H . " 0 0 cm\n/Im{$imageNo} Do\nQ\n";
		$out .= $graphics;
		$out .= "BT\n";
		$out .= implode('', $ops);
		$out .= "ET\n";
		return $out;
	}

	private static function disc(float $cx, float $cy, float $r): string
	{
		$k = $r * 0.5522847498;
		return sprintf(
			"q 0 0 0 rg %.2f %.2f m %.2f %.2f %.2f %.2f %.2f %.2f c %.2f %.2f %.2f %.2f %.2f %.2f c %.2f %.2f %.2f %.2f %.2f %.2f c %.2f %.2f %.2f %.2f %.2f %.2f c f Q\n",
			$cx, $cy + $r,
			$cx + $k, $cy + $r, $cx + $r, $cy + $k, $cx + $r, $cy,
			$cx + $r, $cy - $k, $cx + $k, $cy - $r, $cx, $cy - $r,
			$cx - $k, $cy - $r, $cx - $r, $cy - $k, $cx - $r, $cy,
			$cx - $r, $cy + $k, $cx - $k, $cy + $r, $cx, $cy + $r
		);
	}

	private static function text(float $x, float $y, float $size, string $value): string
	{
		$value = trim($value);
		if ($value === '') {
			return '';
		}
		return sprintf("/F1 %.1f Tf\n1 0 0 1 %.2f %.2f Tm\n(%s) Tj\n", $size, $x, $y, self::esc($value));
	}

	/**
	 * @return list<array{0:float,1:float,2:string}>
	 */
	private static function termLines(): array
	{
		$items = [
			[410.0, 'The shop will be used as per developer community rules, in case of any violation the tenant will be liable to pay the fine. Real Estate is not responsible for any kind of maintenance.'],
			[392.0, 'All kinds of maintenance is the responsibility of the Tenant.'],
			[374.0, 'The landlord can deduct the payment of utility bills from the Security deposit which have not been paid by the Tenant and remaining outstanding at the time of vacating the property/premises.'],
			[356.0, 'If any cheque bounce then the Tenant will pay AED 1000/- fine as penalty to the landlord.'],
			[338.0, 'If there is any damage charges/repair work expenses more than the security deposit amount, then tenant undertakes to pay the Landlord such difference amount in cash.'],
			[314.0, 'If there are any such deductions, the landlord will provide bills to the tenant for the same.'],
			[296.0, 'Security deposit will be refunded at the time of vacating the property/premise and presentation of final bills payment clearance letter from DEWA. Landlord has the right to deduct any damage expenses/cost spent on repair works done to the subject property/premise due to the negligence of the tenant during the tenancy period.'],
			[267.0, 'If the tenant wants to cancel his contract before expiry of contract then he will give 60 days prior notice to Real Estate and he will pay the penalty of 2 months rent to the Landlord.'],
		];
		$rows = [];
		foreach ($items as [$y, $text]) {
			foreach (self::wrap($text, 108) as $line) {
				$rows[] = [38.0, $y, $line];
				$y -= 6.0;
			}
		}
		return $rows;
	}

	/**
	 * @param array{w:int,h:int,data:string} $p1
	 * @param array{w:int,h:int,data:string} $p2
	 */
	private static function assemble(array $p1, array $p2, string $c1, string $c2): string
	{
		$objects = [];
		$objects[1] = '<< /Type /Catalog /Pages 2 0 R >>';
		$objects[2] = '<< /Type /Pages /Kids [3 0 R 4 0 R] /Count 2 >>';
		$objects[3] = '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ' . self::PAGE_W . ' ' . self::PAGE_H . '] /Resources << /Font << /F1 5 0 R >> /XObject << /Im1 6 0 R >> >> /Contents 8 0 R >>';
		$objects[4] = '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ' . self::PAGE_W . ' ' . self::PAGE_H . '] /Resources << /Font << /F1 5 0 R >> /XObject << /Im2 7 0 R >> >> /Contents 9 0 R >>';
		$objects[5] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>';
		$objects[6] = self::imageObj($p1);
		$objects[7] = self::imageObj($p2);
		$objects[8] = '<< /Length ' . strlen($c1) . " >>\nstream\n" . $c1 . "endstream";
		$objects[9] = '<< /Length ' . strlen($c2) . " >>\nstream\n" . $c2 . "endstream";

		$pdf = "%PDF-1.4\n";
		$offsets = [0];
		for ($id = 1; $id <= 9; $id++) {
			$offsets[$id] = strlen($pdf);
			$pdf .= $id . " 0 obj\n" . $objects[$id] . "\nendobj\n";
		}
		$xref = strlen($pdf);
		$pdf .= "xref\n0 10\n0000000000 65535 f \n";
		for ($id = 1; $id <= 9; $id++) {
			$pdf .= sprintf("%010d 00000 n \n", $offsets[$id]);
		}
		$pdf .= "trailer << /Size 10 /Root 1 0 R >>\nstartxref\n" . $xref . "\n%%EOF";
		return $pdf;
	}

	/**
	 * @param array{w:int,h:int,data:string} $img
	 */
	private static function imageObj(array $img): string
	{
		return sprintf(
			"<< /Type /XObject /Subtype /Image /Width %d /Height %d /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length %d >>\nstream\n%s\nendstream",
			$img['w'],
			$img['h'],
			strlen($img['data']),
			$img['data']
		);
	}

	/**
	 * @return array{w:int,h:int,data:string}
	 */
	private static function jpeg(string $path): array
	{
		if (!is_readable($path)) {
			throw new \RuntimeException('Ejari template image is missing: ' . basename($path));
		}
		$info = getimagesize($path);
		$data = file_get_contents($path);
		if (!is_array($info) || $data === false) {
			throw new \RuntimeException('Could not read Ejari template image.');
		}
		return ['w' => (int)$info[0], 'h' => (int)$info[1], 'data' => $data];
	}

	private static function longDate(string $ymd): string
	{
		$ymd = trim($ymd);
		if ($ymd === '') {
			return '';
		}
		$d = \DateTime::createFromFormat('Y-m-d', $ymd);
		return $d instanceof \DateTime ? $d->format('d F Y') : $ymd;
	}

	private static function moneyLine(string $raw): string
	{
		$n = (int)round((float)preg_replace('/[^\d.]/', '', $raw));
		if ($n <= 0) {
			return '';
		}
		return 'AED ' . number_format($n) . '/- ' . self::words($n) . ' ONLY';
	}

	private static function moneyShort(string $raw): string
	{
		$n = (int)round((float)preg_replace('/[^\d.]/', '', $raw));
		if ($n <= 0) {
			return '';
		}
		return 'AED ' . number_format($n) . '/-';
	}

	private static function words(int $n): string
	{
		if ($n === 0) {
			return 'ZERO';
		}
		$ones = ['', 'ONE', 'TWO', 'THREE', 'FOUR', 'FIVE', 'SIX', 'SEVEN', 'EIGHT', 'NINE', 'TEN', 'ELEVEN', 'TWELVE', 'THIRTEEN', 'FOURTEEN', 'FIFTEEN', 'SIXTEEN', 'SEVENTEEN', 'EIGHTEEN', 'NINETEEN'];
		$tens = ['', '', 'TWENTY', 'THIRTY', 'FORTY', 'FIFTY', 'SIXTY', 'SEVENTY', 'EIGHTY', 'NINETY'];
		$to99 = static function (int $x) use ($ones, $tens): string {
			if ($x < 20) {
				return $ones[$x];
			}
			$t = intdiv($x, 10);
			$o = $x % 10;
			return trim($tens[$t] . ($o ? ' ' . $ones[$o] : ''));
		};
		$out = [];
		$m = intdiv($n, 1_000_000);
		$n %= 1_000_000;
		$th = intdiv($n, 1000);
		$n %= 1000;
		$h = intdiv($n, 100);
		$r = $n % 100;
		if ($m) {
			$out[] = $to99($m) . ' MILLION';
		}
		if ($th) {
			$out[] = $to99($th) . ' THOUSAND';
		}
		if ($h) {
			$out[] = $ones[$h] . ' HUNDRED';
		}
		if ($r) {
			$out[] = $to99($r);
		}
		return implode(' ', $out);
	}

	private static function esc(string $text): string
	{
		$converted = iconv('UTF-8', 'Windows-1252//TRANSLIT//IGNORE', $text);
		$text = $converted !== false ? $converted : $text;
		return str_replace(['\\', '(', ')'], ['\\\\', '\\(', '\\)'], $text);
	}

	/**
	 * @return list<string>
	 */
	private static function wrap(string $text, int $width): array
	{
		$words = preg_split('/\s+/', $text) ?: [];
		$lines = [];
		$cur = '';
		foreach ($words as $w) {
			$try = $cur === '' ? $w : $cur . ' ' . $w;
			if (strlen($try) > $width && $cur !== '') {
				$lines[] = $cur;
				$cur = $w;
			} else {
				$cur = $try;
			}
		}
		if ($cur !== '') {
			$lines[] = $cur;
		}
		return $lines ?: [''];
	}
}
