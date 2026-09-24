/**
 * @module stafftrack/check-in-v2/onboarding/utils
 */
jn.define('stafftrack/check-in-v2/onboarding/utils', (require, exports, module) => {
	const { downloadImages, downloadLottieAnimations, makeLibraryImagePath } = require('asset-manager');

	const ONBOARDING_IMAGE_FILES = [
		'map.png',
		'route.png',
		'report.png',
		'calendar.png',
		'timeline.png',
		'worktime.png',
		'final.png',
	];

	const ONBOARDING_LOTTIE_FILES = [
		'success.json',
	];

	/**
	 * @returns {Promise<void>}
	 */
	function preloadOnboardingAssets()
	{
		const toUrl = (name) => makeLibraryImagePath(name, 'onboarding', 'stafftrack', false);

		const imageUrls = ONBOARDING_IMAGE_FILES.map((element) => toUrl(element));
		const lottieUrls = ONBOARDING_LOTTIE_FILES.map((element) => toUrl(element));

		return Promise.allSettled([
			downloadImages(imageUrls),
			downloadLottieAnimations(lottieUrls),
		]).then((results) => {
			results.forEach((result) => {
				if (result.status === 'rejected')
				{
					console.error('Onboarding: asset preload failed', result.reason);
				}
			});
		});
	}

	module.exports = {
		preloadOnboardingAssets,
	};
});
