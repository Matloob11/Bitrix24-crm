/**
 * @module stafftrack/layout/check-in-v2/tabs/work-reports/stub
 */
jn.define('stafftrack/layout/check-in-v2/tabs/work-reports/stub', (require, exports, module) => {
	const { Line } = require('utils/skeleton');

	let WorkReportListSkeleton = null;

	try
	{
		WorkReportListSkeleton = require('timeman/work-reports/ui/skeleton').WorkReportListSkeleton;
	}
	catch (error)
	{
		console.error(error);
	}

	class Stub extends LayoutComponent
	{
		render()
		{
			if (WorkReportListSkeleton)
			{
				return new WorkReportListSkeleton({});
			}

			return View(
				{},
				Line(device.screen.width, device.screen.height, 0, 0, 0),
			);
		}
	}

	module.exports = { Stub };
});
