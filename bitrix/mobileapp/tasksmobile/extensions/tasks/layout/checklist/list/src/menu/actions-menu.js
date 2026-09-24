/**
 * @module tasks/layout/checklist/list/src/menu/actions-menu
 */
jn.define('tasks/layout/checklist/list/src/menu/actions-menu', (require, exports, module) => {
	const { Color } = require('tokens');
	const { Haptics } = require('haptics');
	const { animate } = require('animation');
	const { PureComponent } = require('layout/pure-component');
	const { directions } = require('tasks/layout/checklist/list/src/constants');
	const { IconView, Icon } = require('ui-system/blocks/icon');
	const { ScrollView } = require('layout/ui/scroll-view');
	const {
		MEMBER_TYPE,
		MEMBER_TYPE_ICONS,
		MEMBER_TYPE_RESTRICTION_FEATURE_META,
	} = require('tasks/layout/checklist/list/src/constants');

	const ICON_SIZE = 24;
	const ICON_MARGIN = 16;
	const ACTIVE_COLOR = Color.accentMainPrimary;
	const INACTIVE_COLOR = Color.base3;
	const BUTTON_TYPES = {
		important: 'important',
		attach: 'attach',
	};

	/**
	 * @class ChecklistActionsMenu
	 * @extends PureComponent
	 * @param {ChecklistActionsMenuProps} props
	 */
	class ChecklistActionsMenu extends PureComponent
	{
		/** @param {ChecklistActionsMenuProps} props */
		constructor(props)
		{
			super(props);

			/** @type {boolean} */
			this.isShown = false;
			/** @type {Map<string, Object>} */
			this.targetRefMap = new Map();

			/** @type {CheckListFlatTreeItem} */
			this.item = null;
			/** @type {Object} */
			this.menuRef = null;

			this.initialItem(props);
		}

		/** @param {ChecklistActionsMenuProps} props */
		componentWillReceiveProps(props)
		{
			this.initialItem(props);
		}

		/** @param {ChecklistActionsMenuProps} props */
		initialItem(props)
		{
			let itemId = null;
			if (props.item)
			{
				this.item = props.item;
				itemId = this.item.getId();
			}

			this.state = this.getStateParams(itemId);
		}

		handleOnToggleImportant = () => {
			const { onToggleImportant } = this.props;
			Haptics.impactLight();
			onToggleImportant();

			this.setState({
				[BUTTON_TYPES.important]: this.item?.getIsImportant(),
			});
		};

		/** @param {CheckListFlatTreeItem} item */
		setItem(item)
		{
			this.item = item;
			const itemId = item.getId();

			this.setState(this.getStateParams(itemId));
		}

		/**
		 * @private
		 * @param {number | string | null} itemId
		 * @return {Object}
		 */
		getStateParams(itemId)
		{
			const params = {
				itemId,
			};

			if (this.item)
			{
				params[BUTTON_TYPES.important] = this.item.getIsImportant();
				params[BUTTON_TYPES.attach] = Boolean(this.item.getAttachmentsCount() > 0);
				params[MEMBER_TYPE.auditor] = this.item.hasAuditor();
				params[MEMBER_TYPE.accomplice] = this.item.hasAccomplice();
			}

			return params;
		}

		/** @return {Promise<void>} */
		show()
		{
			if (!this.isShown)
			{
				return this.animateToggleMenu({ show: true });
			}

			return Promise.resolve();
		}

		/** @return {Promise<void>} */
		hide()
		{
			if (this.isShown)
			{
				return this.animateToggleMenu({ show: false });
			}

			return Promise.resolve();
		}

		/** @return {boolean} */
		isShownMenu()
		{
			return this.isShown;
		}

		/**
		 * @param {ChecklistActionsMenuToggleParams} param0
		 * @return {Promise<void>}
		 */
		animateToggleMenu({ show })
		{
			this.isShown = show;

			return animate(this.menuRef, {
				opacity: show ? 1 : 0,
				duration: 300,
			}).catch(console.error);
		}

		/**
		 * @private
		 * @param {string} type
		 * @return {boolean}
		 */
		isActiveIconByType(type)
		{
			return Boolean(this.state[type]);
		}

		/**
		 * @private
		 * @param {string | null} [type]
		 * @return {Object}
		 */
		getIconColor(type = null)
		{
			return this.isActiveIconByType(type) ? ACTIVE_COLOR : INACTIVE_COLOR;
		}

		renderMenu()
		{
			if (!this.item)
			{
				return null;
			}

			const { onAddFile, onBlur } = this.props;
			const {
				canUpdate,
				canAdd,
				canTabOut,
				canTabIn,
				hasAnotherCheckLists,
				canAddAccomplice,
			} = this.getPermissions();

			return View(
				{
					testId: this.getTestId(),
					style: {
						flex: 1,
						flexDirection: 'row',
						alignItems: 'center',
						justifyContent: 'flex-end',
					},
				},
				ScrollView(
					{
						horizontal: true,
						style: {
							flex: 1,
							height: 24,
							alignItems: 'center',
						},
					},
					this.renderIconView({
						id: 'attach',
						color: this.getIconColor(BUTTON_TYPES.attach),
						icon: Icon.ATTACH,
						onClick: onAddFile,
						size: ICON_SIZE,
						style: {
							marginRight: ICON_MARGIN,
						},
					}),
					this.renderIconView({
						id: MEMBER_TYPE.auditor,
						color: this.getIconColor(MEMBER_TYPE.auditor),
						icon: MEMBER_TYPE_ICONS[MEMBER_TYPE.auditor],
						size: ICON_SIZE,
						disabled: (
							!canAddAccomplice || MEMBER_TYPE_RESTRICTION_FEATURE_META[MEMBER_TYPE.auditor].isRestricted()
						),
						style: {
							marginRight: ICON_MARGIN,
						},
						onClick: () => this.onMemberIconClick(MEMBER_TYPE.auditor),
					}),
					this.renderIconView({
						id: MEMBER_TYPE.accomplice,
						color: this.getIconColor(MEMBER_TYPE.accomplice),
						icon: MEMBER_TYPE_ICONS[MEMBER_TYPE.accomplice],
						size: ICON_SIZE,
						disabled: (
							!canAddAccomplice || MEMBER_TYPE_RESTRICTION_FEATURE_META[MEMBER_TYPE.accomplice].isRestricted()
						),
						style: {
							marginRight: ICON_MARGIN,
						},
						onClick: () => this.onMemberIconClick(MEMBER_TYPE.accomplice),
					}),
					this.renderIconView({
						id: 'importance',
						size: ICON_SIZE,
						color: this.isActiveIconByType(BUTTON_TYPES.important)
							? Color.accentMainWarning
							: INACTIVE_COLOR,
						icon: Icon.FIRE,
						disabled: !canUpdate,
						style: {
							marginRight: ICON_MARGIN,
						},
						onClick: this.handleOnToggleImportant,
					}),
					this.renderIconView({
						id: 'toLeft',
						color: this.getIconColor(),
						size: ICON_SIZE,
						icon: Icon.POINT_LEFT,
						disabled: !canTabOut,
						style: {
							marginRight: ICON_MARGIN,
						},
						onClick: () => {
							if (canTabOut)
							{
								this.onTabMove(directions.LEFT);
							}
						},
					}),
					this.renderIconView({
						id: 'toRight',
						color: this.getIconColor(),
						size: ICON_SIZE,
						icon: Icon.POINT_RIGHT,
						disabled: !canTabIn,
						style: {
							marginRight: ICON_MARGIN,
						},
						onClick: () => {
							if (canTabIn)
							{
								this.onTabMove(directions.RIGHT);
							}
						},
					}),
					this.renderIconView({
						useRef: true,
						id: 'toChecklist',
						color: this.getIconColor(),
						icon: Icon.MOVE_TO_CHECKLIST,
						disabled: (canUpdate && !canAdd && !hasAnotherCheckLists) || !canUpdate,
						size: ICON_SIZE,
						onClick: this.handleOnMoveToCheckList,
					}),
				),
				View({
					style: {
						width: 1,
						height: 14,
						justifyContent: 'center',
						backgroundColor: Color.bgSeparatorPrimary.toHex(),
						marginHorizontal: 10,
					},
				}),
				this.renderIconView({
					id: 'hide',
					color: ACTIVE_COLOR,
					icon: Icon.CHEVRON_DOWN,
					size: ICON_SIZE,
					style: {
						alignSelf: 'center',
						justifyContent: 'center',
					},
					onClick: onBlur,
				}),
			);
		}

		/**
		 * @private
		 * @param {ChecklistIconViewProps} iconProps
		 * @return {Object}
		 */
		renderIconView(iconProps)
		{
			const { useRef, onClick, id, disabled, ...restProps } = iconProps;
			const isRestricted = MEMBER_TYPE_RESTRICTION_FEATURE_META[id]?.isRestricted?.();

			return IconView({
				testId: this.getTestId(id),
				forwardRef: (ref) => {
					if (useRef)
					{
						this.targetRefMap.set(id, ref);
					}
				},
				onClick: () => {
					if (this.isShown && (!disabled || isRestricted))
					{
						onClick?.(this.targetRefMap.get(id));
					}
				},
				disabled,
				...restProps,
			});
		}

		handleOnMoveToCheckList = (targetRef) => {
			const { onMoveToCheckList } = this.props;

			onMoveToCheckList?.(this.item.getMoveIds(this.item.getId()), targetRef);
		};

		/**
		 * @private
		 * @param {string} memberType
		 */
		onMemberIconClick(memberType)
		{
			const { openTariffRestrictionWidget, openUserSelectionManager } = this.props;

			if (MEMBER_TYPE_RESTRICTION_FEATURE_META[memberType].isRestricted())
			{
				openTariffRestrictionWidget(memberType);

				return;
			}

			openUserSelectionManager(this.item.getId(), memberType);
		}

		/**
		 * @private
		 * @param {string} direction
		 */
		onTabMove(direction)
		{
			const { onTabMove } = this.props;

			if (onTabMove)
			{
				Haptics.impactLight();
				onTabMove(this.item, direction);
			}
		}

		/**
		 * @private
		 * @return {ChecklistPermissions}
		 */
		getPermissions()
		{
			return {
				canTabOut: this.item.checkCanTabOut(),
				canTabIn: this.item.checkCanTabIn(),
				canAdd: this.item.checkCanAdd(),
				canUpdate: this.item.checkCanUpdate(),
				canAddAccomplice: this.item.checkCanAddAccomplice(),
				hasAnotherCheckLists: this.item.hasAnotherCheckLists(),
			};
		}

		render()
		{
			return View(
				{
					ref: (menuRef) => {
						this.menuRef = menuRef;
					},
					onClick: () => {
						// Disabled blur
						return null;
					},
					style: {
						opacity: 0,
						paddingVertical: 14,
						paddingHorizontal: 18,
						position: 'absolute',
						width: '100%',
						left: 0,
						bottom: 0,
						backgroundColor: Color.bgContentPrimary.toHex(),
					},
				},
				this.renderMenu(),
			);
		}

		/**
		 * @private
		 * @param {string} [suffix]
		 * @return {string}
		 */
		getTestId(suffix)
		{
			const prefix = 'checklist_toolbar';

			return suffix ? `${prefix}_${suffix}` : prefix;
		}
	}

	module.exports = { ChecklistActionsMenu };
});
