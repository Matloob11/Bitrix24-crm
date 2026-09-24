<?php

declare(strict_types=1);

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

use Bitrix\Bizproc\Activity\ActivityDescription;
use Bitrix\Bizproc\Activity\Enum\ActivityColorIndex;
use Bitrix\Bizproc\Activity\Enum\ActivityGroup;
use Bitrix\Bizproc\Activity\Enum\ActivityType;

if (\CBPRuntime::ACTIVITY_API_VERSION < 3)
{
	return;
}

if (!class_exists('CBPCrmEntityCreateTrigger'))
{
	\CBPRuntime::getRuntime()->includeActivityFile('crmentitycreatetrigger');
}

$presets = class_exists('CBPCrmEntityCreateTrigger') ? CBPCrmEntityCreateTrigger::getPresets() : [];

$arActivityDescription = (new ActivityDescription(
	name: '',
	description: '',
	type: [ActivityType::TRIGGER->value],
))
	->setClass('CrmEntityCreateTrigger')
	->setCategory(['ID' => 'document'])
	->setPresets($presets)
	->set('ADDITIONAL_RESULT', ['Return'])
	->setGroups([ActivityGroup::STARTER->value])
	->setColorIndex(ActivityColorIndex::BLUE->value)
	->toArray()
;
