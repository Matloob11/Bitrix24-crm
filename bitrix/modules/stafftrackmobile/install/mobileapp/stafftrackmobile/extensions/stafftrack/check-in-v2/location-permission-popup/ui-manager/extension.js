/**
 * @module stafftrack/check-in-v2/location-permission-popup/ui-manager
 */
jn.define('stafftrack/check-in-v2/location-permission-popup/ui-manager', (require, exports, module) => {
	const { Feature } = require('feature');
	const { Tourist } = require('tourist');
	const { Geo } = require('utils/geo');
	const { BackgroundUIManager } = require('background/ui-manager');
	const {
		LOCATION_PERMISSION_POPUP_COMPONENT_NAME,
		LOCATION_PERMISSION_POPUP_SHOWN,
		LOCATION_PERMISSION_POPUP_TIMEMAN_SHOWN,
		LOCATION_PERMISSION_GRANTED_REMEMBERED,
		LOCATION_PERMISSION_GRANTED_TEST,
	} = require('stafftrack/check-in-v2/location-permission-popup/const');
	const { getLocationPermissionPopupState } = require('stafftrack/check-in-v2/location-permission-popup/api');
	const {
		openLocationPermissionPopupComponent,
	} = require('stafftrack/check-in-v2/location-permission-popup/component-opener');

	const COMPONENT_PRIORITY = 500;
	const ONE_DAY_MS = 24 * 60 * 60 * 1000;

	/**
	 * @typedef {{
	 *   isAutoCheckInEnabledInSettings?: boolean,
	 *   isCheckInRequiredOnWorkDayStart?: boolean,
	 * }} LocationPermissionPopupOpenParams
	 */

	class LocationPermissionPopupUIManager
	{
		/**
		 * @public
		 * @param {LocationPermissionPopupOpenParams} [params]
		 */
		static openComponent(params = {})
		{
			openLocationPermissionPopupComponent(params);
		}

		/**
		 * @public
		 * @param {LocationPermissionPopupOpenParams} [params]
		 */
		static openComponentInBackground(params = {})
		{
			BackgroundUIManager.openComponent(
				LOCATION_PERMISSION_POPUP_COMPONENT_NAME,
				() => LocationPermissionPopupUIManager.openComponent(params),
				COMPONENT_PRIORITY,
			);
		}

		/**
		 * @public
		 * @return {boolean}
		 */
		static canOpenComponentInBackground()
		{
			return BackgroundUIManager.canOpenComponentInBackground();
		}

		/**
		 * @public
		 * @return {Promise<void>}
		 */
		static async openInBackgroundIfNeeded()
		{
			if (!Feature.isLocationStatusSupported())
			{
				return;
			}

			await Tourist.ready();

			if (!Tourist.firstTime(LOCATION_PERMISSION_GRANTED_TEST))
			{
				return;
			}

			const lastShown = Tourist.lastTime(LOCATION_PERMISSION_POPUP_SHOWN);
			if (lastShown && Date.now() - lastShown.getTime() < ONE_DAY_MS)
			{
				return;
			}

			const {
				isAutoCheckInEnabledInSettings,
				isCheckInRequiredOnWorkDayStart,
			} = await getLocationPermissionPopupState();
			if (!isAutoCheckInEnabledInSettings && !isCheckInRequiredOnWorkDayStart)
			{
				return;
			}

			if (isAutoCheckInEnabledInSettings)
			{
				const status = await Geo.getLocationStatus();
				const isPermissionGranted = Geo.isLocationPermissionGranted(status);

				if (isPermissionGranted && !Tourist.firstTime(LOCATION_PERMISSION_GRANTED_REMEMBERED))
				{
					return;
				}
			}
			else if (!Tourist.firstTime(LOCATION_PERMISSION_POPUP_TIMEMAN_SHOWN))
			{
				return;
			}

			LocationPermissionPopupUIManager.openComponentInBackground({
				isAutoCheckInEnabledInSettings,
				isCheckInRequiredOnWorkDayStart,
			});
		}
	}

	module.exports = {
		LocationPermissionPopupUIManager,
	};
});
