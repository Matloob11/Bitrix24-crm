<?php

return [
	'controllers' => [
		'value' => [
			'namespaces' => [
				'\\Bitrix\\StaffTrackMobile\\Infrastructure\\Controllers' => 'v2',
			],
			'defaultNamespace' => '\\Bitrix\\StaffTrackMobile\\Controller',
			'restIntegration' => [
				'enabled' => false,
			],
		],
		'readonly' => true,
	],
	'feature-flags' => [
		'value' => [
			\Bitrix\StaffTrackMobile\Public\Features\CheckInFeature::class,
		],
		'readonly' => true,
	],
];
