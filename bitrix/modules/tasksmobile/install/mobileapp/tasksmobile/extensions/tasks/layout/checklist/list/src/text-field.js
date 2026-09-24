/**
 * @module tasks/layout/checklist/list/src/text-field
 */
jn.define('tasks/layout/checklist/list/src/text-field', (require, exports, module) => {
	const { Color } = require('tokens');
	const { inAppUrl } = require('in-app-url');
	const { TextInput } = require('ui-system/typography/text-input');
	const { PlainTextFormatter } = require('bbcode/formatter/plain-text-formatter');

	class ItemTextField extends LayoutComponent
	{
		#itemText = '';

		/** @param {ItemTextFieldProps} props */
		constructor(props)
		{
			super(props);

			/** @type {Object | null} */
			this.textInputRef = null;
			/** @type {number} */
			this.cursorPosition = 0;
			this.#itemText = this.getValue();

			this.#initState(props);
		}

		/** @param {ItemTextFieldProps} props */
		componentWillReceiveProps(props)
		{
			this.#initState(props);
		}

		/**
		 * @private
		 * @param {ItemTextFieldProps} props
		 */
		#initState(props)
		{
			this.state = {
				completed: props.item.getIsComplete(),
			};
		}

		/** @return {Object} */
		render()
		{
			return View(
				{
					style: {
						flex: 1,
						marginTop: 4,
						justifyContent: 'center',
					},
					onClick: this.handleOnClickView,
				},
				this.#renderTextField(),
			);
		}

		/** @return {void} */
		handleOnClickView = () => {
			const { enable, showToastNoRights } = this.props;
			if (!enable)
			{
				showToastNoRights();
			}
		};

		/**
		 * @param {string} text
		 * @return {void}
		 */
		handleOnChange = (text) => {
			const { onChangeText } = this.props;
			this.#itemText = text;

			onChangeText?.(text, this.isFocused());
		};

		/** @return {void} */
		handleOnSubmit = () => {
			const { onSubmit } = this.props;

			onSubmit?.();
		};

		/**
		 * @param {ChecklistLinkClickParams} params
		 * @return {void}
		 */
		handleOnLinkClick = ({ url }) => {
			inAppUrl.open(url);
		};

		/** @return {void} */
		handleOnFocus = () => {
			const { onFocus, item, enable } = this.props;
			const title = item.getTitle();

			this.cursorPosition = title.length;

			if (onFocus && enable)
			{
				onFocus();
			}
		};

		/** @return {void} */
		handleOnBlur = () => {
			const { onBlur } = this.props;
			const value = this.getTextValue();

			if (value)
			{
				this.setState({}, onBlur);
			}
			else
			{
				onBlur();
			}
		};

		/**
		 * @param {Object | null} ref
		 * @return {void}
		 */
		handleOnRef = (ref) => {
			if (!ref)
			{
				return;
			}

			this.textInputRef = ref;

			const { isFocused, item } = this.props;

			if (isFocused && !item.hasItemTitle())
			{
				if (item.getIndex() === 1)
				{
					setTimeout(() => {
						this.focus();
					}, 500);
				}
				else
				{
					this.focus();
				}
			}
		};

		/** @return {void} */
		focus()
		{
			const { enable } = this.props;

			if (this.textInputRef && enable)
			{
				this.textInputRef.focus();
			}
		}

		/** @return {void} */
		blur()
		{
			if (this.textInputRef)
			{
				this.textInputRef.blur({
					hideKeyboard: true,
				});
			}
		}

		/**
		 * @private
		 * @return {boolean}
		 */
		isFocused()
		{
			if (this.textInputRef)
			{
				return this.textInputRef.isFocused();
			}

			return false;
		}

		/** @return {void} */
		clear()
		{
			if (this.textInputRef)
			{
				this.textInputRef.clear();
			}
		}

		/** @return {void} */
		toggleCompleted()
		{
			const { item } = this.props;

			this.setState({
				completed: item.getIsComplete(),
			});
		}

		/**
		 * @private
		 * @return {Object}
		 */
		#renderTextField()
		{
			const { placeholder, header, textSize, enable = true } = this.props;

			return TextInput({
				size: textSize,
				header,
				enable,
				multiline: true,
				placeholder,
				ref: this.handleOnRef,
				placeholderTextColor: Color.base4.toHex(),
				color: Color.base1,
				style: this.getStyle(),
				forcedValue: this.getValue(),
				onBlur: this.handleOnBlur,
				onFocus: this.handleOnFocus,
				returnKeyType: this.getReturnKeyType(),
				onSubmitEditing: this.handleOnSubmit,
				onChangeText: this.handleOnChange,
				onSelectionChange: ({ selection }) => {
					this.cursorPosition = selection.start;
				},
				onLinkClick: this.handleOnLinkClick,
			});
		}

		/** @return {string | null} */
		getReturnKeyType()
		{
			const { item } = this.props;

			return item.isRoot() ? 'done' : null;
		}

		/** @return {string} */
		getValue()
		{
			const { item } = this.props;

			return this.parseTextValue(item.getTitle());
		}

		/**
		 * @param {string} value
		 * @return {string}
		 */
		parseTextValue(value)
		{
			const plainTextFormatter = new PlainTextFormatter({
				diskRenderType: 'link',
				mentionRenderType: 'text',
				tableRenderType: 'placeholder',
				codeRenderType: 'text',
				listRenderType: 'text',
				allowedTags: ['url'],
			});

			const plainAst = plainTextFormatter.format({
				source: value,
			});

			return plainAst.toString({ encode: false });
		}

		/** @return {Object} */
		getStyle()
		{
			const { item, style = {} } = this.props;
			const completed = item.getIsComplete();

			return {
				textAlignVertical: 'center',
				opacity: completed ? 0.6 : 1,
				...style,
			};
		}

		/** @return {number} */
		getCursorPosition()
		{
			return this.cursorPosition;
		}

		/** @return {string} */
		getTextValue()
		{
			return this.#itemText;
		}

		/** @return {void} */
		setSelection()
		{
			const titleLength = this.getValue().length;

			if (!titleLength || !this.textInputRef)
			{
				return;
			}

			this.textInputRef.setSelection(titleLength, titleLength);
		}
	}

	module.exports = { ItemTextField };
});
