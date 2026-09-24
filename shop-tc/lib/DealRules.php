<?php

declare(strict_types=1);

final class DealScoutRules
{
	public static function money(string $value): float
	{
		$n = (float)preg_replace('/[^\d.-]/', '', str_replace(',', '', $value));
		return is_finite($n) ? $n : 0.0;
	}

	public static function num(float $n): string
	{
		if (abs($n) < 0.00001) {
			return '0';
		}
		$s = number_format(round($n, 2), 2, '.', '');
		$s = rtrim(rtrim($s, '0'), '.');
		return $s === '' ? '0' : $s;
	}

	/**
	 * @param array<string, string> $fields
	 * @return array<string, string>
	 */
	public static function recompute(array $fields): array
	{
		$total = self::money($fields['totalCommission'] ?? '');
		$vatPct = trim((string)($fields['vatPercent'] ?? '')) === ''
			? 5.0
			: self::money((string)$fields['vatPercent']);
		$company = self::money($fields['companySharePct'] ?? '');
		$agent = self::money($fields['agentSharePct'] ?? '');
		$companyFilled = trim((string)($fields['companySharePct'] ?? '')) !== '';
		$agentFilled = trim((string)($fields['agentSharePct'] ?? '')) !== '';
		$count = max(1, (int)($fields['agentCount'] ?? 1));

		$splitSum = 0.0;
		for ($i = 1; $i <= $count; $i++) {
			$splitSum += self::money($fields['agent' . $i . 'Split'] ?? '');
		}

		if ($companyFilled && !$agentFilled) {
			$agent = max(0.0, 100.0 - $company);
		} elseif ($agentFilled && !$companyFilled) {
			$company = max(0.0, 100.0 - $agent);
		} elseif (!$companyFilled && !$agentFilled && $splitSum > 0) {
			$agent = $splitSum;
			$company = max(0.0, 100.0 - $agent);
		}

		if ($count === 1 && trim((string)($fields['agent1Split'] ?? '')) === '' && $agent > 0) {
			$fields['agent1Split'] = self::num($agent);
			$splitSum = $agent;
		}

		$vat = $total * ($vatPct / 100);
		$fields['vatPercent'] = self::num($vatPct);
		$fields['vatAmount'] = self::num($vat);
		$fields['grossCommission'] = self::num($total + $vat);
		$fields['companySharePct'] = self::num($company);
		$fields['agentSharePct'] = self::num($agent);
		$fields['companyShareAed'] = self::num($total * ($company / 100));
		$fields['agentShareAed'] = self::num($total * ($agent / 100));
		for ($i = 1; $i <= $count; $i++) {
			$split = self::money($fields['agent' . $i . 'Split'] ?? '');
			$fields['agent' . $i . 'Amount'] = $split > 0 ? self::num($total * ($split / 100)) : '';
		}

		$p = $f = $na = 0;
		$missing = [];
		for ($n = 1; $n <= 14; $n++) {
			$st = strtoupper(trim((string)($fields['check' . $n] ?? '')));
			if ($st === 'P') {
				$p++;
			} elseif ($st === 'F') {
				$f++;
			} elseif ($st === 'NA') {
				$na++;
			} else {
				$missing[] = $n;
			}
		}
		$fields['passedCount'] = (string)$p;
		$fields['failedCount'] = (string)$f;
		$fields['naCount'] = (string)$na;
		$fields['result'] = $missing === [] ? ($f > 0 ? 'fail' : 'pass') : '';
		return $fields;
	}

	/**
	 * @param array<string, string> $fields
	 * @return list<string>
	 */
	public static function validateAgent(array $fields): array
	{
		$errors = [];
		if (trim((string)($fields['dealId'] ?? '')) === '') {
			$errors[] = 'Deal ID is required.';
		}
		$clientType = (string)($fields['clientType'] ?? '');
		if ($clientType === '') {
			$errors[] = 'Pick Individual or Company.';
		} elseif ($clientType === 'individual' && trim((string)($fields['clientName'] ?? '')) === '') {
			$errors[] = 'Add the client name.';
		} elseif ($clientType === 'company' && trim((string)($fields['companyName'] ?? $fields['clientName'] ?? '')) === '') {
			$errors[] = 'Add the company name.';
		}
		return $errors;
	}

	/**
	 * @param array<string, string> $fields
	 * @return list<string>
	 */
	public static function validateSplit(array $fields): array
	{
		$errors = [];
		$total = self::money($fields['totalCommission'] ?? '');
		$company = self::money($fields['companySharePct'] ?? '');
		$agent = self::money($fields['agentSharePct'] ?? '');
		if ($total > 0 && abs($company + $agent - 100) > 0.05) {
			$errors[] = 'Company % and agent % must add to 100. Now '
				. self::num($company) . ' + ' . self::num($agent) . ' = ' . self::num($company + $agent) . '.';
		}
		$count = max(1, (int)($fields['agentCount'] ?? 1));
		$splitSum = 0.0;
		$named = 0;
		for ($i = 1; $i <= $count; $i++) {
			$name = trim((string)($fields['agent' . $i . 'Name'] ?? ''));
			$split = self::money($fields['agent' . $i . 'Split'] ?? '');
			if ($name !== '') {
				$named++;
			}
			if ($name !== '' && $split <= 0) {
				$errors[] = 'Add a split % for ' . $name . '.';
			}
			$splitSum += $split;
		}
		if ($agent > 0.05 && $named === 0) {
			$errors[] = 'Name the agent(s) who get the agent share.';
		}
		if ($named > 0 && abs($splitSum - $agent) > 0.05) {
			$errors[] = 'Agent split % must add to the agent share (' . self::num($agent)
				. '%). Now ' . self::num($splitSum) . '%.';
		}
		return $errors;
	}

	/**
	 * @param array<string, string> $fields
	 * @return list<string>
	 */
	public static function validate(array $fields): array
	{
		$errors = self::validateAgent($fields);
		$missing = [];
		for ($n = 1; $n <= 14; $n++) {
			if (!in_array((string)($fields['check' . $n] ?? ''), ['P', 'F', 'NA'], true)) {
				$missing[] = $n;
			}
		}
		if ($missing !== []) {
			$errors[] = 'Answer all 14 checks. Still open: #' . implode(', #', $missing) . '.';
		}
		$total = self::money($fields['totalCommission'] ?? '');
		if ($total <= 0) {
			$errors[] = 'Enter the total commission earned.';
		}
		$errors = array_merge($errors, self::validateSplit($fields));
		if (trim((string)($fields['reviewerName'] ?? '')) === '' || trim((string)($fields['reviewerSign'] ?? '')) === '') {
			$errors[] = 'Reviewer name and signature are required.';
		}
		if (trim((string)($fields['countersignName'] ?? '')) === '' || trim((string)($fields['countersignSign'] ?? '')) === '') {
			$errors[] = 'Malik must countersign — name and signature are required.';
		}
		if (($fields['result'] ?? '') === 'fail' && trim((string)($fields['failReason'] ?? '')) === '') {
			$errors[] = 'This file is on hold. Add the failed check # and reason.';
		}
		return $errors;
	}

	/**
	 * @param array<string, mixed> $fields
	 */
	public static function agentNames(array $fields): string
	{
		$names = [];
		$count = max(1, (int)($fields['agentCount'] ?? 1));
		for ($i = 1; $i <= $count; $i++) {
			$name = trim((string)($fields['agent' . $i . 'Name'] ?? ''));
			if ($name !== '') {
				$names[] = $name;
			}
		}
		return implode(', ', $names);
	}

	public static function whenLabel(int $ts): string
	{
		if ($ts <= 0) {
			return '';
		}
		try {
			$dt = new DateTime('@' . $ts);
			$dt->setTimezone(new DateTimeZone('Asia/Dubai'));
			return $dt->format('d M Y, H:i');
		} catch (Throwable $e) {
			return '';
		}
	}
}
