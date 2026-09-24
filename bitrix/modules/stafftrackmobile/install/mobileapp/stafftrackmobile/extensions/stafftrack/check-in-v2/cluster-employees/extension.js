/**
 * @module stafftrack/check-in-v2/cluster-employees
 */
jn.define('stafftrack/check-in-v2/cluster-employees', (require, exports, module) => {
	const { BottomSheet } = require('bottom-sheet');
	const { RunActionExecutor } = require('rest/run-action-executor');
	const { Line } = require('utils/skeleton');
	const { Box } = require('ui-system/layout/box');
	const { Color, Indent, Component, Corner } = require('tokens');
	const { Avatar, AvatarEntityType } = require('ui-system/blocks/avatar');
	const { IconView, Icon } = require('ui-system/blocks/icon');
	const { Text2, Text4, Text3 } = require('ui-system/typography/text');
	const { H4 } = require('ui-system/typography/heading');
	const { TextField } = require('ui-system/typography/text-field');
	const { Loc } = require('loc');
	const { createTestIdGenerator } = require('utils/test');
	const { ManualBalloon, AutomaticBalloon } = require('stafftrack/check-in-v2/balloon');
	const { CheckInTypeEnum } = require('stafftrack/check-in-v2/enums');

	const BOTTOM_SHEET_HEIGHT = 460;
	const ADDRESS_CACHE_TTL_SECONDS = 2_592_000; // 30 days

	class ClusterEmployeesBox extends LayoutComponent
	{
		constructor(props)
		{
			super(props);

			this.getTestId = createTestIdGenerator({
				prefix: 'cluster-employees',
			});

			this.state = {
				searchText: '',
				address: props.address ?? null,
			};
		}

		async componentDidMount()
		{
			const { address: propAddress, coords } = this.props;

			if (propAddress)
			{
				return;
			}

			const response = await this.#fetchAddress(coords);
			const address = response?.status === 'success' ? (response.data?.address ?? '') : '';
			if (address)
			{
				this.setState({ address });
			}
		}

		#fetchAddress(coords)
		{
			if (!coords)
			{
				return null;
			}

			const [latitude, longitude] = coords;

			return new Promise((resolve) => {
				new RunActionExecutor(
					'stafftrackmobile.v2.CheckIn.getAddressByCoordinates',
					{
						latitude,
						longitude,
					},
				).setCacheTtl(ADDRESS_CACHE_TTL_SECONDS)
					.setSkipRequestIfCacheExists()
					.setCacheHandler(resolve)
					.setHandler(resolve)
					.call(true)
				;
			});
		}

		#renderAddressHeader()
		{
			const { address } = this.state;

			return View(
				{
					style: {
						height: 24,
						marginHorizontal: Component.paddingLr.toNumber(),
						marginTop: Indent.XL.toNumber(),
						marginBottom: Indent.XL.toNumber(),
						justifyContent: 'center',
						alignItems: 'center',
					},
				},
				address === null
					? Line(160, 16)
					: H4({
						testId: this.getTestId('address'),
						text: address || Loc.getMessage('M_STAFFTRACK_CLUSTER_EMPLOYEES_TITLE'),
						numberOfLines: 1,
						ellipsize: 'end',
					}),
			);
		}

		/**
		 * @param {object} options
		 * @param {Array} options.employees
		 * @param {LayoutComponent} [options.widget]
		 * @param {Function} options.onEmployeeSelect
		 */
		static open({ employees, coords, address, widget, onEmployeeSelect })
		{
			const bottomSheet = new BottomSheet({
				component: (layoutWidget) => new ClusterEmployeesBox({
					employees,
					coords,
					address,
					layoutWidget,
					onEmployeeSelect,
				}),
			})
				.setMediumPositionHeight(BOTTOM_SHEET_HEIGHT)
				.enableResizeContent()
				.enableBounce()
				.enableSwipe()
				.disableOnlyMediumPosition();

			if (widget)
			{
				bottomSheet.setParentWidget(widget);
			}

			return bottomSheet.open();
		}

		#getCheckInType(markerType)
		{
			if (markerType && markerType.includes('auto'))
			{
				return CheckInTypeEnum.AUTOMATIC.getValue();
			}

			return CheckInTypeEnum.MANUAL.getValue();
		}

		#getFilteredEmployees()
		{
			const { employees = [] } = this.props;
			const { searchText } = this.state;
			const query = searchText?.trim().toLowerCase();

			if (!query)
			{
				return employees;
			}

			return employees.filter((employee) => {
				const nameMatch = employee.name?.toLowerCase().includes(query);
				const positionMatch = employee.position?.toLowerCase().includes(query);

				return nameMatch || positionMatch;
			});
		}

		render()
		{
			const { searchText } = this.state;
			const filteredEmployees = this.#getFilteredEmployees();
			const isEmptySearch = filteredEmployees.length === 0;

			return Box(
				{
					testId: this.getTestId('backdrop'),
				},
				this.#renderAddressHeader(),
				this.#renderSearchBar(searchText),
				isEmptySearch && this.#renderEmptySearch(),
				!isEmptySearch && ListView({
					testId: this.getTestId('list'),
					style: { flex: 1 },
					data: [
						{
							items: filteredEmployees.map((employee) => ({
								key: `employee-${employee.id}`,
								type: 'employee',
								data: employee,
							})),
						},
					],
					renderItem: this.#renderItem,
				}),
			);
		}

		#renderSearchBar(searchText)
		{
			const isClearVisible = searchText.length > 0;

			return View(
				{
					style: {
						paddingHorizontal: Component.paddingLr.toNumber(),
						paddingVertical: Indent.XS.toNumber(),
					},
				},
				View(
					{
						style: {
							backgroundColor: Color.base5.toHex(0.25),
							height: 36,
							borderRadius: Corner.M.toNumber(),
							flexDirection: 'row',
							paddingVertical: Indent.M.toNumber(),
							paddingHorizontal: Indent.L.toNumber(),
							alignItems: 'center',
						},
					},
					IconView({
						icon: Icon.SEARCH,
						size: 22,
						color: Color.base4,
						style: {
							marginRight: Indent.S.toNumber(),
						},
					}),
					TextField({
						testId: this.getTestId('search-input'),
						placeholder: Loc.getMessage('M_STAFFTRACK_CLUSTER_EMPLOYEES_SEARCH_PLACEHOLDER'),
						placeholderTextColor: Color.base4.toHex(),
						size: 4,
						color: Color.base1,
						style: { flex: 1 },
						value: searchText,
						onChangeText: (text) => this.setState({ searchText: text }),
					}),
					isClearVisible && IconView({
						testId: this.getTestId('search-clear'),
						icon: Icon.CROSS,
						size: 22,
						color: Color.base4,
						onClick: () => this.setState({ searchText: '' }),
					}),
				),
			);
		}

		#renderEmptySearch()
		{
			return View(
				{
					testId: this.getTestId('empty-search'),
					style: {
						paddingVertical: Indent.XL2.toNumber(),
						alignItems: 'center',
						justifyContent: 'center',
					},
				},
				Text3({
					text: Loc.getMessage('M_STAFFTRACK_CLUSTER_EMPLOYEES_EMPTY_SEARCH'),
					color: Color.base4,
				}),
			);
		}

		#renderItem = (item) => {
			const employee = item?.data;
			if (!employee)
			{
				return null;
			}

			const checkInType = this.#getCheckInType(employee.lastCheckIn?.type);
			const timeText = employee.lastCheckIn?.time ?? '';
			const testId = this.getTestId('item');
			const isManual = CheckInTypeEnum.isManual(checkInType);

			return View(
				{
					style: {
						flexDirection: 'row',
						alignItems: 'center',
						paddingHorizontal: Component.paddingLr.toNumber(),
					},
					onClick: () => this.#onEmployeeSelect(employee.id),
				},
				Avatar({
					testId: this.getTestId('item-avatar'),
					uri: employee.avatar,
					name: employee.name,
					entityType: AvatarEntityType.USER,
					size: 40,
					withRedux: false,
					style: {
						paddingVertical: Indent.XL2.toNumber(),
						marginRight: Indent.M.toNumber(),
					},
				}),
				View(
					{
						style: {
							flexDirection: 'row',
							paddingVertical: Indent.XL2.toNumber(),
							borderBottomWidth: 1,
							borderBottomColor: Color.bgSeparatorSecondary.toHex(),
							flex: 1,
							alignItems: 'center',
						},
					},
					View(
						{
							style: {
								flex: 1,
								justifyContent: 'center',
							},
						},
						Text2({
							testId: this.getTestId('item-name'),
							text: employee.name,
							numberOfLines: 1,
							ellipsize: 'end',
						}),
						employee.position
							? Text4({
								testId: this.getTestId('item-position'),
								text: employee.position,
								color: Color.base3,
								numberOfLines: 1,
								ellipsize: 'end',
								style: {
									marginTop: Indent.XS.toNumber(),
								},
							})
							: null,
					),
					View(
						{
							style: {
								width: 60,
								alignItems: 'center',
							},
						},
						isManual
							? ManualBalloon({ testId, timeText })
							: AutomaticBalloon({ testId, timeText, showBalloon: true }),
					),
				),
			);
		};

		#onEmployeeSelect(employeeId)
		{
			const { onEmployeeSelect, layoutWidget } = this.props;
			layoutWidget?.close(() => onEmployeeSelect?.(employeeId));
		}
	}

	module.exports = { ClusterEmployeesBox };
});
