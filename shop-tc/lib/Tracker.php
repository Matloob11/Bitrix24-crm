<?php

declare(strict_types=1);

final class ShopTcTracker
{
	public const STAGE_SHOP = 'deal';

	/**
	 * @return list<array{id:string,label:string}>
	 */
	public static function columns(): array
	{
		return [
			['id' => self::STAGE_SHOP, 'label' => 'Deal scouting'],
		];
	}

	/**
	 * @return list<array<string, mixed>>
	 */
	public static function all(): array
	{
		$rows = self::read();
		usort($rows, static fn($a, $b) => (int)($b['updatedAt'] ?? $b['createdAt'] ?? 0) <=> (int)($a['updatedAt'] ?? $a['createdAt'] ?? 0));
		return $rows;
	}

	/**
	 * @param array<string, mixed> $row
	 */
	public static function add(array $row): string
	{
		$id = 'ds-' . time() . '-' . bin2hex(random_bytes(3));
		$now = time();
		$row['id'] = $id;
		$row['stage'] = self::STAGE_SHOP;
		$row['createdAt'] = $now;
		$row['updatedAt'] = $now;
		$rows = self::read();
		$rows[] = $row;
		self::write($rows);
		return $id;
	}

	/**
	 * @param array<string, mixed> $patch
	 * @return array<string, mixed>|null
	 */
	public static function update(string $id, array $patch): ?array
	{
		unset($patch['id'], $patch['createdAt']);
		$patch['updatedAt'] = time();
		$patch['stage'] = self::STAGE_SHOP;
		$rows = self::read();
		foreach ($rows as $i => $row) {
			if ((string)($row['id'] ?? '') !== $id) {
				continue;
			}
			$rows[$i] = array_merge($row, $patch);
			$rows[$i]['id'] = $id;
			if (isset($row['createdAt'])) {
				$rows[$i]['createdAt'] = $row['createdAt'];
			}
			self::write($rows);
			return $rows[$i];
		}
		return null;
	}

	public static function get(string $id): ?array
	{
		foreach (self::read() as $row) {
			if ((string)($row['id'] ?? '') === $id) {
				return $row;
			}
		}
		return null;
	}

	/**
	 * @return list<array<string, mixed>>
	 */
	private static function read(): array
	{
		$path = self::path();
		if (!is_readable($path)) {
			return [];
		}
		$data = json_decode((string)file_get_contents($path), true);
		return is_array($data) ? $data : [];
	}

	/**
	 * @param list<array<string, mixed>> $rows
	 */
	private static function write(array $rows): void
	{
		$dir = dirname(self::path());
		if (!is_dir($dir)) {
			@mkdir($dir, 0700, true);
		}
		file_put_contents(self::path(), json_encode($rows, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT), LOCK_EX);
	}

	private static function path(): string
	{
		$doc = (string)($_SERVER['DOCUMENT_ROOT'] ?? '');
		$outside = $doc !== '' ? dirname($doc) . '/tenancy-data' : '';
		if ($outside !== '' && (is_dir($outside) || @mkdir($outside, 0700, true))) {
			return $outside . '/deal-scouting.json';
		}
		return dirname(__DIR__) . '/data/deal-scouting.json';
	}
}
