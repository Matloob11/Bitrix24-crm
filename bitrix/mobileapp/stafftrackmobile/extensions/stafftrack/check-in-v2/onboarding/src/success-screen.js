/**
 * @module stafftrack/check-in-v2/onboarding/src/success-screen
 */
jn.define('stafftrack/check-in-v2/onboarding/src/success-screen', (require, exports, module) => {
	const { Color, Indent, Component } = require('tokens');
	const { makeLibraryImagePath } = require('asset-manager');
	const { Text3 } = require('ui-system/typography/text');
	const { H2 } = require('ui-system/typography/heading');
	const { Button, ButtonDesign } = require('ui-system/form/buttons/button');
	const { IconView, Icon } = require('ui-system/blocks/icon');

	const LOTTIE_URI = makeLibraryImagePath('success.json', 'onboarding', 'stafftrack', false);

	/**
	 * @extends {LayoutComponent<OnboardingSuccessScreenProps>}
	 */
	class OnboardingSuccessScreen extends LayoutComponent
	{
		render()
		{
			const { position } = this.props;

			return View(
				{
					style: {
						flex: 2,
						backgroundColorGradient: {
							start: '#BE52FF',
							end: '#6732FF',
							angle: 95,
						},
					},
				},
				View(
					{
						style: {
							flex: 2,
							justifyContent: 'space-between',
							marginTop: position.top,
							paddingTop: Indent.XL4.toNumber(),
							marginBottom: position.horizontal,
							marginHorizontal: position.horizontal,
						},
					},
					View(
						{
							style: {
								flex: 2,
							},
						},
						this.#renderImage(),
						this.#renderLottie(),
						this.#renderContent(),
					),
					this.#renderButton(),
				),
				this.#renderCloseButton(),
			);
		}

		#renderCloseButton()
		{
			const { position, onClose } = this.props;

			return View(
				{
					style: {
						width: 32,
						height: 32,
						position: 'absolute',
						top: position.top + 20,
						right: position.horizontal,
						justifyContent: 'center',
						backgroundColor: Color.base6.toHex(0.4),
						borderRadius: Component.elementAccentCorner.toNumber(),
						zIndex: 3,
					},
				},
				IconView({
					icon: Icon.CROSS,
					size: 22,
					style: { alignSelf: 'center' },
					color: Color.baseWhiteFixed,
					onClick: onClose,
				}),
			);
		}

		#renderImage()
		{
			const { image } = this.props;

			return image && Image({
				style: {
					paddingVertical: Indent.XL4.toNumber(),
					minHeight: 200,
					minWidth: 200,
					width: '100%',
					height: '100%',
					maxWidth: 363,
					maxHeight: 369,
				},
				resizeMode: 'contain',
				uri: image,
			});
		}

		#renderContent()
		{
			const { title, description } = this.props;

			return View(
				{
					style: {
						paddingVertical: Indent.XL3.toNumber(),
					},
				},
				title && H2({
					color: Color.baseWhiteFixed,
					text: title,
					style: {
						marginBottom: Indent.XL4.toNumber(),
						textAlign: 'center',
					},
				}),
				description && Text3({
					color: Color.baseWhiteFixed,
					text: description,
					style: {
						textAlign: 'center',
					},
				}),
			);
		}

		#renderButton()
		{
			const { buttonText, onClose } = this.props;

			return Button({
				testId: 'onboarding-success-screen-close',
				stretched: true,
				rounded: false,
				text: buttonText ?? '',
				onClick: onClose,
				design: ButtonDesign.OUTLINE_ACCENT_2,
				backgroundColor: Color.bgContentLight,
			});
		}

		#renderLottie()
		{
			return View(
				{
					style: {
						flex: 2,
						position: 'absolute',
						top: 0,
						left: 0,
						right: 0,
						bottom: '50%',
					},
				},
				LottieView({
					testId: 'onboarding-success-screen-lottie',
					style: {
						position: 'absolute',
						top: 0,
						left: 0,
						right: 0,
						bottom: 0,
					},
					data: {
						uri: LOTTIE_URI,
					},
					params: {
						loopMode: 'playOnce',
					},
					autoPlay: true,
				}),
				View(
					{
						style: {
							position: 'absolute',
							top: 0,
							left: 0,
							right: 0,
							bottom: 0,
							padding: 20,
						},
						rotate: 180,
					},
					LottieView({
						style: {
							rotate: 20,
							position: 'absolute',
							top: 0,
							left: 0,
							right: 0,
							bottom: 0,
						},
						testId: 'onboarding-success-screen-lottie',
						data: {
							uri: LOTTIE_URI,
						},
						params: {
							loopMode: 'playOnce',
						},
						autoPlay: true,
					}),
				),
			);
		}
	}

	module.exports = {
		OnboardingSuccessScreen,
	};
});
