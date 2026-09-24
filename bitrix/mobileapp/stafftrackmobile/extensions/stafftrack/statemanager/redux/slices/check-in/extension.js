/**
 * @module stafftrack/statemanager/redux/slices/check-in
 */
jn.define('stafftrack/statemanager/redux/slices/check-in', (require, exports, module) => {
	/* eslint-disable no-param-reassign */
	const { ReducerRegistry } = require('statemanager/redux/reducer-registry');
	const { createSlice } = require('statemanager/redux/toolkit');
	const {
		sliceName,
		initialState,
		checkInAdapter,
	} = require('stafftrack/statemanager/redux/slices/check-in/meta');
	const { create } = require('stafftrack/statemanager/redux/slices/check-in/thunk');
	const {
		createPending,
		createFulfilled,
		createRejected,
	} = require('stafftrack/statemanager/redux/slices/check-in/extra-reducer');
	const {
		selectCheckInEntities,
		selectCheckInIdSet,
		selectCheckInsByUser,
		selectCheckInCountByUser,
		selectCurrentUserManualCount,
	} = require('stafftrack/statemanager/redux/slices/check-in/selector');

	const checkInSlice = createSlice({
		name: sliceName,
		initialState,
		reducers: {
			addCheckIn: (state, { payload }) => {
				checkInAdapter.addOne(state, payload);
			},
			upsertCheckIn: (state, { payload }) => {
				checkInAdapter.upsertOne(state, payload);
			},
			upsertCheckIns: (state, { payload }) => {
				checkInAdapter.upsertMany(state, payload);
			},
			setStatsByUser: (state, { payload }) => {
				const { date, stats } = payload || {};
				if (!date)
				{
					return;
				}
				Object.entries(stats || {}).forEach(([userId, count]) => {
					if (!state.statsByUserAndDate[userId])
					{
						state.statsByUserAndDate[userId] = {};
					}
					state.statsByUserAndDate[userId][date] = Number(count) || 0;
				});
			},
			incrementStatByUser: (state, { payload }) => {
				const { userId, date } = payload || {};
				if (!date)
				{
					return;
				}
				const numUserId = Number(userId);
				if (!state.statsByUserAndDate[numUserId])
				{
					state.statsByUserAndDate[numUserId] = {};
				}
				state.statsByUserAndDate[numUserId][date] = (state.statsByUserAndDate[numUserId][date] ?? 0) + 1;
			},
			decrementStatByUser: (state, { payload }) => {
				const { userId, date } = payload || {};
				if (!date)
				{
					return;
				}
				const numUserId = Number(userId);
				const current = state.statsByUserAndDate[numUserId]?.[date];
				if (!current)
				{
					return;
				}
				state.statsByUserAndDate[numUserId][date] = Math.max(0, current - 1);
			},
		},
		extraReducers: (builder) => {
			builder
				.addCase(create.pending, createPending)
				.addCase(create.fulfilled, createFulfilled)
				.addCase(create.rejected, createRejected);
		},
	});

	const {
		addCheckIn,
		upsertCheckIn,
		upsertCheckIns,
		setStatsByUser,
		incrementStatByUser,
		decrementStatByUser,
	} = checkInSlice.actions;

	ReducerRegistry.register(sliceName, checkInSlice.reducer);

	module.exports = {
		addCheckIn,
		upsertCheckIn,
		upsertCheckIns,
		setStatsByUser,
		incrementStatByUser,
		decrementStatByUser,
		create,
		selectCheckInEntities,
		selectCheckInIdSet,
		selectCheckInsByUser,
		selectCheckInCountByUser,
		selectCurrentUserManualCount,
	};
});
