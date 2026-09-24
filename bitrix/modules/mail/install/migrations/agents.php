<?php

$agent = \Bitrix\Main\UpdateSystem\Migration::getInstance()->agent();

$agent
	->add('CMailbox::CleanUp();', 60 * 60 * 24, false)
	->add('Bitrix\Mail\Access\Install\AccessInstaller::install();', 60, false, 600)
;

// Installing over data left by a previous installation can find the one-shot CRM filter repair still
// running: it reschedules itself under a name carrying its cursor, which the exact-name check inside
// AddAgent() would miss. Match by name mask to cover both forms.
if (!\CAgent::GetList([], ['NAME' => 'Bitrix\Mail\Helper::repairCrmImapFilterAgent(%'])->Fetch())
{
	$agent->add('Bitrix\Mail\Helper::repairCrmImapFilterAgent();', 60, false, 600);
}
