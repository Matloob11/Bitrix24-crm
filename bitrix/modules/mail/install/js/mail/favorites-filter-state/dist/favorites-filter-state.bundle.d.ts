/* eslint-disable */
type FavoritesFilterApi = {
	setFields(fields: Record<string, string>): void;
	apply(): void;
};

declare namespace BX.Mail {
	function isFavoriteFilterApplied(fieldValues: Record<string, unknown> | null | undefined): boolean;

	function applyFavoriteFilter(filterApi: FavoritesFilterApi | null | undefined, active: boolean): void;

	const FAVORITES_FILTER_FIELD = "IS_FAVORITE";

	const FAVORITES_FILTER_VALUE = "Y";
}
