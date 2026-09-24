/**
 * @module stafftrack/statemanager/redux/slices/check-in/pull
 */
jn.define('stafftrack/statemanager/redux/slices/check-in/pull', (require, exports, module) => {
	const store = require('statemanager/redux/store');
	const { dispatch } = store;
	const { PullCommand } = require('stafftrack/check-in-v2/enums');
	const { usersUpserted } = require('statemanager/redux/slices/users');
	const { batchActions } = require('statemanager/redux/batched-actions');
	const { DateHelper } = require('stafftrack/date-helper');

	const mapPushUserToSliceShape = (pushUser) => ({
		id: pushUser.id,
		fullName: pushUser.name,
		name: pushUser.name,
		avatarSize100: pushUser.avatar,
		workPosition: pushUser.workPosition,
	});

	const handlers = {
		[PullCommand.CHECK_IN_ADD.getValue()]: (params) => {
			const checkIn = params?.checkIn;
			if (!checkIn)
			{
				return;
			}

			if (Number(checkIn.userId) === Number(env.userId))
			{
				return;
			}

			const {
				upsertCheckIn,
				incrementStatByUser,
			} = require('stafftrack/statemanager/redux/slices/check-in');
			const actions = [];

			if (params?.user?.id)
			{
				actions.push(usersUpserted([mapPushUserToSliceShape(params.user)]));
			}

			actions.push(upsertCheckIn(checkIn), incrementStatByUser({
				userId: checkIn.userId,
				date: DateHelper.getCheckInLocalDate(checkIn),
			}));

			dispatch(batchActions(actions));
		},
	};

	let listener = null;

	const subscribeToCheckInPullEvents = () => {
		if (listener)
		{
			return;
		}

		listener = (command, params) => {
			const handle = handlers[command];
			if (handle)
			{
				handle(params);
			}
		};

		BX.addCustomEvent('onPullEvent-stafftrack', listener);
	};

	const unsubscribeFromCheckInPullEvents = () => {
		if (!listener)
		{
			return;
		}

		BX.removeCustomEvent('onPullEvent-stafftrack', listener);
		listener = null;
	};

	module.exports = { subscribeToCheckInPullEvents, unsubscribeFromCheckInPullEvents };
});
