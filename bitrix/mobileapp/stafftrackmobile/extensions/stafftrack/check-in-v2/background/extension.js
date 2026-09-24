(() => {
	const require = jn.require;

	const { isModuleInstalled } = require('module');
	const { Feature } = require('feature');
	const { Tourist } = require('tourist');
	const { Geo, GeoStatus } = require('utils/geo');
	const { OnboardingUIManager } = require('stafftrack/check-in-v2/onboarding/ui-manager');
	const { LocationPermissionPopupUIManager } = require('stafftrack/check-in-v2/location-permission-popup/ui-manager');
	const {
		LocationPermissionGrantedPopupUIManager,
	} = require('stafftrack/check-in-v2/location-permission-granted-popup/ui-manager');
	const {
		LOCATION_PERMISSION_POPUP_OPEN_EVENT,
		LOCATION_PERMISSION_POPUP_CLOSED_EVENT,
		LOCATION_PERMISSION_GRANTED_EVENT,
		LOCATION_PERMISSION_POPUP_REVEAL_CHECK_IN,
		LOCATION_PERMISSION_GRANTED_REMEMBERED,
	} = require('stafftrack/check-in-v2/location-permission-popup/const');
	const { Entry } = require('stafftrack/entry');

	const rememberLocationPermissionGrantedIfNeeded = async (isAutoCheckInEnabledInSettings) => {
		if (isAutoCheckInEnabledInSettings === true)
		{
			await Tourist.remember(LOCATION_PERMISSION_GRANTED_REMEMBERED);
			BX.postComponentEvent(LOCATION_PERMISSION_GRANTED_EVENT, []);
		}
	};

	if (isModuleInstalled('timeman'))
	{
		const { AutoCheckIn } = require('stafftrack/check-in-v2/auto-check-in');

		if (AutoCheckIn)
		{
			new AutoCheckIn();
		}
	}

	if (Feature.isLocationStatusSupported())
	{
		let status = null;
		BX.addCustomEvent(LOCATION_PERMISSION_POPUP_OPEN_EVENT, async (state = {}) => {
			status = await Geo.getLocationStatus();

			if (Geo.isLocationPermissionGranted(status))
			{
				setTimeout(() => {
					void Entry.revealCheckInEntry();
				}, 300);
			}
			else
			{
				setTimeout(() => {
					LocationPermissionPopupUIManager.openComponent({
						isAutoCheckInEnabledInSettings: state.isAutoCheckInEnabledInSettings === true,
						isCheckInRequiredOnWorkDayStart: state.isCheckInRequiredOnWorkDayStart === true,
					});
				}, 300);
			}
		});

		BX.addCustomEvent(LOCATION_PERMISSION_POPUP_CLOSED_EVENT, async ({
			isAutoCheckInEnabledInSettings,
			isCheckInRequiredOnWorkDayStart,
			wasAllowClicked,
		}) => {
			if (!wasAllowClicked)
			{
				return;
			}

			status = await Geo.getLocationStatus();

			if (Geo.isLocationPermissionGranted(status))
			{
				await rememberLocationPermissionGrantedIfNeeded(isAutoCheckInEnabledInSettings);

				return;
			}

			const result = await new Geo({ shouldShowAlert: true }).requestPosition();
			if (result.status === GeoStatus.SUCCESS)
			{
				await rememberLocationPermissionGrantedIfNeeded(isAutoCheckInEnabledInSettings);

				setTimeout(() => {
					LocationPermissionGrantedPopupUIManager.openComponent({
						isAutoCheckInEnabledInSettings: isAutoCheckInEnabledInSettings === true,
						isCheckInRequiredOnWorkDayStart: isCheckInRequiredOnWorkDayStart === true,
					});
				}, 300);
			}
		});

		BX.addCustomEvent(LOCATION_PERMISSION_POPUP_REVEAL_CHECK_IN, () => {
			setTimeout(() => {
				void Entry.revealCheckInEntry();
			}, 300);
		});
	}

	void (async () => {
		await OnboardingUIManager.openInBackgroundIfNeeded();
		await LocationPermissionPopupUIManager.openInBackgroundIfNeeded();
	})();
})();
