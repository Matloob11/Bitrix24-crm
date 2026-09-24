/**
 * @module stafftrack/layout/check-in-v2/form/src/ui/loading-view
 */
jn.define('stafftrack/layout/check-in-v2/form/src/ui/loading-view', (require, exports, module) => {
	const { Area } = require('ui-system/layout/area');
	const { AreaList } = require('ui-system/layout/area-list');
	const { Box } = require('ui-system/layout/box');
	const { BoxFooter } = require('ui-system/layout/dialog-footer');
	const { Button, ButtonDesign, ButtonSize } = require('ui-system/form/buttons/button');
	const { Component, Indent } = require('tokens');
	const { H3 } = require('ui-system/typography/heading');
	const { Icon } = require('assets/icons');
	const { Line } = require('utils/skeleton');
	const { Type } = require('type');

	const DESCRIPTION_HEIGHT = 82;
	const DESCRIPTION_MARGIN = Indent.XL3.toNumber();
	const MARGIN_TOP = DESCRIPTION_HEIGHT + (DESCRIPTION_MARGIN * 2);

	/**
	 * @param {LoadingViewProps} [props]
	 */
	const LoadingView = (props = {}) => {
		const { testId, onRef, style = {}, title } = props;

		const submitButtonBase = {
			leftIcon: Icon.LOCATION_PLUS,
			text: '',
			disabled: true,
			loading: true,
		};

		const footer = BoxFooter(
			{
				testId: testId?.('add-check-in-footer-submit-button'),
				keyboardButton: {
					...submitButtonBase,
				},
			},
			Button({
				testId: testId?.('add-check-in-submit-button'),
				design: ButtonDesign.FILLED,
				size: ButtonSize.L,
				stretched: true,
				...submitButtonBase,
			}),
		);

		return Box(
			{
				testId: testId?.('add-check-in-box'),
				resizableByKeyboard: false,
				withScroll: true,
				footer,
				safeArea: {
					bottom: true,
				},
				style,
				ref: onRef,
			},
			Type.isStringFilled(title) && H3({
				style: {
					height: 44,
					textAlign: 'center',
				},
				text: title,
				testId: testId?.('add-check-in-title-field'),
			}),
			AreaList(
				{
					withScroll: false,
					safeArea: {
						bottom: false,
					},
				},
				Area(
					{
						isFirst: true,
					},
					View(
						{},
						Line('100%', 136, 0, 0, Component.cardCornerXL.toNumber()),
					),
					View(
						{
							style: {
								flexDirection: 'row',
								alignItems: 'flex-start',
								justifyContent: 'flex-start',
								marginTop: MARGIN_TOP,
							},
						},
						View(
							{
								style: {
									marginRight: 8,
								},
							},
							Line(90, 32, 0, 0, 10),
						),
						Line(65, 32, 0, 0, 10),
					),
				),
			),
		);
	};

	module.exports = { LoadingView };
});
