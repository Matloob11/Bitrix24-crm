/**
 * @module stafftrack/layout/check-in-v2/tabs/shifts/stub
 */
jn.define('stafftrack/layout/check-in-v2/tabs/shifts/stub', (require, exports, module) => {
	const { Line } = require('utils/skeleton');
	const { Indent, Component } = require('tokens');
	const { makeLibraryImagePath } = require('asset-manager');

	const IMAGE_URI = makeLibraryImagePath('map-shimmer-background.gif', 'graphic', 'stafftrack');
	// Mirrors the layout of buttons rendered by layout/ui/map and content/extension
	const PILL_SHIMMER_WIDTH = 103;
	const PILL_SHIMMER_HEIGHT = 38;
	const CHIP_BUTTON_SIZE = 38; // ChipButtonSize.L height
	const FIT_BUTTON_BOTTOM = 100;
	const ADD_BUTTON_HEIGHT = 58;
	const ADD_BUTTON_WIDTH = 125;

	class Stub extends LayoutComponent
	{
		render()
		{
			return View(
				{
					style: {
						flex: 1,
						overflow: 'hidden',
					},
				},
				Image({
					style: {
						position: 'absolute',
						top: 0,
						left: 0,
						right: 0,
						bottom: 0,
					},
					uri: IMAGE_URI,
					resizeMode: 'cover',
					autoPlayAnimation: true,
				}),
				this.#renderControlButtons(),
				this.#renderWorktimePill(),
				this.#renderAddCheckInButton(),
			);
		}

		#renderWorktimePill()
		{
			return View(
				{
					style: {
						position: 'absolute',
						top: Indent.XL3.toNumber(),
						right: Indent.XL3.toNumber(),
						zIndex: 2,
						alignItems: 'flex-start',
					},
				},
				Line(PILL_SHIMMER_WIDTH, PILL_SHIMMER_HEIGHT, 0, 0, Component.elementAccentCorner.toNumber()),
			);
		}

		#renderControlButtons()
		{
			return View(
				{
					style: {
						position: 'absolute',
						top: 0,
						bottom: 0,
						right: Indent.XL3.toNumber(),
					},
				},
				View(
					{
						style: {
							flex: 1,
							justifyContent: 'center',
							paddingBottom: Indent.M.toNumber(),
						},
					},
					this.#renderZoomButtons(),
				),
				this.#renderFitButton(),
			);
		}

		#renderZoomButtons()
		{
			return View(
				{},
				Line(CHIP_BUTTON_SIZE, CHIP_BUTTON_SIZE, 0, Indent.M.toNumber(), Component.chipsLCorner.toNumber()),
				Line(CHIP_BUTTON_SIZE, CHIP_BUTTON_SIZE, 0, 0, Component.chipsLCorner.toNumber()),
			);
		}

		#renderFitButton()
		{
			return View(
				{
					style: {
						position: 'absolute',
						bottom: FIT_BUTTON_BOTTOM,
					},
				},
				Line(CHIP_BUTTON_SIZE, CHIP_BUTTON_SIZE, 0, 0, Component.chipsLCorner.toNumber()),
			);
		}

		#renderAddCheckInButton()
		{
			return View(
				{
					style: {
						position: 'absolute',
						bottom: Indent.XL3.toNumber(),
						right: Indent.XL3.toNumber(),
					},
				},
				Line(ADD_BUTTON_WIDTH, ADD_BUTTON_HEIGHT, 0, 0, Component.popupCorner.toNumber()),
			);
		}
	}

	module.exports = { Stub, stubImageUri: IMAGE_URI };
});
