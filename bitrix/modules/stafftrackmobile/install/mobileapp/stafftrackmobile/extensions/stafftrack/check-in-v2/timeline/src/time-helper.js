/**
 * @module stafftrack/check-in-v2/timeline/src/time-helper
 */
jn.define('stafftrack/check-in-v2/timeline/src/time-helper', (require, exports, module) => {
	const { Type } = require('type');
	const { Loc } = require('loc');
	const { CheckInTypeEnum } = require('stafftrack/check-in-v2/enums');

	const formatTimeOffset = (minutes) => {
		const hours = Math.floor(minutes / 60);
		const mins = minutes % 60;

		const parts = [];

		if (hours > 0)
		{
			parts.push(Loc.getMessage(
				'M_STAFFTRACK_CHECK_IN_NEW_TIMELINE_HOURS_SHORT',
				{
					'#COUNT#': hours,
				},
			));
		}

		if (mins > 0)
		{
			parts.push(Loc.getMessage(
				'M_STAFFTRACK_CHECK_IN_NEW_TIMELINE_MINUTES_SHORT',
				{
					'#COUNT#': mins,
				},
			));
		}

		return parts.join(' ');
	};

	const parseDate = (dateCreate) => {
		if (!Type.isStringFilled(dateCreate))
		{
			return new Date();
		}

		const date = new Date(dateCreate);
		if (Number.isNaN(date.getTime()))
		{
			return new Date();
		}

		return date;
	};

	const computeTimeOffsets = (items) => {
		let lastManualDate = null;

		return items.map((item) => {
			const date = parseDate(item.dateCreate);

			if (item.checkInType === CheckInTypeEnum.MANUAL.getValue())
			{
				lastManualDate = date;

				return { ...item, duration: null };
			}

			let duration = null;
			if (lastManualDate)
			{
				const diffMinutes = Math.round((date.getTime() - lastManualDate.getTime()) / 60000);
				if (diffMinutes > 0)
				{
					duration = formatTimeOffset(diffMinutes);
				}
			}

			return { ...item, duration };
		});
	};

	module.exports = { computeTimeOffsets, formatTimeOffset, parseDate };
});
