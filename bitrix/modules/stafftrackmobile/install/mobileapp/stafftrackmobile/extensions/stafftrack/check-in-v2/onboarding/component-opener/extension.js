/**
 * @module stafftrack/check-in-v2/onboarding/component-opener
 */
jn.define('stafftrack/check-in-v2/onboarding/component-opener', (require, exports, module) => {
	const { ONBOARDING_COMPONENT_NAME } = require('stafftrack/check-in-v2/onboarding/const');

	function openOnboardingComponent()
	{
		PageManager.openComponent('JSStackComponent', {
			componentCode: ONBOARDING_COMPONENT_NAME,
			// eslint-disable-next-line no-undef
			scriptPath: availableComponents[ONBOARDING_COMPONENT_NAME].publicUrl,
			canOpenInDefault: true,
			rootWidget: {
				name: 'layout',
				componentCode: ONBOARDING_COMPONENT_NAME,
				settings: {
					objectName: 'layout',
					modal: true,
					backdrop: {
						disableTopInset: true,
						showOnTop: false,
						mediumPositionHeight: 10,
						forceDismissOnSwipeDown: true,
						horizontalSwipeAllowed: false,
						swipeContentAllowed: true,
						hideNavigationBar: true,
					},
				},
			},
		});
	}

	module.exports = {
		openOnboardingComponent,
	};
});
