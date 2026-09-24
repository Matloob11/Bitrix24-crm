/**
 * @module stafftrack/layout/check-in-v2/tabs/work-reports/preload
 */
jn.define('stafftrack/layout/check-in-v2/tabs/work-reports/preload', (require, exports, module) => {
	const { isModuleInstalled } = require('module');

	/**
	 * @returns {Promise<WorkReportsPreloadData|null>}
	 */
	async function preload()
	{
		if (!isModuleInstalled('timeman'))
		{
			return null;
		}

		try
		{
			const { WorkReportsApi } = require('timeman/work-reports/api');
			const report = await (new WorkReportsApi()).getPreloadData();

			return {
				settings: report?.settings,
				draftReport: report?.isReadyForSubmit ? report : null,
			};
		}
		catch (e)
		{
			console.error(e);

			return null;
		}
	}

	module.exports = { preload };
});
