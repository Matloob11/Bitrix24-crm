/**
 * @module stafftrack/check-in-v2/location-permission-popup/component-opener
 */
jn.define('stafftrack/check-in-v2/location-permission-popup/component-opener', (require, exports, module) => {
	const { Loc } = require('loc');
	const {
		LOCATION_PERMISSION_POPUP_COMPONENT_NAME,
	} = require('stafftrack/check-in-v2/location-permission-popup/const');

	function openLocationPermissionPopupComponent(params = {})
	{
		PageManager.openComponent(
			'JSStackComponent',
			{
				componentCode: LOCATION_PERMISSION_POPUP_COMPONENT_NAME,
				// eslint-disable-next-line no-undef
				scriptPath: availableComponents[LOCATION_PERMISSION_POPUP_COMPONENT_NAME].publicUrl,
				canOpenInDefault: true,
				rootWidget: {
					name: 'layout',
					componentCode: LOCATION_PERMISSION_POPUP_COMPONENT_NAME,
					settings: {
						objectName: 'layout',
						enableNavigationBarBorder: false,
						titleParams: {
							text: Loc.getMessage('STAFFTRACKMOBILE_LOCATION_PERMISSION_POPUP_WIDGET_TITLE'),
							type: 'dialog',
						},
						backdrop: {
							showOnTop: true,
						},
					},
				},
				params,
			},
		);
	}

	module.exports = {
		openLocationPermissionPopupComponent,
	};
});
