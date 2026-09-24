<?php

if (!check_bitrix_sessid())
{
	return;
}

IncludeModuleLangFile(__FILE__);

global $APPLICATION;

if ($ex = $APPLICATION->GetException())
{
	CAdminMessage::ShowMessage([
		'TYPE' => 'ERROR',
		'MESSAGE' => GetMessage('MOD_INST_ERR'),
		'HTML' => true,
		'DETAILS' => $ex->GetString(),
	]);
}
else
{
	CAdminMessage::ShowNote(GetMessage('MOD_INST_OK'));
}
?>
<form action="<?= $APPLICATION->GetCurPage() ?>">
	<input type="hidden" name="lang" value="<?= LANG ?>">
	<input type="submit" name="" value="<?= GetMessage('MOD_BACK') ?>">
</form>
