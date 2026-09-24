/**
 * @module stafftrack/statemanager/redux/slices/check-in/extra-reducer
 */
jn.define('stafftrack/statemanager/redux/slices/check-in/extra-reducer', (require, exports, module) => {
	/* eslint-disable no-param-reassign */
	const { checkInAdapter } = require('stafftrack/statemanager/redux/slices/check-in/meta');

	const userId = Number(env.userId);
	const pad = (n) => String(n).padStart(2, '0');
	const formatNow = () => {
		const d = new Date();

		return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
	};

	const bumpStat = (state, date, delta) => {
		if (!date)
		{
			return;
		}

		if (!state.statsByUserAndDate[userId])
		{
			state.statsByUserAndDate[userId] = {};
		}

		const next = (state.statsByUserAndDate[userId][date] ?? 0) + delta;
		state.statsByUserAndDate[userId][date] = Math.max(0, next);
	};

	const createPending = (state, action) => {
		const { entityType, latitude, longitude, address, description, files } = action.meta.arg;
		const dateCreate = formatNow();

		checkInAdapter.addOne(state, {
			id: action.meta.requestId,
			userId,
			entityType,
			dateCreate,
			latitude,
			longitude,
			address: address || '',
			description,
			files,
		});

		bumpStat(state, dateCreate.slice(0, 10), 1);
	};

	const createRejected = (state, action) => {
		const tempEntity = state.entities[action.meta.requestId];
		checkInAdapter.removeOne(state, action.meta.requestId);

		if (tempEntity?.dateCreate)
		{
			bumpStat(state, tempEntity.dateCreate.slice(0, 10), -1);
		}
	};

	const createFulfilled = (state, action) => {
		const tempId = action.meta.requestId;
		const tempEntity = state.entities[tempId];

		checkInAdapter.removeOne(state, tempId);

		if (action.payload?.checkIn)
		{
			checkInAdapter.upsertOne(state, { ...tempEntity, ...action.payload.checkIn });
		}
	};

	module.exports = {
		createPending,
		createFulfilled,
		createRejected,
	};
});
