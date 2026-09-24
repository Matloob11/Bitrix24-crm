<?php

use Bitrix\StaffTrack\Internal\Integration\Bizproc\PlanningService;

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

if (
	!CBXFeatures::IsFeatureEnabled('timeman')
	|| !\Bitrix\Main\Loader::includeModule('timeman')
	|| !\Bitrix\Main\Loader::includeModule('stafftrack')
	|| !CTimeMan::CanUse()
)
{
	return [];
}

$showAiReportsFeature = class_exists(PlanningService::class)
	&& PlanningService::existsSystemDayAgent();

$isGeoFeaturesAvailable = \Bitrix\StaffTrack\Feature::isGeoFeaturesAvailableByRegion();

return [
	'js' => 'dist/checkin-onboarding-banner.bundle.js',
	'css' => 'dist/checkin-onboarding-banner.bundle.css',
	'rel' => [
		'main.core',
		'main.popup',
		'ui.icon-set.api.vue',
		'ui.vue3',
		'ui.vue3.components.button',
	],
	'skip_core' => false,
	'settings' => [
		'showAiReportsFeature' => $showAiReportsFeature,
		'isGeoFeaturesAvailable' => $isGeoFeaturesAvailable,
	],
];
