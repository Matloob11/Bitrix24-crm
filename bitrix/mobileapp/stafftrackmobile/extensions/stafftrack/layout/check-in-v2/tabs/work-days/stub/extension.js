/**
 * @module stafftrack/layout/check-in-v2/tabs/work-days/stub
 */
jn.define('stafftrack/layout/check-in-v2/tabs/work-days/stub', (require, exports, module) => {
	const { Line } = require('utils/skeleton');

	let WorkDaysSkeleton = null;

	try
	{
		WorkDaysSkeleton = require('timeman/work-days/ui/skeleton').WorkDaysSkeleton;
	}
	catch (error)
	{
		console.error(error);
	}

	class Stub extends LayoutComponent
	{
		render()
		{
			if (WorkDaysSkeleton)
			{
				return new WorkDaysSkeleton({});
			}

			return View(
				{},
				Line(device.screen.width, device.screen.height, 0, 0, 0),
			);
		}
	}

	module.exports = { Stub };
});
