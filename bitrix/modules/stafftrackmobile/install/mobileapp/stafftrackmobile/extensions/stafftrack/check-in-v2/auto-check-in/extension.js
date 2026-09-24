/**
 * @module stafftrack/check-in-v2/auto-check-in
 */
jn.define('stafftrack/check-in-v2/auto-check-in', (require, exports, module) => {
	const { Feature } = require('feature');
	const { Tourist } = require('tourist');
	const { CheckInSender } = require('stafftrack/check-in-v2/auto-check-in/check-in-sender');
	const { GeoStateMachine, GeoEvent, GeoState } = require('stafftrack/check-in-v2/auto-check-in/geo-state-machine');
	const { SHARED_STORAGE_KEY } = require('stafftrack/check-in-v2/auto-check-in/const');
	const {
		LOCATION_PERMISSION_GRANTED_EVENT,
		LOCATION_PERMISSION_GRANTED_REMEMBERED,
	} = require('stafftrack/check-in-v2/location-permission-popup/const');
	const {
		getLocationPermissionPopupState,
	} = require('stafftrack/check-in-v2/location-permission-popup/api');
	const { CheckInTypeEnum } = require('stafftrack/check-in-v2/enums');
	const { Geo, GeoStatus } = require('utils/geo');
	const store = require('statemanager/redux/store');

	let selectIsWorkTimeOpened;
	let selectIsExpired;
	let fetchWorkTimeStatus;
	let subscribeToPullEvent;
	try
	{
		({
			selectIsOpened: selectIsWorkTimeOpened,
			selectIsExpired,
			fetchCurrentRecord: fetchWorkTimeStatus,
		} = require('timeman/statemanager/redux/slices/worktime'));
		({ subscribeToPullEvent } = require('timeman/statemanager/redux/slices/worktime/utils'));
	}
	catch (error)
	{
		console.error(error);

		module.exports = { AutoCheckIn: null };

		return;
	}

	const COORD_PRECISION = 4;
	const CACHE_TTL_SEC = 28800;
	const STATE_CACHE_KEY = 'auto_check_in_state';

	function roundCoord(value)
	{
		const factor = 10 ** COORD_PRECISION;

		return Math.round(value * factor) / factor;
	}

	/**
	 * @class AutoCheckIn
	 */
	class AutoCheckIn
	{
		constructor()
		{
			this.sender = new CheckInSender();
			this.geo = new GeoStateMachine();
			this.geoLocator = new Geo({ shouldShowAlert: false });
			this.timer = null;
			this.isRunning = false;
			this.isStarting = false;
			this.isProcessing = false;
			this.dirty = false;
			this.cycleId = 0;
			this.lastSentEvent = null;
			this.lastSentCoordKey = null;

			this.stopTracking = this.stopTracking.bind(this);
			this.startTracking = this.startTracking.bind(this);
			this.handleOnline = this.handleOnline.bind(this);

			this.subscribeToEvents();
			this.startTracking();
		}

		subscribeToEvents()
		{
			BX.addCustomEvent('onAppPaused', this.stopTracking);
			BX.addCustomEvent('onAppActive', this.startTracking);
			BX.addCustomEvent('online', this.handleOnline);
			BX.addCustomEvent('onPullEvent-timeman', (command, params) => {
				subscribeToPullEvent({ command, params });
				if (command === 'stop')
				{
					this.handleWorkDayStop();
				}
			});
			BX.addCustomEvent('stafftrack_add_check-in', () => {
				this.handleManualCheckIn();
			});
			BX.addCustomEvent(LOCATION_PERMISSION_GRANTED_EVENT, this.startTracking);

			this.subscribeToWorkTimeStore();
		}

		subscribeToWorkTimeStore()
		{
			let prevIsOpened = selectIsWorkTimeOpened(store.getState());

			store.subscribe(() => {
				const isOpened = selectIsWorkTimeOpened(store.getState());

				if (isOpened !== prevIsOpened)
				{
					prevIsOpened = isOpened;

					if (isOpened)
					{
						this.resumeTracking();
					}
					else
					{
						this.stopTracking();
					}
				}
			});
		}

		handleManualCheckIn()
		{
			if (this.geo.getState().status === GeoState.STAY)
			{
				this.geo.resetState();

				// prevent MOVING_POINT after cache reset
				const { lastSentPoint } = this.geo.getState();
				if (lastSentPoint)
				{
					this.geo.updateLastSentPoint({ ...lastSentPoint, time: Date.now() });
				}

				this.lastSentEvent = null;
				this.lastSentCoordKey = null;
				this.markDirty();
			}
		}

		async handleWorkDayStop()
		{
			const isExpired = selectIsExpired(store.getState());

			if (!isExpired)
			{
				let { lastReceivedPoint } = this.geo.getState();

				if (!lastReceivedPoint)
				{
					const position = await this.getPosition();
					if (position)
					{
						lastReceivedPoint = {
							lat: position.latitude,
							lon: position.longitude,
							time: Date.now(),
						};
					}
				}

				if (lastReceivedPoint)
				{
					this.dispatchCheckIn(GeoEvent.LEAVE, lastReceivedPoint);
				}
			}

			this.geo.resetState();
			this.lastSentEvent = null;
			this.lastSentCoordKey = null;
			this.markDirty();
			this.stopTracking();
		}

		handleOnline()
		{
			this.sender.retrySending();
		}

		async startTracking()
		{
			if (this.isRunning || this.isStarting)
			{
				return;
			}

			this.isStarting = true;

			try
			{
				if (!await this.passesTrackingPreconditions())
				{
					return;
				}

				await store.dispatch(fetchWorkTimeStatus());

				if (!this.isWorkdayValidForTracking())
				{
					return;
				}

				await this.beginTracking();
			}
			finally
			{
				this.isStarting = false;
			}
		}

		async resumeTracking()
		{
			if (this.isRunning || this.isStarting)
			{
				return;
			}

			if (!await this.passesTrackingPreconditions())
			{
				return;
			}

			if (!this.isWorkdayValidForTracking())
			{
				return;
			}

			await this.beginTracking();
		}

		async passesTrackingPreconditions()
		{
			if (!await this.isAutoCheckInEnabledInSettings())
			{
				return false;
			}

			if (!await this.isLocationPermissionGrantedRemembered())
			{
				return false;
			}

			if (!await this.hasLocationPermission())
			{
				return false;
			}

			return true;
		}

		isWorkdayValidForTracking()
		{
			const isWorkTimeOpened = selectIsWorkTimeOpened(store.getState());
			const isWorkTimeExpired = selectIsExpired(store.getState());

			return isWorkTimeOpened && !isWorkTimeExpired;
		}

		async isAutoCheckInEnabledInSettings()
		{
			const { isAutoCheckInEnabledInSettings } = await getLocationPermissionPopupState();

			return isAutoCheckInEnabledInSettings;
		}

		async hasLocationPermission()
		{
			if (!Feature.isLocationStatusSupported())
			{
				return false;
			}

			const status = await Geo.getLocationStatus();

			return Geo.isLocationPermissionGranted(status);
		}

		async isLocationPermissionGrantedRemembered()
		{
			await Tourist.ready();

			return !Tourist.firstTime(LOCATION_PERMISSION_GRANTED_REMEMBERED);
		}

		async beginTracking()
		{
			this.isRunning = true;
			const currentCycleId = ++this.cycleId;

			await this.loadState();

			if (currentCycleId !== this.cycleId)
			{
				this.isRunning = false;

				return;
			}

			const { lastPollTime } = this.geo.getState();
			if (lastPollTime !== null)
			{
				const elapsedSec = (Date.now() - lastPollTime) / 1000;

				if (elapsedSec > CACHE_TTL_SEC)
				{
					const leaveEvent = this.geo.getAnchorLeaveEvent();
					if (leaveEvent)
					{
						this.dispatchCheckIn(leaveEvent.event, leaveEvent.point);
					}

					this.geo.resetState();
					this.lastSentEvent = null;
					this.lastSentCoordKey = null;
					this.markDirty();
					this.saveState();
				}
				else if (this.geo.getState().stateEnteredAt !== null)
				{
					this.geo.adjustStateEnteredAt(Date.now() - lastPollTime);
					this.markDirty();
				}
			}

			this.sender.retrySending();

			await this.processPoint();

			if (currentCycleId !== this.cycleId)
			{
				this.isRunning = false;

				return;
			}

			this.saveState();
			this.scheduleNext();
		}

		stopTracking()
		{
			if (this.timer !== null)
			{
				clearTimeout(this.timer);
				this.timer = null;
			}

			this.isRunning = false;

			this.geo.setLastPollTime(Date.now());
			this.markDirty();
			this.saveState();
		}

		async loadState()
		{
			const result = Application.sharedStorage(SHARED_STORAGE_KEY).get(STATE_CACHE_KEY);

			const cached = result ? JSON.parse(result) : null;

			if (cached && cached.status)
			{
				this.geo.setState(cached);
				this.lastSentEvent = cached.lastSentEvent || null;
				this.lastSentCoordKey = cached.lastSentCoordKey || null;
			}

			await this.sender.loadPendingQueue();

			this.dirty = false;
		}

		saveState()
		{
			if (!this.dirty)
			{
				return;
			}

			this.dirty = false;

			const state = {
				...this.geo.getState(),
				lastSentEvent: this.lastSentEvent,
				lastSentCoordKey: this.lastSentCoordKey,
			};

			Application.sharedStorage(SHARED_STORAGE_KEY).set(STATE_CACHE_KEY, JSON.stringify(state));
		}

		markDirty()
		{
			this.dirty = true;
		}

		async processPoint()
		{
			if (this.isProcessing)
			{
				return;
			}

			if (!this.isWorkdayValidForTracking())
			{
				return;
			}

			this.isProcessing = true;

			try
			{
				const position = await this.getPosition();

				if (position)
				{
					const currentPoint = {
						lat: position.latitude,
						lon: position.longitude,
						time: Date.now(),
					};

					const events = this.geo.processPoint(currentPoint);

					for (const { event, point } of events)
					{
						this.dispatchCheckIn(event, point);
					}

					this.markDirty();
				}
			}
			finally
			{
				this.isProcessing = false;
			}
		}

		dispatchCheckIn(event, point)
		{
			const coordKey = `${roundCoord(point.lat)}:${roundCoord(point.lon)}`;

			if (
				event === GeoEvent.ENTER
				&& this.lastSentEvent === GeoEvent.ENTER
				&& this.lastSentCoordKey === coordKey
			)
			{
				return;
			}

			this.lastSentEvent = event;
			this.lastSentCoordKey = coordKey;
			if (event === GeoEvent.MOVING_POINT)
			{
				this.geo.updateLastSentPoint(point);
			}

			this.sender.send({
				entityType: CheckInTypeEnum.AUTOMATIC.getValue(),
				latitude: roundCoord(point.lat),
				longitude: roundCoord(point.lon),
				dateCreate: Math.floor(point.time / 1000),
				description: event,
			});
		}

		scheduleNext()
		{
			if (!this.isRunning)
			{
				return;
			}

			const activeCycleId = this.cycleId;
			const interval = this.geo.getPollingInterval();

			this.timer = setTimeout(async () => {
				if (activeCycleId !== this.cycleId)
				{
					return;
				}

				await this.processPoint();
				this.geo.setLastPollTime(Date.now());
				this.markDirty();
				this.saveState();
				this.scheduleNext();
			}, interval);
		}

		async getPosition()
		{
			const result = await this.geoLocator.requestPosition();

			if (result.status === GeoStatus.SUCCESS)
			{
				return result;
			}

			return null;
		}
	}

	module.exports = { AutoCheckIn };
});
