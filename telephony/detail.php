<?php
require($_SERVER['DOCUMENT_ROOT'] . '/bitrix/header.php');
IncludeModuleLangFile($_SERVER['DOCUMENT_ROOT'] . '/bitrix/modules/intranet/public/telephony/detail.php');

$APPLICATION->SetTitle(GetMessage('VI_PAGE_STAT_DETAIL'));

$a7CiCss = '/bitrix/css/a7_call_intelligence.css';
$a7CiJs = '/bitrix/js/a7_call_intelligence.js';
$a7CiDoc = (string)($_SERVER['DOCUMENT_ROOT'] ?? '');
$a7CiCssVer = is_readable($a7CiDoc . $a7CiCss) ? (string)@filemtime($a7CiDoc . $a7CiCss) : (string)time();
$a7CiJsVer = is_readable($a7CiDoc . $a7CiJs) ? (string)@filemtime($a7CiDoc . $a7CiJs) : (string)time();
if (is_object($APPLICATION) && method_exists($APPLICATION, 'AddHeadString')) {
    $APPLICATION->AddHeadString(
        '<link rel="stylesheet" href="' . $a7CiCss . '?v=' . $a7CiCssVer . '">'
        . '<script src="' . $a7CiJs . '?v=' . $a7CiJsVer . '"></script>',
        true
    );
}

$APPLICATION->IncludeComponent(
	'bitrix:ui.sidepanel.wrapper',
	'',
	[
		'POPUP_COMPONENT_NAME' => 'bitrix:voximplant.statistic.detail',
		'POPUP_COMPONENT_TEMPLATE_NAME' => '',
		'USE_UI_TOOLBAR' => 'Y',
		'POPUP_COMPONENT_PARAMS' => [
			'COMPONENT_POPUP_TEMPLATE_NAME' => '',
			'COMPONENT_PARAMS' => [
				'LIMIT' => '30'
			]
		]
	]
);
?>
<link rel="stylesheet" href="<?= htmlspecialcharsbx($a7CiCss . '?v=' . $a7CiCssVer) ?>">
<script src="<?= htmlspecialcharsbx($a7CiJs . '?v=' . $a7CiJsVer) ?>"></script>
<?php
require($_SERVER['DOCUMENT_ROOT'] . '/bitrix/footer.php');
