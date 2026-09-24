/**
 * @module stafftrack/check-in-v2/onboarding
 */
jn.define('stafftrack/check-in-v2/onboarding', (require, exports, module) => {
	const { Loc } = require('loc');
	const { Corner, Color } = require('tokens');
	const { makeLibraryImagePath } = require('asset-manager');
	const { WidgetLayer } = require('widget-layer');
	const { Slider, sliderInternalPosition } = require('layout/ui/story-slider');
	const { OnboardingSlide } = require('stafftrack/check-in-v2/onboarding/src/slides/base');
	const { getSlidesConfig } = require('stafftrack/check-in-v2/onboarding/src/slides-config');
	const { OnboardingSuccessScreen } = require('stafftrack/check-in-v2/onboarding/src/success-screen');

	const TEST_ID = 'stafftrack-onboarding';
	const MAX_WIDTH = 440;
	const MAX_HEIGHT = 956;

	/**
	 * @extends {LayoutComponent<OnboardingProps, OnboardingState>}
	 */
	class Onboarding extends LayoutComponent
	{
		#widgetLayer = null;
		#sliderRef = null;
		#unmounted = false;
		#closeNotified = false;
		#revealCheckInAfterClose = false;

		/**
		 * @param {OnboardingProps} props
		 */
		constructor(props)
		{
			super(props);

			this.state = {
				showSuccess: false,
			};
		}

		componentWillUnmount()
		{
			this.#unmounted = true;
			this.#notifyClose();
		}

		/**
		 * @param {OnboardingProps} params
		 */
		static async show(params)
		{
			const onboarding = new Onboarding(params);

			try
			{
				onboarding.#widgetLayer = await WidgetLayer.open({ component: onboarding });
			}
			catch (e)
			{
				console.error('Error showing Onboarding:', e);
			}
		}

		render()
		{
			const view = this.state.showSuccess ? this.#renderSuccess() : this.#renderSlider();

			if (!this.#shouldUseFixedSize())
			{
				return view;
			}

			const { width, height } = this.#getSize();

			return View(
				{
					style: {
						flex: 1,
						alignItems: 'center',
						justifyContent: 'center',
						backgroundColor: Color.baseWhiteFixed.toHex(),
					},
				},
				this.#renderBackground(),
				View(
					{
						style: {
							width,
							height,
							borderRadius: Corner.XL.toNumber(),
							overflow: 'hidden',
						},
					},
					view,
				),
			);
		}

		#renderBackground()
		{
			if (device.screen.width < MAX_WIDTH)
			{
				return View({});
			}

			return View(
				{
					style: {
						position: 'absolute',
						top: 0,
						left: 0,
						right: 0,
						bottom: 0,
					},
				},

				Image({
					uri: makeLibraryImagePath('map_blurred.png', 'onboarding', 'stafftrack', false),
					style: {
						width: 433,
						height: 433,
						position: 'absolute',
						top: 53,
						left: -188,
					},
					resizeMode: 'contain',
				}),
				Image({
					uri: makeLibraryImagePath('marshmallow_route_blurred.png', 'onboarding', 'stafftrack', false),
					style: {
						width: 440,
						height: 440,
						position: 'absolute',
						top: 16,
						right: -137,
					},
					resizeMode: 'contain',
				}),
				Image({
					uri: makeLibraryImagePath('gpt_blurred.png', 'onboarding', 'stafftrack', false),
					style: {
						width: 345,
						height: 345,
						position: 'absolute',
						bottom: -108,
						right: 10,
					},
					resizeMode: 'contain',
				}),
				Image({
					uri: makeLibraryImagePath('marshmallow_calendar_blurred.png', 'onboarding', 'stafftrack', false),
					style: {
						width: 320,
						height: 320,
						position: 'absolute',
						bottom: 64,
						left: -70,
					},
					resizeMode: 'contain',
				}),
			);
		}

		#renderSlider()
		{
			const { width, height } = this.#getSize();
			let style = {};

			if (this.#shouldUseFixedSize())
			{
				style = {
					width,
					height,
				};
			}

			return new Slider({
				testId: TEST_ID,
				ref: (ref) => {
					this.#sliderRef = ref;
				},
				slides: this.#buildSlides(),
				slideDuration: 7,
				closeOnComplete: false,
				clickableInsets: {
					bottom: 96,
				},
				style,
				onClose: this.#close,
			});
		}

		#renderSuccess()
		{
			return new OnboardingSuccessScreen({
				title: Loc.getMessage('STAFFTRACKMOBILE_CHECK_IN_ONBOARDING_SLIDE_FINAL_TITLE'),
				description: Loc.getMessage('STAFFTRACKMOBILE_CHECK_IN_ONBOARDING_SLIDE_FINAL_DESCRIPTION'),
				buttonText: Loc.getMessage('STAFFTRACKMOBILE_CHECK_IN_ONBOARDING_SLIDE_FINAL_BUTTON'),
				image: makeLibraryImagePath('final.png', 'onboarding', 'stafftrack', false),
				position: sliderInternalPosition,
				onClose: this.#close,
			});
		}

		#buildSlides()
		{
			const slides = getSlidesConfig({
				isPlanningServiceEnabled: this.props.isPlanningServiceEnabled !== false,
			});

			const buttonText = this.props.canEnableFeatures
				? Loc.getMessage('STAFFTRACKMOBILE_CHECK_IN_ONBOARDING_SLIDE_BUTTON')
				: Loc.getMessage('STAFFTRACKMOBILE_CHECK_IN_ONBOARDING_SLIDE_BUTTON_VIEW');

			return slides.map((config) => new OnboardingSlide({
				...config,
				buttonText,
				position: sliderInternalPosition,
				onActivate: this.#onSlideActivate,
			}));
		}

		#onSlideActivate = async (id) => {
			this.#sliderRef?.pauseAutoProgress?.();
			let success = false;

			if (!this.props.canEnableFeatures)
			{
				this.#revealCheckInAfterClose = true;
				this.#close();

				return;
			}

			try
			{
				await this.props.onActivate(id);
				success = true;
			}
			finally
			{
				if (!success && !this.#unmounted)
				{
					this.#sliderRef?.resumeAutoProgress?.();
				}
			}

			if (success && !this.#unmounted)
			{
				this.setState({ showSuccess: true });
			}
		};

		#close = () => {
			this.#notifyClose();
			this.#widgetLayer?.close();
		};

		#notifyClose()
		{
			if (this.#closeNotified)
			{
				return;
			}

			this.#closeNotified = true;
			this.props.onClose?.({
				wasSuccessful: this.state.showSuccess,
				shouldRevealCheckIn: this.#revealCheckInAfterClose,
			});
		}

		#shouldUseFixedSize()
		{
			return device.screen.width >= MAX_WIDTH || device.screen.height >= MAX_HEIGHT;
		}

		#getSize()
		{
			return {
				width: device.screen.width >= MAX_WIDTH ? MAX_WIDTH : device.screen.width,
				height: device.screen.height >= MAX_HEIGHT ? MAX_HEIGHT : device.screen.height,
			};
		}
	}

	module.exports = {
		Onboarding,
	};
});
