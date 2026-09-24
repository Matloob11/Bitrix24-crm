/**
 * @module stafftrack/check-in-v2/cache
 */
jn.define('stafftrack/check-in-v2/cache', (require, exports, module) => {
	const { Geo } = require('utils/geo');

	const SHARED_STORAGE_KEY = 'check-in';
	const STORAGE_KEY = 'geo-cache';
	const CACHE_RADIUS_METERS = 30;
	const MAX_ENTRIES = 30;

	class CheckInCacheStorage
	{
		constructor(props = {})
		{
			this.storage = props.storage || Application.sharedStorage(SHARED_STORAGE_KEY);
		}

		findByRadius(latitude, longitude, radius = CACHE_RADIUS_METERS)
		{
			const entries = this.#getEntries();

			for (const entry of entries)
			{
				if (Geo.isWithinRadius(entry.latitude, entry.longitude, latitude, longitude, radius))
				{
					return entry;
				}
			}

			return null;
		}

		add({ latitude, longitude, address, snapshot })
		{
			const entries = this.#getEntries();

			entries.unshift({
				latitude,
				longitude,
				address,
				snapshot,
			});

			if (entries.length > MAX_ENTRIES)
			{
				entries.length = MAX_ENTRIES;
			}

			this.#setEntries(entries);
		}

		#getEntries()
		{
			return this.storage.get(STORAGE_KEY) ?? [];
		}

		#setEntries(entries)
		{
			this.storage.set(STORAGE_KEY, entries);
		}
	}

	module.exports = {
		CheckInCacheStorage,
	};
});
