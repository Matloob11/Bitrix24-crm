/**
 * @module stafftrack/statemanager/redux/slices/check-in/meta
 */
jn.define('stafftrack/statemanager/redux/slices/check-in/meta', (require, exports, module) => {
	const { createEntityAdapter } = require('statemanager/redux/toolkit');
	const { StateCache } = require('statemanager/redux/state-cache');

	const sliceName = 'stafftrack:check-in';

	const checkInAdapter = createEntityAdapter({
		selectId: ({ id }) => String(id),
	});

	const defaultState = {
		...checkInAdapter.getInitialState(),
		statsByUserAndDate: {},
	};

	const initialState = StateCache.getReducerState(sliceName, defaultState);
	if (!initialState.statsByUserAndDate)
	{
		initialState.statsByUserAndDate = {};
	}

	module.exports = {
		sliceName,
		checkInAdapter,
		initialState,
	};
});
