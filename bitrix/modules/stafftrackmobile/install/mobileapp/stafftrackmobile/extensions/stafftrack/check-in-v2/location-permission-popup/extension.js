/**
 * @module stafftrack/check-in-v2/location-permission-popup
 */
jn.define('stafftrack/check-in-v2/location-permission-popup', (require, exports, module) => {
	const { Loc } = require('loc');
	const { Color, Indent } = require('tokens');
	const { makeLibraryImagePath } = require('asset-manager');
	const { Box } = require('ui-system/layout/box');
	const { BoxFooter } = require('ui-system/layout/dialog-footer');
	const { H2 } = require('ui-system/typography/heading');
	const { Text3 } = require('ui-system/typography/text');
	const { IconView, Icon } = require('ui-system/blocks/icon');
	const { Button, ButtonSize } = require('ui-system/form/buttons/button');

	const TEST_ID = 'location-permission-popup';

	const TITLE_KEY_BY_VARIANT = {
		auto: 'STAFFTRACKMOBILE_LOCATION_PERMISSION_POPUP_AUTO_TITLE',
		timeman: 'STAFFTRACKMOBILE_LOCATION_PERMISSION_POPUP_TIMEMAN_TITLE',
	};

	const ITEMS_BY_VARIANT = {
		auto: [
			{ icon: Icon.AUTO_CHECK_IN, key: 'STAFFTRACKMOBILE_LOCATION_PERMISSION_POPUP_AUTO_ITEM_1' },
			{ icon: Icon.CLOCK, key: 'STAFFTRACKMOBILE_LOCATION_PERMISSION_POPUP_AUTO_ITEM_2' },
			{ icon: Icon.MAP, key: 'STAFFTRACKMOBILE_LOCATION_PERMISSION_POPUP_AUTO_ITEM_3' },
		],
		timeman: [
			{ icon: Icon.AUTO_CHECK_IN, key: 'STAFFTRACKMOBILE_LOCATION_PERMISSION_POPUP_TIMEMAN_ITEM_1' },
			{ icon: Icon.CLOCK, key: 'STAFFTRACKMOBILE_LOCATION_PERMISSION_POPUP_TIMEMAN_ITEM_2' },
			{ icon: Icon.MAP, key: 'STAFFTRACKMOBILE_LOCATION_PERMISSION_POPUP_TIMEMAN_ITEM_3' },
		],
	};

	/**
	 * @extends {LayoutComponent<LocationPermissionPopupProps>}
	 */
	class LocationPermissionPopup extends LayoutComponent
	{
		/**
		 * @param {LocationPermissionPopupProps} props
		 */
		constructor(props)
		{
			super(props);

			this.handleAllowClick = this.handleAllowClick.bind(this);
		}

		getVariant()
		{
			if (this.props.isAutoCheckInEnabledInSettings)
			{
				return 'auto';
			}

			if (this.props.isCheckInRequiredOnWorkDayStart)
			{
				return 'timeman';
			}

			return 'auto';
		}

		render()
		{
			return Box(
				{
					testId: TEST_ID,
					footer: BoxFooter(
						{ testId: `${TEST_ID}-footer` },
						this.renderButton(),
					),
					withPaddingHorizontal: true,
				},
				this.renderImage(),
				this.renderTitle(),
				this.renderItems(),
			);
		}

		renderImage()
		{
			return View(
				{
					style: {
						alignItems: 'center',
						justifyContent: 'center',
						marginTop: Indent.XL.toNumber(),
						marginBottom: Indent.XL4.toNumber(),
					},
				},
				Image({
					style: {
						width: 224,
						height: 224,
					},
					uri: makeLibraryImagePath('enabled-popup.png', 'onboarding', 'stafftrack', false),
					resizeMode: 'contain',
				}),
			);
		}

		renderTitle()
		{
			return H2({
				text: Loc.getMessage(TITLE_KEY_BY_VARIANT[this.getVariant()]),
				color: Color.base1,
				style: {
					textAlign: 'center',
					marginBottom: Indent.XL4.toNumber(),
				},
			});
		}

		renderItems()
		{
			const items = ITEMS_BY_VARIANT[this.getVariant()] ?? [];

			return View(
				{
					style: {
						paddingHorizontal: Indent.XL4.toNumber(),
					},
				},
				...items.map(({ icon, key }) => this.renderItem(icon, Loc.getMessage(key))),
			);
		}

		renderItem(icon, text)
		{
			return View(
				{
					style: {
						flexDirection: 'row',
						alignItems: 'center',
						marginBottom: Indent.XL2.toNumber(),
					},
				},
				IconView({
					icon,
					size: 24,
					color: Color.accentMainPrimary,
					style: {
						marginRight: Indent.M.toNumber(),
					},
				}),
				Text3({
					text,
					color: Color.base1,
					style: {
						flex: 1,
					},
				}),
			);
		}

		renderButton()
		{
			const { isLocationPermissionGranted } = this.props;

			return Button({
				testId: `${TEST_ID}-allow`,
				size: ButtonSize.L,
				stretched: true,
				text: isLocationPermissionGranted
					? Loc.getMessage('STAFFTRACKMOBILE_LOCATION_PERMISSION_POPUP_BUTTON_UNDERSTOOD')
					: Loc.getMessage('STAFFTRACKMOBILE_LOCATION_PERMISSION_POPUP_BUTTON'),
				onClick: this.handleAllowClick,
			});
		}

		async handleAllowClick()
		{
			const { onAllow } = this.props;

			try
			{
				await onAllow?.();
			}
			catch (error)
			{
				console.error('LocationPermissionPopup onAllow error:', error);
			}
		}
	}

	module.exports = {
		LocationPermissionPopup,
	};
});
