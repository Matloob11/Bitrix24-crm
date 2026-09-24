/**
 * @module stafftrack/check-in-v2/location-permission-popup/const
 */
jn.define('stafftrack/check-in-v2/location-permission-popup/const', (require, exports, module) => {
	const LOCATION_PERMISSION_POPUP_COMPONENT_NAME = 'stafftrack:location-permission-popup';
	const LOCATION_PERMISSION_POPUP_OPEN_EVENT = 'stafftrack:location-permission-popup:open';
	const LOCATION_PERMISSION_POPUP_CLOSED_EVENT = 'stafftrack:location-permission-popup:closed';
	const LOCATION_PERMISSION_GRANTED_EVENT = 'stafftrack:location-permission:granted';
	const LOCATION_PERMISSION_POPUP_SHOWN = 'stafftrack_check_in_v2_location_permission_popup_shown';
	const LOCATION_PERMISSION_POPUP_TIMEMAN_DISMISSED = 'stafftrack_check_in_v2_location_permission_popup_timeman_dismissed';
	const LOCATION_PERMISSION_POPUP_REVEAL_CHECK_IN = 'stafftrack_check_in_v2_location_permission_popup_reveal_check_in';
	const LOCATION_PERMISSION_POPUP_TIMEMAN_SHOWN = 'stafftrack_check_in_v2_location_permission_popup_timeman_shown';
	const LOCATION_PERMISSION_GRANTED_REMEMBERED = 'stafftrack_check_in_v2_location_permission_granted';
	const LOCATION_PERMISSION_GRANTED_TEST = 'stafftrack_check_in_v2_location_permission_granted_test';

	module.exports = {
		LOCATION_PERMISSION_POPUP_COMPONENT_NAME,
		LOCATION_PERMISSION_POPUP_OPEN_EVENT,
		LOCATION_PERMISSION_POPUP_CLOSED_EVENT,
		LOCATION_PERMISSION_GRANTED_EVENT,
		LOCATION_PERMISSION_POPUP_SHOWN,
		LOCATION_PERMISSION_POPUP_TIMEMAN_DISMISSED,
		LOCATION_PERMISSION_POPUP_REVEAL_CHECK_IN,
		LOCATION_PERMISSION_POPUP_TIMEMAN_SHOWN,
		LOCATION_PERMISSION_GRANTED_REMEMBERED,
		LOCATION_PERMISSION_GRANTED_TEST,
	};
});
