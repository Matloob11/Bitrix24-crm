/**
 * @module stafftrack/layout/check-in-v2/tabs/shifts/content/src/api
 */
jn.define('stafftrack/layout/check-in-v2/tabs/shifts/content/src/api', (require, exports, module) => {
	const { RunActionExecutor } = require('rest/run-action-executor');

	function getMapData(timestamp = 0)
	{
		return new Promise((resolve) => {
			void new RunActionExecutor('stafftrackmobile.v2.CheckIn.getMapData', { timestamp })
				.setHandler((response) => {
					resolve({
						checkIns: response?.data?.checkIns || [],
						stats: response?.data?.stats || {},
						users: response?.data?.users || [],
						hasSubordinates: response?.data?.hasSubordinates || false,
						isWesternPortal: response?.data?.isWesternPortal || false,
					});
				})
				.call()
			;
		});
	}

	function getEmployeeRoute(userId, timestamp)
	{
		return new Promise((resolve) => {
			void new RunActionExecutor(
				'stafftrackmobile.v2.CheckIn.getEmployeeRoute',
				{ userId, timestamp },
			)
				.setHandler((response) => {
					if (response?.status !== 'success' || !response.data)
					{
						resolve(null);

						return;
					}

					resolve({
						route: response.data.route || [],
						isDayClosed: response.data.isDayClosed === true,
						stats: response.data.stats || {},
					});
				})
				.call()
			;
		});
	}

	module.exports = { getMapData, getEmployeeRoute };
});
