/**
 * @module stafftrack/check-in-v2/location-permission-popup/api
 */
jn.define('stafftrack/check-in-v2/location-permission-popup/api', (require, exports, module) => {
	const { RunActionExecutor } = require('rest/run-action-executor');

	const CACHE_TTL = 24 * 60 * 60;

	/**
	 * @returns {Promise<{ isAutoCheckInEnabledInSettings: boolean, isCheckInRequiredOnWorkDayStart: boolean }>}
	 */
	function getLocationPermissionPopupState()
	{
		return new Promise((resolve) => {
			const handle = (response) => {
				const data = response?.status === 'success' && response.data ? response.data : {};
				resolve({
					isAutoCheckInEnabledInSettings: data.isAutoCheckInEnabledInSettings === true,
					isCheckInRequiredOnWorkDayStart: data.isCheckInRequiredOnWorkDayStart === true,
				});
			};

			void new RunActionExecutor('stafftrackmobile.v2.CheckIn.Settings.getLocationPermissionPopupState')
				.setCacheTtl(CACHE_TTL)
				.setSkipRequestIfCacheExists()
				.setSkipDuplicateRequests()
				.setCacheHandler(handle)
				.setHandler(handle)
				.call(true);
		});
	}

	module.exports = {
		getLocationPermissionPopupState,
	};
});
