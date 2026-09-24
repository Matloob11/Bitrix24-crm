/**
 * @module stafftrack/layout/check-in-v2/disabled-geo-view
 */
jn.define('stafftrack/layout/check-in-v2/disabled-geo-view', (require, exports, module) => {
	const { PureComponent } = require('layout/pure-component');
	const { Box } = require('ui-system/layout/box');
	const { StatusBlock } = require('ui-system/blocks/status-block');
	const { Link4 } = require('ui-system/blocks/link');
	const { Color } = require('tokens');
	const { Loc } = require('loc');
	const { createTestIdGenerator } = require('utils/test');
	const { makeLibraryImagePath } = require('asset-manager');

	class DisabledGeoView extends PureComponent
	{
		constructor(props)
		{
			super(props);

			this.getTestId = createTestIdGenerator({
				prefix: 'disabled-geo-view',
				context: this,
			});
		}

		render()
		{
			return Box(
				{
					safeArea: {
						bottom: true,
					},
					resizableByKeyboard: false,
					testId: this.getTestId('box'),
				},
				this.#renderContent(),
			);
		}

		#renderContent()
		{
			return StatusBlock({
				image: Image({
					style: {
						width: 225,
						height: 205,
					},
					uri: makeLibraryImagePath('disabled-geo.png', 'graphic', 'stafftrack'),
				}),
				title: Loc.getMessage('STAFFTRACK_DISABLED_GEO_VIEW_TITLE'),
				description: Loc.getMessage('STAFFTRACK_DISABLED_GEO_VIEW_DESCRIPTION'),
				titleColor: Color.base1,
				descriptionColor: Color.base1,
				buttons: [
					Link4({
						testId: this.getTestId('settings-link'),
						text: Loc.getMessage('STAFFTRACK_DISABLED_GEO_VIEW_SETTINGS_LINK'),
						onClick: () => Application.openSettings(),
					}),
				],
				testId: this.getTestId('content-container'),
			});
		}
	}

	module.exports = { DisabledGeoView };
});
