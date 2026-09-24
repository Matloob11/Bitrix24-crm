(() => {
	const require = (extension) => jn.require(extension);

	const { Tourist } = require('tourist');
	const { Geo } = require('utils/geo');
	const { LocationPermissionPopup } = require('stafftrack/check-in-v2/location-permission-popup');
	const {
		LOCATION_PERMISSION_POPUP_CLOSED_EVENT,
		LOCATION_PERMISSION_POPUP_SHOWN,
		LOCATION_PERMISSION_POPUP_TIMEMAN_SHOWN,
	} = require('stafftrack/check-in-v2/location-permission-popup/const');

	const isAutoCheckInEnabledInSettings = BX.componentParameters.get('isAutoCheckInEnabledInSettings', false);
	const isCheckInRequiredOnWorkDayStart = BX.componentParameters.get('isCheckInRequiredOnWorkDayStart', false);

	BX.onViewLoaded(async () => {
		let isPermissionGranted = false;
		try
		{
			const status = await Geo.getLocationStatus();
			isPermissionGranted = Geo.isLocationPermissionGranted(status);
		}
		catch (error)
		{
			console.error('LocationPermissionPopup: getLocationStatus failed', error);
		}

		await Tourist.remember(LOCATION_PERMISSION_POPUP_SHOWN);

		if (!isAutoCheckInEnabledInSettings && isCheckInRequiredOnWorkDayStart)
		{
			await Tourist.remember(LOCATION_PERMISSION_POPUP_TIMEMAN_SHOWN);
		}

		let wasAllowClicked = false;

		layout.setListener((eventName) => {
			if (eventName === 'onViewHidden')
			{
				BX.postComponentEvent(LOCATION_PERMISSION_POPUP_CLOSED_EVENT, [{
					isAutoCheckInEnabledInSettings,
					isCheckInRequiredOnWorkDayStart,
					wasAllowClicked,
				}]);
			}
		});

		layout.showComponent(new LocationPermissionPopup({
			layout,
			isAutoCheckInEnabledInSettings,
			isCheckInRequiredOnWorkDayStart,
			isLocationPermissionGranted: isPermissionGranted,
			onAllow: async () => {
				wasAllowClicked = true;

				layout.close();
			},
		}));
	});
})();
