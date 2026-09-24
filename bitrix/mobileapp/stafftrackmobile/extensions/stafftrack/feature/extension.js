/**
 * @module stafftrack/feature
 */
jn.define('stafftrack/feature', (require, exports, module) => {
	const { feature } = require('native/feature');

	class Feature
	{
		static isCheckinMapSupported()
		{
			return Boolean(feature?.isFeatureEnabled('jnwebview_bridge_v1'))
					&& Boolean(feature?.isFeatureEnabled('tabswidget_disable_scroll'));
		}
	}

	module.exports = { Feature };
});
