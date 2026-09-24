<?php

use Bitrix\Main\Localization\Loc;
use Bitrix\Main\ModuleManager;

Loc::loadMessages(__FILE__);

if (class_exists('Superset'))
{
	return;
}

class Superset extends \CModule
{
	public $MODULE_ID = 'superset';
	public $MODULE_VERSION;
	public $MODULE_VERSION_DATE;
	public $MODULE_NAME;
	public $MODULE_DESCRIPTION;
	public $MODULE_GROUP_RIGHTS = 'N';

	public function __construct()
	{
		$arModuleVersion = [];

		include __DIR__ . '/version.php';

		if (
			is_array($arModuleVersion)
			&& array_key_exists('VERSION', $arModuleVersion)
			&& array_key_exists('VERSION_DATE', $arModuleVersion)
		)
		{
			$this->MODULE_VERSION = $arModuleVersion['VERSION'];
			$this->MODULE_VERSION_DATE = $arModuleVersion['VERSION_DATE'];
		}

		$this->MODULE_NAME = Loc::getMessage('SUPERSET_INSTALL_NAME');
		$this->MODULE_DESCRIPTION = Loc::getMessage('SUPERSET_INSTALL_DESCRIPTION');
	}

	public function doInstall()
	{
		global $APPLICATION;

		if ($this->installDB())
		{
			$this->installFiles();
		}

		$APPLICATION->IncludeAdminFile(
			Loc::getMessage('SUPERSET_INSTALL_NAME'),
			$_SERVER['DOCUMENT_ROOT'] . '/bitrix/modules/' . $this->MODULE_ID . '/install/step1.php'
		);
	}

	public function doUninstall()
	{
		global $APPLICATION;

		$step = (int)($_REQUEST['step'] ?? 1);

		if ($step < 2)
		{
			$errors = [];

			if (ModuleManager::isModuleInstalled('supersetproxy'))
			{
				$errors[] = Loc::getMessage('SUPERSET_INSTALL_ERROR_SUPERSETPROXY');
			}

			if (
				\Bitrix\Main\Loader::includeModule('biconnector')
				&& class_exists(\Bitrix\BIConnector\Superset\Selfhost\SupersetHostMode::class)
				&& method_exists(\Bitrix\BIConnector\Superset\Selfhost\SupersetHostMode::class, 'isSelfHosted')
				&& \Bitrix\BIConnector\Superset\Selfhost\SupersetHostMode::isSelfHosted()
			)
			{
				$errors[] = Loc::getMessage('SUPERSET_INSTALL_ERROR_SELFHOST_MODE');
			}

			if (!empty($errors))
			{
				$APPLICATION->throwException(implode('<br>', $errors));
			}

			$APPLICATION->includeAdminFile(
				Loc::getMessage('SUPERSET_INSTALL_NAME'),
				$_SERVER['DOCUMENT_ROOT'] . '/bitrix/modules/' . $this->MODULE_ID . '/install/unstep1.php'
			);
		}
		elseif ($step === 2)
		{
			$this->uninstallDB([
				'save_tables' => $_REQUEST['save_tables'] ?? '',
			]);
			$this->uninstallFiles();

			$APPLICATION->includeAdminFile(
				Loc::getMessage('SUPERSET_INSTALL_NAME'),
				$_SERVER['DOCUMENT_ROOT'] . '/bitrix/modules/' . $this->MODULE_ID . '/install/unstep2.php'
			);
		}
	}

	public function installFiles()
	{
		return true;
	}

	public function uninstallFiles()
	{
		return true;
	}

	public function installDB()
	{
		global $APPLICATION;

		if (!$this->isRequiredLibrariesAvailable())
		{
			$APPLICATION->ThrowException(Loc::getMessage('SUPERSET_INSTALL_ERROR_MAIN_UPDATE_REQUIRED'));

			return false;
		}

		$migrationResult = $this->installMigrations();
		if (!$migrationResult->isSuccess())
		{
			$APPLICATION->ThrowException(implode('<br>', $migrationResult->getErrorMessages()));

			return false;
		}

		ModuleManager::registerModule($this->MODULE_ID);

		return true;
	}

	private function isRequiredLibrariesAvailable(): bool
	{
		return class_exists('Symfony\\Component\\Yaml\\Yaml');
	}

	public function uninstallDB($arParams = [])
	{
		global $APPLICATION;

		$dropTables = !array_key_exists('save_tables', $arParams) || $arParams['save_tables'] !== 'Y';

		$migrationResult = $this->uninstallMigrations($dropTables);
		if (!$migrationResult->isSuccess())
		{
			$APPLICATION->ThrowException(implode('<br>', $migrationResult->getErrorMessages()));

			return false;
		}

		ModuleManager::unregisterModule($this->MODULE_ID);

		return true;
	}
}
