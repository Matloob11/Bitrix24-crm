<?php

declare(strict_types=1);

use Bitrix\Main\Loader;

final class TenancyWhatsapp
{
	/**
	 * @param array<string, mixed> $data
	 * @return array{ok:bool, waMe:string, bitrix?:bool, error?:string}
	 */
	public static function send(string $party, array $data): array
	{
		$party = $party === 'owner' ? 'owner' : 'tenant';
		$name = $party === 'owner'
			? trim((string)($data['landlordName'] ?? 'Owner'))
			: trim((string)($data['tenantName'] ?? 'Tenant'));
		$phone = $party === 'owner'
			? (string)($data['landlordPhone'] ?? '')
			: (string)($data['tenantPhone'] ?? '');
		$digits = tenancy_phone_digits($phone);
		if ($digits === '') {
			return ['ok' => false, 'waMe' => '', 'error' => 'Add a ' . $party . ' phone number first.'];
		}

		$unit = trim((string)($data['propertyNo'] ?? $data['building'] ?? 'the property'));
		$text = 'Hello ' . $name . ', A7 Group Real Estate (broker) has prepared the tenancy contract for '
			. $unit . '. Please review the PDF I am sending and sign. Thank you.';
		$waMe = 'https://wa.me/' . $digits . '?text=' . rawurlencode($text);

		$bitrix = self::tryBitrix($digits, $text, $party, $data);

		return [
			'ok' => true,
			'waMe' => $waMe,
			'bitrix' => $bitrix,
			'party' => $party,
			'digits' => $digits,
		];
	}

	/**
	 * @param array<string, mixed> $data
	 */
	private static function tryBitrix(string $digits, string $text, string $party, array $data): bool
	{
		$contactId = $party === 'owner' ? (int)($data['landlordId'] ?? 0) : (int)($data['tenantId'] ?? 0);
		if ($contactId <= 0 || !Loader::includeModule('crm')) {
			return false;
		}
		try {
			global $USER;
			$rid = (is_object($USER) && method_exists($USER, 'GetID')) ? (int)$USER->GetID() : 0;
			$fields = [
				'TYPE_ID' => 'WHATSAPP',
				'SUBJECT' => 'Tenancy contract WhatsApp',
				'DESCRIPTION' => $text,
				'DESCRIPTION_TYPE' => 1,
				'COMPLETED' => 'N',
				'RESPONSIBLE_ID' => $rid,
				'BINDINGS' => [[
					'OWNER_TYPE_ID' => \CCrmOwnerType::Contact,
					'OWNER_ID' => $contactId,
				]],
				'SETTINGS' => ['PHONE' => '+' . $digits],
			];
			$activity = new \CCrmActivity(false);
			$id = (int)$activity->Add($fields, false, false, ['REGISTER_SONET_EVENT' => false]);
			if ($id > 0) {
				return true;
			}
		} catch (\Throwable $e) {
			// fall through
		}

		if (Loader::includeModule('im') && class_exists(\CIMMessage::class) === false) {
			return false;
		}
		return false;
	}
}
