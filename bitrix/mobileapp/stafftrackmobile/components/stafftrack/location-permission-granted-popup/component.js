(() => {
	const require = (extension) => jn.require(extension);

	const { Entry } = require('stafftrack/entry');
	const { LocationPermissionGrantedPopup } = require('stafftrack/check-in-v2/location-permission-granted-popup');

	const isAutoCheckInEnabledInSettings = BX.componentParameters.get('isAutoCheckInEnabledInSettings', false);
	const isCheckInRequiredOnWorkDayStart = BX.componentParameters.get('isCheckInRequiredOnWorkDayStart', false);

	BX.onViewLoaded(() => {
		layout.showComponent(new LocationPermissionGrantedPopup({
			layout,
			isAutoCheckInEnabledInSettings,
			isCheckInRequiredOnWorkDayStart,
			onOpenCheckIn: async () => {
				layout.close(() => {
					void Entry.revealCheckInEntry();
				});
			},
		}));
	});
})();
