<?php

use Bitrix\Main\Application;
use Bitrix\Main\FileTable;
use Bitrix\Main\IO\File;
use Bitrix\Main\Localization\Loc;
use Bitrix\Main\ModuleManager;

Loc::loadMessages(__FILE__);

if (class_exists('Anonymizer'))
{
	return;
}

class Anonymizer extends \CModule
{
	public $MODULE_ID = 'anonymizer';
	public $MODULE_GROUP_RIGHTS = 'Y';
	public $MODULE_VERSION;
	public $MODULE_VERSION_DATE;
	public $MODULE_NAME;
	public $MODULE_DESCRIPTION;

	private $eventsData = [
		// 'ai' => [
		// 	'onTuningLoad' => [
		// 		['\Bitrix\Landing\Connector\Ai', 'onTuningLoad'],
		// 	],
		// 	'onBeforeCompletions' => ['\Bitrix\Landing\Connector\Ai', 'onBeforeCompletions'],
		// 	'onQueueJobExecute' => ['\Bitrix\Landing\Copilot\EventHandler', 'onQueueJobExecute'],
		// 	'onQueueJobFail' => ['\Bitrix\Landing\Copilot\EventHandler', 'onQueueJobFail'],
		// ],
	];

	/**
	 * Constructor.
	 */
	public function __construct()
	{
		$arModuleVersion = [];

		include(__DIR__ . '/version.php');

		if (is_array($arModuleVersion) && array_key_exists('VERSION', $arModuleVersion))
		{
			$this->MODULE_VERSION = $arModuleVersion['VERSION'];
			$this->MODULE_VERSION_DATE = $arModuleVersion['VERSION_DATE'];
		}

		$this->MODULE_NAME = Loc::getMessage('ANON_INSTALL_MODULE_NAME');
		$this->MODULE_DESCRIPTION = Loc::getMessage('ANON_INSTALL_MODULE_DESCRIPTION');
	}

	protected function getDocumentRoot(): string
	{
		$context = Application::getInstance()->getContext();

		return $context->getServer()->getDocumentRoot();
	}

	/**
	 * Call all install methods.
	 * @returm void
	 */
	public function DoInstall(): void
	{
		global $APPLICATION, $step, $USER;
		$step = (int)$step;

		if (
			$USER->IsAdmin()
			&& !ModuleManager::isModuleInstalled('anonymizer')
		)
		{
			$this->InstallDB();
			$this->InstallEvents();
			// dbg need install files
			// $this->InstallFiles();

			$GLOBALS['errors'] = $this->errors ?? [];

			$APPLICATION->includeAdminFile(
				Loc::getMessage('ANON_INSTALL_INSTALL_TITLE'),
				$this->getDocumentRoot() . '/bitrix/modules/anonymizer/install/step1.php'
			);
		}
	}

	/**
	 * Call all uninstall methods, include several steps.
	 * @returm void
	 */
	public function DoUninstall(): void
	{
		global $APPLICATION;

		$step = isset($_GET['step']) ? intval($_GET['step']) : 1;

		if ($step < 2)
		{
			$APPLICATION->includeAdminFile(
				Loc::getMessage('ANON_INSTALL_UNINSTALL_TITLE'),
				$this->getDocumentRoot() . '/bitrix/modules/anonymizer/install/unstep1.php'
			);
		}
		elseif ($step === 2)
		{
			$params = [
				'savedata' => ($_GET['savedata'] ?? 'N') === 'Y'
			];

			$this->uninstallDB($params);
			// dbg: need files
			// $this->uninstallFiles();
			$this->UnInstallEvents();

			$APPLICATION->includeAdminFile(
				Loc::getMessage('ANON_INSTALL_UNINSTALL_TITLE'),
				$this->getDocumentRoot() . '/bitrix/modules/anonymizer/install/unstep2.php'
			);
		}
	}

	/**
	 * Install DB, events, etc.
	 * @return bool
	 */
	public function InstallDB(): bool
	{
		global $DB, $APPLICATION;

		// db
		if (File::isFileExists($this->getDocumentRoot()
			. "/bitrix/modules/anonymizer/install/db/{$this->getConnectionType()}/install.sql"))
		{
			$errors = $DB->runSQLBatch(
				$this->getDocumentRoot()
				. "/bitrix/modules/anonymizer/install/db/{$this->getConnectionType()}/install.sql"
			);
			if ($errors !== false)
			{
				$APPLICATION->throwException(implode('', $errors));

				return false;
			}
		}

		// module
		registerModule('anonymizer');

		return true;
	}

	public function InstallEvents(): void
	{
		$eventManager = Bitrix\Main\EventManager::getInstance();
		foreach ($this->eventsData as $module => $events)
		{
			foreach ($events as $eventCode => $callbacks)
			{
				$callbacks = is_array($callbacks[0]) ? $callbacks : [$callbacks];
				foreach ($callbacks as $callback)
				{
					$eventManager->registerEventHandler(
						$module,
						$eventCode,
						$this->MODULE_ID,
						$callback[0],
						$callback[1]
					);
				}
			}
		}
	}

	public function UnInstallEvents(): void
	{
		$eventManager = Bitrix\Main\EventManager::getInstance();
		foreach ($this->eventsData as $module => $events)
		{
			foreach ($events as $eventCode => $callbacks)
			{
				$callbacks = is_array($callbacks[0]) ? $callbacks : [$callbacks];
				foreach ($callbacks as $callback)
				{
					$eventManager->unregisterEventHandler(
						$module,
						$eventCode,
						$this->MODULE_ID,
						$callback[0],
						$callback[1]
					);
				}
			}
		}
	}

	/**
	 * Install files.
	 * @return bool
	 */
	public function InstallFiles(): bool
	{
		return true;
	}

	/**
	 * Uninstall DB, events, etc.
	 * @param array $arParams Some params.
	 * @return bool
	 */
	public function UnInstallDB(array $arParams = []): bool
	{
		global $APPLICATION, $DB;

		$errors = false;

		// delete DB
		if (File::isFileExists($this->getDocumentRoot()
			. "/bitrix/modules/anonymizer/install/db/{$this->getConnectionType()}/uninstall.sql"))
		{
			if (isset($arParams['savedata']) && !$arParams['savedata'])
			{
				$errors = $DB->runSQLBatch(
					$this->getDocumentRoot()
					. "/bitrix/modules/anonymizer/install/db/{$this->getConnectionType()}/uninstall.sql"
				);
			}
		}

		if ($errors !== false)
		{
			$APPLICATION->throwException(implode('', $errors));

			return false;
		}

		// CAgent::removeModuleAgents('anonymizer');

		unregisterModule('anonymizer');

		// delete files finally
		if (isset($arParams['savedata']) && !$arParams['savedata'])
		{
			$res = FileTable::getList([
				'select' => [
					'ID',
				],
				'filter' => [
					'=MODULE_ID' => 'anonymizer',
				],
				'order' => [
					'ID' => 'desc',
				],
			]);
			while ($row = $res->fetch())
			{
				CFile::delete($row['ID']);
			}
		}

		return true;
	}

	/**
	 * Uninstall files.
	 * @return bool
	 */
	public function UnInstallFiles(): bool
	{
		return true;
	}


	private function getConnectionType(): string
	{
		return Application::getConnection()->getType();
	}

	private function isCloudInstallation(): bool
	{
		return (defined('BX24_HOST_NAME') && BX24_HOST_NAME !== '');
	}
}
