<?php if (!defined("B_PROLOG_INCLUDED") || B_PROLOG_INCLUDED !== true)
{
	die();
}

/**
 * @var CMain $APPLICATION
 */

IncludeModuleLangFile(__FILE__);

if (isset($anonymizer_installer_errors)
	&& is_array($anonymizer_installer_errors)
	&& (count($anonymizer_installer_errors) > 0)
)
{
	$errors = '';
	foreach ($anonymizer_installer_errors as $e)
	{
		$errors .= htmlspecialcharsbx($e) . '<br>';
	}
	CAdminMessage::ShowMessage(array(
		'TYPE' => 'ERROR',
		'MESSAGE' => GetMessage('MOD_UNINST_ERR'),
		'DETAILS' => $errors,
		'HTML' => true,
	));
	?>
	<form action="<?= $APPLICATION->GetCurPage() ?>">
		<input type="hidden" name="lang" value="<?= LANG ?>">
		<input type="submit" name="" value="<?= GetMessage("MOD_BACK") ?>">
	</form>
	<?php
}
else
{
	?>
	<form action="<?= $APPLICATION->GetCurPage() ?>">
		<?= bitrix_sessid_post() ?>
		<input type="hidden" name="lang" value="<?= LANG ?>">
		<input type="hidden" name="id" value="anonymizer">
		<input type="hidden" name="uninstall" value="Y">
		<input type="hidden" name="step" value="2">
		<?php CAdminMessage::ShowMessage(GetMessage("MOD_UNINST_WARN")) ?>
		<p><?= GetMessage("MOD_UNINST_SAVE") ?></p>

		<p>
			<input type="checkbox" name="savedata" id="savedata" value="Y" checked>
			<label for="savedata"><?= GetMessage("MOD_UNINST_SAVE_TABLES") ?></label>
		</p>
		<input type="submit" name="inst" value="<?= GetMessage("MOD_UNINST_DEL") ?>">
	</form>
	<?php
}
?>