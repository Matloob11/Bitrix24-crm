/**
 * @module stafftrack/check-in-v2/auto-check-in/aggregator
 */
jn.define('stafftrack/check-in-v2/auto-check-in/aggregator', (require, exports, module) => {
	const { CheckInTypeEnum } = require('stafftrack/check-in-v2/enums');

	const AutoCheckInType = Object.freeze({
		ENTER: 'ENTER',
		LEAVE: 'LEAVE',
		MOVING_POINT: 'MOVING_POINT',
		STAY: 'STAY',
	});

	const PushAction = Object.freeze({
		APPEND: 'append',
		REPLACE: 'replace',
	});

	class AutoCheckInAggregator
	{
		#openEnter = null;

		/**
		 * @param {Array<Object>} checkIns
		 * @param {Object} [options]
		 * @param {?number} [options.dayCloseTimestamp]
		 * @returns {Array<Object>}
		 */
		aggregate(checkIns, options = {})
		{
			const { dayCloseTimestamp = null } = options;

			this.#openEnter = null;
			const result = [];
			const lastIndex = checkIns.length - 1;

			for (const [i, checkIn] of checkIns.entries())
			{
				if (CheckInTypeEnum.isManual(checkIn.entityType))
				{
					if (this.#openEnter)
					{
						const duration = this.#computeDuration(this.#openEnter.dateCreate, checkIn.dateCreate);
						result.push({
							...this.#openEnter,
							description: AutoCheckInType.STAY,
							duration,
						});
						this.#openEnter = null;
					}

					result.push({ ...checkIn, duration: null });
					continue;
				}

				const items = this.#processAutoCheckIn(checkIn);
				if (items.length === 0 && i === lastIndex && !this.#openEnter)
				{
					result.push({ ...checkIn, duration: null });
				}
				else
				{
					result.push(...items);
				}
			}

			if (this.#openEnter)
			{
				const endIso = this.#resolveOpenEnterEndIso(dayCloseTimestamp);
				const duration = this.#computeDuration(this.#openEnter.dateCreate, endIso);
				result.push({
					...this.#openEnter,
					description: AutoCheckInType.STAY,
					duration,
				});
			}

			return result;
		}

		#resolveOpenEnterEndIso(dayCloseTimestamp)
		{
			if (Number.isFinite(dayCloseTimestamp) && dayCloseTimestamp > 0)
			{
				const enterTime = new Date(this.#openEnter.dateCreate).getTime();
				const closeMs = dayCloseTimestamp * 1000;

				if (!Number.isNaN(enterTime) && closeMs >= enterTime)
				{
					return new Date(closeMs).toISOString();
				}
			}

			return new Date().toISOString();
		}

		/**
		 * @param {Object} checkIn
		 * @returns {Array<{ type: string, item: Object|null, replaceId?: number }>}
		 */
		push(checkIn)
		{
			if (CheckInTypeEnum.isManual(checkIn.entityType))
			{
				return this.#pushManual(checkIn);
			}

			const { description } = checkIn;

			if (description === AutoCheckInType.ENTER)
			{
				return this.#pushEnter(checkIn);
			}

			if (description === AutoCheckInType.LEAVE)
			{
				return this.#pushLeave(checkIn);
			}

			return this.#pushMovingPoint(checkIn);
		}

		#processAutoCheckIn(checkIn)
		{
			const { description, dateCreate } = checkIn;

			if (description === AutoCheckInType.ENTER)
			{
				if (this.#openEnter)
				{
					const duration = this.#computeDuration(this.#openEnter.dateCreate, dateCreate);
					const flushed = {
						...this.#openEnter,
						description: AutoCheckInType.STAY,
						duration,
					};
					this.#openEnter = checkIn;

					return [flushed];
				}

				this.#openEnter = checkIn;

				return [];
			}

			if (description === AutoCheckInType.LEAVE)
			{
				if (this.#openEnter)
				{
					const duration = this.#computeDuration(this.#openEnter.dateCreate, dateCreate);
					const item = {
						...this.#openEnter,
						description: AutoCheckInType.STAY,
						duration,
					};
					this.#openEnter = null;

					return [item];
				}

				return [{ ...checkIn, description: AutoCheckInType.MOVING_POINT, duration: null }];
			}

			if (this.#openEnter)
			{
				const duration = this.#computeDuration(this.#openEnter.dateCreate, dateCreate);
				const flushed = {
					...this.#openEnter,
					description: AutoCheckInType.STAY,
					duration,
				};
				this.#openEnter = null;

				return [flushed, { ...checkIn, duration: null }];
			}

			return [{ ...checkIn, duration: null }];
		}

		#pushManual(checkIn)
		{
			return this.#flushAndAppend(checkIn);
		}

		#pushEnter(checkIn)
		{
			const actions = this.#flushAndAppend(checkIn);
			this.#openEnter = checkIn;

			return actions;
		}

		#pushLeave(checkIn)
		{
			if (!this.#openEnter)
			{
				return [{
					type: PushAction.APPEND,
					item: { ...checkIn, description: AutoCheckInType.MOVING_POINT, duration: null },
				}];
			}

			const replaceId = this.#openEnter.id;
			const duration = this.#computeDuration(this.#openEnter.dateCreate, checkIn.dateCreate);
			const item = {
				...this.#openEnter,
				description: AutoCheckInType.STAY,
				duration,
			};
			this.#openEnter = null;

			return [{ type: PushAction.REPLACE, replaceId, item }];
		}

		#pushMovingPoint(checkIn)
		{
			return this.#flushAndAppend(checkIn);
		}

		#flushAndAppend(checkIn)
		{
			const actions = [];

			if (this.#openEnter)
			{
				actions.push(this.#flushOpenEnter(checkIn.dateCreate));
			}

			actions.push({ type: PushAction.APPEND, item: { ...checkIn, duration: null } });

			return actions;
		}

		#flushOpenEnter(nextDateCreate)
		{
			const replaceId = this.#openEnter.id;
			const duration = this.#computeDuration(this.#openEnter.dateCreate, nextDateCreate);
			const item = {
				...this.#openEnter,
				description: AutoCheckInType.STAY,
				duration,
			};
			this.#openEnter = null;

			return { type: PushAction.REPLACE, replaceId, item };
		}

		#computeDuration(enterDateCreate, leaveDateCreate)
		{
			const enterTime = new Date(enterDateCreate).getTime();
			const leaveTime = new Date(leaveDateCreate).getTime();

			if (Number.isNaN(enterTime) || Number.isNaN(leaveTime))
			{
				return null;
			}

			return Math.floor((leaveTime - enterTime) / 1000);
		}
	}

	module.exports = {
		AutoCheckInAggregator,
		AutoCheckInType,
		PushAction,
	};
});
