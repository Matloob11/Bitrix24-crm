/**
 * @module stafftrack/layout/check-in-v2/form
 */
jn.define('stafftrack/layout/check-in-v2/form', (require, exports, module) => {
	const { BottomSheet } = require('bottom-sheet');
	const { requireLazy } = require('require-lazy');
	const { confirmDefaultAction, confirmClosing } = require('alert');
	const { Haptics } = require('haptics');
	const { Loc } = require('loc');
	const { Type } = require('type');
	const { isModuleInstalled } = require('module');
	const { showErrorToast, showToast } = require('toast');
	const store = require('statemanager/redux/store');
	const { dispatch } = store;
	const { usersUpserted } = require('statemanager/redux/slices/users');
	const { create: createCheckIn } = require('stafftrack/statemanager/redux/slices/check-in');
	const { Geo, GeoStatus } = require('utils/geo');
	const { debounce } = require('utils/function');
	const { createTestIdGenerator } = require('utils/test');
	const { withCurrentDomain } = require('utils/url');
	const { PropTypes } = require('utils/validation');
	const { Entry } = require('stafftrack/entry');
	const { CheckInTypeEnum } = require('stafftrack/check-in-v2/enums');
	const { CheckInCacheStorage } = require('stafftrack/check-in-v2/cache');
	const { DisabledCheckInView } = require('stafftrack/layout/check-in-v2/disabled-view');
	const { CheckInView } = require('stafftrack/layout/check-in-v2/form/src/ui/check-in-view');
	const { LoadingView } = require('stafftrack/layout/check-in-v2/form/src/ui/loading-view');
	const { loadCheckInForm } = require('stafftrack/layout/check-in-v2/form/src/api');
	const {
		WORKTIME_COMMANDS,
		computeIsExpiredFromRecord,
		computeIsExpiredFromPull,
		computeIsOpenedFromRecord,
		computeIsOpenedFromPull,
	} = require('stafftrack/layout/check-in-v2/form/src/workday-expired');
	const { Feature } = require('stafftrack/feature');
	const { RunActionExecutor } = require('rest/run-action-executor');
	const { UnsupportedMapView } = require('stafftrack/layout/check-in-v2/unsupported-map-view');

	const BACKDROP_BASE_HEIGHT = 395;
	const BACKDROP_DISABLED_HEIGHT = 500;
	const TITLE_HEIGHT = 44;
	const MAX_DESCRIPTION_LENGTH = 255;
	const PULL_DEBOUNCE_DELAY = 500;
	const IOS_KEYBOARD_OFFSET = 350;
	const IS_IOS = Application.getPlatform() === 'ios';

	const CHAT_SELECTION_STORAGE_KEY = `stafftrack-check-in-v2:last-chat-selection:${env.userId}-${currentDomain}`;

	/**
	 * @extends {LayoutComponent<CheckInFormProps, CheckInFormState>}
	 */
	class CheckInForm extends LayoutComponent
	{
		static getBottomSheetHeight(isDisabled = false, hasTitle = false)
		{
			return isDisabled ? BACKDROP_DISABLED_HEIGHT : (BACKDROP_BASE_HEIGHT + (hasTitle ? TITLE_HEIGHT : 0));
		}

		/**
		 * @param {CheckInFormOpenOptions} [options]
		 */
		static openInBottomSheet(options)
		{
			void new BottomSheet({
				titleParams: {
					type: 'dialog',
					text: Loc.getMessage('M_STAFFTRACK_ADD_CHECK_IN_TITLE'),
				},
				component: (layoutWidget) => {
					return new this({
						layoutWidget,
						dialogId: options?.dialogId,
						dialogName: options?.dialogName,
						onCheckInAdded: options?.onCheckInAdded,
					});
				},
			})
				.setParentWidget(options?.parentWidget ?? PageManager)
				.enableAdoptHeightByKeyboard()
				.setMediumPositionHeight(BACKDROP_BASE_HEIGHT)
				.enableResizeContent()
				.enableBounce()
				.enableSwipe()
				.disableOnlyMediumPosition()
				.preventBottomSheetDismiss()
				.open()
			;
		}

		/**
		 * @param {CheckInFormProps} props
		 */
		constructor(props)
		{
			super(props);

			this.state = {
				isLoading: true,
				isDisabled: true,
				isSubmitting: false,
				isUnavailable: false,
				snapshotUrl: null,
				address: null,
				files: [],
				dialogId: null,
				dialogName: null,
			};

			this.latestDescription = '';
			this.latitude = null;
			this.longitude = null;
			this.locationExternalId = null;
			this.locationSourceCode = null;
			this.isTimeManIntegrationEnabled = false;
			this.isWorkDayExpired = false;
			this.isWorkDayOpened = false;
			this.isNotWorkingDay = false;
			this.confirmStartWorkDayResult = null;

			this.currentBaseHeight = BACKDROP_BASE_HEIGHT;

			this.getTestId = createTestIdGenerator({ context: this });

			this.handlePreventDismiss = () => this.#showConfirmOnFormClosing();
			this.handleKeyboardWillShow = this.#handleKeyboardWillShow.bind(this);
			this.handleKeyboardWillHide = this.#handleKeyboardWillHide.bind(this);
		}

		async componentDidMount()
		{
			this.#subscribeEvents();

			if (!Feature.isCheckinMapSupported())
			{
				this.#resizeBackdropHeight(true);
				this.setState({
					isLoading: false,
					isUnavailable: true,
				});

				return;
			}

			const [geoResult, isCheckInToolEnabled] = await Promise.all([
				new Geo().requestPosition(),
				this.#loadIsCheckInToolEnabled(),
			]);

			if (isCheckInToolEnabled !== true)
			{
				BX.postComponentEvent('check-in-settings:disabled');
			}

			if (geoResult.status !== GeoStatus.SUCCESS)
			{
				this.#layoutWidget.close();

				return;
			}

			const initialState = await this.#getInitialState(geoResult, isCheckInToolEnabled);
			if (initialState)
			{
				this.#resizeBackdropHeight(initialState.isDisabled);
				this.setState(initialState);
			}
		}

		componentWillUnmount()
		{
			this.#unsubscribeEvents();
		}

		#loadIsCheckInToolEnabled()
		{
			return new Promise((resolve) => {
				void new RunActionExecutor('stafftrack.Feature.isCheckInEnabled')
					.setHandler((response) => {
						resolve(response?.status === 'success' && response?.data === true);
					})
					.call();
			});
		}

		#subscribeEvents()
		{
			this.#layoutWidget.on('preventDismiss', this.handlePreventDismiss);
			BX.addCustomEvent('onPullEvent-timeman', this.#handlePullEvent);

			if (IS_IOS)
			{
				Keyboard.on(Keyboard.Event.WillShow, this.handleKeyboardWillShow);
				Keyboard.on(Keyboard.Event.WillHide, this.handleKeyboardWillHide);
			}
		}

		#unsubscribeEvents()
		{
			this.#layoutWidget.off('preventDismiss', this.handlePreventDismiss);
			BX.removeCustomEvent('onPullEvent-timeman', this.#handlePullEvent);

			if (IS_IOS)
			{
				Keyboard.off(Keyboard.Event.WillShow, this.handleKeyboardWillShow);
				Keyboard.off(Keyboard.Event.WillHide, this.handleKeyboardWillHide);
			}
		}

		#handleKeyboardWillShow()
		{
			const screenLimit = device.screen.height - 80;
			const target = Math.min(this.currentBaseHeight + IOS_KEYBOARD_OFFSET, screenLimit);

			this.#layoutWidget.setBottomSheetParams({
				mediumPositionHeight: target,
				adoptHeightByKeyboard: false,
			});
			this.#layoutWidget.setBottomSheetHeight(target);
		}

		#handleKeyboardWillHide()
		{
			this.#layoutWidget.setBottomSheetParams({
				mediumPositionHeight: this.currentBaseHeight,
				adoptHeightByKeyboard: true,
			});
			this.#layoutWidget.setBottomSheetHeight(this.currentBaseHeight);
		}

		#handlePullEvent = debounce((command, params) => {
			if (!WORKTIME_COMMANDS.has(command))
			{
				return;
			}

			const isExpired = computeIsExpiredFromPull(params);
			const isOpened = computeIsOpenedFromPull(params);
			if (isExpired !== this.isWorkDayExpired || isOpened !== this.isWorkDayOpened)
			{
				this.isWorkDayExpired = isExpired;
				this.isWorkDayOpened = isOpened;
				this.setState({});
			}
		}, PULL_DEBOUNCE_DELAY);

		async #getInitialState({ latitude, longitude }, isCheckInToolEnabled)
		{
			const result = await this.#getCheckInFormData(latitude, longitude);
			if (!result)
			{
				return null;
			}

			const {
				address,
				snapshot,
				workDaySettings,
				users,
				dialogName,
				dialogId,
			} = result;

			this.latitude = latitude;
			this.longitude = longitude;
			this.locationExternalId = address?.locationExternalId;
			this.locationSourceCode = address?.locationSourceCode;
			this.isTimeManIntegrationEnabled = workDaySettings?.isTimeManIntegrationEnabled;
			this.isWorkDayExpired = computeIsExpiredFromRecord(workDaySettings?.record);
			this.isWorkDayOpened = computeIsOpenedFromRecord(workDaySettings?.record);
			this.isNotWorkingDay = workDaySettings?.isNotWorkingDay ?? false;

			if (Type.isArrayFilled(users))
			{
				dispatch(usersUpserted(users));
			}

			const [initialDialogId, initialDialogName] = this.#resolveInitialChat(dialogId, dialogName);

			return {
				isLoading: false,
				isDisabled: isCheckInToolEnabled !== true,
				snapshotUrl: snapshot?.imageUrl,
				address: address?.address,
				dialogId: initialDialogId,
				dialogName: initialDialogName,
			};
		}

		#resolveInitialChat(serverDialogId, serverDialogName)
		{
			if (this.props.dialogId)
			{
				return [this.props.dialogId, this.props.dialogName];
			}

			const persisted = Application.storage.getObject(CHAT_SELECTION_STORAGE_KEY, null);
			if (persisted)
			{
				return [persisted.dialogId ?? null, persisted.dialogName ?? null];
			}

			return [serverDialogId ?? null, serverDialogName ?? null];
		}

		async #getCheckInFormData(latitude, longitude)
		{
			const cache = new CheckInCacheStorage();
			const cachedGeo = cache.findByRadius(latitude, longitude);

			if (cachedGeo)
			{
				const data = await loadCheckInForm();
				if (!data)
				{
					return null;
				}

				return {
					...data,
					latitude,
					longitude,
					address: cachedGeo.address,
					snapshot: cachedGeo.snapshot,
				};
			}

			const data = await loadCheckInForm(latitude, longitude);
			if (!data)
			{
				showErrorToast({
					message: Loc.getMessage('M_STAFFTRACK_ADD_CHECK_IN_ERROR'),
					layout: this.#layoutWidget,
				});

				setTimeout(() => {
					this.#layoutWidget.close();
				}, 3600);

				return null;
			}

			cache.add({
				latitude,
				longitude,
				address: data.address,
				snapshot: data.snapshot,
			});

			return {
				...data,
				latitude,
				longitude,
			};
		}

		#resizeBackdropHeight(isDisabled)
		{
			const height = CheckInForm.getBottomSheetHeight(isDisabled, Type.isStringFilled(this.props.title));

			this.currentBaseHeight = height;

			this.#layoutWidget.setBottomSheetParams({ mediumPositionHeight: height });
			this.#layoutWidget.setBottomSheetHeight(height);
		}

		#showConfirmOnFormClosing()
		{
			const { files } = this.state;
			const description = this.latestDescription;

			const hasDescription = Boolean(description && String(description).trim().length > 0);
			const hasFiles = Type.isArrayFilled(files);
			const hasAnyUserInfo = hasDescription || hasFiles;

			if (!hasAnyUserInfo)
			{
				this.#layoutWidget.close();

				return;
			}

			Haptics.impactLight();

			confirmClosing({
				hasSaveAndClose: false,
				title: Loc.getMessage('M_STAFFTRACK_ADD_CHECK_IN_CANCEL_TITLE'),
				onClose: () => this.#layoutWidget.close(),
			});
		}

		fadeOut()
		{
			return new Promise((resolve) => {
				this.viewRef?.animate({ opacity: 0, duration: 300 });
				setTimeout(() => resolve(), 300);
			});
		}

		fadeIn()
		{
			return new Promise((resolve) => {
				this.viewRef?.animate({ opacity: 1, duration: 300 });
				setTimeout(() => resolve(), 300);
			});
		}

		#onViewRef = (ref) => {
			this.viewRef = ref;
		};

		render()
		{
			const { isLoading, isDisabled, isUnavailable } = this.state;

			if (isLoading)
			{
				return LoadingView({
					testId: this.getTestId,
					style: this.props.loadingViewStyle,
					title: this.props.title,
					onRef: this.#onViewRef,
				});
			}

			if (isUnavailable)
			{
				return new UnsupportedMapView({ fromBackdrop: true });
			}

			if (isDisabled)
			{
				return new DisabledCheckInView({ onCheckInEnabled: this.#onCheckInEnabled });
			}

			const { snapshotUrl, address, files, dialogName, isSubmitting } = this.state;

			return CheckInView({
				snapshotUrl,
				address,
				files,
				dialogName,
				isSubmitting,
				title: this.props.title,
				testId: this.getTestId,
				hasInputError: this.#hasInputError,
				hasUploadingFiles: this.#hasUploadingFiles(),
				remainderCharacters: this.#remainderCharacters,
				onChangeDescription: this.#onChangeDescription,
				canUploadFiles: this.#canUploadFiles,
				onChangeFiles: this.#onChangeFiles,
				fileFieldRef: this.#setFileFieldRef,
				parentWidget: this.#layoutWidget,
				onOpenChat: this.#openChatSelector,
				onClearChat: this.#clearChat,
				onSendCheckIn: this.#sendCheckIn,
				onRef: this.#onViewRef,
			});
		}

		#onCheckInEnabled = () => {
			this.#resizeBackdropHeight(false);
			this.setState({ isDisabled: false });
		};

		get #hasInputError()
		{
			return this.latestDescription.length >= MAX_DESCRIPTION_LENGTH;
		}

		get #remainderCharacters()
		{
			return MAX_DESCRIPTION_LENGTH - this.latestDescription.length;
		}

		#refreshDescription = debounce(() => this.setState({}), 300);

		#onChangeDescription = (description) => {
			this.latestDescription = description;
			this.#refreshDescription();
		};

		get #canUploadFiles()
		{
			return isModuleInstalled('disk');
		}

		#setFileFieldRef = (ref) => {
			this.fileFieldRef = ref;
		};

		#hasUploadingFiles()
		{
			return this.fileFieldRef?.hasUploadingFiles(true) ?? false;
		}

		#onChangeFiles = (files) => {
			if (!Array.isArray(files))
			{
				return;
			}

			const validFiles = files.filter((file) => !file.hasError);

			if (validFiles.length !== files.length && this.fileFieldRef)
			{
				this.fileFieldRef.queuedValue = null;
				this.fileFieldRef.preparedValue = validFiles;
			}

			this.setState({ files: validFiles });
		};

		#prepareFilesForSubmit()
		{
			const { files } = this.state;

			const uploadedFiles = files
				.filter((file) => file.token)
				.map((file) => file.token);

			const fileIds = files
				.filter((file) => file.isDiskFile && file.id)
				.map((file) => file.id);

			return { uploadedFiles, fileIds };
		}

		#openChatSelector = async () => {
			const { dialogId = null, dialogName = null } = await this.#selectChat();

			if (dialogId && dialogName)
			{
				this.setState({ dialogId, dialogName });
				this.#updateSelectedChatInCache(dialogId, dialogName);
			}
		};

		#selectChat = async () => {
			const { DialogSelector } = await requireLazy('im:messenger/api/dialog-selector');
			if (!DialogSelector)
			{
				return {};
			}

			const result = await new DialogSelector().show({
				title: Loc.getMessage('M_STAFFTRACK_ADD_CHECK_IN_CHAT_SELECTOR_TITLE'),
				layout: this.#layoutWidget,
			});

			return {
				dialogId: result?.dialogId,
				dialogName: result?.name,
			};
		};

		#clearChat = () => {
			this.setState({
				dialogId: null,
				dialogName: null,
			});
			this.#updateSelectedChatInCache(null, null);
		};

		#updateSelectedChatInCache(dialogId, dialogName)
		{
			Application.storage.setObject(CHAT_SELECTION_STORAGE_KEY, { dialogId, dialogName });
		}

		#sendCheckIn = async () => {
			if (this.#hasUploadingFiles() || this.#hasInputError)
			{
				return;
			}

			if (this.#shouldShowStartWorkDayConfirm())
			{
				this.#showConfirmStartWorkDay();

				return;
			}

			if (this.isTimeManIntegrationEnabled && this.isWorkDayExpired)
			{
				this.#showConfirmExpiredWorkDay();

				return;
			}

			if (!this.latitude || !this.longitude)
			{
				this.#layoutWidget.close(() => {
					showToast({ message: Loc.getMessage('M_STAFFTRACK_ADD_CHECK_IN_ERROR') });
				});

				return;
			}

			this.setState({ isSubmitting: true });

			const { snapshotUrl, address, dialogId, files } = this.state;
			const description = this.latestDescription;
			const { uploadedFiles, fileIds } = this.#prepareFilesForSubmit();

			const result = await dispatch(createCheckIn({
				entityType: CheckInTypeEnum.MANUAL.getValue(),
				latitude: this.latitude,
				longitude: this.longitude,
				address,
				description,
				files,
				uploadedFiles,
				fileIds,
				dialogIds: [dialogId],
				snapshotUrl: withCurrentDomain(snapshotUrl),
				locationExternalId: this.locationExternalId,
				locationSourceCode: this.locationSourceCode,
				skipWorkDayStart: this.confirmStartWorkDayResult === true,
			}));

			if (result.meta.requestStatus === 'rejected')
			{
				showErrorToast(
					{ message: Loc.getMessage('M_STAFFTRACK_ADD_CHECK_IN_ERROR') },
					this.#layoutWidget,
				);
				this.setState({ isSubmitting: false });

				return;
			}

			BX.postComponentEvent('stafftrack_add_check-in', []);

			if (this.props.onCheckInSent)
			{
				this.props.onCheckInSent();

				return;
			}

			const finalCoords = { latitude: this.latitude, longitude: this.longitude };
			this.#layoutWidget.close(() => {
				showToast({ message: Loc.getMessage('M_STAFFTRACK_ADD_CHECK_IN_SUCCESS_TOAST') });
				this.props.onCheckInAdded?.(finalCoords);
			});
		};

		#showConfirmExpiredWorkDay()
		{
			Haptics.notifyWarning();

			confirmDefaultAction({
				title: Loc.getMessage('M_STAFFTRACK_ADD_CHECK_IN_EXPIRED_WORKDAY_CONFIRM_TITLE'),
				description: Loc.getMessage('M_STAFFTRACK_ADD_CHECK_IN_EXPIRED_WORKDAY_CONFIRM_DESCRIPTION'),
				actionButtonText: Loc.getMessage('M_STAFFTRACK_ADD_CHECK_IN_EXPIRED_WORKDAY_CONFIRM_ACTION'),
				onAction: () => Entry.openTimemanPage(),
			});
		}

		#shouldShowStartWorkDayConfirm()
		{
			return this.isTimeManIntegrationEnabled
				&& this.isNotWorkingDay
				&& !this.isWorkDayOpened
				&& this.confirmStartWorkDayResult === null
			;
		}

		#showConfirmStartWorkDay()
		{
			Haptics.notifyWarning();

			confirmDefaultAction({
				title: Loc.getMessage('M_STAFFTRACK_ADD_CHECK_IN_START_WORKDAY_CONFIRM_TITLE'),
				description: Loc.getMessage('M_STAFFTRACK_ADD_CHECK_IN_START_WORKDAY_CONFIRM_DESCRIPTION'),
				actionButtonText: Loc.getMessage('M_STAFFTRACK_ADD_CHECK_IN_START_WORKDAY_CONFIRM_ACTION'),
				cancelButtonText: Loc.getMessage('M_STAFFTRACK_ADD_CHECK_IN_START_WORKDAY_CONFIRM_CANCEL'),
				onAction: () => {
					this.confirmStartWorkDayResult = false;
					void this.#sendCheckIn();
				},
				onCancel: () => {
					this.confirmStartWorkDayResult = true;
					void this.#sendCheckIn();
				},
			});
		}

		get #layoutWidget()
		{
			return this.props.layoutWidget;
		}
	}

	CheckInForm.defaultProps = {
		dialogId: null,
		dialogName: null,
		loadingViewStyle: {},
		title: null,
		onCheckInSent: null,
		onCheckInAdded: null,
	};

	CheckInForm.propTypes = {
		layoutWidget: PropTypes.object.isRequired,
		dialogId: PropTypes.string,
		dialogName: PropTypes.string,
		loadingViewStyle: PropTypes.object,
		title: PropTypes.string,
		onCheckInSent: PropTypes.func,
		onCheckInAdded: PropTypes.func,
	};

	module.exports = { CheckInForm };
});
