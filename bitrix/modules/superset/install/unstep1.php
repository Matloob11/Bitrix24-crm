<?php
/** @var CMain $APPLICATION */

if ($ex = $APPLICATION->GetException()):

	CAdminMessage::ShowMessage([
		'TYPE' => 'ERROR',
		'MESSAGE' => GetMessage('MOD_UNINST_ERR'),
		'DETAILS' => $ex->GetString(),
		'HTML' => true,
	]);
	?>

	<form action="<?= $APPLICATION->GetCurPage() ?>">
		<?= bitrix_sessid_post() ?>
		<input type="hidden" name="lang" value="<?= LANG ?>">
		<input type="submit" name="" value="<?= GetMessage('MOD_BACK') ?>">
	</form>

<?php else: ?>

	<form action="<?php echo $APPLICATION->GetCurPage() ?>">
		<?= bitrix_sessid_post() ?>
		<input type="hidden" name="lang" value="<?= LANGUAGE_ID ?>">
		<input type="hidden" name="id" value="superset">
		<input type="hidden" name="uninstall" value="Y">
		<input type="hidden" name="step" value="2">
		<?php CAdminMessage::ShowMessage(GetMessage('MOD_UNINST_WARN')) ?>
		<p><?= GetMessage('MOD_UNINST_SAVE') ?></p>
		<p>
			<input type="checkbox" name="save_tables" id="save_tables" value="Y" checked>
			<label for="save_tables"><?= GetMessage('MOD_UNINST_SAVE_TABLES') ?></label>
		</p>
		<input type="submit" name="inst" value="<?= GetMessage('MOD_UNINST_DEL') ?>">
	</form>

<?php endif; ?>
