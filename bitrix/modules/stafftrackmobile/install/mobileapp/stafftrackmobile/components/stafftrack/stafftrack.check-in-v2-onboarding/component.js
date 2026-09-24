(() => {
	const require = (extension) => jn.require(extension);
	const { Tourist } = require('tourist');
	const { Onboarding } = require('stafftrack/check-in-v2/onboarding');
	const { ONBOARDING_TOURIST_EVENT } = require('stafftrack/check-in-v2/onboarding/const');
	const { enableCheckIn, loadOnboardingConfig } = require('stafftrack/check-in-v2/onboarding/api');
	const {
		LOCATION_PERMISSION_POPUP_OPEN_EVENT,
		LOCATION_PERMISSION_POPUP_REVEAL_CHECK_IN,
	} = require('stafftrack/check-in-v2/location-permission-popup/const');

	BX.onViewLoaded(async () => {
		let popupState = null;
		let wasSuccessful = false;
		let shouldRevealCheckIn = false;

		layout.setListener((eventName) => {
			if (eventName === 'onViewHidden')
			{
				if (wasSuccessful && popupState)
				{
					BX.postComponentEvent(LOCATION_PERMISSION_POPUP_OPEN_EVENT, [popupState]);
				}
				else if (shouldRevealCheckIn)
				{
					BX.postComponentEvent(LOCATION_PERMISSION_POPUP_REVEAL_CHECK_IN, []);
				}
			}
		});

		try
		{
			const { isPlanningServiceEnabled, canEnableFeatures } = await loadOnboardingConfig();

			void Tourist.remember(ONBOARDING_TOURIST_EVENT);

			void Onboarding.show({
				onActivate: async () => {
					popupState = await enableCheckIn();
					if (!popupState)
					{
						throw new Error('Failed to enable check-in');
					}
				},
				onClose: ({ wasSuccessful: success, shouldRevealCheckIn: revealCheckIn } = {}) => {
					wasSuccessful = success === true;
					shouldRevealCheckIn = revealCheckIn === true;

					layout.close();
				},
				isPlanningServiceEnabled,
				canEnableFeatures,
			});
		}
		catch (error)
		{
			console.error('Onboarding: failed to load config', error);
			layout.close();
		}
	});
})();
