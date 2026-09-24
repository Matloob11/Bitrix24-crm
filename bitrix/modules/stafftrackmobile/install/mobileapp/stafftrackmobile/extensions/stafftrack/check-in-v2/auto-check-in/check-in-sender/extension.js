/**
 * @module stafftrack/check-in-v2/auto-check-in/check-in-sender
 */
jn.define('stafftrack/check-in-v2/auto-check-in/check-in-sender', (require, exports, module) => {
	const { SHARED_STORAGE_KEY } = require('stafftrack/check-in-v2/auto-check-in/const');
	const store = require('statemanager/redux/store');
	const { upsertCheckIn, incrementStatByUser } = require('stafftrack/statemanager/redux/slices/check-in');
	const { batchActions } = require('statemanager/redux/batched-actions');

	const MAX_PENDING_QUEUE = 3;
	const PENDING_QUEUE_KEY = 'auto_check_in_pending';

	/**
	 * @class CheckInSender
	 */
	class CheckInSender
	{
		constructor()
		{
			this.pendingQueue = [];
		}

		async loadPendingQueue()
		{
			const result = Application.sharedStorage(SHARED_STORAGE_KEY).get(PENDING_QUEUE_KEY);
			const pending = result ? JSON.parse(result) : null;

			if (Array.isArray(pending))
			{
				this.pendingQueue = pending;
			}
		}

		send(checkInDto)
		{
			BX.ajax.runAction('stafftrackmobile.v2.CheckIn.add', {
				data: { checkInDto },
			}).then((response) => {
				const checkIn = response?.data?.checkIn;
				if (!checkIn)
				{
					return;
				}

				const date = String(checkIn.dateCreate || '').slice(0, 10);
				const actions = [upsertCheckIn(checkIn)];
				if (date && Number(checkIn.userId) === Number(env.userId))
				{
					actions.push(incrementStatByUser({ userId: checkIn.userId, date }));
				}

				store.dispatch(batchActions(actions));
			}).catch((response) => {
				const isNetworkError = response?.errors?.some(
					(error) => error.code === 'NETWORK_ERROR',
				);

				if (isNetworkError)
				{
					this.#addToPending(checkInDto);
				}
			});
		}

		retrySending()
		{
			if (this.pendingQueue.length === 0)
			{
				return;
			}

			const queue = [...this.pendingQueue];
			this.pendingQueue = [];

			for (const checkInDto of queue)
			{
				this.send(checkInDto);
			}

			this.#savePending();
		}

		#addToPending(checkInDto)
		{
			this.pendingQueue.push(checkInDto);

			if (this.pendingQueue.length > MAX_PENDING_QUEUE)
			{
				this.pendingQueue.shift();
			}

			this.#savePending();
		}

		#savePending()
		{
			Application.sharedStorage(SHARED_STORAGE_KEY).set(PENDING_QUEUE_KEY, JSON.stringify(this.pendingQueue));
		}
	}

	module.exports = { CheckInSender };
});
