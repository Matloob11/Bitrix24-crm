<?php

declare(strict_types=1);

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

return [
	'js' => 'script.js',
	'rel' => [
		'main.core',
		'main.core.events',
		'ui.dialogs.messagebox',
		'ui.notification',
	],
	'skip_core' => false,
];
