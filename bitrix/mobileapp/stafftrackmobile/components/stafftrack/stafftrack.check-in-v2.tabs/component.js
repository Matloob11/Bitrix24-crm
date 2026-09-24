(() => {
	const { Tabs } = jn.require('stafftrack/check-in-v2/tabs');

	const unavailableTabIds = BX.componentParameters.get('UNAVAILABLE_TAB_IDS', []);

	// eslint-disable-next-line no-undef
	new Tabs({ tabs, unavailableTabIds });
})();
