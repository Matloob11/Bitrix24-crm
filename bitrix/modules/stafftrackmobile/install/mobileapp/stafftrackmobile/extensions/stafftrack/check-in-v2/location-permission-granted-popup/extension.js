/**
 * @module stafftrack/check-in-v2/location-permission-granted-popup
 */
jn.define('stafftrack/check-in-v2/location-permission-granted-popup', (require, exports, module) => {
	const { Loc } = require('loc');
	const { Color, Indent } = require('tokens');
	const { downloadImages, makeLibraryImagePath } = require('asset-manager');
	const { Box } = require('ui-system/layout/box');
	const { BoxFooter } = require('ui-system/layout/dialog-footer');
	const { H2, H3 } = require('ui-system/typography/heading');
	const { Text3 } = require('ui-system/typography/text');
	const { Button, ButtonSize } = require('ui-system/form/buttons/button');

	const TEST_ID = 'location-permission-granted-popup';

	const TITLE_KEY_BY_VARIANT = {
		auto: 'STAFFTRACKMOBILE_LOCATION_PERMISSION_GRANTED_POPUP_AUTO_TITLE',
		timeman: 'STAFFTRACKMOBILE_LOCATION_PERMISSION_GRANTED_POPUP_TIMEMAN_TITLE',
	};

	const DESCRIPTION_KEY_BY_VARIANT = {
		auto: 'STAFFTRACKMOBILE_LOCATION_PERMISSION_GRANTED_POPUP_AUTO_DESCRIPTION',
		timeman: 'STAFFTRACKMOBILE_LOCATION_PERMISSION_GRANTED_POPUP_TIMEMAN_DESCRIPTION',
	};

	/**
	 * @extends {LayoutComponent<LocationPermissionGrantedPopupProps>}
	 */
	class LocationPermissionGrantedPopup extends LayoutComponent
	{
		/**
		 * @param {LocationPermissionGrantedPopupProps} props
		 */
		constructor(props)
		{
			super(props);

			this.handleOpenCheckInClick = this.handleOpenCheckInClick.bind(this);

			void downloadImages([
				makeLibraryImagePath('confetti.svg', 'graphic'),
				makeLibraryImagePath('success.png', 'graphic', 'stafftrack'),
			]);
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
				},
				this.renderConfetti(),
				this.renderHeader(),
				this.renderImage(),
				this.renderTitle(),
				this.renderDescription(),
			);
		}

		renderHeader()
		{
			return View(
				{
					style: {
						marginTop: 15,
						height: 44,
						alignItems: 'center',
						justifyContent: 'center',
					},
				},
				H3({
					text: Loc.getMessage('STAFFTRACKMOBILE_LOCATION_PERMISSION_GRANTED_POPUP_HEADER'),
					color: Color.base1,
				}),
			);
		}

		renderConfetti()
		{
			if (Math.min(device.screen.width, device.screen.height) >= 768)
			{
				return null;
			}

			return Image({
				style: {
					position: 'absolute',
					width: '100%',
					height: 126,
					top: -20,
				},
				resizeMode: 'stretch',
				svg: {
					uri: makeLibraryImagePath('confetti.svg', 'graphic'),
				},
			});
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
					uri: makeLibraryImagePath('success.png', 'graphic', 'stafftrack'),
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
					marginBottom: Indent.XL2.toNumber(),
					paddingHorizontal: Indent.XL4.toNumber(),
				},
			});
		}

		renderDescription()
		{
			return Text3({
				text: Loc.getMessage(DESCRIPTION_KEY_BY_VARIANT[this.getVariant()]),
				color: Color.base1,
				style: {
					textAlign: 'center',
					paddingHorizontal: Indent.XL4.toNumber(),
				},
			});
		}

		renderButton()
		{
			return Button({
				testId: `${TEST_ID}-open-check-in`,
				size: ButtonSize.L,
				stretched: true,
				text: Loc.getMessage('STAFFTRACKMOBILE_LOCATION_PERMISSION_GRANTED_POPUP_BUTTON'),
				onClick: this.handleOpenCheckInClick,
			});
		}

		async handleOpenCheckInClick()
		{
			const { onOpenCheckIn } = this.props;

			try
			{
				await onOpenCheckIn?.();
			}
			catch (error)
			{
				console.error('LocationPermissionGrantedPopup onOpenCheckIn error:', error);
			}
		}
	}

	module.exports = {
		LocationPermissionGrantedPopup,
	};
});
