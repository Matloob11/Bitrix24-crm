/**
 * @module stafftrack/layout/check-in-v2/unsupported-map-view
 */
jn.define('stafftrack/layout/check-in-v2/unsupported-map-view', (require, exports, module) => {
	const { PureComponent } = require('layout/pure-component');
	const { Box } = require('ui-system/layout/box');
	const { BoxFooter } = require('ui-system/layout/dialog-footer');
	const { StatusBlock } = require('ui-system/blocks/status-block');
	const { Button, ButtonDesign, ButtonSize } = require('ui-system/form/buttons/button');
	const { Loc } = require('loc');
	const { createTestIdGenerator } = require('utils/test');
	const { makeLibraryImagePath } = require('asset-manager');
	const { openStore } = require('utils/store');

	class UnsupportedMapView extends PureComponent
	{
		constructor(props)
		{
			super(props);

			this.getTestId = createTestIdGenerator({
				prefix: 'unsupported-map-view',
				context: this,
			});
		}

		render()
		{
			return Box(
				{
					footer: BoxFooter(
						{
							testId: this.getTestId('footer'),
						},
						this.#renderButton(),
					),
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
			const { fromBackdrop } = this.props;

			return StatusBlock({
				image: Image({
					style: {
						width: 207,
						height: 207,
					},
					uri: makeLibraryImagePath('not-found.png', 'marshmallow'),
				}),
				emptyScreen: !fromBackdrop,
				title: Loc.getMessage('STAFFTRACK_UNSUPPORTED_MAP_VIEW_TITLE'),
				description: Loc.getMessage('STAFFTRACK_UNSUPPORTED_MAP_VIEW_DESCRIPTION'),
				testId: this.getTestId('content-container'),
			});
		}

		#renderButton()
		{
			return Button({
				text: Loc.getMessage('STAFFTRACK_UNSUPPORTED_MAP_VIEW_BUTTON'),
				stretched: true,
				size: ButtonSize.L,
				design: ButtonDesign.FILLED,
				testId: this.getTestId('button'),
				onClick: () => openStore(),
			});
		}
	}

	module.exports = { UnsupportedMapView };
});
