/**
 * @module stafftrack/check-in-v2/more-menu
 */
jn.define('stafftrack/check-in-v2/more-menu', (require, exports, module) => {
	const { Color } = require('tokens');
	const { Loc } = require('loc');
	const { Icon } = require('ui-system/blocks/icon');
	const { BaseMenu, baseSectionType } = require('stafftrack/base-menu');
	const { CheckInSettings } = require('stafftrack/check-in-v2/settings');

	const ItemType = {
		SETTINGS: 'SETTINGS',
		HELP: 'HELP',
	};

	class MoreMenu extends BaseMenu
	{
		getItems()
		{
			return [
				{
					id: ItemType.SETTINGS,
					sectionCode: baseSectionType,
					testId: 'more-menu-settings',
					title: Loc.getMessage('STAFFTRACKMOBILE_CHECK_IN_MORE_MENU_SETTINGS'),
					iconName: Icon.SETTINGS.getIconName(),
					styles: {
						icon: {
							color: Color.base3.toHex(),
						},
					},
				},
				{
					id: ItemType.HELP,
					sectionCode: baseSectionType,
					testId: 'more-menu-help',
					title: Loc.getMessage('STAFFTRACKMOBILE_CHECK_IN_MORE_MENU_HELP'),
					iconName: Icon.QUESTION.getIconName(),
					styles: {
						icon: {
							color: Color.base3.toHex(),
						},
					},
				},
			];
		}

		onItemSelected(item)
		{
			switch (item.id)
			{
				case ItemType.SETTINGS:
					CheckInSettings.open({ parentWidget: this.layoutWidget });
					break;

				case ItemType.HELP:
					helpdesk.openHelpArticle('28482334');
					break;

				default:
					break;
			}
		}
	}

	module.exports = { MoreMenu };
});
