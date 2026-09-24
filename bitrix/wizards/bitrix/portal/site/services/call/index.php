<?php
if (!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED!==true) die();

use Bitrix\Main\ModuleManager;

if (!ModuleManager::isModuleInstalled("call"))
{
	return;
}

if (WIZARD_INSTALL_DEMO_DATA || WIZARD_FIRST_INSTAL !== "Y" || WIZARD_B24_TO_CP)
{
	$arUrlRewrite = [];
	if (file_exists(WIZARD_SITE_ROOT_PATH."/urlrewrite.php"))
	{
		include(WIZARD_SITE_ROOT_PATH."/urlrewrite.php");
	}

	$arNewUrlRewrite = [
		[
			'CONDITION' => '#^'.WIZARD_SITE_DIR.'call/detail/([0-9]+)#',
			'RULE' => "callId=\$1",
			'ID' => 'bitrix:call',
			'PATH' => WIZARD_SITE_DIR. 'call/index.php',
		],
		[
			"CONDITION" => "#^".WIZARD_SITE_DIR."video/([\\.\\-0-9a-zA-Z]+)(/?)([^/]*)#",
			"RULE" => "alias=\$1&videoconf",
			'ID' => 'bitrix:conference',
			"PATH" => WIZARD_SITE_DIR. "conference/videoconf.php",
		],
		[
			'CONDITION' => '#^'.WIZARD_SITE_DIR.'conference/#',
			'RULE' => '',
			'ID' => 'bitrix:call.conference.center',
			'PATH' => WIZARD_SITE_DIR. '/conference/index.php',
		],
	];

	foreach ($arNewUrlRewrite as $arUrl)
	{
		if (!in_array($arUrl, $arUrlRewrite))
		{
			\Bitrix\Main\UrlRewriter::add(WIZARD_SITE_ID, $arUrl);
		}
	}
}

if (!(WIZARD_SITE_ID == 's1' && !WIZARD_NEW_2011 && WIZARD_FIRST_INSTAL !== "Y") || WIZARD_B24_TO_CP)
{
	if (WIZARD_INSTALL_DEMO_DATA || WIZARD_FIRST_INSTAL !== "Y" || WIZARD_B24_TO_CP)
	{
		WizardServices::SetFilePermission([WIZARD_SITE_ID, WIZARD_SITE_DIR. "video/"], ["*" => "R"]);
		WizardServices::SetFilePermission([WIZARD_SITE_ID, WIZARD_SITE_DIR. "conference/videoconf.php"], ["*" => "R"]);
	}
}
