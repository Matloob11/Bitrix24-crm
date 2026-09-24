/**
 * @module stafftrack/check-in-v2/onboarding/src/slides/base
 */
jn.define('stafftrack/check-in-v2/onboarding/src/slides/base', (require, exports, module) => {
	const { Color, Indent } = require('tokens');
	const { Text3 } = require('ui-system/typography/text');
	const { H2 } = require('ui-system/typography/heading');
	const { Button, ButtonDesign } = require('ui-system/form/buttons/button');

	/**
	 * @extends {LayoutComponent<OnboardingSlideProps, OnboardingSlideState>}
	 */
	class OnboardingSlide extends LayoutComponent
	{
		/**
		 * @param {OnboardingSlideProps} props
		 */
		constructor(props)
		{
			super(props);

			this.state = {
				loadingButton: false,
			};

			this.handleOnEnableClick = this.handleOnEnableClick.bind(this);
		}

		render()
		{
			const { position } = this.props;

			return View(
				{
					style: {
						flex: 1,
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
							flex: 1,
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
								flex: 1,
								marginTop: Indent.XL3.toNumber(),
							},
						},
						this.renderImage(),
						this.renderContent(),
					),
					this.renderButton(),
				),
			);
		}

		renderImage()
		{
			const uri = this.props.image;

			return uri && Image({
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
				uri,
			});
		}

		renderContent()
		{
			const title = this.props.title;
			const description = this.props.description;

			return View(
				{
					style: {
						paddingVertical: Indent.XL3.toNumber(),
					},
				},
				title ? H2({
					color: Color.baseWhiteFixed,
					text: title,
					style: {
						marginBottom: Indent.XL4.toNumber(),
						textAlign: 'center',
					},
				}) : null,
				description ? Text3({
					color: Color.baseWhiteFixed,
					text: description,
					style: {
						textAlign: 'center',
					},
				}) : null,
			);
		}

		renderButton()
		{
			const { loadingButton } = this.state;
			const text = this.props.buttonText;

			return Button({
				testId: `onboarding-slide-button-${this.props.id}-next`,
				stretched: true,
				rounded: false,
				loading: loadingButton,
				text: text ?? '',
				onClick: this.handleOnEnableClick,
				design: ButtonDesign.OUTLINE_ACCENT_2,
				backgroundColor: Color.bgContentLight,
			});
		}

		async handleOnEnableClick()
		{
			const { onActivate, id } = this.props;

			try
			{
				this.setState({ loadingButton: true });
				await onActivate?.(id);
			}
			catch (error)
			{
				console.error('OnboardingSlide activate error:', error);
			}
			finally
			{
				this.setState({ loadingButton: false });
			}
		}
	}

	module.exports = {
		OnboardingSlide,
	};
});
