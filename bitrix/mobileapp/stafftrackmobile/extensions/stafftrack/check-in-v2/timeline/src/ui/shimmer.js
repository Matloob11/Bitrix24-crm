/**
 * @module stafftrack/check-in-v2/timeline/src/ui/shimmer
 */
jn.define('stafftrack/check-in-v2/timeline/src/ui/shimmer', (require, exports, module) => {
	const { Indent, Component } = require('tokens');
	const { Line, Circle } = require('utils/skeleton');
	const TIMELINE_COLUMN_WIDTH = 60;
	const ITEMS_COUNT = 4;

	const Shimmer = () => {
		return View(
			{},
			renderShimmeredNavigationBar(),
			renderShimmeredHeader(),
			...renderShimmeredItems(ITEMS_COUNT),
		);
	};

	const renderShimmeredNavigationBar = () => {
		return View(
			{
				style: {
					flexDirection: 'row',
					alignItems: 'center',
					paddingTop: Indent.XL.toNumber(),
					paddingBottom: Indent.XL4.toNumber(),
					paddingHorizontal: Component.paddingLr.toNumber(),
				},
			},
			Circle(48),
			View(
				{
					style: {
						marginLeft: Indent.XL2.toNumber(),
						justifyContent: 'center',
					},
				},
				Line(120, 14),
				View(
					{
						style: { marginTop: Indent.XS.toNumber() },
					},
					Line(80, 12),
				),
			),
		);
	};

	const renderShimmeredHeader = () => {
		return View(
			{
				style: {
					flexDirection: 'row',
					justifyContent: 'space-between',
					alignItems: 'center',
					marginBottom: Indent.XL3.toNumber(),
					paddingHorizontal: Component.paddingLr.toNumber(),
				},
			},
			Line(80, 12),
			Line(60, 12),
		);
	};

	const renderShimmeredItems = (count) => {
		return Array.from({ length: count }, (_, index) => renderShimmeredItem(index === 0));
	};

	const renderShimmeredItem = (isFirst) => {
		return View(
			{
				style: {
					flexDirection: 'row',
					paddingBottom: Indent.XL3.toNumber(),
					paddingHorizontal: Component.paddingLr.toNumber(),
				},
			},
			View(
				{
					style: {
						width: TIMELINE_COLUMN_WIDTH,
						alignItems: 'center',
					},
				},
				isFirst ? Circle(24) : Circle(10),
			),
			View(
				{
					style: {
						flex: 1,
						marginLeft: Indent.L.toNumber(),
					},
				},
				Line(150, 14),
				View(
					{
						style: { marginTop: Indent.XS.toNumber() },
					},
					Line(40, 12),
				),
				View(
					{
						style: { marginTop: Indent.S.toNumber() },
					},
					Line(200, 12),
				),
			),
		);
	};

	module.exports = {
		Shimmer,
	};
});
