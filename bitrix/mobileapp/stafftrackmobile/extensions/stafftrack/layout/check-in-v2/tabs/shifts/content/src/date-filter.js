/**
 * @module stafftrack/layout/check-in-v2/tabs/shifts/content/src/date-filter
 */
jn.define('stafftrack/layout/check-in-v2/tabs/shifts/content/src/date-filter', (require, exports, module) => {
	const { Loc } = require('loc');
	const { PropTypes } = require('utils/validation');
	const { Moment } = require('utils/date');
	const { mediumDate } = require('utils/date/formats');
	const { Icon } = require('ui-system/blocks/icon');
	const { DateHelper } = require('stafftrack/date-helper');

	const MILLISECONDS_IN_SECOND = 1000;
	const AVAILABLE_MONTHS_BACKWARD = 3;

	class DateFilter
	{
		#onSelect = null;
		#onReset = null;

		/**
		 * @param {Object} props
		 * @param {boolean} props.isWesternPortal
		 * @param {function} [props.onSelect]
		 * @param {function} [props.onReset]
		 */
		constructor(props)
		{
			PropTypes.validate(DateFilter.propTypes, props, 'DateFilter');

			this.isWesternPortal = props.isWesternPortal;
			this.#onSelect = props.onSelect;
			this.#onReset = props.onReset;

			this.todayTimestamp = DateFilter.#getTodayTimestampInSeconds();
			this.selectedTimestamp = this.todayTimestamp;
		}

		/**
		 * @return {number} UNIX timestamp in seconds
		 */
		getSelectedTimestamp()
		{
			return this.selectedTimestamp;
		}

		/**
		 * @return {boolean}
		 */
		isActive()
		{
			return !Moment.createFromTimestamp(this.selectedTimestamp).isToday;
		}

		/**
		 * @return {boolean}
		 */
		isTodaySelected()
		{
			return !this.isActive();
		}

		/**
		 * @return {string}
		 */
		getFormattedSelectedDate()
		{
			return Moment.createFromTimestamp(this.selectedTimestamp).format(mediumDate);
		}

		/**
		 * @return {{ type: string, callback: function, accent: boolean }}
		 */
		getDateFilterButton()
		{
			return {
				type: Icon.CALENDAR_WITH_SLOTS.getIconName(),
				callback: () => this.openPicker(),
				accent: this.isActive(),
			};
		}

		/**
		 * @param {{ dateCreate: string, userTimezone?: number }} checkIn
		 * @return {boolean}
		 */
		isCheckInMatchDate(checkIn)
		{
			return DateHelper.getCheckInLocalDate(checkIn)
				=== DateHelper.getLocalDateFromTimestamp(this.selectedTimestamp);
		}

		openPicker()
		{
			const pickerProps = {
				title: Loc.getMessage('M_STAFFTRACK_CHECK_IN_DATE_PICKER_TITLE'),
				rightButtonName: Loc.getMessage('M_STAFFTRACK_CHECK_IN_DATE_PICKER_BUTTON'),
				type: 'date',
				value: this.selectedTimestamp * MILLISECONDS_IN_SECOND,
				maxDate: DateFilter.#getMaxSelectableDateInMilliseconds(),
			};

			const minSelectableDateInMilliseconds = this.#getMinSelectableDateInMilliseconds();
			if (minSelectableDateInMilliseconds !== null)
			{
				pickerProps.minDate = minSelectableDateInMilliseconds;
			}

			dialogs.showDatePicker(pickerProps, this.#handleDateSelected.bind(this));
		}

		/**
		 * @return {void}
		 */
		reset()
		{
			if (!this.isActive())
			{
				return;
			}

			this.selectedTimestamp = this.todayTimestamp;
			this.#onReset?.();
		}

		#handleDateSelected(eventName, pickedTimestampInMilliseconds)
		{
			if (eventName !== 'onPick' || !pickedTimestampInMilliseconds)
			{
				return;
			}

			const pickedTimestamp = Math.floor(pickedTimestampInMilliseconds / MILLISECONDS_IN_SECOND);
			if (DateHelper.getLocalDateFromTimestamp(pickedTimestamp)
				=== DateHelper.getLocalDateFromTimestamp(this.selectedTimestamp))
			{
				return;
			}

			this.selectedTimestamp = pickedTimestamp;
			this.#onSelect?.();
		}

		static #getTodayTimestampInSeconds()
		{
			return Math.floor(Date.now() / MILLISECONDS_IN_SECOND);
		}

		static #getMaxSelectableDateInMilliseconds()
		{
			const tomorrowDate = new Date();
			tomorrowDate.setDate(tomorrowDate.getDate() + 1);

			return tomorrowDate.getTime();
		}

		#getMinSelectableDateInMilliseconds()
		{
			if (!this.isWesternPortal)
			{
				return null;
			}

			const earliestSelectableDate = new Date();
			earliestSelectableDate.setMonth(earliestSelectableDate.getMonth() - AVAILABLE_MONTHS_BACKWARD);

			return earliestSelectableDate.getTime();
		}
	}

	DateFilter.propTypes = {
		isWesternPortal: PropTypes.bool.isRequired,
		onSelect: PropTypes.func,
		onReset: PropTypes.func,
	};

	module.exports = { DateFilter };
});
