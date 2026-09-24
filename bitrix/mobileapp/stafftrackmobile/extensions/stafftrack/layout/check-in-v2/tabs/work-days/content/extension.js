/**
 * @module stafftrack/layout/check-in-v2/tabs/work-days/content
 */
jn.define('stafftrack/layout/check-in-v2/tabs/work-days/content', (require, exports, module) => {
	const { isModuleInstalled } = require('module');
	let WorkDays = null;
	if (isModuleInstalled('timeman'))
	{
		try
		{
			WorkDays = require('timeman/work-days')?.WorkDays;
		}
		catch (e)
		{
			console.error(e);
		}
	}

	const { Content: WorktimeUnavailable } = require('stafftrack/layout/check-in-v2/worktime-unavailable-view');

	module.exports = {
		Content: (props) => (
			(props.isTabUnavailable || !WorkDays)
				? WorktimeUnavailable(props)
				: new WorkDays({ parentWidget: props.parentWidget })
		),
	};
});
