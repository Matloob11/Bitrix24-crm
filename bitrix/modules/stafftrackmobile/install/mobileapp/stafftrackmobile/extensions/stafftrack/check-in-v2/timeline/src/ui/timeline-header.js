/**
 * @module stafftrack/check-in-v2/timeline/src/ui/timeline-header
 */
jn.define('stafftrack/check-in-v2/timeline/src/ui/timeline-header', (require, exports, module) => {
	const { Loc } = require('loc');
	const { Color, Indent, Component } = require('tokens');
	const { Text4 } = require('ui-system/typography/text');
	const { DateHelper } = require('stafftrack/date-helper');
	const { createTestIdGenerator } = require('utils/test');

	const TimelineHeader = ({ testId, date, count }) => {
		const getTestId = createTestIdGenerator({ prefix: testId });
		const formattedDate = DateHelper.formatDayMonth(date);

		return View(
			{
				style: {
					alignItems: 'center',
					flexDirection: 'row',
					justifyContent: 'space-between',
					marginBottom: Indent.XL3.toNumber(),
					paddingHorizontal: Component.paddingLr.toNumber(),
				},
			},
			Text4({
				testId: getTestId('date'),
				text: formattedDate,
				color: Color.base4,
			}),
			Text4({
				testId: getTestId('count'),
				text: Loc.getMessage('M_STAFFTRACK_CHECK_IN_NEW_TIMELINE_CHECKINS_IN_DAY', {
					'#COUNT#': count,
				}),
				color: Color.base4,
			}),
		);
	};

	module.exports = { TimelineHeader };
});
