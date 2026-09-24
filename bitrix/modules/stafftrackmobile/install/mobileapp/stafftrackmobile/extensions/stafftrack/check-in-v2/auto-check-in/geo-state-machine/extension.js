/**
 * @module stafftrack/check-in-v2/auto-check-in/geo-state-machine
 */
jn.define('stafftrack/check-in-v2/auto-check-in/geo-state-machine', (require, exports, module) => {

	const { Geo } = require('utils/geo');

	function getDistance(p1, p2)
	{
		return Geo.getHaversineDistanceInMeters(p1.lat, p1.lon, p2.lat, p2.lon);
	}

	function calculateMedian(points)
	{
		const lats = points.map((p) => p.lat).sort((a, b) => a - b);
		const lons = points.map((p) => p.lon).sort((a, b) => a - b);
		const mid = Math.floor(points.length / 2);
		const isOdd = points.length % 2 === 1;

		return {
			lat: isOdd ? lats[mid] : (lats[mid - 1] + lats[mid]) / 2,
			lon: isOdd ? lons[mid] : (lons[mid - 1] + lons[mid]) / 2,
		};
	}

	function getBoundingBoxDiagonal(points)
	{
		const maxLat = Math.max(...points.map((p) => p.lat));
		const minLat = Math.min(...points.map((p) => p.lat));
		const maxLon = Math.max(...points.map((p) => p.lon));
		const minLon = Math.min(...points.map((p) => p.lon));

		return getDistance({ lat: minLat, lon: minLon }, { lat: maxLat, lon: maxLon });
	}

	const GeoState = Object.freeze({
		STAY: 'STAY',
		MOVING: 'MOVING',
	});

	const GeoEvent = Object.freeze({
		ENTER: 'ENTER',
		LEAVE: 'LEAVE',
		MOVING_POINT: 'MOVING_POINT',
	});

	const THRESHOLDS = Object.freeze({
		GPS_JUMP_SPEED_MS: 200 / 3.6,
		STAY_BBOX_DIAGONAL_METERS: 50,
		LEAVE_DISTANCE_METERS: 50,
		LEAVE_SPEED_MS: 15 / 3.6,
		BUFFER_SIZE: 10,
		MIN_POINTS_FOR_STAY: 3,
		LEAVE_CONFIRM_COUNT: 3,
		MOVING_POINT_INTERVAL_SEC: 600,
		POLL_MOVING_MS: 60_000,
		POLL_STAY_0_10_MS: 60_000,
		POLL_STAY_10_30_MS: 120_000,
		POLL_STAY_30_PLUS_MS: 300_000,
		STAY_TIER_1_SEC: 300,
		STAY_TIER_2_SEC: 900,
	});

	/**
	 * @class GeoStateMachine
	 */
	class GeoStateMachine
	{
		constructor()
		{
			this.state = this.#buildDefaultState();
		}

		getState()
		{
			return this.state;
		}

		setState(state)
		{
			this.state = { ...this.#buildDefaultState(), ...state };
		}

		resetState()
		{
			const { lastSentPoint } = this.state;
			this.state = this.#buildDefaultState();
			this.state.lastSentPoint = lastSentPoint;
			this.state.stateEnteredAt = Date.now();
		}

		/**
		 * @param {{ lat: number, lon: number, time: number }} currentPoint
		 * @returns {Array<{ event: string, point: { lat: number, lon: number, time: number } }>}
		 */
		processPoint(currentPoint)
		{
			this.#validateBufferByPosition(currentPoint);

			if (this.#shouldRejectAsGpsJump(currentPoint))
			{
				return [];
			}

			const speed = this.#getDerivedSpeed(currentPoint);
			this.state.lastReceivedPoint = currentPoint;

			if (this.state.status === GeoState.STAY)
			{
				return this.#processStayPoint(currentPoint, speed);
			}

			return this.#processNonStayPoint(currentPoint);
		}

		getPollingInterval()
		{
			if (this.state.status !== GeoState.STAY)
			{
				return THRESHOLDS.POLL_MOVING_MS;
			}

			const timeInStateSec = this.state.stateEnteredAt
				? (Date.now() - this.state.stateEnteredAt) / 1000
				: 0;

			if (timeInStateSec < THRESHOLDS.STAY_TIER_1_SEC)
			{
				return THRESHOLDS.POLL_STAY_0_10_MS;
			}

			if (timeInStateSec < THRESHOLDS.STAY_TIER_2_SEC)
			{
				return THRESHOLDS.POLL_STAY_10_30_MS;
			}

			return THRESHOLDS.POLL_STAY_30_PLUS_MS;
		}

		getAnchorLeaveEvent()
		{
			if (this.state.status === GeoState.STAY && this.state.anchorPoint)
			{
				return {
					event: GeoEvent.LEAVE,
					point: {
						lat: this.state.anchorPoint.lat,
						lon: this.state.anchorPoint.lon,
						time: this.state.lastPollTime,
					},
				};
			}

			return null;
		}

		setLastPollTime(time)
		{
			this.state.lastPollTime = time;
		}

		adjustStateEnteredAt(delta)
		{
			this.state.stateEnteredAt += delta;
		}

		updateLastSentPoint(point)
		{
			this.state.lastSentPoint = { lat: point.lat, lon: point.lon, time: point.time };
		}

		#buildDefaultState()
		{
			return {
				status: GeoState.MOVING,
				buffer: [],
				anchorPoint: null,
				lastSentPoint: null,
				lastReceivedPoint: null,
				leaveConfirmCount: 0,
				leaveStartPoint: null,
				lastPollTime: null,
				stateEnteredAt: null,
			};
		}

		#validateBufferByPosition(currentPoint)
		{
			if (this.state.status === GeoState.STAY || this.state.buffer.length === 0)
			{
				return;
			}

			const median = calculateMedian(this.state.buffer);
			const dist = getDistance(median, currentPoint);

			if (dist > THRESHOLDS.LEAVE_DISTANCE_METERS)
			{
				this.state.buffer = [];
			}
		}

		#shouldRejectAsGpsJump(currentPoint)
		{
			if (this.state.status === GeoState.STAY || this.state.buffer.length === 0)
			{
				return false;
			}

			const lastPoint = this.state.buffer[this.state.buffer.length - 1];
			const timeDiffSec = (currentPoint.time - lastPoint.time) / 1000;

			if (timeDiffSec > 0)
			{
				const speed = getDistance(lastPoint, currentPoint) / timeDiffSec;

				if (speed > THRESHOLDS.GPS_JUMP_SPEED_MS)
				{
					return true;
				}
			}

			return false;
		}

		#getDerivedSpeed(currentPoint)
		{
			const refPoint = this.state.status === GeoState.STAY
				? this.state.lastReceivedPoint
				: this.state.buffer[this.state.buffer.length - 1];

			if (!refPoint)
			{
				return 0;
			}

			const timeDiffSec = (currentPoint.time - refPoint.time) / 1000;

			if (timeDiffSec <= 0)
			{
				return 0;
			}

			return getDistance(refPoint, currentPoint) / timeDiffSec;
		}

		#processStayPoint(currentPoint, speed)
		{
			const events = [];
			const distToAnchor = getDistance(currentPoint, this.state.anchorPoint);

			if (distToAnchor > THRESHOLDS.LEAVE_DISTANCE_METERS || speed > THRESHOLDS.LEAVE_SPEED_MS)
			{
				this.state.leaveConfirmCount++;

				if (this.state.leaveConfirmCount === 1)
				{
					this.state.leaveStartPoint = currentPoint;
				}

				if (this.state.leaveConfirmCount >= THRESHOLDS.LEAVE_CONFIRM_COUNT)
				{
					const leavePoint = this.state.leaveStartPoint;
					this.state.status = GeoState.MOVING;
					this.state.anchorPoint = null;
					this.state.buffer = [];
					this.state.leaveConfirmCount = 0;
					this.state.leaveStartPoint = null;
					this.state.stateEnteredAt = currentPoint.time;

					events.push({ event: GeoEvent.LEAVE, point: leavePoint });
				}
			}
			else if (this.state.leaveConfirmCount > 0)
			{
				this.state.leaveConfirmCount = 0;
				this.state.leaveStartPoint = null;
			}

			return events;
		}

		#processNonStayPoint(currentPoint)
		{
			const events = [];

			this.state.buffer.push(currentPoint);

			if (this.state.buffer.length > THRESHOLDS.BUFFER_SIZE)
			{
				this.state.buffer.shift();
			}

			if (this.state.status)
			{
				const movingEvent = this.#checkMovingPoint(currentPoint);

				if (movingEvent)
				{
					events.push(movingEvent);
				}
			}

			if (this.state.buffer.length >= THRESHOLDS.MIN_POINTS_FOR_STAY)
			{
				const diagonal = getBoundingBoxDiagonal(this.state.buffer);

				if (diagonal < THRESHOLDS.STAY_BBOX_DIAGONAL_METERS)
				{
					const median = calculateMedian(this.state.buffer);
					const stayStartTime = this.state.buffer[0].time;
					this.state.status = GeoState.STAY;
					this.state.anchorPoint = median;
					this.state.stateEnteredAt = stayStartTime;

					return [{ event: GeoEvent.ENTER, point: { ...median, time: stayStartTime } }];
				}
			}

			return events;
		}

		#checkMovingPoint(currentPoint)
		{
			if (!this.state.lastSentPoint)
			{
				this.state.lastSentPoint = { lat: currentPoint.lat, lon: currentPoint.lon, time: currentPoint.time };

				return { event: GeoEvent.MOVING_POINT, point: currentPoint };
			}

			const timeSinceLastSentSec = (currentPoint.time - this.state.lastSentPoint.time) / 1000;

			if (timeSinceLastSentSec < THRESHOLDS.MOVING_POINT_INTERVAL_SEC)
			{
				return null;
			}

			this.state.lastSentPoint = { lat: currentPoint.lat, lon: currentPoint.lon, time: currentPoint.time };

			return { event: GeoEvent.MOVING_POINT, point: currentPoint };
		}
	}

	module.exports = { GeoStateMachine, GeoState, GeoEvent, THRESHOLDS };
});
