/**
 * @module stafftrack/check-in-v2/location-permission-granted-popup/ui-manager
 */
jn.define('stafftrack/check-in-v2/location-permission-granted-popup/ui-manager', (require, exports, module) => {
	const {
		openLocationPermissionGrantedPopupComponent,
	} = require('stafftrack/check-in-v2/location-permission-granted-popup/component-opener');

	/**
	 * @typedef {{
	 *   isAutoCheckInEnabledInSettings?: boolean,
	 *   isCheckInRequiredOnWorkDayStart?: boolean,
	 * }} LocationPermissionGrantedPopupOpenParams
	 */

	class LocationPermissionGrantedPopupUIManager
	{
		/**
		 * @public
		 * @param {LocationPermissionGrantedPopupOpenParams} [params]
		 */
		static openComponent(params = {})
		{
			openLocationPermissionGrantedPopupComponent(params);
		}
	}

	module.exports = {
		LocationPermissionGrantedPopupUIManager,
	};
});
