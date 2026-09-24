/**
 * @module stafftrack/layout/check-in-v2/form/src/ui/check-in-view
 */
jn.define('stafftrack/layout/check-in-v2/form/src/ui/check-in-view', (require, exports, module) => {
	const { Area } = require('ui-system/layout/area');
	const { AreaList } = require('ui-system/layout/area-list');
	const { Avatar } = require('ui-system/blocks/avatar');
	const { Box } = require('ui-system/layout/box');
	const { BoxFooter } = require('ui-system/layout/dialog-footer');
	const { Button, ButtonDesign, ButtonSize } = require('ui-system/form/buttons/button');
	const { ChipButton, ChipButtonDesign, ChipButtonMode } = require('ui-system/blocks/chips/chip-button');
	const { ChipStatus, ChipStatusDesign, ChipStatusMode } = require('ui-system/blocks/chips/chip-status');
	const { Component, Indent } = require('tokens');
	const { CheckInFileField } = require('stafftrack/layout/check-in-v2/form/src/file-field');
	const { Ellipsize } = require('utils/enums/style');
	const { Icon } = require('assets/icons');
	const { Loc } = require('loc');
	const { H3 } = require('ui-system/typography/heading');
	const { TextAreaInput, InputSize, InputMode, InputDesign } = require('ui-system/form/inputs/textarea');
	const { isModuleInstalled } = require('module');
	const { withCurrentDomain } = require('utils/url');
	const { Type } = require('type');

	/**
	 * @param {CheckInViewProps} props
	 */
	const CheckInView = (props) => {
		const {
			snapshotUrl,
			address,
			files,
			dialogName,
			hasInputError,
			hasUploadingFiles,
			remainderCharacters,
			testId,
			onChangeDescription,
			onChangeFiles,
			fileFieldRef,
			parentWidget,
			onOpenChat,
			onClearChat,
			onSendCheckIn,
			isSubmitting,
			canUploadFiles,
			onRef,
			title,
		} = props;

		const renderMap = () => {
			return View(
				{
					testId: testId('add-check-in-snapshot'),
					style: {
						width: '100%',
						height: 136,
						position: 'relative',
						alignItems: 'center',
						justifyContent: 'center',
						borderRadius: Component.cardCornerXL.toNumber(),
						backgroundImage: withCurrentDomain(snapshotUrl),
						backgroundResizeMode: 'cover',
						paddingHorizontal: 18,
					},
				},
				View(
					{
						style: {
							alignItems: 'center',
							justifyContent: 'center',
						},
					},
					Avatar({
						testId: testId(`add-check-in-avatar-${env.userId}`),
						id: env.userId,
						size: 48,
						withRedux: true,
						style: {
							zIndex: 2,
						},
					}),
					ChipStatus({
						testId: testId('add-check-in-address-chip'),
						text: address,
						ellipsize: Ellipsize.MIDDLE,
						mode: ChipStatusMode.TINTED,
						design: ChipStatusDesign.PRIMARY,
						compact: false,
						style: {
							marginTop: Indent.XL.toNumber(),
						},
					}),
				),
			);
		};

		const renderDescriptionTextArea = () => {
			return TextAreaInput({
				testId: testId('add-check-in-description'),
				height: 82,
				showCharacterCount: false,
				error: hasInputError,
				errorText: hasInputError ? String(remainderCharacters) : '',
				size: InputSize.L,
				mode: InputMode.NAKED,
				design: hasInputError ? InputDesign.PRIMARY : InputDesign.LIGHT_GREY,
				onChange: onChangeDescription,
				placeholder: Loc.getMessage('M_STAFFTRACK_ADD_CHECK_IN_DESCRIPTION_PLACEHOLDER'),
				multiline: true,
				style: {
					marginVertical: Indent.XL3.toNumber(),
				},
			});
		};

		const renderFileChip = () => {
			if (!canUploadFiles)
			{
				return null;
			}

			return View(
				{
					style: {
						flexShrink: 0,
						marginRight: 8,
					},
				},
				CheckInFileField({
					ref: fileFieldRef,
					id: 'check-in-files',
					testId: testId('add-check-in-files'),
					title: Loc.getMessage('M_STAFFTRACK_ADD_CHECK_IN_FILE_BUTTON_PLACEHOLDER_MSGVER_1'),
					value: files,
					readOnly: false,
					required: false,
					multiple: true,
					showFilesName: true,
					showAddButton: true,
					onChange: onChangeFiles,
					config: {
						textMultiple: Loc.getMessage('M_STAFFTRACK_ADD_CHECK_IN_FILES_BUTTON_MSGVER_1', { '#COUNT#': files?.length }),
						parentWidget,
						uploadController: {
							endpoint: 'stafftrack.Internal.Integration.Disk.CheckInUploadController',
						},
						disk: {
							isDiskModuleInstalled: isModuleInstalled('disk'),
							isWebDavModuleInstalled: true,
							fileAttachPath: `/mobile/?mobile_action=disk_folder_list&type=user&path=%2F&entityId=${env.userId}`,
						},
					},
				}),
			);
		};

		const renderChatChip = () => {
			return ChipButton({
				testId: testId(`add-check-in-chat-${dialogName ? 'selected' : 'empty'}`),
				mode: ChipButtonMode.OUTLINE,
				disabled: !snapshotUrl,
				design: dialogName ? ChipButtonDesign.PRIMARY : ChipButtonDesign.GREY,
				clearable: Boolean(dialogName),
				onClear: onClearChat,
				onClick: snapshotUrl ? onOpenChat : () => {},
				style: {
					marginRight: 8,
					flexGrow: 1,
					flexShrink: 1,
				},
				text: dialogName ?? Loc.getMessage('M_STAFFTRACK_ADD_CHECK_IN_MESSENGER_BUTTON_PLACEHOLDER'),
				icon: Icon.MESSAGES,
				compact: false,
				rounded: false,
			});
		};

		const renderChipsPanel = () => {
			return View(
				{
					testId: testId('add-check-in-chips-panel'),
					style: {
						flexDirection: 'row',
						alignItems: 'flex-start',
						justifyContent: 'flex-start',
					},
				},
				renderFileChip(),
				renderChatChip(),
			);
		};

		const isSubmitDisabled = hasInputError || hasUploadingFiles;
		const submitButtonBase = {
			leftIcon: Icon.LOCATION_PLUS,
			text: Loc.getMessage('M_STAFFTRACK_ADD_CHECK_IN_BUTTON'),
			disabled: isSubmitDisabled,
			loading: isSubmitting,
			onClick: isSubmitDisabled ? () => {} : onSendCheckIn,
		};

		const footer = BoxFooter(
			{
				testId: testId('add-check-in-footer-submit-button'),
				keyboardButton: {
					...submitButtonBase,
				},
			},
			Button({
				testId: testId('add-check-in-submit-button'),
				design: ButtonDesign.FILLED,
				size: ButtonSize.L,
				stretched: true,
				...submitButtonBase,
			}),
		);

		return Box(
			{
				testId: testId('add-check-in-box'),
				resizableByKeyboard: true,
				withScroll: true,
				footer,
				safeArea: {
					bottom: true,
				},
				ref: onRef,
			},
			Type.isStringFilled(title) && H3({
				style: {
					height: 44,
					textAlign: 'center',
				},
				text: title,
				testId: testId('add-check-in-title-field'),
			}),
			AreaList(
				{
					testId: testId('add-check-in-content'),
					withScroll: false,
					safeArea: {
						bottom: false,
					},
				},
				Area(
					{
						isFirst: true,
					},
					snapshotUrl && renderMap(),
					renderDescriptionTextArea(),
					renderChipsPanel(),
				),
			),
		);
	};

	module.exports = { CheckInView };
});
