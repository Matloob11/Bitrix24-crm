/**
 * @module stafftrack/check-in-v2/timeline/src/bottom-sheet
 */
jn.define('stafftrack/check-in-v2/timeline/src/bottom-sheet', (require, exports, module) => {
	const { BottomSheet } = require('bottom-sheet');
	const { Box, BoxFooter } = require('ui-system/layout/box');
	const { Button, ButtonDesign, ButtonSize } = require('ui-system/form/buttons/button');
	const { Indent } = require('tokens');
	const { Loc } = require('loc');
	const { Color } = require('tokens');
	const { createTestIdGenerator } = require('utils/test');
	const { debounce } = require('utils/function');
	const { NavigationBar } = require('stafftrack/check-in-v2/timeline/src/ui/navigation-bar');
	const { TimelineContent } = require('stafftrack/check-in-v2/timeline/src/ui/timeline-content');
	const { Shimmer } = require('stafftrack/check-in-v2/timeline/src/ui/shimmer');
	const { PullCommand } = require('stafftrack/check-in-v2/enums');
	const { AutoCheckInAggregator } = require('stafftrack/check-in-v2/auto-check-in/aggregator');
	const { confirmDefaultAction } = require('alert');
	const { Type } = require('type');
	const { showErrorToast } = require('toast');
	const { withCurrentDomain } = require('utils/url');
	const store = require('statemanager/redux/store');
	const { dispatch } = store;
	const { usersUpserted, usersSelector } = require('statemanager/redux/slices/users');
	const { upsertCheckIns } = require('stafftrack/statemanager/redux/slices/check-in');
	const { selectCheckInsByUser } = require('stafftrack/statemanager/redux/slices/check-in/selector');
	const {
		observeCheckInListChange,
	} = require('stafftrack/statemanager/redux/slices/check-in/observers/list-observer');

	const BOTTOM_SHEET_HEIGHT = 480;
	const ADDRESS_RERENDER_DELAY = 300;

	class TimelineBottomSheet extends LayoutComponent
	{
		constructor(props)
		{
			super(props);

			this.getTestId = createTestIdGenerator({
				prefix: 'timeline',
			});

			this.state = {
				loading: true,
			};
			this.isDayClosed = false;
			this.dayCloseTimestamp = null;
			this.aggregator = new AutoCheckInAggregator();
			this.localCheckIns = [];

			this.handlePullEvent = this.#onPullEvent.bind(this);
			this.checkInListObserver = null;
			this.mounted = false;

			this.rerenderAfterAddress = debounce(this.#rerenderAfterAddress, ADDRESS_RERENDER_DELAY, this);
		}

		async componentDidMount()
		{
			this.mounted = true;
			await this.#getTimelineData();
			BX.addCustomEvent('onPullEvent-stafftrack', this.handlePullEvent);
			if (this.props.isToday)
			{
				this.checkInListObserver = observeCheckInListChange(store, () => this.setState({}));
			}
		}

		componentWillUnmount()
		{
			this.mounted = false;
			BX.removeCustomEvent('onPullEvent-stafftrack', this.handlePullEvent);
			this.checkInListObserver?.unsubscribe();
			this.checkInListObserver = null;
		}

		#rerenderAfterAddress()
		{
			if (this.mounted)
			{
				this.setState({});
			}
		}

		#onPullEvent(command, params)
		{
			if (command === PullCommand?.CHECK_IN_ADDRESS_RESOLVED.getValue())
			{
				this.#handleAddressResolved(params);
			}
		}

		#handleAddressResolved(params)
		{
			if (!Type.isPlainObject(params))
			{
				return;
			}

			const sourceCheckIns = this.props.isToday
				? selectCheckInsByUser(store.getState(), Number(this.props.userId), this.props.timestamp)
				: this.localCheckIns;

			const updates = [];
			for (const [checkInId, address] of Object.entries(params))
			{
				if (!Type.isStringFilled(address))
				{
					continue;
				}

				const entity = sourceCheckIns.find((c) => Number(c.id) === Number(checkInId));
				if (entity)
				{
					updates.push({ ...entity, address });
				}
			}

			if (updates.length === 0)
			{
				return;
			}

			if (this.props.isToday)
			{
				dispatch(upsertCheckIns(updates));
			}
			else
			{
				const byId = new Map(updates.map((u) => [Number(u.id), u]));
				this.localCheckIns = this.localCheckIns.map((c) => byId.get(Number(c.id)) || c);
			}

			this.rerenderAfterAddress();
		}

		async #getTimelineData()
		{
			const timelineData = await this.#getUserCheckInByDate();
			if (!timelineData)
			{
				return;
			}

			this.#prepareData(timelineData);
			this.setState({
				loading: false,
			});
		}

		#prepareData(timelineData)
		{
			const rawUsers = timelineData.users;
			const rawCheckIns = timelineData.checkIns || [];

			if (Type.isArrayFilled(rawUsers))
			{
				dispatch(usersUpserted(rawUsers));
			}

			if (Type.isArrayFilled(rawCheckIns))
			{
				if (this.props.isToday)
				{
					dispatch(upsertCheckIns(rawCheckIns));
				}
				else
				{
					this.localCheckIns = rawCheckIns;
				}
			}

			this.isDayClosed = timelineData.isDayClosed === true;
			this.dayCloseTimestamp = Number.isFinite(timelineData.dayCloseTimestamp)
				? timelineData.dayCloseTimestamp
				: null;
		}

		#getItems()
		{
			const { userId, timestamp, isToday } = this.props;
			const checkIns = isToday
				? selectCheckInsByUser(store.getState(), Number(userId), timestamp)
				: this.localCheckIns;

			return this.aggregator
				.aggregate(checkIns, { dayCloseTimestamp: this.dayCloseTimestamp })
				.map((checkIn) => this.#mapCheckIn(checkIn));
		}

		#getUser()
		{
			const userId = Number(this.props.userId);

			return usersSelector.selectById(store.getState(), userId) || null;
		}

		#mapCheckIn(checkIn)
		{
			return {
				id: checkIn.id,
				userId: checkIn.userId,
				dateCreate: checkIn.dateCreate,
				checkInType: checkIn.entityType,
				address: checkIn.address || '',
				description: checkIn.description || '',
				duration: checkIn.duration ?? null,
				files: checkIn.files,
			};
		}

		#getUserCheckInByDate = async () => {
			const { userId, timestamp, layoutWidget } = this.props;
			if (!userId)
			{
				return [];
			}

			const result = await BX.ajax.runAction('stafftrackmobile.v2.CheckIn.getUserCheckInByDate', {
				data: {
					userId,
					timestamp,
				},
			});

			if (result.status === 'success' && result.data)
			{
				return result.data;
			}

			console.error('Failed to load getUserCheckInByDate', result);
			showErrorToast({
				message: Loc.getMessage('STAFFTRACK_TIMELINE_TOAST_ERROR'),
				layoutWidget,
			});

			return [];
		};

		static open({ userId, timestamp, isToday = true, selectedItemId, widget, onChatClick })
		{
			const bottomSheet = new BottomSheet({
				component: (layoutWidget) => new TimelineBottomSheet({
					userId,
					timestamp,
					isToday,
					selectedItemId,
					layoutWidget,
					onChatClick,
				}),
			})
				.setMediumPositionHeight(BOTTOM_SHEET_HEIGHT)
				.disableOnlyMediumPosition()
				.hideNavigationBar();

			if (widget)
			{
				bottomSheet.setParentWidget(widget);
			}

			return bottomSheet.open();
		}

		render()
		{
			const { loading } = this.state;
			const showFooter = !this.#isCurrentUser();
			const items = loading ? [] : this.#getItems();

			return Box(
				{
					testId: this.getTestId('backdrop'),
					footer: showFooter ? this.#renderFooter() : null,
					backgroundColor: Color.bgPrimary,
				},
				!loading && this.#renderNavigationBar(),
				!loading && this.#renderTimeline(items, showFooter),
				loading && Shimmer(),
			);
		}

		#isCurrentUser()
		{
			const { userId } = this.props;

			return userId === Number(env.userId);
		}

		#renderFooter = () => {
			const { loading } = this.state;

			return BoxFooter(
				{
					testId: this.getTestId('box-footer'),
					style: {
						justifyContent: 'center',
					},
				},
				View(
					{
						style: {
							flexDirection: 'row',
						},
					},
					Button({
						testId: this.getTestId('chat-button'),
						text: Loc.getMessage('STAFFTRACK_TIMELINE_CHAT_BUTTON'),
						design: ButtonDesign.FILLED,
						size: ButtonSize.L,
						stretched: true,
						onClick: this.#handleChatClick,
						disabled: Boolean(loading),
					}),
					Button({
						testId: this.getTestId('call-button'),
						text: Loc.getMessage('STAFFTRACK_TIMELINE_CALL_BUTTON'),
						design: ButtonDesign.OUTLINE,
						size: ButtonSize.L,
						stretched: true,
						disabled: Boolean(loading),
						style: {
							marginLeft: Indent.XL.toNumber(),
						},
						onClick: this.#handleCallClick,
					}),
				),
			);
		};

		#handleChatClick = () => {
			const { layoutWidget, onChatClick, userId } = this.props;
			const dialogParams = { dialogId: String(userId) };

			if (Type.isFunction(onChatClick))
			{
				layoutWidget.close(() => onChatClick(dialogParams));

				return;
			}

			BX.postComponentEvent('onOpenDialog', [dialogParams], 'im.recent');
			BX.postComponentEvent('ImMobile.Messenger.Dialog:open', [dialogParams], 'im.messenger');
		};

		#handleCallClick = () => {
			confirmDefaultAction({
				title: Loc.getMessage('STAFFTRACK_TIMELINE_CALL_CONFIRM_TITLE'),
				actionButtonText: Loc.getMessage('STAFFTRACK_TIMELINE_CALL_CONFIRM_ACTION'),
				cancelButtonText: Loc.getMessage('STAFFTRACK_TIMELINE_CALL_CONFIRM_CANCEL'),
				onAction: () => this.#startVideoCall(),
			});
		};

		#startVideoCall()
		{
			const { userId } = this.props;
			const user = this.#getUser();

			BX.postComponentEvent(
				'onCallInvite',
				[
					{
						userId,
						video: true,
						chatData: {
							dialogId: String(userId),
							chatId: String(userId),
							name: user?.fullName,
							avatar: user?.avatarSize100 ? withCurrentDomain(user.avatarSize100) : null,
						},
						userData: {
							[userId]:
								{
									id: userId,
									avatar: user?.avatarSize100 ? withCurrentDomain(user.avatarSize100) : null,
									name: user?.fullName,
								},
						},
					},
				],
			);
		}

		#renderNavigationBar()
		{
			const user = this.#getUser();
			if (!user)
			{
				return null;
			}

			return NavigationBar({
				testId: this.getTestId('navbar'),
				id: user.id,
				name: user.fullName,
				position: user.workPosition,
				avatarUri: user.avatarSize100 ? withCurrentDomain(user.avatarSize100) : null,
				withRedux: true,
			});
		}

		#renderTimeline(items, withFooterStub)
		{
			const { timestamp, selectedItemId } = this.props;
			const date = new Date(timestamp * 1000);

			if (items.length === 0)
			{
				return null;
			}

			return new TimelineContent({
				items,
				date,
				withFooterStub,
				selectedItemId,
				isDayClosed: this.isDayClosed,
			});
		}
	}

	module.exports = { TimelineBottomSheet };
});
