/**
 * @module stafftrack/check-in-v2/location-permission-granted-popup/component-opener
 */
jn.define('stafftrack/check-in-v2/location-permission-granted-popup/component-opener', (require, exports, module) => {
	const {
		LOCATION_PERMISSION_GRANTED_POPUP_COMPONENT_NAME,
	} = require('stafftrack/check-in-v2/location-permission-granted-popup/const');

	function openLocationPermissionGrantedPopupComponent(params = {})
	{
		PageManager.openComponent(
			'JSStackComponent',
			{
				componentCode: LOCATION_PERMISSION_GRANTED_POPUP_COMPONENT_NAME,
				// eslint-disable-next-line no-undef
				scriptPath: availableComponents[LOCATION_PERMISSION_GRANTED_POPUP_COMPONENT_NAME].publicUrl,
				canOpenInDefault: true,
				rootWidget: {
					name: 'layout',
					componentCode: LOCATION_PERMISSION_GRANTED_POPUP_COMPONENT_NAME,
					settings: {
						objectName: 'layout',
						enableNavigationBarBorder: false,
						backdrop: {
							mediumPositionHeight: 500,
							disableTopInset: true,
							hideNavigationBar: true,
						},
					},
				},
				params,
			},
		);
	}

	module.exports = {
		openLocationPermissionGrantedPopupComponent,
	};
});
