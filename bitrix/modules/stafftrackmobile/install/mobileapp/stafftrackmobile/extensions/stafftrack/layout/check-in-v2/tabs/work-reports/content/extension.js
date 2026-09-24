/**
 * @module stafftrack/layout/check-in-v2/tabs/work-reports/content
 */
jn.define('stafftrack/layout/check-in-v2/tabs/work-reports/content', (require, exports, module) => {
	const { isModuleInstalled } = require('module');
	let WorkReportsList = null;
	if (isModuleInstalled('timeman'))
	{
		try
		{
			WorkReportsList = require('timeman/work-reports/review/list')?.WorkReportsList;
		}
		catch (e)
		{
			console.error(e);
		}
	}

	const { Content: WorktimeUnavailable } = require('stafftrack/layout/check-in-v2/worktime-unavailable-view');

	module.exports = {
		/** @param {WorkReportsContentProps} props */
		Content: (props) => (
			(props.isTabUnavailable || !WorkReportsList)
				? WorktimeUnavailable(props)
				: new WorkReportsList({
					...props.preloadData,
					parentWidget: props.parentWidget,
				})
		),
	};
});
