declare type LocationPermissionPopupProps = {
	isAutoCheckInEnabledInSettings?: boolean,
	isCheckInRequiredOnWorkDayStart?: boolean,
	isLocationPermissionGranted?: boolean,
	onAllow?: () => void | Promise<void>,
};
