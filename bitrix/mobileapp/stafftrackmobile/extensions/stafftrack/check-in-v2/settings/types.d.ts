declare type CheckInSettingsProps = {
	layoutWidget: object,
};

declare type CheckInSettingsData = {
	isCheckInEnabled: boolean,
	isTimemanAvailable: boolean,
	isTimemanIntegrationEnabled: boolean,
	isAutoCheckInEnabledInSettings: boolean,
	canChangeAutoCheckIn: boolean,
	isDayStartCheckInEnabledInSettings: boolean,
	canChangeDayStartCheckIn: boolean,
};

declare type CheckInSettingsState = CheckInSettingsData & {
	isLoading: boolean,
};
