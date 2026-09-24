export const FAVORITES_FILTER_FIELD = 'IS_FAVORITE';
export const FAVORITES_FILTER_VALUE = 'Y';

export type FavoritesFilterApi = {
	setFields(fields: Record<string, string>): void;
	apply(): void;
};

export function isFavoriteFilterApplied(fieldValues: Record<string, unknown> | null | undefined): boolean
{
	return fieldValues != null && fieldValues[FAVORITES_FILTER_FIELD] === FAVORITES_FILTER_VALUE;
}

export function applyFavoriteFilter(filterApi: FavoritesFilterApi | null | undefined, active: boolean): void
{
	if (!filterApi)
	{
		return;
	}

	filterApi.setFields(active ? { [FAVORITES_FILTER_FIELD]: FAVORITES_FILTER_VALUE } : {});
	filterApi.apply();
}
