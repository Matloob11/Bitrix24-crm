/**
 * @module stafftrack/statemanager/redux/slices/check-in/selector
 */
jn.define('stafftrack/statemanager/redux/slices/check-in/selector', (require, exports, module) => {
	const { createDraftSafeSelector } = require('statemanager/redux/toolkit');
	const { sliceName, checkInAdapter } = require('stafftrack/statemanager/redux/slices/check-in/meta');
	const { CheckInTypeEnum } = require('stafftrack/check-in-v2/enums');
	const { DateHelper } = require('stafftrack/date-helper');

	const emptyAdapterState = checkInAdapter.getInitialState();
	const checkInSelectors = checkInAdapter.getSelectors((state) => state[sliceName] || emptyAdapterState);

	const {
		selectAll: selectAllCheckIns,
		selectIds: selectCheckInIds,
		selectEntities: selectCheckInEntities,
	} = checkInSelectors;

	const selectCheckInIdSet = createDraftSafeSelector(
		selectCheckInIds,
		(ids) => new Set(ids.map(String)),
	);

	const selectStatsByUserAndDate = (state) => state[sliceName]?.statsByUserAndDate || {};

	const compareCheckIns = (a, b) => {
		const dateA = a.dateCreate || '';
		const dateB = b.dateCreate || '';
		if (dateA !== dateB)
		{
			return dateA < dateB ? -1 : 1;
		}

		return (Number(a.id) || 0) - (Number(b.id) || 0);
	};

	const selectCheckInsByUser = (state, userId, timestamp) => {
		const targetUserId = Number(userId);
		const localDate = DateHelper.getLocalDateFromTimestamp(timestamp);

		return selectAllCheckIns(state)
			.filter((checkIn) => Number(checkIn.userId) === targetUserId)
			.filter((checkIn) => (checkIn.dateCreate || '').slice(0, 10) === localDate)
			.sort(compareCheckIns);
	};

	const selectCheckInCountByUser = (state, userId, timestamp) => {
		const numUserId = Number(userId);
		const localDate = DateHelper.getLocalDateFromTimestamp(timestamp);

		return selectStatsByUserAndDate(state)[numUserId]?.[localDate] ?? 0;
	};

	const selectCurrentUserManualCount = (state, timestamp) => {
		return selectCheckInsByUser(state, Number(env.userId), timestamp)
			.filter((checkIn) => CheckInTypeEnum.isManual(checkIn.entityType))
			.length;
	};

	module.exports = {
		selectCheckInEntities,
		selectCheckInIdSet,
		selectCheckInsByUser,
		selectCheckInCountByUser,
		selectCurrentUserManualCount,
	};
});
