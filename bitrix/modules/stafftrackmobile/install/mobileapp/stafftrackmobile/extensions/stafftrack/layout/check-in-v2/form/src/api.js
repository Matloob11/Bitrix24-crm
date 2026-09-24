/**
 * @module stafftrack/layout/check-in-v2/form/src/api
 */
jn.define('stafftrack/layout/check-in-v2/form/src/api', (require, exports, module) => {
	const { RunActionExecutor } = require('rest/run-action-executor');

	function loadCheckInForm(latitude = 0, longitude = 0)
	{
		return new Promise((resolve) => {
			void new RunActionExecutor(
				'stafftrackmobile.v2.CheckIn.loadCheckInForm',
				{ latitude, longitude },
			)
				.setHandler((response) => resolve(response?.status === 'success' ? response.data : null))
				.call()
			;
		});
	}

	module.exports = {
		loadCheckInForm,
	};
});
