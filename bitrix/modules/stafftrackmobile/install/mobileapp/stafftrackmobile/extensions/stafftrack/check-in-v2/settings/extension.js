/**
 * @module stafftrack/check-in-v2/settings
 */
jn.define('stafftrack/check-in-v2/settings', (require, exports, module) => {
	const { PureComponent } = require('layout/pure-component');
	const { BottomSheet } = require('bottom-sheet');
	const { Color, Indent } = require('tokens');
	const { showToast } = require('toast');
	const { confirmDestructiveAction } = require('alert');
	const { Haptics } = require('haptics');
	const { Loc } = require('loc');
	const { PropTypes } = require('utils/validation');
	const { createTestIdGenerator } = require('utils/test');
	const { LoadingScreenComponent } = require('layout/ui/loading-screen');
	const { Area } = require('ui-system/layout/area');
	const { Card } = require('ui-system/layout/card');
	const { Link4 } = require('ui-system/blocks/link');
	const { AhaMoment } = require('ui-system/popups/aha-moment');
	const { SettingSelector, SettingMode } = require('ui-system/blocks/setting-selector');
	const {
		loadSettings,
		changeTimemanIntegration,
		enableAutoCheckIn,
		disableAutoCheckIn,
		enableDayStartCheckIn,
		disableDayStartCheckIn,
		enableCheckIn,
		disableCheckIn,
	} = require('stafftrack/check-in-v2/settings/src/api');

	const BACKDROP_HEIGHT = 700;

	/**
	 * @extends {PureComponent<CheckInSettingsProps, CheckInSettingsState>}
	 */
	class CheckInSettings extends PureComponent
	{
		static open({ parentWidget = PageManager } = {})
		{
			void new BottomSheet({
				titleParams: {
					text: Loc.getMessage('STAFFTRACKMOBILE_CHECK_IN_SETTINGS_WIDGET_TITLE'),
					type: 'section',
				},
				component: (layoutWidget) => new CheckInSettings({ layoutWidget }),
			})
				.setParentWidget(parentWidget)
				.setMediumPositionHeight(BACKDROP_HEIGHT)
				.preventBottomSheetDismiss()
				.open()
			;
		}

		/**
		 * @param {CheckInSettingsProps} props
		 */
		constructor(props)
		{
			super(props);

			this.getTestId = createTestIdGenerator({
				prefix: 'check-in-settings',
				context: this,
			});

			this.isCheckInInitiallyEnabled = null;

			this.state = {
				isLoading: true,
				isTimemanAvailable: false,
				isTimemanIntegrationEnabled: false,
				isCheckInEnabled: false,
				isAutoCheckInEnabledInSettings: false,
				canChangeAutoCheckIn: false,
				isDayStartCheckInEnabledInSettings: false,
				canChangeDayStartCheckIn: false,
			};

			this.onTimemanSyncSwitcherClick = this.#onTimemanSyncSwitcherClick.bind(this);
			this.onAutoCheckInSwitcherClick = this.#onAutoCheckInSwitcherClick.bind(this);
			this.onAutoCheckInHelpLinkClick = this.#onAutoCheckInHelpLinkClick.bind(this);
			this.onAutoCheckInHelpLinkRef = this.#onAutoCheckInHelpLinkRef.bind(this);
			this.onDayStartCheckInSwitcherClick = this.#onDayStartCheckInSwitcherClick.bind(this);
			this.onDayStartCheckInHelpLinkClick = this.#onDayStartCheckInHelpLinkClick.bind(this);
			this.onDayStartCheckInHelpLinkRef = this.#onDayStartCheckInHelpLinkRef.bind(this);
			this.onCheckInEnableClick = this.#onCheckInEnableClick.bind(this);
			this.onCheckInDisableClick = this.#onCheckInDisableClick.bind(this);
			this.onPreventDismiss = this.#onPreventDismiss.bind(this);
		}

		async componentDidMount()
		{
			const data = await loadSettings();

			if (data)
			{
				const {
					isCheckInEnabled,
					isTimemanAvailable,
					isTimemanIntegrationEnabled,
					isAutoCheckInEnabledInSettings,
					canChangeAutoCheckIn,
					isDayStartCheckInEnabledInSettings,
					canChangeDayStartCheckIn,
				} = data;

				this.setState({
					isCheckInEnabled,
					isTimemanAvailable,
					isTimemanIntegrationEnabled,
					isAutoCheckInEnabledInSettings,
					canChangeAutoCheckIn,
					isDayStartCheckInEnabledInSettings,
					canChangeDayStartCheckIn,
					isLoading: false,
				});

				this.isCheckInInitiallyEnabled = isCheckInEnabled;
				this.#layoutWidget.on('preventDismiss', this.onPreventDismiss);
			}
			else
			{
				this.#showErrorToast();
				setTimeout(() => this.#layoutWidget.close(), 3000);
			}
		}

		componentWillUnmount()
		{
			this.#layoutWidget.off('preventDismiss', this.onPreventDismiss);
		}

		#onPreventDismiss()
		{
			const { isCheckInEnabled } = this.state;

			if (isCheckInEnabled !== this.isCheckInInitiallyEnabled)
			{
				BX.postComponentEvent(`check-in-settings:${isCheckInEnabled ? 'enabled' : 'disabled'}`);
			}

			this.#layoutWidget.close();
		}

		render()
		{
			if (this.state.isLoading)
			{
				return new LoadingScreenComponent();
			}

			return View(
				{},
				this.#renderPersonalSection(),
				this.#renderDepartmentsSection(),
				this.#renderAdminSection(),
			);
		}

		#renderPersonalSection()
		{
			const { isTimemanAvailable, isTimemanIntegrationEnabled, isCheckInEnabled } = this.state;

			if (!isTimemanAvailable)
			{
				return null;
			}

			return Area(
				{
					title: Loc.getMessage('STAFFTRACKMOBILE_CHECK_IN_SETTINGS_PERSONAL_SECTION_TITLE'),
					isFirst: true,
				},
				Card(
					{
						border: true,
						testId: this.getTestId('timeman-sync-container'),
					},
					SettingSelector({
						testId: this.getTestId('timeman-sync'),
						title: Loc.getMessage('STAFFTRACKMOBILE_CHECK_IN_SETTINGS_TIMEMAN_SYNC_TITLE'),
						subtitle: Loc.getMessage('STAFFTRACKMOBILE_CHECK_IN_SETTINGS_TIMEMAN_SYNC_DESCRIPTION'),
						locked: !isCheckInEnabled,
						checked: isTimemanIntegrationEnabled,
						onClick: this.onTimemanSyncSwitcherClick,
					}),
				),
			);
		}

		#renderDepartmentsSection()
		{
			const {
				isTimemanAvailable,
				isCheckInEnabled,
				isAutoCheckInEnabledInSettings,
				canChangeAutoCheckIn,
				isDayStartCheckInEnabledInSettings,
				canChangeDayStartCheckIn,
			} = this.state;

			if (!isTimemanAvailable)
			{
				return null;
			}

			return Area(
				{
					title: Loc.getMessage('STAFFTRACKMOBILE_CHECK_IN_SETTINGS_DEPARTMENTS_SECTION_TITLE'),
					isFirst: true,
				},
				Card(
					{
						border: true,
						testId: this.getTestId('auto-check-in-container'),
					},
					SettingSelector({
						testId: this.getTestId('auto-check-in'),
						title: Loc.getMessage('STAFFTRACKMOBILE_CHECK_IN_SETTINGS_AUTO_CHECK_IN_TITLE'),
						subtitle: Loc.getMessage('STAFFTRACKMOBILE_CHECK_IN_SETTINGS_AUTO_CHECK_IN_DESCRIPTION'),
						locked: !isCheckInEnabled || !canChangeAutoCheckIn,
						checked: isAutoCheckInEnabledInSettings,
						onClick: this.onAutoCheckInSwitcherClick,
						additionalContent: Link4({
							testId: this.getTestId('auto-check-in-help-link'),
							style: {
								alignSelf: 'flex-start',
								paddingVertical: Indent.XS2.toNumber(),
							},
							text: Loc.getMessage('STAFFTRACKMOBILE_CHECK_IN_SETTINGS_AUTO_CHECK_IN_HELP_LINK'),
							forwardRef: this.onAutoCheckInHelpLinkRef,
							onClick: this.onAutoCheckInHelpLinkClick,
						}),
					}),
				),
				Card(
					{
						style: {
							marginTop: Indent.L.toNumber(),
						},
						border: true,
						testId: this.getTestId('day-start-check-in-container'),
					},
					SettingSelector({
						testId: this.getTestId('day-start-check-in'),
						title: Loc.getMessage('STAFFTRACKMOBILE_CHECK_IN_SETTINGS_DAY_START_CHECK_IN_TITLE'),
						subtitle: Loc.getMessage('STAFFTRACKMOBILE_CHECK_IN_SETTINGS_DAY_START_CHECK_IN_DESCRIPTION'),
						locked: !isCheckInEnabled || !canChangeDayStartCheckIn,
						checked: isDayStartCheckInEnabledInSettings,
						onClick: this.onDayStartCheckInSwitcherClick,
						additionalContent: Link4({
							testId: this.getTestId('day-start-check-in-help-link'),
							style: {
								alignSelf: 'flex-start',
								paddingVertical: Indent.XS2.toNumber(),
							},
							text: Loc.getMessage('STAFFTRACKMOBILE_CHECK_IN_SETTINGS_DAY_START_CHECK_IN_HELP_LINK'),
							forwardRef: this.onDayStartCheckInHelpLinkRef,
							onClick: this.onDayStartCheckInHelpLinkClick,
						}),
					}),
				),
			);
		}

		#renderAdminSection()
		{
			const { isCheckInEnabled } = this.state;

			return Area(
				{
					title: Loc.getMessage('STAFFTRACKMOBILE_CHECK_IN_SETTINGS_ADMIN_SECTION_TITLE'),
					isFirst: true,
				},
				Card(
					{
						border: true,
						testId: this.getTestId('check-in-container'),
					},
					SettingSelector({
						testId: this.getTestId('check-in'),
						title: Loc.getMessage('STAFFTRACKMOBILE_CHECK_IN_SETTINGS_CHECK_IN_TITLE'),
						mode: SettingMode.PARAMETER,
						modeParams: {
							text: Loc.getMessage(
								isCheckInEnabled
									? 'STAFFTRACKMOBILE_CHECK_IN_SETTINGS_CHECK_IN_DISABLE'
									: 'STAFFTRACKMOBILE_CHECK_IN_SETTINGS_CHECK_IN_ENABLE',
							),
							textColor: isCheckInEnabled ? Color.accentMainAlert : Color.base1,
							chevron: false,
						},
						locked: !env.isAdmin,
						onClick: isCheckInEnabled ? this.onCheckInDisableClick : this.onCheckInEnableClick,
					}),
				),
			);
		}

		async #onTimemanSyncSwitcherClick(checked)
		{
			if (!this.state.isCheckInEnabled)
			{
				this.#showInfoToast('STAFFTRACKMOBILE_CHECK_IN_SETTINGS_CHECK_IN_GLOBALLY_DISABLED');

				return;
			}

			this.#showInfoToast(
				checked
					? 'STAFFTRACKMOBILE_CHECK_IN_SETTINGS_TIMEMAN_SYNC_ENABLED'
					: 'STAFFTRACKMOBILE_CHECK_IN_SETTINGS_TIMEMAN_SYNC_DISABLED',
			);
			this.setState({ isTimemanIntegrationEnabled: checked });

			if (!await changeTimemanIntegration(checked))
			{
				this.#showErrorToast();
				this.setState({ isTimemanIntegrationEnabled: !checked });
			}
		}

		async #onAutoCheckInSwitcherClick(checked)
		{
			const { isCheckInEnabled, canChangeAutoCheckIn } = this.state;

			if (!isCheckInEnabled)
			{
				this.#showInfoToast('STAFFTRACKMOBILE_CHECK_IN_SETTINGS_CHECK_IN_GLOBALLY_DISABLED');

				return;
			}

			if (!canChangeAutoCheckIn)
			{
				this.#showInfoToast('STAFFTRACKMOBILE_CHECK_IN_SETTINGS_AUTO_CHECK_IN_HEAD_ONLY');

				return;
			}

			this.#showInfoToast(
				checked
					? 'STAFFTRACKMOBILE_CHECK_IN_SETTINGS_AUTO_CHECK_IN_ENABLED'
					: 'STAFFTRACKMOBILE_CHECK_IN_SETTINGS_AUTO_CHECK_IN_DISABLED',
			);
			this.setState({ isAutoCheckInEnabledInSettings: checked });

			const isSuccess = checked ? await enableAutoCheckIn() : await disableAutoCheckIn();
			if (!isSuccess)
			{
				this.#showErrorToast();
				this.setState({ isAutoCheckInEnabledInSettings: !checked });
			}
		}

		#onAutoCheckInHelpLinkRef(ref)
		{
			this.autoCheckInHelpLinkRef = ref;
		}

		#onAutoCheckInHelpLinkClick()
		{
			AhaMoment.show({
				testId: this.getTestId('auto-check-in-help'),
				targetRef: this.autoCheckInHelpLinkRef,
				description: Loc.getMessage('STAFFTRACKMOBILE_CHECK_IN_SETTINGS_AUTO_CHECK_IN_HELP_DESCRIPTION'),
				closeButton: false,
				disableHideByOutsideClick: false,
			});
		}

		async #onDayStartCheckInSwitcherClick(checked)
		{
			const { isCheckInEnabled, canChangeDayStartCheckIn } = this.state;

			if (!isCheckInEnabled)
			{
				this.#showInfoToast('STAFFTRACKMOBILE_CHECK_IN_SETTINGS_CHECK_IN_GLOBALLY_DISABLED');

				return;
			}

			if (!canChangeDayStartCheckIn)
			{
				this.#showInfoToast('STAFFTRACKMOBILE_CHECK_IN_SETTINGS_DAY_START_CHECK_IN_HEAD_ONLY');

				return;
			}

			this.#showInfoToast(
				checked
					? 'STAFFTRACKMOBILE_CHECK_IN_SETTINGS_DAY_START_CHECK_IN_ENABLED'
					: 'STAFFTRACKMOBILE_CHECK_IN_SETTINGS_DAY_START_CHECK_IN_DISABLED',
			);
			this.setState({ isDayStartCheckInEnabledInSettings: checked });

			const isSuccess = checked ? await enableDayStartCheckIn() : await disableDayStartCheckIn();
			if (!isSuccess)
			{
				this.#showErrorToast();
				this.setState({ isDayStartCheckInEnabledInSettings: !checked });
			}
		}

		#onDayStartCheckInHelpLinkRef(ref)
		{
			this.dayStartCheckInHelpLinkRef = ref;
		}

		#onDayStartCheckInHelpLinkClick()
		{
			AhaMoment.show({
				testId: this.getTestId('day-start-check-in-help'),
				targetRef: this.dayStartCheckInHelpLinkRef,
				description: Loc.getMessage('STAFFTRACKMOBILE_CHECK_IN_SETTINGS_DAY_START_CHECK_IN_HELP_DESCRIPTION'),
				closeButton: false,
				disableHideByOutsideClick: false,
			});
		}

		async #onCheckInEnableClick()
		{
			if (!env.isAdmin)
			{
				this.#showAdminOnlyToast();

				return;
			}

			this.#showInfoToast('STAFFTRACKMOBILE_CHECK_IN_SETTINGS_CHECK_IN_ENABLED');
			this.setState({ isCheckInEnabled: true });

			if (!await enableCheckIn())
			{
				this.#showErrorToast();
				this.setState({ isCheckInEnabled: false });
			}
		}

		#onCheckInDisableClick()
		{
			if (!env.isAdmin)
			{
				this.#showAdminOnlyToast();

				return;
			}

			confirmDestructiveAction({
				title: Loc.getMessage('STAFFTRACKMOBILE_CHECK_IN_SETTINGS_CHECK_IN_DISABLE_CONFIRM_TITLE'),
				description: Loc.getMessage('STAFFTRACKMOBILE_CHECK_IN_SETTINGS_CHECK_IN_DISABLE_CONFIRM_DESCRIPTION'),
				destructionText: Loc.getMessage('STAFFTRACKMOBILE_CHECK_IN_SETTINGS_CHECK_IN_DISABLE_CONFIRM_YES'),
				onDestruct: async () => {
					this.#showInfoToast('STAFFTRACKMOBILE_CHECK_IN_SETTINGS_CHECK_IN_DISABLED');
					this.setState({ isCheckInEnabled: false });

					if (!await disableCheckIn())
					{
						this.#showErrorToast();
						this.setState({ isCheckInEnabled: true });
					}
				},
			});
		}

		#showAdminOnlyToast()
		{
			this.#showInfoToast('STAFFTRACKMOBILE_CHECK_IN_SETTINGS_CHECK_IN_ADMIN_ONLY');
		}

		#showInfoToast(messageKey)
		{
			Haptics.notifySuccess();
			showToast({ message: Loc.getMessage(messageKey) }, this.#layoutWidget);
		}

		#showErrorToast(messageKey = 'STAFFTRACKMOBILE_CHECK_IN_SETTINGS_ERROR')
		{
			Haptics.notifyWarning();
			showToast(
				{
					message: Loc.getMessage(messageKey),
					backgroundColor: Color.accentMainAlert.toHex(),
				},
				this.#layoutWidget,
			);
		}

		get #layoutWidget()
		{
			return this.props.layoutWidget;
		}
	}

	CheckInSettings.propTypes = {
		layoutWidget: PropTypes.object.isRequired,
	};

	module.exports = { CheckInSettings };
});
