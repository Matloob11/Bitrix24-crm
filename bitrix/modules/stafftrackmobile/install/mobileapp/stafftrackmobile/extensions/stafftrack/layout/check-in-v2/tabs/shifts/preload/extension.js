/**
 * @module stafftrack/layout/check-in-v2/tabs/shifts/preload
 */
jn.define('stafftrack/layout/check-in-v2/tabs/shifts/preload', (require, exports, module) => {
	const { RunActionExecutor } = require('rest/run-action-executor');

	let store = null;
	let fetchCurrentRecord = null;

	try
	{
		store = require('statemanager/redux/store');
		({ fetchCurrentRecord } = require('timeman/statemanager/redux/slices/worktime'));
	}
	catch (error)
	{
		console.error('stafftrack preload: timeman module not available', error);
	}

	function preload()
	{
		const settingsPromise = new Promise((resolve) => {
			void new RunActionExecutor('stafftrack.Feature.isCheckInEnabled')
				.setHandler((response) => {
					resolve({ isEnabled: response?.status === 'success' && response.data === true });
				})
				.call()
			;
		});

		const worktimePromise = store && fetchCurrentRecord
			? store.dispatch(fetchCurrentRecord()).catch(() => {})
			: Promise.resolve();

		return Promise.all([settingsPromise, worktimePromise])
			.then(([settingsResult]) => settingsResult);
	}

	module.exports = { preload };
});
