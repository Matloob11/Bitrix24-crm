/**
 * @module stafftrack/check-in-v2/balloon
 */
jn.define('stafftrack/check-in-v2/balloon', (require, exports, module) => {
	const { Color, Component, Indent, Typography } = require('tokens');
	const { IconView, Icon } = require('ui-system/blocks/icon');
	const { Text4 } = require('ui-system/typography/text');
	const { createTestIdGenerator } = require('utils/test');

	const DOT_SIZE = 10;
	const PRIMARY_MARK_SIZE = 24;
	const MIN_BALLOON_WIDTH = 55;
	const BALLOON_HEIGHT = 32;

	const getBalloonWidth = (timeText) => {
		const digitWidth = Typography.text4.getDigitWidth();
		const required = Math.ceil((timeText?.length ?? 0) * digitWidth);

		return Math.max(MIN_BALLOON_WIDTH, required);
	};

	const createPillSVG = (width, fillColor, strokeColor) => {
		const center = width / 2;

		return `
			<svg width="${width}" height="${BALLOON_HEIGHT}" viewBox="0 0 ${width} ${BALLOON_HEIGHT}" fill="none" xmlns="http://www.w3.org/2000/svg">
				<path d="M12 7.89 L${center - 7.19} 7.89 L${center - 2.47} 3.18 C${center - 1.11} 1.82 ${center + 1.11} 1.82 ${center + 2.47} 3.18 L${center + 7.19} 7.89 L${width - 12} 7.89 A11.5 11.5 0 0 1 ${width - 0.5} 19.39 A11.5 11.5 0 0 1 ${width - 12} 30.89 L12 30.89 A11.5 11.5 0 0 1 0.5 19.39 A11.5 11.5 0 0 1 12 7.89 Z" fill="${fillColor}" stroke="${strokeColor}"/>
			</svg>
		`;
	};

	const BaseBalloon = ({ testId, timeText, textColor, fillColor, strokeColor }) => {
		const getTestId = createTestIdGenerator({ prefix: testId });
		const width = getBalloonWidth(timeText);

		return View(
			{
				style: {
					marginTop: Indent.XS2.toNumber(),
					width,
					height: BALLOON_HEIGHT,
					alignItems: 'center',
					justifyContent: 'center',
				},
			},
			Image(
				{
					style: {
						width,
						height: BALLOON_HEIGHT,
						position: 'absolute',
					},
					svg: {
						content: createPillSVG(width, fillColor, strokeColor),
					},
				},
			),
			Text4({
				testId: getTestId('time'),
				text: timeText,
				color: textColor,
				numberOfLines: 1,
				style: {
					marginTop: 7,
				},
			}),
		);
	};

	const TimelinePoint = ({ solid = false } = {}) => {
		return View(
			{
				style: {
					marginTop: Indent.XS.toNumber() + 3,
					width: DOT_SIZE,
					height: DOT_SIZE,
					borderRadius: Component.elementAccentCorner.toNumber(),
					borderColor: solid
						? Color.bgDarkLensGradient2.toHex()
						: Color.base8.toHex(),
					borderWidth: 1,
					backgroundColor: solid
						? Color.base8.toHex()
						: Color.bgDarkLensGradient2.toHex(),
				},
			},
		);
	};

	const PrimaryPoint = ({ testId, icon }) => {
		const getTestId = createTestIdGenerator({ prefix: testId });

		return View(
			{
				style: {
					width: PRIMARY_MARK_SIZE,
					height: PRIMARY_MARK_SIZE,
					borderRadius: Component.elementAccentCorner.toNumber(),
					backgroundColor: Color.accentMainSuccess.toHex(),
					borderColor: Color.base8.toHex(),
					borderWidth: 1,
					alignItems: 'center',
					justifyContent: 'center',
				},
			},
			IconView({
				testId: getTestId('icon'),
				icon,
				size: 16,
				color: Color.baseWhiteFixed,
			}),
		);
	};

	const getPoint = ({ getTestId, isStopPoint, isFirst, solid = false }) => {
		if (isStopPoint)
		{
			return PrimaryPoint({ testId: getTestId('stop'), icon: Icon.SOLID_CHECK });
		}

		if (isFirst)
		{
			return PrimaryPoint({ testId: getTestId('play'), icon: Icon.SOLID_PLAY });
		}

		return TimelinePoint({ solid });
	};

	const ManualBalloon = ({ testId, timeText, isFirst = false, isStopPoint = false } = {}) => {
		const getTestId = createTestIdGenerator({ prefix: testId });
		const isHighlighted = isFirst || isStopPoint;
		const balloonColors = {
			textColor: Color.baseWhiteFixed,
			fillColor: isHighlighted
				? Color.accentMainSuccess.toHex()
				: Color.bgDarkLensGradient2.toHex(),
			strokeColor: Color.bgPrimary.toHex(),
		};

		return View(
			{
				style: {
					alignItems: 'center',
				},
			},
			getPoint({ getTestId, isStopPoint, isFirst }),
			BaseBalloon({
				testId: getTestId('balloon'),
				timeText,
				...balloonColors,
			}),
		);
	};

	const AutomaticBalloon = ({ testId, timeText, isFirst = false, isStopPoint = false, showBalloon = false } = {}) => {
		const getTestId = createTestIdGenerator({ prefix: testId });
		const isHighlighted = isFirst || isStopPoint;
		const showBalloonForced = isHighlighted || showBalloon;
		const balloonColors = {
			textColor: Color.base3,
			fillColor: Color.bgPrimary.toHex(),
			strokeColor: isHighlighted
				? Color.accentMainSuccess.toHex()
				: Color.bgDarkLensGradient2.toHex(),
		};

		return View(
			{
				style: {
					alignItems: 'center',
				},
			},
			getPoint({ getTestId, isStopPoint, isFirst, solid: true }),
			showBalloonForced && BaseBalloon({
				testId: getTestId('balloon'),
				timeText,
				...balloonColors,
			}),
		);
	};

	module.exports = {
		ManualBalloon,
		AutomaticBalloon,
		getBalloonWidth,
	};
});
