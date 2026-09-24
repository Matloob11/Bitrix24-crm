/**
 * @module stafftrack/layout/check-in-v2/tabs/shifts/content/src/marker-type
 */
jn.define('stafftrack/layout/check-in-v2/tabs/shifts/content/src/marker-type', (require, exports, module) => {
	// TODO::refactoring after CheckInEnum appeared in default
	const MarkerType = Object.freeze({
		CHECK_IN: 'checkin',
		AUTO_CHECK_IN: 'autocheckin',
		FIRST_CHECK_IN: 'firstcheckin',
		FIRST_AUTO_CHECK_IN: 'firstautocheckin',
		LAST_CHECK_IN: 'lastcheckin',
		LAST_AUTO_CHECK_IN: 'lastautocheckin',
		TRANSIT_AUTO_CHECK_IN: 'transitautocheckin',
	});

	module.exports = { MarkerType };
});
