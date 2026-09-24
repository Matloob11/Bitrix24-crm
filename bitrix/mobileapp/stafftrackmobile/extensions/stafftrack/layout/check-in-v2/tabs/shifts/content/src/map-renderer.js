/**
 * @module stafftrack/layout/check-in-v2/tabs/shifts/content/src/map-renderer
 */
jn.define('stafftrack/layout/check-in-v2/tabs/shifts/content/src/map-renderer', (require, exports, module) => {
	const { MarkerType } = require('stafftrack/layout/check-in-v2/tabs/shifts/content/src/marker-type');
	const { AutoCheckInType, PushAction } = require('stafftrack/check-in-v2/auto-check-in/aggregator');
	const { withCurrentDomain } = require('utils/url');
	const { DateHelper } = require('stafftrack/date-helper');

	const ENTITY_TYPE_AUTO = 2;

	const VIEW_MODE = {
		EMPLOYEE_LIST: 'employeeList',
		EMPLOYEE_ROUTE: 'employeeRoute',
	};

	const getMarkerType = (checkIn) => {
		if (checkIn.entityType !== ENTITY_TYPE_AUTO)
		{
			return MarkerType.CHECK_IN;
		}

		if (checkIn.description === AutoCheckInType.MOVING_POINT)
		{
			return MarkerType.TRANSIT_AUTO_CHECK_IN;
		}

		return MarkerType.AUTO_CHECK_IN;
	};

	const isAutoMarkerType = (type) => {
		return type === MarkerType.AUTO_CHECK_IN
			|| type === MarkerType.TRANSIT_AUTO_CHECK_IN;
	};

	class CheckInMapRenderer
	{
		#content;

		constructor(content)
		{
			this.#content = content;
		}

		applyCheckInAdded({ checkIn, user })
		{
			const dateFilter = this.#content.dateFilter;
			if (dateFilter && !dateFilter.isCheckInMatchDate(checkIn))
			{
				return;
			}

			const { viewMode, selectedEmployeeId } = this.#content.state;

			if (viewMode === VIEW_MODE.EMPLOYEE_LIST)
			{
				this.#handleEmployeeList(checkIn, user);

				return;
			}

			if (viewMode === VIEW_MODE.EMPLOYEE_ROUTE)
			{
				this.#updateEmployeeData(checkIn, user);

				if (checkIn.userId === selectedEmployeeId)
				{
					this.#handleEmployeeRoute(checkIn);
				}

				this.#content.setState({});
			}
		}

		#updateEmployeeData(checkIn, user)
		{
			const date = new Date(checkIn.dateCreate);
			const dateCreateTs = date.getTime();
			const time = DateHelper.formatTime(date);
			const isAuto = checkIn.entityType === ENTITY_TYPE_AUTO;
			const type = isAuto ? MarkerType.AUTO_CHECK_IN : MarkerType.CHECK_IN;
			const coords = [checkIn.latitude, checkIn.longitude];

			let employee = this.#content.getEmployeeById(checkIn.userId);
			let isStale = false;
			if (employee)
			{
				const currentTs = employee.lastCheckIn?.dateCreateTs ?? 0;
				if (dateCreateTs > currentTs)
				{
					employee.lastCheckIn = { coords, time, type, dateCreateTs };
				}
				else
				{
					isStale = true;
				}
				employee.checkInsCount += 1;
			}
			else
			{
				employee = {
					id: checkIn.userId,
					checkInId: checkIn.id,
					name: user?.name || '',
					avatar: user?.avatar ? withCurrentDomain(user.avatar) : '',
					lastCheckIn: { coords, time, type, dateCreateTs },
					checkIns: [],
					checkInsCount: 1,
				};
				this.#content.employees.push(employee);
			}

			return { employee, isStale };
		}

		#handleEmployeeList(checkIn, user)
		{
			const { employee, isStale } = this.#updateEmployeeData(checkIn, user);

			if (this.#content.search?.isActive())
			{
				if (!this.#content.search.matchesEmployee(employee))
				{
					return;
				}

				if (this.#content.state.isSearchResultEmpty)
				{
					this.#content.mapRef?.enableClustering({ animated: true });
					this.#content.setState({ isSearchResultEmpty: false });
				}
			}

			const { lastCheckIn, avatar, checkInsCount } = employee;
			const markerType = lastCheckIn.type === MarkerType.AUTO_CHECK_IN
				? MarkerType.LAST_AUTO_CHECK_IN
				: MarkerType.LAST_CHECK_IN;

			this.#content.mapRef?.addMarkers([
				{
					id: this.#content.getEmployeeMarkerId(checkIn.userId),
					config: {
						coords: lastCheckIn.coords,
						markerIcon: {
							type: markerType,
							data: {
								avatarUrl: avatar,
								time: lastCheckIn.time,
								checkInCount: checkInsCount,
							},
						},
					},
				},
			]);

			const onlyMeOnMap = this.#content.employees.length === 1 && this.#content.employees[0].id === Number(env.userId);
			if (onlyMeOnMap && !isStale && checkIn.userId === Number(env.userId))
			{
				this.#content.mapRef?.fitBounds([lastCheckIn.coords]);
			}
		}

		#handleEmployeeRoute(checkIn)
		{
			const employee = this.#content.getEmployeeById(checkIn.userId);
			if (!employee)
			{
				return;
			}

			const actions = this.#content.aggregator.push(checkIn);
			const validActions = actions.filter((action) => action.type !== PushAction.NONE && action.item);
			if (validActions.length === 0)
			{
				return;
			}

			let lastCheckIn = null;
			for (const action of validActions)
			{
				const prepared = this.#prepareCheckIn(action.item);
				this.#updateEmployeeCheckIns(employee, action, prepared, checkIn.userId);
				lastCheckIn = prepared;
			}

			this.#addLastMarker(employee, lastCheckIn, checkIn.userId);
			this.#updateRoute(employee);

			employee.lastCheckIn = {
				coords: lastCheckIn.coords,
				time: lastCheckIn.time,
				type: lastCheckIn.type,
				dateCreateTs: lastCheckIn.dateCreateTs,
			};
		}

		#prepareCheckIn(aggregatedItem)
		{
			const date = new Date(aggregatedItem.dateCreate);

			return {
				id: aggregatedItem.id,
				coords: [aggregatedItem.latitude, aggregatedItem.longitude],
				time: DateHelper.formatTime(date),
				type: getMarkerType(aggregatedItem),
				isAuto: aggregatedItem.entityType === ENTITY_TYPE_AUTO,
				dateCreateTs: date.getTime(),
			};
		}

		#updateEmployeeCheckIns(employee, action, newCheckIn, userId)
		{
			if (action.type === PushAction.REPLACE)
			{
				this.#replaceCheckIn(employee, action.replaceId, newCheckIn, userId);
			}
			else
			{
				this.#appendCheckIn(employee, newCheckIn, userId);
			}
		}

		#replaceCheckIn(employee, replaceId, newCheckIn, userId)
		{
			const index = employee.checkIns.findIndex((item) => item.id === replaceId);
			if (index === -1)
			{
				return;
			}

			const old = employee.checkIns[index];

			const oldMarkerId = this.#content.getCheckInMarkerId(
				userId,
				old.id,
				isAutoMarkerType(old.type),
			);
			this.#content.mapRef?.removeMarkers([oldMarkerId]);

			// eslint-disable-next-line no-param-reassign
			employee.checkIns[index] = newCheckIn;
		}

		#appendCheckIn(employee, newCheckIn, userId)
		{
			const previousCount = employee.checkIns.length;

			if (previousCount > 0)
			{
				this.#updatePreviousLastMarker(employee, userId, previousCount);
			}

			employee.checkIns.push(newCheckIn);
		}

		#updatePreviousLastMarker(employee, userId, previousCount)
		{
			const prevCheckIn = employee.checkIns[previousCount - 1];
			const prevIsAuto = isAutoMarkerType(prevCheckIn.type);
			const prevMarkerId = this.#content.getCheckInMarkerId(userId, prevCheckIn.id, prevIsAuto);
			const prevType = this.#content.getCheckInType(prevCheckIn, previousCount - 1, previousCount + 1);

			this.#content.mapRef?.removeMarkers([prevMarkerId]);
			this.#content.mapRef?.addMarkers([
				{
					id: prevMarkerId,
					config: {
						coords: prevCheckIn.coords,
						markerIcon: {
							type: prevType,
							data: {
								time: prevCheckIn.time,
							},
						},
					},
				},
			]);
		}

		#addLastMarker(employee, newCheckIn, userId)
		{
			const markerType = newCheckIn.isAuto
				? MarkerType.LAST_AUTO_CHECK_IN
				: MarkerType.LAST_CHECK_IN;

			const markerId = this.#content.getCheckInMarkerId(userId, newCheckIn.id, newCheckIn.isAuto);

			this.#content.mapRef?.addMarkers([
				{
					id: markerId,
					config: {
						coords: newCheckIn.coords,
						markerIcon: {
							type: markerType,
							data: {
								time: newCheckIn.time,
								avatarUrl: employee.avatar,
							},
						},
					},
				},
			]);
		}

		#updateRoute(employee)
		{
			const routePoints = employee.checkIns.map((ci) => ci.coords);
			const { mapRef, routeConfig } = this.#content;

			mapRef?.removeLayers(['route-background', 'route-main']);
			mapRef?.addLayers([
				{
					id: 'route-background',
					config: {
						type: 'polyline',
						points: routePoints,
						options: routeConfig.backgroundLayer,
					},
				},
				{
					id: 'route-main',
					config: {
						type: 'polyline',
						points: routePoints,
						options: routeConfig.mainLayer,
					},
				},
			]);
		}
	}

	module.exports = {
		CheckInMapRenderer,
	};
});
