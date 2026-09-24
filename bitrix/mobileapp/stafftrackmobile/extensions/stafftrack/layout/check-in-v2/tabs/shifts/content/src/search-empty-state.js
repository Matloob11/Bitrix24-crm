/**
 * @module stafftrack/layout/check-in-v2/tabs/shifts/content/src/search-empty-state
 */
jn.define('stafftrack/layout/check-in-v2/tabs/shifts/content/src/search-empty-state', (require, exports, module) => {
	const { StatusBlock } = require('ui-system/blocks/status-block');
	const { Color } = require('tokens');
	const { Loc } = require('loc');
	const { makeLibraryImagePath } = require('asset-manager');

	function SearchEmptyState()
	{
		return View(
			{
				style: {
					position: 'absolute',
					top: 0,
					right: 0,
					bottom: 0,
					left: 0,
				},
			},
			View(
				{
					style: {
						position: 'absolute',
						top: 0,
						left: 0,
						right: 0,
						bottom: 0,
					},
				},
				View({
					style: {
						flex: 1,
						backgroundColorGradient: {
							start: '#0000aaff',
							middle: '#a36a98f4',
							end: '#a30704b7',
							angle: 90,
						},
					},
				}),
			),
			StatusBlock({
				image: Image({
					style: {
						width: 207,
						height: 207,
					},
					uri: makeLibraryImagePath('search-empty.png', 'graphic', 'stafftrack'),
				}),
				title: Loc.getMessage('M_STAFFTRACK_CHECK_IN_SEARCH_EMPTY_STATE_TITLE'),
				description: Loc.getMessage('M_STAFFTRACK_CHECK_IN_SEARCH_EMPTY_STATE_DESCRIPTION'),
				titleColor: Color.baseWhiteFixed,
				descriptionColor: Color.baseWhiteFixed,
				testId: 'search-empty-state',
			}),
		);
	}

	module.exports = { SearchEmptyState };
});
