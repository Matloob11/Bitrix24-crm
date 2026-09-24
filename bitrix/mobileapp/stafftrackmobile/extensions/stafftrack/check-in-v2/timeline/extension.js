/**
 * @module stafftrack/check-in-v2/timeline
 */
jn.define('stafftrack/check-in-v2/timeline', (require, exports, module) => {
	const { TimelineContent } = require('stafftrack/check-in-v2/timeline/src/ui/timeline-content');
	const { TimelineBottomSheet } = require('stafftrack/check-in-v2/timeline/src/bottom-sheet');

	module.exports = {
		TimelineContent,
		TimelineBottomSheet,
	};
});
