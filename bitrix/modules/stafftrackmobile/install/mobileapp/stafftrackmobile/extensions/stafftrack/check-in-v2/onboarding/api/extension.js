/**
 * @module stafftrack/check-in-v2/onboarding/api
 */
jn.define('stafftrack/check-in-v2/onboarding/api', (require, exports, module) => {
	const { RunActionExecutor } = require('rest/run-action-executor');

	const SHOULD_SHOW_CACHE_TTL = 7 * 24 * 60 * 60;

	/**
	 * @returns {Promise<boolean>}
	 */
	function shouldShowOnboarding()
	{
		return new Promise((resolve, reject) => {
			const handle = (response) => {
				if (response?.status === 'success' && typeof response.data === 'boolean')
				{
					resolve(response.data);

					return;
				}

				reject(new Error('shouldShowOnboarding: unexpected response'));
			};

			void new RunActionExecutor('stafftrackmobile.v2.CheckIn.Onboarding.shouldShow')
				.setCacheId(`stafftrack.checkInOnboarding.shouldShow_${currentDomain}_${env.userId}`)
				.setCacheTtl(SHOULD_SHOW_CACHE_TTL)
				.setSkipRequestIfCacheExists()
				.setCacheHandler(handle)
				.setHandler(handle)
				.call(true);
		});
	}

	/**
	 * @returns {Promise<{ isAutoCheckInEnabledInSettings: boolean, isCheckInRequiredOnWorkDayStart: boolean } | null>}
	 */
	function enableCheckIn()
	{
		return new Promise((resolve) => {
			void new RunActionExecutor('stafftrackmobile.v2.CheckIn.Onboarding.enableFeatures')
				.setHandler((response) => {
					const data = response?.status === 'success' ? response.data : null;
					if (!data)
					{
						resolve(null);

						return;
					}

					resolve({
						isAutoCheckInEnabledInSettings: data.isAutoCheckInEnabledInSettings === true,
						isCheckInRequiredOnWorkDayStart: data.isCheckInRequiredOnWorkDayStart === true,
					});
				})
				.call();
		});
	}

	/**
	 * @returns {Promise<{ isPlanningServiceEnabled: boolean, canEnableFeatures: boolean }>}
	 */
	function loadOnboardingConfig()
	{
		return new Promise((resolve, reject) => {
			void new RunActionExecutor('stafftrackmobile.v2.CheckIn.Onboarding.getConfig')
				.setHandler((response) => {
					const data = response?.status === 'success' ? response.data : null;
					if (data && typeof data === 'object')
					{
						resolve({
							isPlanningServiceEnabled: data.isPlanningServiceEnabled === true,
							canEnableFeatures: data.canEnableFeatures === true,
						});

						return;
					}

					reject(new Error('loadOnboardingConfig: unexpected response'));
				})
				.call();
		});
	}

	module.exports = {
		shouldShowOnboarding,
		enableCheckIn,
		loadOnboardingConfig,
	};
});
