/**
 * @module stafftrack/layout/check-in-v2/disabled-view/src/api
 */
jn.define('stafftrack/layout/check-in-v2/disabled-view/src/api', (require, exports, module) => {
	const { RunActionExecutor } = require('rest/run-action-executor');

	function createChatWithDepartmentHead()
	{
		return new Promise((resolve) => {
			void new RunActionExecutor('stafftrackmobile.v2.CheckIn.createChatWithDepartmentHead')
				.setSkipRequestIfCacheExists()
				.setCacheTtl(86400)
				.setCacheHandler((response) => resolve(response.data.chatId))
				.setHandler((response) => resolve(response?.status === 'success' ? response.data.chatId : null))
				.call(true)
			;
		});
	}

	function turnCheckInSettingOn()
	{
		return new Promise((resolve) => {
			void new RunActionExecutor('stafftrack.Feature.turnCheckInSettingOn')
				.setHandler((response) => resolve(response?.status === 'success'))
				.call()
			;
		});
	}

	module.exports = {
		createChatWithDepartmentHead,
		turnCheckInSettingOn,
	};
});
