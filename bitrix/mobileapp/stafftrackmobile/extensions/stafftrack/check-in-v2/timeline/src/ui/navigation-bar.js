/**
 * @module stafftrack/check-in-v2/timeline/src/ui/navigation-bar
 */
jn.define('stafftrack/check-in-v2/timeline/src/ui/navigation-bar', (require, exports, module) => {
	const { Color, Indent, Component } = require('tokens');
	const { Text2, Text4 } = require('ui-system/typography/text');
	const { Avatar } = require('ui-system/blocks/avatar');
	const { UserName } = require('layout/ui/user/user-name');
	const { createTestIdGenerator } = require('utils/test');

	const NavigationBar = ({ testId, id, withRedux = false, avatarUri, name, position }) => {
		const getTestId = createTestIdGenerator({ prefix: testId });

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
			Avatar({
				testId: getTestId('avatar'),
				id,
				uri: avatarUri,
				size: 48,
				withRedux,
			}),
			View(
				{
					style: {
						flex: 1,
						marginLeft: Indent.XL2.toNumber(),
						justifyContent: 'center',
					},
				},
				UserName({
					testId: getTestId('user-name'),
					id,
					text: name,
					textElement: Text2,
					withRedux,
					accent: true,
					numberOfLines: 1,
					ellipsize: 'end',
				}),
				position && Text4({
					testId: getTestId('position'),
					text: position,
					color: Color.base3,
					numberOfLines: 1,
					ellipsize: 'end',
					style: {
						marginTop: Indent.XS.toNumber(),
					},
				}),
			),
		);
	};

	module.exports = { NavigationBar };
});
