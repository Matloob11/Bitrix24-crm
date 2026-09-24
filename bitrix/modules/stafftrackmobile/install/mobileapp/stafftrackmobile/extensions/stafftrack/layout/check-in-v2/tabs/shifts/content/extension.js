/**
 * @module stafftrack/layout/check-in-v2/tabs/shifts/content
 */
jn.define('stafftrack/layout/check-in-v2/tabs/shifts/content', (require, exports, module) => {
	const { Map, EventType } = require('layout/ui/map');
	const { Indent, Color, Component } = require('tokens');
	const { IconView, Icon } = require('ui-system/blocks/icon');
	const { BadgeButton, BadgeButtonDesign, BadgeButtonSize } = require('ui-system/blocks/badges/button');
	const { Avatar, AvatarEntityType } = require('ui-system/blocks/avatar');
	const { Text2, Text3 } = require('ui-system/typography/text');
	const { BBCodeText } = require('ui-system/typography/bbcodetext');
	const { Loc } = require('loc');
	const { PropTypes } = require('utils/validation');
	const { createTestIdGenerator } = require('utils/test');
	const { MarkerType } = require('stafftrack/layout/check-in-v2/tabs/shifts/content/src/marker-type');
	const { TimelineBottomSheet } = require('stafftrack/check-in-v2/timeline');
	const { AutoCheckInAggregator, AutoCheckInType } = require('stafftrack/check-in-v2/auto-check-in/aggregator');
	const { ClusterEmployeesBox } = require('stafftrack/check-in-v2/cluster-employees');
	const { CheckInForm } = require('stafftrack/layout/check-in-v2/form');
	const { DisabledCheckInView } = require('stafftrack/layout/check-in-v2/disabled-view');
	const { DisabledGeoView } = require('stafftrack/layout/check-in-v2/disabled-geo-view');
	const { UnsupportedMapView } = require('stafftrack/layout/check-in-v2/unsupported-map-view');
	const { Feature } = require('stafftrack/feature');
	const { Geo, GeoStatus } = require('utils/geo');
	const { MoreMenu } = require('stafftrack/check-in-v2/more-menu');
	const { stubImageUri } = require('stafftrack/layout/check-in-v2/tabs/shifts/stub');
	const { Type } = require('type');
	const { withCurrentDomain } = require('utils/url');
	const { CheckInMapRenderer } = require('stafftrack/layout/check-in-v2/tabs/shifts/content/src/map-renderer');
	const { showErrorToast } = require('toast');
	const { DialogOpener } = require('im/messenger/api/dialog-opener');
	const { DateHelper } = require('stafftrack/date-helper');
	const { Search } = require('stafftrack/layout/check-in-v2/tabs/shifts/content/src/search');
	const { SearchEmptyState } = require('stafftrack/layout/check-in-v2/tabs/shifts/content/src/search-empty-state');
	const { DateFilter } = require('stafftrack/layout/check-in-v2/tabs/shifts/content/src/date-filter');
	const { getMapData, getEmployeeRoute } = require('stafftrack/layout/check-in-v2/tabs/shifts/content/src/api');
	const { Notify } = require('notify');
	const store = require('statemanager/redux/store');
	const { dispatch } = store;
	const {
		upsertCheckIns,
		setStatsByUser,
	} = require('stafftrack/statemanager/redux/slices/check-in');
	const {
		selectCheckInsByUser,
		selectCheckInCountByUser,
	} = require('stafftrack/statemanager/redux/slices/check-in/selector');
	const {
		observeCheckInListChange,
	} = require('stafftrack/statemanager/redux/slices/check-in/observers/list-observer');
	const {
		subscribeToCheckInPullEvents,
		unsubscribeFromCheckInPullEvents,
	} = require('stafftrack/statemanager/redux/slices/check-in/pull');
	const { usersUpserted, usersSelector } = require('statemanager/redux/slices/users');
	const { batchActions } = require('statemanager/redux/batched-actions');
	let WorkDayPill = null;
	let subscribeToWorkDayState = null;
	let WorkdayState = null;
	try
	{
		const workdayPill = require('timeman/workday-pill');
		WorkDayPill = workdayPill.WorkDayPill;
		subscribeToWorkDayState = workdayPill.subscribeToWorkDayState;
		WorkdayState = workdayPill.WorkdayState;
	}
	catch (error)
	{
		console.error(error);
	}

	const VIEW_MODE = {
		EMPLOYEE_LIST: 'employeeList',
		EMPLOYEE_ROUTE: 'employeeRoute',
	};

	const ROUTE_STATUS = {
		IDLE: 'idle',
		LOADING: 'loading',
		READY: 'ready',
	};

	const BoundsPaddingToFit = {
		DEFAULT: [20, 50, 80, 20],
		SEARCH: [20, 50, 250, 20],
	};

	const ENTITY_TYPE_MANUAL = 1;
	const ENTITY_TYPE_AUTO = 2;

	const BOTTOM_BUTTON_HEIGHT = 58;
	const BOTTOM_BUTTON_AVATAR_SIZE = 32;

	class Content extends LayoutComponent
	{
		#worktimeUnsubscribe = null;
		#workdayState = null;
		#initialFocusApplied = false;

		constructor(props)
		{
			super(props);

			this.getTestId = createTestIdGenerator({
				prefix: 'shifts',
			});

			this.geo = new Geo();
			this.geoStatus = null;
			this.geoPosition = null;

			this.state = {
				isDisabled: this.props.preloadData.isEnabled !== true,
				isGeoDisabled: false,
				isLoading: true,
				isSearchResultEmpty: false,
				viewMode: VIEW_MODE.EMPLOYEE_LIST,
				selectedEmployeeId: null,
				isMapReady: false,
				routeStatus: ROUTE_STATUS.IDLE,
			};

			/** @type {Map} */
			this.mapRef = null;

			/** @type {Search} */
			this.search = null;

			/** @type {DateFilter} */
			this.dateFilter = null;

			this.employees = [];
			this.hasSubordinates = false;
			this.isWesternPortal = true;
			this.aggregator = new AutoCheckInAggregator();
			this.mapRenderer = new CheckInMapRenderer(this);

			this.routeConfig = {
				backgroundLayer: {
					color: Color.base8.toHex(),
					weight: 6,
					opacity: 1,
				},
				mainLayer: {
					color: Color.accentMainLink.toHex(),
					weight: 4,
					dashArray: '16, 8',
					opacity: 1,
				},
			};

			this.isBottomTabActive = true;
			this.isTopTabActive = true;
			this.pendingCheckInEnabled = false;

			this.requestGeo = this.#requestGeo.bind(this);
		}

		componentDidMount()
		{
			this.#setRightButtons();

			BX.addCustomEvent('check-in-settings:enabled', this.#onCheckInEnabled);
			BX.addCustomEvent('check-in-settings:disabled', this.#onCheckInDisabled);
			BX.addCustomEvent('onTabsSelected', this.#onBottomTabSelected);
			BX.addCustomEvent('stafftrack.check-in-v2.tabs:onTabSelected', this.#onTopTabSelected);

			this.#subscribeToWorktime();

			if (Feature.isCheckinMapSupported() && !this.state.isDisabled)
			{
				void this.#requestGeo();
			}
		}

		#subscribeToWorktime()
		{
			if (!subscribeToWorkDayState)
			{
				return;
			}

			this.#worktimeUnsubscribe = subscribeToWorkDayState((widgetState) => {
				this.#workdayState = widgetState;
				this.#updateMapGrayscale(widgetState);
			});
		}

		#updateMapGrayscale(widgetState)
		{
			const grayscaleStates = new Set([
				WorkdayState?.NOT_STARTED,
				WorkdayState?.PAUSED,
				WorkdayState?.CLOSED,
			]);
			this.mapRef?.setGrayscale(grayscaleStates.has(widgetState));
		}

		componentWillUnmount()
		{
			this.#unsubscribeFromEvents();
			this.#worktimeUnsubscribe?.();
		}

		#unsubscribeFromEvents()
		{
			this.checkInListObserver?.unsubscribe();
			this.checkInListObserver = null;
			BX.removeCustomEvent('onAppActive', this.requestGeo);
			BX.removeCustomEvent('check-in-settings:disabled', this.#onCheckInDisabled);
			unsubscribeFromCheckInPullEvents();
		}

		#setRightButtons()
		{
			const { parentWidget } = this.props;
			const { isDisabled, isGeoDisabled, isLoading } = this.state;

			parentWidget.setRightButtons(
				[
					!isDisabled && !isGeoDisabled && !isLoading && this.search?.getSearchButton(),
					!isDisabled && !isGeoDisabled && !isLoading && this.dateFilter?.getDateFilterButton(),
					{
						type: Icon.MORE.getIconName(),
						callback: () => {
							this.moreMenu ??= new MoreMenu({ layoutWidget: parentWidget });
							this.moreMenu.show();
						},
					},
				].filter(Boolean),
			);
		}

		#onBottomTabSelected = (tabId) => {
			this.isBottomTabActive = tabId === 'check-in';
			this.#tryFlushPendingCheckInEnabled();
		};

		#onTopTabSelected = ({ tabId, changed }) => {
			if (changed)
			{
				this.isTopTabActive = tabId === 'shifts';
				this.#tryFlushPendingCheckInEnabled();
			}
		};

		#onCheckInEnabled = () => {
			if (!this.state.isDisabled)
			{
				return;
			}

			if (!this.isBottomTabActive || !this.isTopTabActive)
			{
				this.pendingCheckInEnabled = true;

				return;
			}

			this.geoStatus = null;
			void this.#requestGeo();
		};

		#tryFlushPendingCheckInEnabled()
		{
			if (!this.pendingCheckInEnabled || !this.isBottomTabActive || !this.isTopTabActive)
			{
				return;
			}

			this.pendingCheckInEnabled = false;

			if (!this.state.isDisabled)
			{
				return;
			}

			this.geoStatus = null;
			void this.#requestGeo();
		}

		#onCheckInDisabled = () => {
			if (this.state.isDisabled)
			{
				return;
			}

			this.pendingCheckInEnabled = false;
			this.#unsubscribeFromEvents();
			this.setState({ isDisabled: true }, () => this.#setRightButtons());
		};

		async #requestGeo()
		{
			if (!this.isBottomTabActive || !this.isTopTabActive)
			{
				return;
			}

			BX.removeCustomEvent('onAppActive', this.requestGeo);

			const { status, latitude, longitude } = await this.geo.requestPosition();
			if (status !== this.geoStatus)
			{
				this.geoStatus = status;

				if (status === GeoStatus.SUCCESS)
				{
					this.geoPosition = { latitude, longitude };
					void this.#init();
				}
				else
				{
					this.setState(
						{
							isDisabled: false,
							isGeoDisabled: true,
						},
						() => this.#setRightButtons(),
					);
				}
			}

			BX.addCustomEvent('onAppActive', this.requestGeo);
		}

		async #init()
		{
			await this.loadMapData();

			this.dateFilter = new DateFilter({
				isWesternPortal: this.isWesternPortal,
				onSelect: () => this.#reloadMap(),
				onReset: () => this.#reloadMap(),
			});

			if (this.hasSubordinates)
			{
				this.search = new Search({
					layout: this.props.parentWidget,
					onShow: this.#onSearchShow,
					onHide: this.#onSearchHide,
					onSearch: this.#onSearchChange,
					onCancel: this.#onSearchReset,
				});
			}

			subscribeToCheckInPullEvents();
			this.checkInListObserver = observeCheckInListChange(store, this.#onCheckInListChange);

			this.setState(
				{
					isDisabled: false,
					isGeoDisabled: false,
					isLoading: false,
				},
				() => {
					this.#setRightButtons();
					this.showEmployeeList();
				},
			);
		}

		async #reloadMap()
		{
			const timestamp = this.dateFilter.isTodaySelected() ? 0 : this.dateFilter.getSelectedTimestamp();
			void Notify.showIndicatorLoading();
			try
			{
				await this.loadMapData(timestamp);
			}
			finally
			{
				Notify.hideCurrentIndicator();
			}

			this.#setRightButtons();
			this.showEmployeeList();
		}

		#onSearchShow = () => this.mapRef?.updateSettings({ fitBoundsPadding: BoundsPaddingToFit.SEARCH });

		#onSearchHide = () => this.mapRef?.updateSettings({ fitBoundsPadding: BoundsPaddingToFit.DEFAULT });

		#onSearchChange = () => {
			this.#setRightButtons();
			this.#showFilteredEmployees();
		};

		#onSearchReset = () => {
			this.#setRightButtons();
			this.#onSearchHide();
			this.setState({ isSearchResultEmpty: false }, () => this.showEmployeeList());
		};

		#showFilteredEmployees(toFitBounds = true)
		{
			this.mapRef?.clearMarkers();
			this.mapRef?.clearLayers();
			this.mapRef?.disableClustering();

			const filteredEmployees = this.employees.filter((employee) => this.search.matchesEmployee(employee));
			if (!Type.isArrayFilled(filteredEmployees))
			{
				this.setState({
					isSearchResultEmpty: true,
					viewMode: VIEW_MODE.EMPLOYEE_LIST,
					selectedEmployeeId: null,
				});

				return;
			}

			this.mapRef?.addMarkers(filteredEmployees.map((employee) => this.#createEmployeeListMarker(employee)));
			this.mapRef?.enableClustering({ animated: true });
			if (toFitBounds)
			{
				this.mapRef?.fitBounds(filteredEmployees.map((employee) => employee.lastCheckIn.coords));
			}

			this.setState({
				isSearchResultEmpty: false,
				viewMode: VIEW_MODE.EMPLOYEE_LIST,
				selectedEmployeeId: null,
			});
		}

		#onCheckInListChange = ({ addedCheckIns, hasRemoved, state }) => {
			const selfId = Number(env.userId);
			const selfChanged = this.#processAddedCheckIns(addedCheckIns, state, selfId) || hasRemoved;

			if (selfChanged)
			{
				this.#refreshSelfRender();
			}
		};

		#onManualCheckInAdded = ({ latitude, longitude } = {}) => {
			if (!this.#canPanMapToPoint(latitude, longitude))
			{
				return;
			}

			if (!this.#isViewingToday())
			{
				return;
			}

			if (this.#isSearchResultsViewActive())
			{
				return;
			}

			if (this.#isViewingOtherEmployeeRoute())
			{
				this.showEmployeeList(false);
			}

			this.mapRef?.fitBounds([[latitude, longitude]], { animate: true, duration: 0.5 });
		};

		#isViewingOtherEmployeeRoute()
		{
			return this.state.viewMode === VIEW_MODE.EMPLOYEE_ROUTE
				&& this.state.selectedEmployeeId !== Number(env.userId);
		}

		#canPanMapToPoint(latitude, longitude)
		{
			return this.state.isMapReady && Boolean(latitude) && Boolean(longitude);
		}

		#isViewingToday()
		{
			return !this.dateFilter || this.dateFilter.isTodaySelected();
		}

		#isSearchResultsViewActive()
		{
			return this.state.viewMode === VIEW_MODE.EMPLOYEE_LIST && Boolean(this.search?.isActive());
		}

		#processAddedCheckIns(addedCheckIns, state, selfId)
		{
			let selfChanged = false;

			for (const checkIn of addedCheckIns)
			{
				if (!checkIn?.latitude || !checkIn?.longitude)
				{
					continue;
				}

				const checkInId = String(checkIn.id);
				if (checkInId.startsWith('temp_') || Number(checkIn.userId) === selfId)
				{
					selfChanged = true;
					continue;
				}

				const user = usersSelector.selectById(state, checkIn.userId);
				this.mapRenderer.applyCheckInAdded({
					checkIn,
					user: user
						? {
							name: user.fullName,
							avatar: user.avatarSize100,
						}
						: undefined,
				});
			}

			return selfChanged;
		}

		#refreshSelfRender()
		{
			if (!this.state.isMapReady)
			{
				return;
			}

			if (this.dateFilter && !this.dateFilter.isTodaySelected())
			{
				return;
			}

			const selfId = Number(env.userId);
			const timestamp = this.dateFilter
				? this.dateFilter.getSelectedTimestamp()
				: Math.floor(Date.now() / 1000);

			const state = store.getState();
			const selfCheckIns = selectCheckInsByUser(state, selfId, timestamp);

			const aggregated = this.aggregator.aggregate(selfCheckIns);
			if (aggregated.length === 0)
			{
				this.#clearSelfFromMap(selfId);

				return;
			}

			const lastAgg = aggregated[aggregated.length - 1];
			const employee = this.#ensureSelfEmployee(selfId, lastAgg, state);

			employee.lastCheckIn = {
				coords: [lastAgg.latitude, lastAgg.longitude],
				time: DateHelper.formatTime(DateHelper.parseCheckInDate(lastAgg.dateCreate)),
				type: this.#getMarkerType(lastAgg),
			};
			employee.checkInsCount = selectCheckInCountByUser(state, selfId, timestamp);

			this.#updateSelfMarker(employee, aggregated, selfId);

			this.setState({});
		}

		#ensureSelfEmployee(selfId, lastAgg, state)
		{
			const existing = this.getEmployeeById(selfId);
			if (existing)
			{
				return existing;
			}

			const user = usersSelector.selectById(state, selfId) || {};
			const employee = {
				id: selfId,
				checkInId: lastAgg.id,
				name: user.fullName || '',
				firstName: user.name || '',
				lastName: user.lastName || '',
				secondName: user.secondName || '',
				position: user.workPosition || '',
				avatar: user.avatarSize100 ? withCurrentDomain(user.avatarSize100) : '',
				lastCheckIn: { coords: [0, 0], time: '', type: MarkerType.CHECK_IN },
				checkIns: [],
				checkInsCount: 0,
			};
			this.employees.push(employee);

			return employee;
		}

		#updateSelfMarker(employee, aggregated, selfId)
		{
			if (this.state.viewMode === VIEW_MODE.EMPLOYEE_LIST && !this.search?.isActive())
			{
				this.mapRef?.addMarkers([this.#createEmployeeListMarker(employee)]);

				return;
			}

			if (
				this.state.viewMode === VIEW_MODE.EMPLOYEE_ROUTE
				&& this.state.selectedEmployeeId === selfId
				&& this.state.routeStatus === ROUTE_STATUS.READY
			)
			{
				this.#renderSelfRoute(employee, aggregated);
			}
		}

		#clearSelfFromMap(selfId)
		{
			const existing = this.getEmployeeById(selfId);
			if (!existing)
			{
				return;
			}

			if (this.state.viewMode === VIEW_MODE.EMPLOYEE_LIST && !this.search?.isActive())
			{
				this.mapRef?.removeMarkers([this.getEmployeeMarkerId(selfId)]);
			}
			else if (
				this.state.viewMode === VIEW_MODE.EMPLOYEE_ROUTE
				&& this.state.selectedEmployeeId === selfId
				&& this.state.routeStatus === ROUTE_STATUS.READY
			)
			{
				this.mapRef?.clearLayers();
				this.mapRef?.clearMarkers();
			}

			this.employees = this.employees.filter((employee) => employee.id !== selfId);
		}

		#renderSelfRoute(employee, aggregated)
		{
			const checkIns = aggregated.map((aggCheckIn) => ({
				id: aggCheckIn.id,
				coords: [aggCheckIn.latitude, aggCheckIn.longitude],
				time: DateHelper.formatTime(DateHelper.parseCheckInDate(aggCheckIn.dateCreate)),
				type: this.#getMarkerType(aggCheckIn),
			}));

			this.mapRef?.disableClustering();
			this.mapRef?.clearLayers();
			this.mapRef?.clearMarkers();

			const {
				routeLayers,
				checkInMarkers,
				routeMarkerIds,
			} = this.#buildRouteAssets(employee, checkIns);

			this.mapRef?.addLayers(routeLayers);
			this.mapRef?.enableClustering({
				animated: true,
				mode: 'route',
				routeMarkerIds,
				routeLayerIds: ['route-background', 'route-main'],
				maxClusterRadius: 45,
			});
			this.mapRef?.addMarkers(checkInMarkers);
		}

		#buildRouteAssets(employee, checkIns, { isDayClosed = false } = {})
		{
			const routePoints = checkIns.map((checkIn) => checkIn.coords);
			const checkInCount = checkIns.length;
			const checkInMarkers = [];
			const routeMarkerIds = [];

			checkIns.forEach((checkIn, index) => {
				const isAuto = this.#isAutoMarkerType(checkIn.type);
				const isLast = index === checkInCount - 1;
				const markerId = this.getCheckInMarkerId(employee.id, checkIn.id, isAuto);
				const iconConfig = {
					type: this.getCheckInType(checkIn, index, checkInCount),
					data: { time: checkIn.time },
				};

				if (isLast)
				{
					iconConfig.data.avatarUrl = employee.avatar;
					iconConfig.data.name = employee.name;
					iconConfig.data.id = employee.id;
					iconConfig.data.isDayClosed = isDayClosed;
				}

				routeMarkerIds.push(markerId);
				checkInMarkers.push({
					id: markerId,
					config: {
						coords: checkIn.coords,
						markerIcon: iconConfig,
						zIndex: index,
					},
				});
			});

			const routeLayers = [
				{
					id: 'route-background',
					config: {
						type: 'polyline',
						points: routePoints,
						options: this.routeConfig.backgroundLayer,
					},
				},
				{
					id: 'route-main',
					config: {
						type: 'polyline',
						points: routePoints,
						options: this.routeConfig.mainLayer,
					},
				},
			];

			return { routePoints, routeLayers, checkInMarkers, routeMarkerIds };
		}

		#createEmployeeListMarker(employee)
		{
			const { type, time, coords } = employee.lastCheckIn;

			return {
				id: this.getEmployeeMarkerId(employee.id),
				config: {
					coords,
					markerIcon: {
						type: type === MarkerType.AUTO_CHECK_IN ? MarkerType.LAST_AUTO_CHECK_IN : MarkerType.LAST_CHECK_IN,
						data: {
							time,
							id: employee.id,
							name: employee.name,
							avatarUrl: employee.avatar,
							checkInCount: employee.checkInsCount,
						},
					},
				},
			};
		}

		async loadMapData(timestamp = 0)
		{
			const { checkIns, stats, users, hasSubordinates, isWesternPortal } = await getMapData(timestamp);

			const isToday = timestamp === 0;
			const actions = [];
			if (isToday)
			{
				const localDate = DateHelper.getLocalDateFromTimestamp(Math.floor(Date.now() / 1000));
				actions.push(upsertCheckIns(checkIns), setStatsByUser({ date: localDate, stats: stats || {} }));
			}

			if (Array.isArray(users) && users.length > 0)
			{
				actions.push(usersUpserted(users));
			}

			if (actions.length > 0)
			{
				this.checkInListObserver?.pause();
				try
				{
					dispatch(batchActions(actions));
				}
				finally
				{
					this.checkInListObserver?.resume();
				}
			}

			const state = store.getState();

			this.employees = checkIns.map((checkIn) => {
				const date = new Date(checkIn.dateCreate);
				const time = DateHelper.formatTime(date);
				const type = checkIn.entityType === ENTITY_TYPE_MANUAL ? MarkerType.CHECK_IN : MarkerType.AUTO_CHECK_IN;
				const user = usersSelector.selectById(state, checkIn.userId) || {};

				return {
					id: user.id,
					checkInId: checkIn.id,
					name: user.fullName,
					firstName: user.name || '',
					lastName: user.lastName || '',
					secondName: user.secondName || '',
					position: user.workPosition || '',
					avatar: user.avatarSize100 ? withCurrentDomain(user.avatarSize100) : '',
					lastCheckIn: {
						coords: [checkIn.latitude, checkIn.longitude],
						address: checkIn.address || '',
						time,
						type,
						dateCreateTs: date.getTime(),
					},
					checkIns: [],
					checkInsCount: stats?.[checkIn.userId] ?? 0,
				};
			});
			this.hasSubordinates = hasSubordinates;
			this.isWesternPortal = isWesternPortal;
		}

		render()
		{
			if (!Feature.isCheckinMapSupported())
			{
				return new UnsupportedMapView();
			}

			const { isDisabled, isGeoDisabled, isMapReady } = this.state;

			if (isDisabled)
			{
				return new DisabledCheckInView({ onCheckInEnabled: this.#onCheckInEnabled });
			}

			if (isGeoDisabled)
			{
				return new DisabledGeoView();
			}

			return View(
				{
					style: {
						height: '100%',
						overflow: 'visible',
					},
					resizableByKeyboard: true,
				},
				Map({
					ref: this.bindMapRef,
					mapUrl: '/mobile/location/check-in-map.php',
					isLoading: !isMapReady,
					loadingOverlayImageUri: stubImageUri,
					onReceiveEvent: this.onReceiveEvent,
				}),
				this.renderBottomButtons(),
				this.shouldShowSearchEmptyState() && SearchEmptyState(),
				this.renderWorktimePill(),
			);
		}

		bindMapRef = (ref) => {
			this.mapRef = ref;
		};

		onReceiveEvent = async (event) => {
			const { data, eventType } = event;

			switch (eventType)
			{
				case EventType.PAGE_WITH_MAP_LOADED:
					this.initializeMap();
					break;
				case EventType.MARKER_CLICKED:
					await this.handleMarkerClick(data);
					break;
				case EventType.CLUSTER_CLICKED:
					await this.handleClusterClick(data);
					break;
				default:
			}
		};

		initializeMap()
		{
			const mapProps = {
				fitBoundsPadding: BoundsPaddingToFit.DEFAULT,
			};
			if (this.geoPosition)
			{
				mapProps.mapCenter = [this.geoPosition.latitude, this.geoPosition.longitude];
			}

			this.mapRef?.initMap(mapProps);
			this.#updateMapGrayscale(this.#workdayState);
			this.setState({ isMapReady: true }, () => this.showEmployeeList());
		}

		showEmployeeList(toFitBounds = true)
		{
			if (this.state.isLoading || !this.state.isMapReady)
			{
				return;
			}

			if (this.search?.isActive())
			{
				this.#showFilteredEmployees(toFitBounds);

				return;
			}

			this.mapRef?.clearMarkers();
			this.mapRef?.clearLayers();
			this.mapRef?.enableClustering({ animated: false });

			const employeeMarkers = [];
			const employeeCoords = [];

			this.employees.forEach((employee) => {
				employeeMarkers.push(this.#createEmployeeListMarker(employee));
				employeeCoords.push(employee.lastCheckIn.coords);
			});

			if (Type.isArrayFilled(employeeMarkers))
			{
				this.mapRef?.addMarkers(employeeMarkers);
			}
			this.mapRef?.enableClustering({ animated: true });
			if (toFitBounds)
			{
				this.#applyEmployeeListFitBounds(employeeCoords);
			}

			this.setState({
				viewMode: VIEW_MODE.EMPLOYEE_LIST,
				selectedEmployeeId: null,
				isMapReady: true,
			});
		}

		#applyEmployeeListFitBounds(employeeCoords)
		{
			const isInitial = !this.#initialFocusApplied;
			this.#initialFocusApplied = true;

			if (isInitial)
			{
				const selfCoords = this.#findSelfLastCheckInCoords();
				if (selfCoords)
				{
					this.mapRef?.fitBounds([selfCoords]);

					return;
				}
			}

			if (employeeCoords.length > 0)
			{
				this.mapRef?.fitBounds(employeeCoords);
			}
		}

		#findSelfLastCheckInCoords()
		{
			const selfId = Number(env.userId);
			const selfEmployee = this.getEmployeeById(selfId);
			const coords = selfEmployee?.lastCheckIn?.coords;

			return Array.isArray(coords) && coords.length === 2 ? coords : null;
		}

		showEmployeeRoute(employeeId, { clusterMarkerIds } = {})
		{
			const employee = this.getEmployeeById(employeeId);
			if (!employee)
			{
				return;
			}

			this.search?.close();

			this.setState(
				{
					viewMode: VIEW_MODE.EMPLOYEE_ROUTE,
					selectedEmployeeId: employeeId,
					routeStatus: ROUTE_STATUS.LOADING,
				},
				() => this.#loadAndRenderRoute(employee, clusterMarkerIds),
			);
		}

		async #loadAndRenderRoute(employee, clusterMarkerIds)
		{
			this.mapRef?.clearLayers();

			if (clusterMarkerIds)
			{
				this.mapRef?.updateClusterIcon(clusterMarkerIds, true);
			}
			else
			{
				this.mapRef?.addMarkers([
					{
						id: this.getEmployeeMarkerId(employee.id),
						config: {
							coords: employee.lastCheckIn.coords,
							markerIcon: {
								type: employee.lastCheckIn.type === MarkerType.AUTO_CHECK_IN
									? MarkerType.LAST_AUTO_CHECK_IN
									: MarkerType.LAST_CHECK_IN,
								data: {
									avatarUrl: employee.avatar,
									name: employee.name,
									id: employee.id,
									time: employee.lastCheckIn.time,
									checkInCount: employee.checkInsCount,
									loading: true,
								},
							},
						},
					},
				]);
			}

			const routeData = await this.loadEmployeeRoute(employee.id);

			this.mapRef?.disableClustering();
			this.mapRef?.clearMarkers();

			const {
				routePoints,
				routeLayers,
				checkInMarkers,
				routeMarkerIds,
			} = this.#buildRouteAssets(employee, routeData.checkIns, { isDayClosed: routeData.isDayClosed });

			this.mapRef?.addLayers(routeLayers);
			this.mapRef?.enableClustering({
				animated: true,
				mode: 'route',
				routeMarkerIds,
				routeLayerIds: ['route-background', 'route-main'],
				maxClusterRadius: 45,
			});
			this.mapRef?.fitBounds(routePoints);
			this.mapRef?.addMarkers(checkInMarkers);
			this.mapRef?.fitToLayers();

			this.setState({ routeStatus: ROUTE_STATUS.READY });
		}

		async loadEmployeeRoute(employeeId)
		{
			const timestamp = this.dateFilter.getSelectedTimestamp();
			const isToday = this.dateFilter.isTodaySelected();
			const response = await getEmployeeRoute(employeeId, timestamp);
			if (!response)
			{
				showErrorToast(
					{ message: Loc.getMessage('M_STAFFTRACK_CHECK_IN_TOAST_ERROR') },
					this.props.parentWidget,
				);

				return { checkIns: [], isDayClosed: false };
			}

			const actions = [];
			if (isToday && Type.isArrayFilled(response.route))
			{
				actions.push(upsertCheckIns(response.route));
			}

			if (response.stats)
			{
				const localDate = DateHelper.getLocalDateFromTimestamp(timestamp);
				actions.push(setStatsByUser({ date: localDate, stats: response.stats }));
			}

			if (actions.length > 0)
			{
				this.checkInListObserver?.pause();
				try
				{
					dispatch(batchActions(actions));
				}
				finally
				{
					this.checkInListObserver?.resume();
				}
			}

			const rawCheckIns = isToday
				? selectCheckInsByUser(store.getState(), Number(employeeId), timestamp)
				: response.route || [];
			const aggregated = this.aggregator.aggregate(rawCheckIns);

			const isDayClosed = response.isDayClosed === true;

			const checkIns = aggregated.map((checkIn) => {
				const date = new Date(checkIn.dateCreate);
				const time = DateHelper.formatTime(date);
				const type = this.#getMarkerType(checkIn);

				return {
					id: checkIn.id,
					coords: [checkIn.latitude, checkIn.longitude],
					time,
					type,
				};
			});

			return { checkIns, isDayClosed };
		}

		getCheckInType(checkIn, index, checkInCount)
		{
			const isAutoType = checkIn.type === MarkerType.AUTO_CHECK_IN
				|| checkIn.type === MarkerType.TRANSIT_AUTO_CHECK_IN;

			if (index === 0)
			{
				return isAutoType ? MarkerType.FIRST_AUTO_CHECK_IN : MarkerType.FIRST_CHECK_IN;
			}

			if (checkInCount === index + 1)
			{
				return isAutoType ? MarkerType.LAST_AUTO_CHECK_IN : MarkerType.LAST_CHECK_IN;
			}

			return checkIn.type;
		}

		async handleMarkerClick(data)
		{
			if (this.state.routeStatus === ROUTE_STATUS.LOADING)
			{
				return;
			}

			const { markerId } = data;

			if (this.isEmployeeMarker(markerId))
			{
				const employeeId = parseInt(markerId.replace('employee-', ''), 10);
				await this.showEmployeeRoute(employeeId);
			}
			else
			{
				const employeeId = this.#getEmployeeIdFromCheckInMarker(markerId);
				await this.#onCheckInsButtonClick(markerId, employeeId);
			}
		}

		async handleClusterClick(data)
		{
			const { markerIds } = data;
			const { parentWidget } = this.props;

			const employeeMarkerIds = markerIds.filter((id) => this.isEmployeeMarker(id));

			if (employeeMarkerIds.length > 0)
			{
				const employees = employeeMarkerIds
					.map((id) => this.employees.find((emp) => emp.id === parseInt(id.replace('employee-', ''), 10)))
					.filter(Boolean);

				if (employees.length === 0)
				{
					return;
				}

				const knownAddress = employees.find((emp) => emp.lastCheckIn?.address)?.lastCheckIn?.address;

				await ClusterEmployeesBox.open({
					employees,
					coords: employees[0]?.lastCheckIn?.coords,
					address: knownAddress,
					widget: parentWidget,
					onEmployeeSelect: (employeeId) => this.showEmployeeRoute(
						employeeId,
						{ clusterMarkerIds: markerIds },
					),
				});

				return;
			}

			// Check-in markers cluster (route mode): open timeline scrolled to the first check-in
			const firstMarkerId = markerIds[0];
			if (!firstMarkerId)
			{
				return;
			}

			const employeeId = this.#getEmployeeIdFromCheckInMarker(firstMarkerId);
			const selectedItemId = firstMarkerId.split('-').slice(-1)[0];

			TimelineBottomSheet.open({
				userId: employeeId,
				timestamp: this.dateFilter.getSelectedTimestamp(),
				isToday: this.dateFilter.isTodaySelected(),
				widget: parentWidget,
				selectedItemId,
				onChatClick: this.#handleChatClick,
			});
		}

		getEmployeeMarkerId(employeeId)
		{
			return `employee-${employeeId}`;
		}

		getCheckInMarkerId(employeeId, checkInId, isAutocheckIn)
		{
			const prefix = isAutocheckIn ? 'auto-check-in' : 'check-in';

			return `${prefix}-${employeeId}-${checkInId}`;
		}

		isEmployeeMarker(markerId)
		{
			return markerId && markerId.startsWith('employee-');
		}

		#getMarkerType(checkIn)
		{
			if (checkIn.entityType !== ENTITY_TYPE_AUTO)
			{
				return MarkerType.CHECK_IN;
			}

			if (checkIn.description === AutoCheckInType.MOVING_POINT)
			{
				return MarkerType.TRANSIT_AUTO_CHECK_IN;
			}

			return MarkerType.AUTO_CHECK_IN;
		}

		#isAutoMarkerType(type)
		{
			return type === MarkerType.AUTO_CHECK_IN
				|| type === MarkerType.TRANSIT_AUTO_CHECK_IN;
		}

		#getEmployeeIdFromCheckInMarker(markerId)
		{
			const parts = markerId.split('-');

			return parseInt(parts[parts.length - 2], 10);
		}

		renderWorktimePill()
		{
			if (!WorkDayPill)
			{
				return null;
			}

			return View(
				{
					style: {
						position: 'absolute',
						top: Indent.XL3.toNumber(),
						right: Indent.XL3.toNumber(),
						alignItems: 'flex-start',
					},
				},
				WorkDayPill({}),
			);
		}

		renderBottomButtons()
		{
			const { viewMode, selectedEmployeeId, routeStatus } = this.state;
			const isRouteView = viewMode === VIEW_MODE.EMPLOYEE_ROUTE;

			let leftButton = null;
			if (isRouteView && selectedEmployeeId && routeStatus === ROUTE_STATUS.READY)
			{
				leftButton = this.renderCheckInsButton(selectedEmployeeId);
			}

			const rightBottomButton = !this.dateFilter || this.dateFilter.isTodaySelected()
				? this.renderAddCheckInButton()
				: this.renderDateButton();

			if (!leftButton && !rightBottomButton)
			{
				return null;
			}

			const children = [];
			if (leftButton && rightBottomButton)
			{
				children.push(leftButton, rightBottomButton);
			}
			else if (rightBottomButton)
			{
				children.push(View({ style: { flex: 1 } }), rightBottomButton);
			}
			else if (leftButton)
			{
				children.push(leftButton);
			}

			return View(
				{
					style: {
						position: 'absolute',
						left: Indent.XL3.toNumber(),
						right: Indent.XL3.toNumber(),
						bottom: Indent.XL3.toNumber(),
						flexDirection: 'row',
						justifyContent: 'space-between',
						alignItems: 'flex-end',
					},
				},
				...children,
			);
		}

		renderCheckInsButton(selectedEmployeeId)
		{
			const selectedEmployee = this.getEmployeeById(selectedEmployeeId);
			if (!selectedEmployee)
			{
				return null;
			}

			const { avatar, name, lastCheckIn } = selectedEmployee;
			const timestamp = this.dateFilter.getSelectedTimestamp();
			const checkInsCount = selectCheckInCountByUser(store.getState(), selectedEmployeeId, timestamp);

			return View(
				{
					testId: this.getTestId('check-ins-button'),
					style: {
						overflow: 'visible',
						paddingTop: 4,
						paddingRight: 3,
						flexShrink: 0,
					},
				},
				View(
					{
						style: {
							position: 'relative',
							flexDirection: 'row',
							alignItems: 'center',
							overflow: 'visible',
							height: BOTTOM_BUTTON_HEIGHT,
							paddingHorizontal: Indent.XL.toNumber(),
							borderRadius: Component.popupCorner.toNumber(),
							borderWidth: 1,
							borderColor: Color.base7.toHex(),
							backgroundColor: Color.bgContentPrimary.toHex(),
						},
						onClick: () => this.#onCheckInsButtonClick(null, selectedEmployeeId),
					},
					Avatar({
						testId: this.getTestId('check-ins-button-avatar'),
						size: BOTTOM_BUTTON_AVATAR_SIZE,
						uri: avatar,
						name,
						entityType: AvatarEntityType.USER,
						withRedux: false,
						style: {
							marginRight: Indent.M.toNumber(),
						},
					}),
					View(
						{
							style: {
								flexDirection: 'column',
								flexShrink: 1,
							},
						},
						View(
							{
								style: {
									flexDirection: 'row',
									alignItems: 'center',
									flexShrink: 1,
								},
							},
							BBCodeText({
								text: Loc.getMessage('M_STAFFTRACK_CHECKIN_SHIFTS_CHECKINS').replace(
									'#CHECKINS_COUNT#',
									`[COLOR=${Color.base3.toHex()}][SIZE=14]${checkInsCount}[/SIZE][/COLOR]`,
								),
								size: 3,
								color: Color.base1,
								numberOfLines: 1,
								ellipsize: 'end',
								style: {
									flexShrink: 1,
								},
							}),
							IconView({
								icon: Icon.CHEVRON_TO_THE_RIGHT,
								color: Color.base2,
								size: 20,
							}),
						),
						BBCodeText({
							text: Loc.getMessage('M_STAFFTRACK_CHECKIN_SHIFTS_LAST').replace(
								'#TIME#',
								`[COLOR=${Color.base2.toHex()}][SIZE=14]${lastCheckIn.time}[/SIZE][/COLOR]`,
							),
							size: 6,
							color: Color.base3,
							numberOfLines: 1,
							ellipsize: 'end',
						}),
					),
				),
				Shadow(
					{
						radius: 1,
						color: Color.base7.toHex(),
						offset: { x: -1, y: 1 },
						style: {
							position: 'absolute',
							top: 0,
							right: 0,
							zIndex: 3,
							borderRadius: BadgeButtonSize.XL / 2,
						},
					},
					BadgeButton({
						testId: this.getTestId('close'),
						icon: Icon.CROSS,
						design: BadgeButtonDesign.LIGHT,
						size: BadgeButtonSize.XL,
						stroke: false,
						onClick: this.onCheckInsButtonClose,
					}),
				),
			);
		}

		#onCheckInsButtonClick = async (markerId, employeeId) => {
			const selectedItemId = markerId ? markerId.split('-').slice(-1)[0] : null;
			const { parentWidget } = this.props;

			TimelineBottomSheet.open({
				userId: employeeId,
				timestamp: this.dateFilter.getSelectedTimestamp(),
				isToday: this.dateFilter.isTodaySelected(),
				widget: parentWidget,
				selectedItemId,
				onChatClick: this.#handleChatClick,
			});
		};

		#handleChatClick = (dialogParams) => {
			DialogOpener.open(dialogParams);
		};

		onCheckInsButtonClose = () => {
			if (this.search?.isActive())
			{
				this.#showFilteredEmployees();
			}
			else
			{
				this.showEmployeeList(false);
			}
		};

		shouldShowSearchEmptyState()
		{
			return this.state.isSearchResultEmpty
				|| (this.dateFilter?.isActive() && !Type.isArrayFilled(this.employees));
		}

		renderDateButton()
		{
			return View(
				{
					style: {
						overflow: 'visible',
						paddingTop: 4,
						paddingRight: 3,
						flexShrink: 1,
						marginLeft: Indent.XL.toNumber(),
					},
				},
				View(
					{
						testId: this.getTestId('date-button'),
						style: {
							position: 'relative',
							flexDirection: 'row',
							alignItems: 'center',
							height: BOTTOM_BUTTON_HEIGHT,
							paddingLeft: Indent.XL.toNumber(),
							paddingRight: Indent.XL3.toNumber(),
							borderRadius: Component.popupCorner.toNumber(),
							borderWidth: 1,
							borderColor: Color.base7.toHex(),
							backgroundColor: Color.bgContentPrimary.toHex(),
							flexShrink: 1,
						},
						onClick: () => this.dateFilter?.openPicker(),
					},
					IconView({
						icon: Icon.CALENDAR_WITH_SLOTS,
						color: Color.accentMainPrimary,
						size: 26,
					}),
					Text3({
						text: this.dateFilter.getFormattedSelectedDate(),
						accent: true,
						color: Color.base1,
						numberOfLines: 1,
						ellipsize: 'end',
						style: {
							marginLeft: Indent.M.toNumber(),
							flexShrink: 1,
						},
					}),
				),
				Shadow(
					{
						radius: 1,
						color: Color.base7.toHex(),
						offset: { x: -1, y: 1 },
						style: {
							position: 'absolute',
							top: 0,
							right: 0,
							borderRadius: BadgeButtonSize.XL / 2,
						},
					},
					BadgeButton({
						testId: this.getTestId('date-close'),
						icon: Icon.CROSS,
						design: BadgeButtonDesign.LIGHT,
						size: BadgeButtonSize.XL,
						stroke: false,
						onClick: () => this.dateFilter.reset(),
					}),
				),
			);
		}

		renderAddCheckInButton()
		{
			return View(
				{
					style: {
						flexShrink: 1,
						marginLeft: Indent.XL.toNumber(),
					},
				},
				View(
					{
						testId: this.getTestId('add-checkin'),
						style: {
							position: 'relative',
							flexDirection: 'row',
							alignItems: 'center',
							height: BOTTOM_BUTTON_HEIGHT,
							paddingLeft: Indent.XL.toNumber(),
							paddingRight: Indent.XL3.toNumber(),
							borderRadius: Component.popupCorner.toNumber(),
							backgroundColor: Color.accentMainPrimary.toHex(),
							flexShrink: 1,
						},
						onClick: () => CheckInForm.openInBottomSheet({
							parentWidget: this.props.parentWidget,
							onCheckInAdded: this.#onManualCheckInAdded,
						}),
					},
					IconView({
						icon: Icon.LOCATION_PLUS,
						color: Color.baseWhiteFixed,
						size: 32,
					}),
					Text2({
						text: Loc.getMessage('M_STAFFTRACK_CHECKIN_SHIFTS_CHECKIN'),
						accent: true,
						color: Color.baseWhiteFixed,
						numberOfLines: 1,
						ellipsize: 'end',
						style: {
							marginLeft: Indent.M.toNumber(),
							flexShrink: 1,
						},
					}),
				),
			);
		}

		getEmployeeById(employeeId)
		{
			return this.employees.find((employee) => employee.id === employeeId) || null;
		}
	}

	Content.defaultProps = {
		preloadData: {},
	};

	Content.propTypes = {
		preloadData: PropTypes.object.isRequired,
		parentWidget: PropTypes.object.isRequired,
		tabsWidget: PropTypes.object.isRequired,
	};

	module.exports = {
		Content: (props) => new Content(props),
	};
});
