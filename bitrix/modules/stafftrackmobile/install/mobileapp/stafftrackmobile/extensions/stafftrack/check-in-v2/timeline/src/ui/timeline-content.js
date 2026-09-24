/**
 * @module stafftrack/check-in-v2/timeline/src/ui/timeline-content
 */
jn.define('stafftrack/check-in-v2/timeline/src/ui/timeline-content', (require, exports, module) => {
	const { TimelineHeader } = require('stafftrack/check-in-v2/timeline/src/ui/timeline-header');
	const { TimelineList } = require('stafftrack/check-in-v2/timeline/src/ui/timeline-list');

	class TimelineContent extends LayoutComponent
	{
		render()
		{
			const {
				date,
				items = [],
				withFooterStub,
				selectedItemId,
				isDayClosed,
			} = this.props;

			return View(
				{
					style: {
						flex: 1,
					},
				},
				TimelineHeader({
					testId: 'timeline-header',
					date,
					count: items.length,
				}),
				new TimelineList({ items, withFooterStub, selectedItemId, isDayClosed }),
			);
		}
	}

	module.exports = { TimelineContent };
});
