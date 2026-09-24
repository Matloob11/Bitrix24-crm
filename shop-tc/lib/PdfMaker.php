<?php

declare(strict_types=1);

final class DealScoutPdf
{
	private const PAGE_W = 841.92;
	private const PAGE_H = 595.32;

	/**
	 * @param array<string, mixed> $data
	 */
	public static function make(array $data): string
	{
		$g = static fn(string $k): string => trim((string)($data[$k] ?? ''));
		$p1 = self::jpeg(self::blank('deal-blank-p1.jpg'));
		$p2 = self::jpeg(self::blank('deal-blank-p2.jpg'));

		$ops1 = [
			self::at(108, 58, 8, $g('dealId')),
			self::at(346, 58, 8, $g('dealType')),
			self::at(584, 58, 8, $g('dateClosed')),
			self::at(108, 82, 7, $g('dealValue')),
			self::at(346, 82, 7, $g('fileRef')),
			self::at(584, 82, 7, $g('agentCount')),
			self::at(108, 94, 7, $g('reviewedBy')),
			self::at(346, 94, 7, $g('reviewDate')),
			self::at(584, 94, 7, $g('dealSource')),

			self::at(160, 125, 7, $g('clientName')),
			self::at(530, 125, 7, $g('propertyType')),
			self::mark(64.0, 136.5, $g('clientType') === 'individual'),
			self::mark(105.0, 136.5, $g('clientType') === 'company'),
			self::at(530, 138, 7, $g('community')),
			self::at(160, 150, 7, $g('eidNumber')),
			self::at(530, 150, 7, $g('building')),
			self::at(160, 162, 7, $g('eidExpiry')),
			self::at(530, 162, 7, $g('unitNo')),
			self::at(160, 174, 7, $g('nationality')),
			self::at(530, 174, 7, $g('plotNo')),
			self::at(160, 186, 7, $g('passportNumber')),
			self::at(530, 186, 7, $g('sizeSqft')),
			self::at(160, 199, 7, $g('passportExpiry')),
			self::at(530, 199, 7, $g('bedsBaths')),
			self::at(160, 211, 7, $g('passportIssuedBy')),
			self::at(530, 211, 7, $g('titleDeed')),
			self::at(160, 223, 7, $g('companyName')),
			self::at(530, 223, 7, $g('ejariNo')),
			self::at(160, 235, 7, $g('tradeLicence')),
			self::at(530, 235, 7, $g('dewaNo')),
			self::at(160, 248, 7, $g('signatoryName')),
			self::at(530, 248, 7, $g('ownerName')),
			self::at(160, 260, 7, $g('signatoryEid')),
			self::at(530, 260, 7, $g('ownerPhone')),
			self::at(160, 272, 7, $g('clientMobile')),
			self::at(530, 272, 7, $g('mgmtRef')),
			self::at(160, 288, 7, $g('clientEmail')),
			self::at(530, 288, 7, $g('ownerInstruction')),
			self::mark(88.5, 305.0, $g('idCopies') === 'yes'),
			self::mark(109.0, 305.0, $g('idCopies') === 'no'),
			self::at(530, 306, 7, $g('notes')),
			self::at(160, 318, 7, $g('idVerifiedBy')),

			self::at(160, 351, 7, $g('totalCommission')),
			self::at(530, 351, 7, $g('vatPercent')),
			self::at(160, 363, 7, $g('vatAmount')),
			self::at(530, 363, 7, $g('grossCommission')),
			self::at(160, 375, 7, $g('companySharePct')),
			self::at(530, 375, 7, $g('companyShareAed')),
			self::at(160, 387, 7, $g('agentSharePct')),
			self::at(530, 387, 7, $g('agentShareAed')),
		];

		$agentTops = [428.5, 441.0, 453.5, 466.0];
		for ($i = 1; $i <= 4; $i++) {
			$top = $agentTops[$i - 1];
			$ops1[] = self::at(44, $top, 6.5, $g('agent' . $i . 'Name'));
			$ops1[] = self::at(176, $top, 6.5, $g('agent' . $i . 'EmpId'));
			$ops1[] = self::at(252, $top, 6.5, $g('agent' . $i . 'Office'));
			$ops1[] = self::at(314, $top, 6.5, $g('agent' . $i . 'Role'));
			$ops1[] = self::at(392, $top, 6.5, $g('agent' . $i . 'Contact'));
			$ops1[] = self::at(484, $top, 6.5, $g('agent' . $i . 'Split'));
			$ops1[] = self::at(538, $top, 6.5, $g('agent' . $i . 'Amount'));
		}

		$extraAgents = self::extraAgents($data);
		if ($extraAgents !== []) {
			$ops1[] = self::at(44, 480, 6.5, 'Additional agents (' . $extraAgents[0]['n'] . '–' . $extraAgents[array_key_last($extraAgents)]['n'] . ') continue on the last page.');
		}

		$ops2 = [];
		for ($n = 1; $n <= 14; $n++) {
			$top = 67.5 + ($n - 1) * 13.6;
			$status = strtoupper($g('check' . $n));
			$ops2[] = self::mark(541.0, $top, $status === 'P');
			$ops2[] = self::mark(576.0, $top, $status === 'F');
			$ops2[] = self::mark(611.0, $top, $status === 'NA');
			$ops2[] = self::at(636, $top, 6.5, $g('check' . $n . 'Evidence'));
		}

		$result = strtolower($g('result'));
		$ops2[] = self::mark(51.2, 267.5, $result === 'pass');
		$ops2[] = self::mark(163.0, 267.5, $result === 'fail');
		$ops2[] = self::at(304, 268, 7, $g('passedCount'));
		$ops2[] = self::at(352, 268, 7, $g('failedCount'));
		$ops2[] = self::at(390, 268, 7, $g('naCount'));
		$ops2[] = self::at(520, 268, 7, $g('failReason'));
		$ops2[] = self::at(70, 294, 7, $g('reviewerName'));
		$ops2[] = self::at(238, 294, 7, $g('reviewerSign'));
		$ops2[] = self::at(400, 294, 7, $g('countersignName'));
		$ops2[] = self::at(556, 294, 7, $g('countersignSign'));

		$pages = [
			['content' => self::pageContent($ops1, 1), 'image' => $p1],
			['content' => self::pageContent($ops2, 2), 'image' => $p2],
		];
		if ($extraAgents !== []) {
			$pages[] = ['content' => self::extraAgentsPage($data, $extraAgents), 'image' => null];
		}

		return self::build($pages);
	}

	/**
	 * @param array<string, mixed> $data
	 * @return list<array{n:int,name:string,empid:string,office:string,role:string,contact:string,split:string,amount:string}>
	 */
	private static function extraAgents(array $data): array
	{
		$out = [];
		for ($i = 5; $i <= 20; $i++) {
			$row = [
				'n' => $i,
				'name' => trim((string)($data['agent' . $i . 'Name'] ?? '')),
				'empid' => trim((string)($data['agent' . $i . 'EmpId'] ?? '')),
				'office' => trim((string)($data['agent' . $i . 'Office'] ?? '')),
				'role' => trim((string)($data['agent' . $i . 'Role'] ?? '')),
				'contact' => trim((string)($data['agent' . $i . 'Contact'] ?? '')),
				'split' => trim((string)($data['agent' . $i . 'Split'] ?? '')),
				'amount' => trim((string)($data['agent' . $i . 'Amount'] ?? '')),
			];
			if ($row['name'] === '' && $row['empid'] === '' && $row['office'] === '' && $row['role'] === '' && $row['contact'] === '' && $row['split'] === '' && $row['amount'] === '') {
				continue;
			}
			$out[] = $row;
		}
		return $out;
	}

	/**
	 * @param array<string, mixed> $data
	 * @param list<array{n:int,name:string,empid:string,office:string,role:string,contact:string,split:string,amount:string}> $agents
	 */
	private static function extraAgentsPage(array $data, array $agents): string
	{
		$g = static fn(string $k): string => trim((string)($data[$k] ?? ''));
		$head = [
			self::at(210, 28, 10, 'A7 GROUP REAL ESTATE — DEAL SCOUTING & COMPLIANCE CHECK'),
			self::at(268, 44, 8, '(continued)  AGENT SPLIT DETAILS — additional agents'),
			self::at(28, 64, 7, 'Deal ID: ' . $g('dealId')),
			self::at(220, 64, 7, 'Client: ' . $g('clientName')),
			self::at(480, 64, 7, 'File / property ref: ' . $g('fileRef')),
		];
		$whiteHeads = [
			self::at(28, 90, 7, '#'),
			self::at(44, 90, 7, 'Agent Name'),
			self::at(176, 90, 7, 'Employee ID'),
			self::at(252, 90, 7, 'Office'),
			self::at(314, 90, 7, 'Role'),
			self::at(392, 90, 7, 'Contact No.'),
			self::at(484, 90, 7, 'Split %'),
			self::at(538, 90, 7, 'Amount (AED)'),
		];
		$rows = [];
		$lines = "q\n1 1 1 rg\n0 0 " . self::PAGE_W . ' ' . self::PAGE_H . " re f\n";
		$lines .= "0.12 0.31 0.47 rg\n24 " . sprintf('%.2f', self::PAGE_H - 98) . " 560 16 re f\n";
		$lines .= "0.12 0.31 0.47 RG\n0.6 w\n";
		$top = 108.0;
		foreach ($agents as $row) {
			$rows[] = self::at(28, $top, 7, (string)$row['n']);
			$rows[] = self::at(44, $top, 7, $row['name']);
			$rows[] = self::at(176, $top, 7, $row['empid']);
			$rows[] = self::at(252, $top, 7, $row['office']);
			$rows[] = self::at(314, $top, 7, $row['role']);
			$rows[] = self::at(392, $top, 7, $row['contact']);
			$rows[] = self::at(484, $top, 7, $row['split']);
			$rows[] = self::at(538, $top, 7, $row['amount']);
			$y = self::PAGE_H - $top - 4;
			$lines .= sprintf("24 %.2f m 584 %.2f l S\n", $y, $y);
			$top += 16;
		}
		$lines .= "Q\n";
		return $lines
			. "BT\n0 0 0 rg\n" . implode('', $head)
			. "1 1 1 rg\n" . implode('', $whiteHeads)
			. "0 0 0 rg\n" . implode('', $rows)
			. "ET\n";
	}

	private static function blank(string $name): string
	{
		$path = dirname(__DIR__) . '/assets/' . $name;
		if (!is_readable($path)) {
			throw new \RuntimeException('Deal Scouting template is missing: ' . $name);
		}
		return $path;
	}

	private static function at(float $x, float $top, float $size, string $value): string
	{
		return self::text($x, self::PAGE_H - $top - ($size * 0.82), $size, $value);
	}

	private static function mark(float $x, float $top, bool $on): string
	{
		return $on ? self::at($x, $top, 8, 'X') : '';
	}

	/**
	 * @param list<string> $ops
	 */
	private static function pageContent(array $ops, int $imageNo): string
	{
		$out = "q\n" . self::PAGE_W . " 0 0 " . self::PAGE_H . " 0 0 cm\n/Im{$imageNo} Do\nQ\n";
		$out .= "BT\n" . implode('', $ops) . "ET\n";
		return $out;
	}

	private static function text(float $x, float $y, float $size, string $value): string
	{
		$value = trim($value);
		if ($value === '') {
			return '';
		}
		if (strlen($value) > 70) {
			$value = substr($value, 0, 67) . '...';
		}
		return sprintf("/F1 %.1f Tf\n1 0 0 1 %.2f %.2f Tm\n(%s) Tj\n", $size, $x, $y, self::esc($value));
	}

	/**
	 * @param list<array{content:string,image:array{w:int,h:int,data:string}|null}> $pages
	 */
	private static function build(array $pages): string
	{
		$n = count($pages);
		$fontId = 3 + $n;
		$next = $fontId + 1;
		$imageIds = [];
		$contentIds = [];
		foreach ($pages as $i => $page) {
			if ($page['image'] !== null) {
				$imageIds[$i] = $next;
				$next++;
			}
		}
		foreach ($pages as $i => $_) {
			$contentIds[$i] = $next;
			$next++;
		}

		$objects = [];
		$objects[1] = '<< /Type /Catalog /Pages 2 0 R >>';
		$kids = [];
		foreach ($pages as $i => $page) {
			$pageId = 3 + $i;
			$kids[] = $pageId . ' 0 R';
			$xobj = isset($imageIds[$i]) ? ' /XObject << /Im' . ($i + 1) . ' ' . $imageIds[$i] . ' 0 R >>' : '';
			$objects[$pageId] = '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ' . self::PAGE_W . ' ' . self::PAGE_H . '] /Resources << /Font << /F1 ' . $fontId . ' 0 R >>' . $xobj . ' >> /Contents ' . $contentIds[$i] . ' 0 R >>';
		}
		$objects[2] = '<< /Type /Pages /Kids [' . implode(' ', $kids) . '] /Count ' . $n . ' >>';
		$objects[$fontId] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>';
		foreach ($imageIds as $i => $id) {
			$objects[$id] = self::imageObj($pages[$i]['image']);
		}
		foreach ($contentIds as $i => $id) {
			$c = $pages[$i]['content'];
			$objects[$id] = '<< /Length ' . strlen($c) . " >>\nstream\n" . $c . "endstream";
		}

		$max = $next - 1;
		$pdf = "%PDF-1.4\n";
		$offsets = [0];
		for ($id = 1; $id <= $max; $id++) {
			$offsets[$id] = strlen($pdf);
			$pdf .= $id . " 0 obj\n" . $objects[$id] . "\nendobj\n";
		}
		$xref = strlen($pdf);
		$pdf .= "xref\n0 " . ($max + 1) . "\n0000000000 65535 f \n";
		for ($id = 1; $id <= $max; $id++) {
			$pdf .= sprintf("%010d 00000 n \n", $offsets[$id]);
		}
		$pdf .= 'trailer << /Size ' . ($max + 1) . " /Root 1 0 R >>\nstartxref\n" . $xref . "\n%%EOF";
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
		$info = getimagesize($path);
		$data = file_get_contents($path);
		if (!is_array($info) || $data === false) {
			throw new \RuntimeException('Could not read Deal Scouting template image.');
		}
		return ['w' => (int)$info[0], 'h' => (int)$info[1], 'data' => $data];
	}

	private static function esc(string $text): string
	{
		$converted = iconv('UTF-8', 'Windows-1252//TRANSLIT//IGNORE', $text);
		$text = $converted !== false ? $converted : $text;
		return str_replace(['\\', '(', ')'], ['\\\\', '\\(', '\\)'], $text);
	}
}
