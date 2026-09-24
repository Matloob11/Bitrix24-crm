/**
 * @module stafftrack/layout/check-in-v2/form/src/workday-expired
 */
jn.define('stafftrack/layout/check-in-v2/form/src/workday-expired', (require, exports, module) => {
	const WORKTIME_COMMANDS = new Set(['start', 'pause', 'continue', 'stop', 'close']);

	const RECORD_STATUS = {
		OPENED: 'opened',
		PAUSED: 'paused',
		CLOSED: 'closed',
	};

	const PULL_STATE_MAP = {
		OPENED: RECORD_STATUS.OPENED,
		PAUSED: RECORD_STATUS.PAUSED,
		CLOSED: RECORD_STATUS.CLOSED,
	};

	const computeIsExpired = (status, actions) => {
		const isOpened = status === RECORD_STATUS.OPENED;

		return isOpened && !actions.canPause && !actions.canContinue && !actions.canStart;
	};

	const computeIsExpiredFromRecord = (recordData) => {
		if (!recordData?.state)
		{
			return false;
		}

		const status = recordData.state.status;
		const actions = recordData.state.actions ?? {};

		return computeIsExpired(status, actions);
	};

	const computeIsOpenedFromRecord = (recordData) => {
		const status = recordData?.state?.status;

		return status === RECORD_STATUS.OPENED || status === RECORD_STATUS.PAUSED;
	};

	const computeIsOpenedFromPull = (params) => {
		const state = params?.STATE ?? params?.INFO?.CURRENT_STATUS ?? params?.info?.state;
		const status = PULL_STATE_MAP[state];

		return status === RECORD_STATUS.OPENED || status === RECORD_STATUS.PAUSED;
	};

	const computeIsExpiredFromPull = (params) => {
		const state = params?.STATE ?? params?.INFO?.CURRENT_STATUS ?? params?.info?.state;
		const status = PULL_STATE_MAP[state];
		const isOpened = status === RECORD_STATUS.OPENED;
		const isPaused = status === RECORD_STATUS.PAUSED;
		const isClosed = status === RECORD_STATUS.CLOSED;

		const canOpen = params?.CAN_OPEN ?? params?.info?.canOpen;

		return computeIsExpired(status, {
			canStart: isClosed && Boolean(canOpen),
			canPause: isOpened,
			canContinue: isPaused,
		});
	};

	module.exports = {
		WORKTIME_COMMANDS,
		computeIsExpiredFromRecord,
		computeIsExpiredFromPull,
		computeIsOpenedFromRecord,
		computeIsOpenedFromPull,
	};
});
