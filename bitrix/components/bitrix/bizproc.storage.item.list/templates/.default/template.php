<?php

if (!defined('B_PROLOG_INCLUDED') || B_PROLOG_INCLUDED !== true)
{
	die();
}

\Bitrix\Main\UI\Extension::load([
	'ui.dialogs.messagebox',
	'ui.alerts',
	'ui.notification',
]);

$hasErrors = (!empty($arResult['errors']) && is_array($arResult['errors']));
$quotaExceeded = !empty($arResult['quotaExceeded']);

?>
<div class="bizproc-storage-item-list-container">
	<div class="bizproc-storage-item-list-errors-container ui-alert ui-alert-danger"<?= (!$hasErrors ? ' style="display: none;"' : '') ?>>
		<?php if ($hasErrors): ?>
			<?php foreach ($arResult['errors'] as $error): ?>
				<div class="bizproc-storage-item-error ui-alert-message"><?= htmlspecialcharsbx($error) ?></div>
			<?php endforeach;?>
		<?php return;
		endif;?>
		<span class="ui-alert-close-btn" onclick="this.parentNode.style.display = 'none';"></span>
	</div>
<!--	--><?php //if ($quotaExceeded): ?>
<!--		<div class="bizproc-storage-item-list-quota-alert ui-alert ui-alert-warning">-->
<!--			<span class="ui-alert-message">--><?php //= htmlspecialcharsbx(GetMessage('BIZPROC_STORAGE_ITEM_LIST_QUOTA_EXCEEDED')) ?><!--</span>-->
<!--		</div>-->
<!--	--><?php //endif; ?>
	<div class="bizproc-storage-item-list-grid">
		<?php
		global $APPLICATION;
		$APPLICATION->IncludeComponent(
			"bitrix:main.ui.grid",
			"",
			$arResult['grid']
		);
		?>
	</div>
<script>
	BX.ready(() => {
		BX.message(<?= \Bitrix\Main\Web\Json::encode(\Bitrix\Main\Localization\Loc::loadLanguageFile(__FILE__)) ?>);

		BX.Bizproc.Component.StorageItemList.Instance = new BX.Bizproc.Component.StorageItemList({
			gridId: '<?= CUtil::JSEscape($arResult['grid']['GRID_ID']) ?>',
		});
	});
</script>
</div>
