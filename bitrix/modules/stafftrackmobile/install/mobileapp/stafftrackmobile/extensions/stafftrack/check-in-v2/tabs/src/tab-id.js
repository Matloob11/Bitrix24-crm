/**
 * @module stafftrack/check-in-v2/tabs/src/tab-id
 */
jn.define('stafftrack/check-in-v2/tabs/src/tab-id', (require, exports, module) => {
	const TabId = Object.freeze({
		SHIFTS: 'shifts',
		WORK_REPORTS: 'work-reports',
		WORK_DAYS: 'work-days',
	});

	module.exports = { TabId };
});
