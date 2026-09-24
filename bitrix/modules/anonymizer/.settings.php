<?php

	return [
	'controllers' => [
		'value' => [
			'namespaces' => [
				'\\Bitrix\\Anonymizer\\Infrastructure\\Controllers' => 'api',
			],
			'defaultNamespace' => '\\Bitrix\\Anonymizer\\Infrastructure\\Controllers',
		],
		'readonly' => true,
	],
	'proxy' => [
		'value' => [
			'servers' => [
				'ru' => [
					'https://anonymizer-ruv-01.bitrix24.tech',
				],
				'en' => [
					'https://anonymizer-de-01.bitrix.info/',
				],
			],
		],
		'readonly' => true,
	],
];
