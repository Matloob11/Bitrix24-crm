/**
 * @module stafftrack/check-in-v2/onboarding/src/slides-config
 */
jn.define('stafftrack/check-in-v2/onboarding/src/slides-config', (require, exports, module) => {
	const { Loc } = require('loc');
	const { makeLibraryImagePath } = require('asset-manager');

	const ENABLE_BUTTON_TEXT = Loc.getMessage('STAFFTRACKMOBILE_CHECK_IN_ONBOARDING_SLIDE_BUTTON');

	/** @type {OnboardingSlideConfig[]} */
	const SLIDES_CONFIG = [
		{
			id: 'slide-1',
			title: Loc.getMessage('STAFFTRACKMOBILE_CHECK_IN_ONBOARDING_SLIDE_1_TITLE'),
			description: Loc.getMessage('STAFFTRACKMOBILE_CHECK_IN_ONBOARDING_SLIDE_1_DESCRIPTION'),
			image: makeLibraryImagePath('map.png', 'onboarding', 'stafftrack', false),
			buttonText: ENABLE_BUTTON_TEXT,
		},
		{
			id: 'slide-2',
			title: Loc.getMessage('STAFFTRACKMOBILE_CHECK_IN_ONBOARDING_SLIDE_2_TITLE'),
			description: Loc.getMessage('STAFFTRACKMOBILE_CHECK_IN_ONBOARDING_SLIDE_2_DESCRIPTION'),
			image: makeLibraryImagePath('route.png', 'onboarding', 'stafftrack', false),
			buttonText: ENABLE_BUTTON_TEXT,
		},
		{
			id: 'slide-3',
			title: Loc.getMessage('STAFFTRACKMOBILE_CHECK_IN_ONBOARDING_SLIDE_3_TITLE'),
			description: Loc.getMessage('STAFFTRACKMOBILE_CHECK_IN_ONBOARDING_SLIDE_3_DESCRIPTION'),
			image: makeLibraryImagePath('report.png', 'onboarding', 'stafftrack', false),
			buttonText: ENABLE_BUTTON_TEXT,
			requiresPlanningService: true,
		},
		{
			id: 'slide-4',
			title: Loc.getMessage('STAFFTRACKMOBILE_CHECK_IN_ONBOARDING_SLIDE_4_TITLE'),
			description: Loc.getMessage('STAFFTRACKMOBILE_CHECK_IN_ONBOARDING_SLIDE_4_DESCRIPTION'),
			image: makeLibraryImagePath('calendar.png', 'onboarding', 'stafftrack', false),
			buttonText: ENABLE_BUTTON_TEXT,
		},
		{
			id: 'slide-5',
			title: Loc.getMessage('STAFFTRACKMOBILE_CHECK_IN_ONBOARDING_SLIDE_5_TITLE'),
			description: Loc.getMessage('STAFFTRACKMOBILE_CHECK_IN_ONBOARDING_SLIDE_5_DESCRIPTION'),
			image: makeLibraryImagePath('timeline.png', 'onboarding', 'stafftrack', false),
			buttonText: ENABLE_BUTTON_TEXT,
		},
		{
			id: 'slide-6',
			title: Loc.getMessage('STAFFTRACKMOBILE_CHECK_IN_ONBOARDING_SLIDE_6_TITLE'),
			description: Loc.getMessage('STAFFTRACKMOBILE_CHECK_IN_ONBOARDING_SLIDE_6_DESCRIPTION'),
			image: makeLibraryImagePath('worktime.png', 'onboarding', 'stafftrack', false),
			buttonText: ENABLE_BUTTON_TEXT,
		},
	];

	/**
	 * @param {object} [options]
	 * @param {boolean} [options.isPlanningServiceEnabled=true]
	 * @returns {OnboardingSlideConfig[]}
	 */
	function getSlidesConfig({ isPlanningServiceEnabled = true } = {})
	{
		return SLIDES_CONFIG.filter((slide) => isPlanningServiceEnabled || !slide.requiresPlanningService);
	}

	module.exports = {
		SLIDES_CONFIG,
		getSlidesConfig,
	};
});
