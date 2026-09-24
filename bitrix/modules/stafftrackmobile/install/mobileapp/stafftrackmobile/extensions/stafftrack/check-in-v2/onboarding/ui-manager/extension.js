/**
 * @module stafftrack/check-in-v2/onboarding/ui-manager
 */
jn.define('stafftrack/check-in-v2/onboarding/ui-manager', (require, exports, module) => {
	const { Tourist } = require('tourist');
	const { BackgroundUIManager } = require('background/ui-manager');
	const {
		ONBOARDING_COMPONENT_NAME,
		ONBOARDING_TOURIST_EVENT,
	} = require('stafftrack/check-in-v2/onboarding/const');
	const { shouldShowOnboarding } = require('stafftrack/check-in-v2/onboarding/api');
	const { preloadOnboardingAssets } = require('stafftrack/check-in-v2/onboarding/utils');
	const { openOnboardingComponent } = require('stafftrack/check-in-v2/onboarding/component-opener');

	const ONBOARDING_PRIORITY = 10005;

	class OnboardingUIManager
	{
		/**
		 * @public
		 */
		static openComponent()
		{
			openOnboardingComponent();
		}

		/**
		 * @public
		 */
		static openComponentInBackground()
		{
			BackgroundUIManager.openComponent(
				ONBOARDING_COMPONENT_NAME,
				OnboardingUIManager.openComponent,
				ONBOARDING_PRIORITY,
			);
		}

		/**
		 * @public
		 * @return {boolean}
		 */
		static canOpenComponentInBackground()
		{
			return BackgroundUIManager.canOpenComponentInBackground();
		}

		/**
		 * @public
		 * @return {Promise<void>}
		 */
		static async openInBackgroundIfNeeded()
		{
			await Tourist.ready();

			if (!Tourist.firstTime(ONBOARDING_TOURIST_EVENT))
			{
				return;
			}

			let shouldShow = false;
			try
			{
				shouldShow = await shouldShowOnboarding();
			}
			catch (error)
			{
				console.error('OnboardingUIManager.openIfNeeded:', error);

				return;
			}

			if (!shouldShow)
			{
				void Tourist.remember(ONBOARDING_TOURIST_EVENT);

				return;
			}

			void preloadOnboardingAssets();
			OnboardingUIManager.openComponentInBackground();
		}
	}

	module.exports = {
		OnboardingUIManager,
	};
});
