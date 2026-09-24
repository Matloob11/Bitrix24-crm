<?php

$migration = \Bitrix\Main\UpdateSystem\Migration::getInstance();

$migration->table('b_superset_user')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$table->addId();
	$table->addColumn()->int('SERVER_ID');
	$table->addColumn()->varchar('LOGIN', 64)->notNull();
	$table->addColumn()->text('ACCESS_PASSWORD');
	$table->addColumn()->datetime('CREATED');
	$table->addColumn()->datetime('UPDATED');
	$table->addColumn()->int('EXTERNAL_ID');
	$table->addColumn()->varchar('CLIENT_ID', 32);
	$table->addIndex('INX_SERVER', ['SERVER_ID']);
	$table->addIndex('INX_SERVER_CLIENT', ['SERVER_ID', 'CLIENT_ID']);
});

$migration->table('b_superset_server')->create(function (\Bitrix\Main\UpdateSystem\Migration\CreateTableBuilder $table) {
	$table->addId();
	$table->addColumn()->varchar('HOST', 255);
	$table->addColumn()->int('ACCOUNT_ID')->notNull();
	$table->addColumn()->text('ACCESS_PASSWORD');
	$table->addColumn()->text('INSTANCE_KEY');
	$table->addColumn()->text('INSTANCE_USERNAME');
	$table->addColumn()->text('TOKEN');
	$table->addColumn()->text('REFRESH_TOKEN');
	$table->addColumn()->varchar('START_JOB_ID', 100);
	$table->addColumn()->int('VERSION');
	$table->addColumn()->varchar('PORTAL_URL', 255);
	$table->addColumn()->varchar('PORTAL_ID', 50);
	$table->addColumn()->char('IS_PORTAL_ID_VERIFIED', 1)->default('N');
	$table->addColumn()->text('JWT_SECRET');
	$table->addColumn()->datetime('DATE_START_ATTEMPT');
	$table->addColumn()->datetime('DATE_CREATE');
	$table->addColumn()->datetime('DATE_UPDATE');
	$table->addIndex('INX_ACCOUNT', ['ACCOUNT_ID']);
	$table->addIndex('INX_PORTAL_ID', ['PORTAL_ID']);
});
