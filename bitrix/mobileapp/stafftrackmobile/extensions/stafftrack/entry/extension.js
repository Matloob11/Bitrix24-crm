/**
 * @module stafftrack/entry
 */
jn.define('stafftrack/entry', (require, exports, module) => {
	const { UserLinkStatisticsManager } = require('stafftrack/data-managers/user-link-statistics-manager');
	const { Notify } = require('notify');
	const { Loc } = require('loc');
	const { RunActionExecutor } = require('rest/run-action-executor');

	class Entry
	{
		static entryVersion()
		{
			return 1;
		}

		static #getIsNewCheckInEnabled()
		{
			return new Promise((resolve) => {
				void new RunActionExecutor('stafftrackmobile.v2.Feature.isNewCheckInFeatureEnabled')
					.setHandler((response) => resolve(response?.status === 'success' ? response.data : null))
					.call()
				;
			});
		}

		static async openCheckIn({ dialogId, dialogName, openSettings = false })
		{
			const isNewCheckInEnabled = await Entry.#getIsNewCheckInEnabled();

			const config = isNewCheckInEnabled
				? Entry.#getNewCheckInConfig()
				: Entry.#getLegacyCheckInConfig();

			PageManager.openComponent('JSStackComponent', {
				name: 'JSStackComponent',
				componentCode: config.componentCode,
				// eslint-disable-next-line no-undef
				scriptPath: availableComponents[`stafftrack:${config.componentCode}`].publicUrl,
				canOpenInDefault: true,
				rootWidget: {
					name: 'layout',
					settings: {
						objectName: 'layout',
						modal: true,
						...config.layoutSettings,
					},
				},
				params: {
					DIALOG_ID: dialogId,
					DIALOG_NAME: dialogName,
					OPEN_SETTINGS: openSettings,
				},
			});
		}

		static #getNewCheckInConfig()
		{
			return {
				componentCode: 'stafftrack.check-in-v2',
				layoutSettings: {
					titleParams: {
						text: Loc.getMessage('M_STAFFTRACK_CHECK_IN_COMPONENT_TITLE'),
						type: 'dialog',
					},
					backdrop: {
						mediumPositionHeight: 390,
						swipeAllowed: true,
						swipeContentAllowed: false,
						adoptHeightByKeyboard: true,
						horizontalSwipeAllowed: false,
					},
				},
			};
		}

		static #getLegacyCheckInConfig()
		{
			return {
				componentCode: 'stafftrack.check-in',
				layoutSettings: {
					enableNavigationBarBorder: false,
					backdrop: {
						mediumPositionHeight: 525,
						hideNavigationBar: true,
						swipeAllowed: true,
						swipeContentAllowed: false,
						adoptHeightByKeyboard: true,
						horizontalSwipeAllowed: false,
					},
				},
			};
		}

		static async openUserStatistics({ userId, hash, monthCode })
		{
			const user = await UserLinkStatisticsManager.get(userId, hash);

			if (!user)
			{
				Notify.showMessage('No permission');

				return;
			}

			PageManager.openComponent('JSStackComponent', {
				name: 'JSStackComponent',
				componentCode: 'stafftrack.user-statistics',
				// eslint-disable-next-line no-undef
				scriptPath: availableComponents['stafftrack:stafftrack.user-statistics'].publicUrl,
				rootWidget: {
					name: 'layout',
					settings: {
						objectName: 'layout',
						modal: true,
						backdrop: {
							mediumPositionPercent: 70,
							hideNavigationBar: true,
							swipeContentAllowed: false,
						},
					},
				},
				params: {
					USER: user,
					MONTH_CODE: monthCode,
				},
			});
		}

		static openTimemanPage()
		{
			PageManager.openPage({
				url: `${env.siteDir}mobile/timeman/`,
				useSearchBar: false,
				cache: false,
				titleParams: {
					type: 'section',
				},
				backdrop: {
					onlyMediumPosition: false,
					mediumPositionPercent: 80,
				},
			});
		}

		static async revealCheckInEntry()
		{
			const navigator = PageManager.getNavigator();
			const tabs = await navigator.getTabs();
			const checkInTab = tabs.find((item) => item?.tab?.id === 'check-in');

			if (checkInTab)
			{
				navigator.makeTabActive('check-in');

				return;
			}

			BX.postComponentEvent('MoreMenu::ScrollToMenuItem', [{
				menuItemId: 'check-in',
				highlightItem: true,
				openOnHighlight: true,
			}]);
		}
	}

	if (typeof jnComponent?.preload === 'function')
	{
		const componentCode = 'stafftrack:stafftrack.check-in';

		// eslint-disable-next-line no-undef
		const { publicUrl } = availableComponents[componentCode] || {};

		if (publicUrl)
		{
			setTimeout(() => jnComponent.preload(publicUrl), 1000);
		}
	}

	module.exports = { Entry };
});
