/**
 * @module stafftrack/check-in-v2/timeline/src/ui/timeline-list
 */
jn.define('stafftrack/check-in-v2/timeline/src/ui/timeline-list', (require, exports, module) => {
	const { Type } = require('type');
	const { Color, Indent, Component } = require('tokens');
	const { Text4, Text5 } = require('ui-system/typography/text');
	const { DateHelper } = require('stafftrack/date-helper');
	const { CheckInTypeEnum } = require('stafftrack/check-in-v2/enums');
	const { AutoCheckInType } = require('stafftrack/check-in-v2/auto-check-in/aggregator');
	const { formatTimeOffset, parseDate } = require('stafftrack/check-in-v2/timeline/src/time-helper');
	const { ManualBalloon, AutomaticBalloon, getBalloonWidth } = require('stafftrack/check-in-v2/balloon');
	const { FileField } = require('layout/ui/fields/file/theme/air');
	const { BlinkView } = require('animation/components/blink-view');
	const { createTestIdGenerator } = require('utils/test');
	const { Line } = require('utils/skeleton');

	const MIN_TIMELINE_COLUMN_WIDTH = 60;
	const LINE_WIDTH = 2;
	const FOOTER_STUB_HEIGHT = 30;
	const FOOTER_STUB_TYPE = 'footer-stub';
	const SCROLL_DELAY = 500;
	const BLINK_DELAY = 400;

	class TimelineList extends LayoutComponent
	{
		constructor(props)
		{
			super(props);

			this.getTestId = createTestIdGenerator({
				prefix: 'timeline-list',
			});
			this.listViewRef = null;
			this.blinkViewRef = null;
		}

		componentDidMount()
		{
			const { selectedItemId } = this.props;
			if (selectedItemId > 0)
			{
				setTimeout(() => this.#scrollToItemAndBlink(), SCROLL_DELAY);
			}
		}

		#scrollToItemAndBlink()
		{
			const { items = [], selectedItemId } = this.props;
			const index = items.findIndex((item) => Number(item.id) === Number(selectedItemId));

			if (index === -1 || !this.listViewRef)
			{
				return;
			}

			this.listViewRef.scrollTo(0, index, true, 'middle');

			setTimeout(() => {
				this.blinkViewRef?.blink();
			}, BLINK_DELAY);
		}

		render()
		{
			return ListView({
				ref: (ref) => {
					this.listViewRef = ref;
				},
				style: {
					flex: 1,
				},
				data: this.#getSections(),
				isRefreshing: false,
				renderItem: this.#renderItem,
			});
		}

		#getSections()
		{
			const { items, withFooterStub } = this.props;

			const sectionItems = items.map((item, index) => ({
				key: `checkin-${item.id}`,
				type: this.#getCheckInType(item, index === 0),
				data: item,
			}));

			if (withFooterStub)
			{
				sectionItems.push({
					key: FOOTER_STUB_TYPE,
					type: FOOTER_STUB_TYPE,
				});
			}

			return [{ items: sectionItems }];
		}

		#getCheckInType(item, isFirst)
		{
			if (isFirst)
			{
				return 'checkin-first';
			}

			return CheckInTypeEnum.isManual(item.checkInType)
				? 'checkin-manual'
				: 'checkin-automatic';
		}

		#getFormattedTime(dateCreate)
		{
			return DateHelper.formatTime(parseDate(dateCreate));
		}

		#getFormattedItemTime(item)
		{
			if (item.description === AutoCheckInType.STAY && item.duration > 0)
			{
				return formatTimeOffset(Math.floor(item.duration / 60));
			}

			return this.#getFormattedTime(item.dateCreate);
		}

		#getColumnMinWidth()
		{
			const { items = [] } = this.props;
			const widths = items.map((item) => getBalloonWidth(
				this.#getFormattedTime(item.dateCreate),
			));

			return Math.max(MIN_TIMELINE_COLUMN_WIDTH, ...widths);
		}

		#renderItem = (item, section, row) => {
			if (item.type === FOOTER_STUB_TYPE)
			{
				return this.#renderFooterStub();
			}

			const { items, selectedItemId } = this.props;
			if (!Type.isArrayFilled(items))
			{
				return null;
			}

			const data = item?.data ?? {};
			const isFirst = row === 0;
			const isLast = row === items.length - 1;
			const isStopPoint = row === this.#findStopPointIndex();
			const isHighlighted = isFirst || isStopPoint;
			const timeText = this.#getFormattedTime(data.dateCreate);
			const isSelected = Number(data.id) === Number(selectedItemId);

			const columnWidth = this.#getColumnMinWidth();

			const rowContent = View(
				{
					style: {
						flexDirection: 'row',
						paddingHorizontal: Component.paddingLr.toNumber(),
						paddingBottom: Indent.XL3.toNumber(),
					},
				},
				!isLast && this.#renderItemLine(columnWidth),
				View(
					{
						style: {
							minWidth: columnWidth,
							alignItems: 'center',
						},
					},
					this.#renderBalloon(data, isFirst, isStopPoint, timeText),
				),
				this.#renderItemContent(data, isHighlighted),
			);

			if (isSelected)
			{
				return new BlinkView({
					ref: (ref) => {
						this.blinkViewRef = ref;
					},
					highlightColor: Color.accentSoftOrange3.toHex(),
					slot: () => rowContent,
				});
			}

			return rowContent;
		};

		#renderFooterStub()
		{
			return View({
				style: { height: FOOTER_STUB_HEIGHT },
			});
		}

		#shouldShowAutomaticBalloon(data)
		{
			return data.checkInType === CheckInTypeEnum.AUTOMATIC.getValue() && data.description === AutoCheckInType.STAY;
		}

		#findStopPointIndex()
		{
			const { items, isDayClosed } = this.props;
			if (!isDayClosed || !Type.isArrayFilled(items))
			{
				return -1;
			}

			return items.length - 1;
		}

		#renderBalloon(data, isFirst, isStopPoint, timeText)
		{
			const testId = this.getTestId('item');
			const showBalloon = this.#shouldShowAutomaticBalloon(data);

			switch (data.checkInType)
			{
				case CheckInTypeEnum.MANUAL.getValue():
					return ManualBalloon({ testId, timeText, isFirst, isStopPoint });
				case CheckInTypeEnum.AUTOMATIC.getValue():
				default:
					return AutomaticBalloon({ testId, timeText, isFirst, isStopPoint, showBalloon });
			}
		}

		#renderItemLine(columnWidth)
		{
			const leftOffset = Component.paddingLr.toNumber() + (columnWidth - LINE_WIDTH) / 2;

			return View({
				style: {
					position: 'absolute',
					top: 0,
					bottom: 0,
					left: leftOffset,
					width: LINE_WIDTH,
					borderLeftWidth: LINE_WIDTH,
					borderLeftColor: Color.bgDarkLensGradient2.toHex(0.2),
					borderStyle: 'dash',
					borderDashSegmentLength: 6,
					borderDashGapLength: 4,
				},
			});
		}

		#renderItemContent(item, isHighlighted)
		{
			const timeText = this.#getFormattedItemTime(item);

			return View(
				{
					style: {
						flex: 1,
						marginLeft: Indent.L.toNumber(),
					},
				},
				this.#renderItemTop(item, timeText, isHighlighted),
				this.#renderItemFiles(item),
			);
		}

		#renderItemTop(item, timeText, isHighlighted)
		{
			const hasBalloon = CheckInTypeEnum.isManual(item.checkInType) || isHighlighted;
			const hasDuration = item.description === AutoCheckInType.STAY && item.duration > 0;
			const shouldShowTimeText = !hasBalloon || (isHighlighted && hasDuration);

			return View(
				{},
				item.address
					? Text4({
						testId: this.getTestId('item-address'),
						text: item.address,
						color: Color.base2,
						numberOfLines: 1,
						ellipsize: 'end',
					})
					: Line(150, 19),
				shouldShowTimeText ? this.#renderItemTime(timeText) : null,
				this.#renderItemDescription(item),
			);
		}

		#renderItemTime(timeText)
		{
			return Text5({
				testId: this.getTestId('item-time'),
				style: {
					marginTop: Indent.XS.toNumber(),
				},
				text: timeText,
				color: Color.base5,
			});
		}

		#renderItemDescription(item)
		{
			if (!Type.isStringFilled(item.description) || !CheckInTypeEnum.isManual(item.checkInType))
			{
				return null;
			}

			return Text5({
				testId: this.getTestId('item-description'),
				text: item.description,
				color: Color.base3,
				numberOfLines: 2,
				ellipsize: 'end',
				style: {
					marginTop: Indent.S.toNumber(),
				},
			});
		}

		#renderItemFiles(item)
		{
			const files = item.files;
			if (!Array.isArray(files) || files.length === 0)
			{
				return null;
			}

			return FileField({
				testId: this.getTestId('item-files'),
				readOnly: true,
				showEditIcon: false,
				hasHiddenEmptyView: false,
				showTitle: false,
				showFilesName: false,
				multiple: true,
				value: files.map(({ name, ...file }) => file),
				config: {
					filePreviewIndent: Indent.M.toNumber(),
				},
			});
		}
	}

	module.exports = { TimelineList };
});
