/**
 * @module stafftrack/layout/check-in-v2/worktime-unavailable-view
 */
jn.define('stafftrack/layout/check-in-v2/worktime-unavailable-view', (require, exports, module) => {
	const { StatusBlock } = require('ui-system/blocks/status-block');
	const { Loc } = require('loc');
	const { makeLibraryImagePath } = require('asset-manager');
	const { Button, ButtonSize, ButtonDesign } = require('ui-system/form/buttons/button');
	const { openQRAuth } = require('qrauth/utils');

	class WorktimeUnavailable extends LayoutComponent
	{
		constructor(props)
		{
			super(props);

			this.parentWidget = props.parentWidget;
			this.tabId = props.tabId;
		}

		render()
		{
			return View(
				{
					style: {
						flex: 1,
						justifyContent: 'center',
						alignItems: 'center',
					},
				},
				StatusBlock({
					image: Image({
						style: {
							width: 207,
							height: 207,
						},
						uri: makeLibraryImagePath('unavailable-tool.png', 'graphic', 'stafftrack'),
					}),
					title: Loc.getMessage('STAFFTRACK_CHECK_IN_V2_WORKTIME_UNAVAILABLE_TITLE'),
					description: env?.isAdmin
						? Loc.getMessage('STAFFTRACK_CHECK_IN_V2_WORKTIME_UNAVAILABLE_DESCRIPTION_ADMIN')
						: Loc.getMessage('STAFFTRACK_CHECK_IN_V2_WORKTIME_UNAVAILABLE_DESCRIPTION'),
					testId: 'worktime-unavailable-status-block',
					buttons: env?.isAdmin ? [
						Button({
							stretched: true,
							testId: 'worktime-unavailable-button',
							size: ButtonSize.L,
							text: Loc.getMessage('STAFFTRACK_CHECK_IN_V2_WORKTIME_UNAVAILABLE_BUTTON'),
							design: ButtonDesign.FILLED,
							onClick: () => openQRAuth({
								layout: this.parentWidget,
								redirectUrl: '/settings/configs/?analyticContext=widget_settings_settings',
								showHint: true,
								analyticsSection: `stafftrack_worktime-unavailable_${this.tabId}`,
							}),
						}),
					] : [],
				}),
			);
		}
	}

	module.exports = {
		Content: (props) => new WorktimeUnavailable(props),
	};
});
