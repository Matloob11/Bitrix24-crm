/* eslint-disable */
this.BX = this.BX || {};
(function (exports) {
	'use strict';

	const FAVORITES_FILTER_FIELD = 'IS_FAVORITE';
	const FAVORITES_FILTER_VALUE = 'Y';
	function isFavoriteFilterApplied(fieldValues) {
		return fieldValues != null && fieldValues[FAVORITES_FILTER_FIELD] === FAVORITES_FILTER_VALUE;
	}
	function applyFavoriteFilter(filterApi, active) {
		if (!filterApi) {
			return;
		}
		filterApi.setFields(active ? {
			[FAVORITES_FILTER_FIELD]: FAVORITES_FILTER_VALUE
		} : {});
		filterApi.apply();
	}

	exports.FAVORITES_FILTER_FIELD = FAVORITES_FILTER_FIELD;
	exports.FAVORITES_FILTER_VALUE = FAVORITES_FILTER_VALUE;
	exports.applyFavoriteFilter = applyFavoriteFilter;
	exports.isFavoriteFilterApplied = isFavoriteFilterApplied;

})(this.BX.Mail = this.BX.Mail || {});
//# sourceMappingURL=favorites-filter-state.bundle.js.map
