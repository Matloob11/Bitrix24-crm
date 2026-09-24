/**
 * @module stafftrack/statemanager/redux/slices/check-in/observers/list-observer
 */
jn.define('stafftrack/statemanager/redux/slices/check-in/observers/list-observer', (require, exports, module) => {
	const {
		selectCheckInIdSet,
		selectCheckInEntities,
	} = require('stafftrack/statemanager/redux/slices/check-in/selector');

	const observeCheckInListChange = (store, onChange) => {
		let prevIdSet = selectCheckInIdSet(store.getState());
		let paused = false;

		const unsubscribe = store.subscribe(() => {
			if (paused)
			{
				return;
			}

			const state = store.getState();
			const nextIdSet = selectCheckInIdSet(state);
			if (nextIdSet === prevIdSet)
			{
				return;
			}

			const { addedIds, hasRemoved } = getDiffForCheckInListObserver(prevIdSet, nextIdSet);
			prevIdSet = nextIdSet;

			if (addedIds.length === 0 && !hasRemoved)
			{
				return;
			}

			const entities = selectCheckInEntities(state);
			const addedCheckIns = addedIds
				.map((id) => entities[id])
				.filter(Boolean);

			onChange({ addedCheckIns, hasRemoved, state });
		});

		const pause = () => {
			paused = true;
		};

		const resume = () => {
			paused = false;
			prevIdSet = selectCheckInIdSet(store.getState());
		};

		return { unsubscribe, pause, resume };
	};

	/**
	 * @private
	 * @param {Set<string>} prevIdSet
	 * @param {Set<string>} nextIdSet
	 * @return {{addedIds: string[], hasRemoved: boolean}}
	 */
	const getDiffForCheckInListObserver = (prevIdSet, nextIdSet) => {
		const addedIds = [];
		let hasRemoved = false;

		for (const id of nextIdSet)
		{
			if (!prevIdSet.has(id))
			{
				addedIds.push(id);
			}
		}

		for (const id of prevIdSet)
		{
			if (!nextIdSet.has(id))
			{
				hasRemoved = true;
				break;
			}
		}

		return { addedIds, hasRemoved };
	};

	module.exports = { observeCheckInListChange, getDiffForCheckInListObserver };
});
