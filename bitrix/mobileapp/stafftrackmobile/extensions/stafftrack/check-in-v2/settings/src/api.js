/**
 * @module stafftrack/check-in-v2/settings/src/api
 */
jn.define('stafftrack/check-in-v2/settings/src/api', (require, exports, module) => {
	const { RunActionExecutor } = require('rest/run-action-executor');

	/**
	 * @param {string} actionName
	 * @param {object} [data]
	 */
	function runVoidAction(actionName, data = {})
	{
		return new Promise((resolve) => {
			void new RunActionExecutor(actionName, data)
				.setHandler((response) => resolve(response?.status === 'success'))
				.call()
			;
		});
	}

	/**
	 * @returns {Promise<CheckInSettingsData|null>}
	 */
	function loadSettings()
	{
		return new Promise((resolve) => {
			void new RunActionExecutor('stafftrackmobile.v2.CheckIn.Settings.getSettings')
				.setHandler((response) => resolve(response?.status === 'success' ? response.data : null))
				.call()
			;
		});
	}

	/**
	 * @param {boolean} enabled
	 */
	function changeTimemanIntegration(enabled)
	{
		return runVoidAction(
			'stafftrack.Option.changeTimemanIntegrationOption',
			{ enabled: enabled ? 'Y' : 'N' },
		);
	}

	function enableAutoCheckIn()
	{
		return runVoidAction('stafftrackmobile.v2.CheckIn.Settings.enableAutoCheckIn');
	}

	function disableAutoCheckIn()
	{
		return runVoidAction('stafftrackmobile.v2.CheckIn.Settings.disableAutoCheckIn');
	}

	function enableDayStartCheckIn()
	{
		return runVoidAction('stafftrackmobile.v2.CheckIn.Settings.enableDayStartCheckIn');
	}

	function disableDayStartCheckIn()
	{
		return runVoidAction('stafftrackmobile.v2.CheckIn.Settings.disableDayStartCheckIn');
	}

	function enableCheckIn()
	{
		return runVoidAction('stafftrack.Feature.turnCheckInSettingOn');
	}

	function disableCheckIn()
	{
		return runVoidAction('stafftrack.Feature.turnCheckInSettingOff');
	}

	module.exports = {
		loadSettings,
		changeTimemanIntegration,
		enableAutoCheckIn,
		disableAutoCheckIn,
		enableDayStartCheckIn,
		disableDayStartCheckIn,
		enableCheckIn,
		disableCheckIn,
	};
});
