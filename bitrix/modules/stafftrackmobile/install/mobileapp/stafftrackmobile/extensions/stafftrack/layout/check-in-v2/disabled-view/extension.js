/**
 * @module stafftrack/layout/check-in-v2/disabled-view
 */
jn.define('stafftrack/layout/check-in-v2/disabled-view', (require, exports, module) => {
	const { PureComponent } = require('layout/pure-component');
	const { Box } = require('ui-system/layout/box');
	const { BoxFooter } = require('ui-system/layout/dialog-footer');
	const { StatusBlock } = require('ui-system/blocks/status-block');
	const { Button, ButtonDesign, ButtonSize } = require('ui-system/form/buttons/button');
	const { Link4 } = require('ui-system/blocks/link');
	const { Color } = require('tokens');
	const { Loc } = require('loc');
	const { createTestIdGenerator } = require('utils/test');
	const { makeLibraryImagePath } = require('asset-manager');
	const { PropTypes } = require('utils/validation');
	const {
		createChatWithDepartmentHead,
		turnCheckInSettingOn,
	} = require('stafftrack/layout/check-in-v2/disabled-view/src/api');

	class DisabledCheckInView extends PureComponent
	{
		/**
		 * @param {Object} props
		 * @param {function|null} [props.onCheckInEnabled=null]
		 */
		constructor(props)
		{
			super(props);

			this.getTestId = createTestIdGenerator({
				prefix: 'disabled-check-in-content',
				context: this,
			});
		}

		render()
		{
			return Box(
				{
					footer: BoxFooter(
						{
							testId: this.getTestId('footer'),
						},
						Button({
							text: Loc.getMessage(
								`STAFFTRACK_CHECK_IN_DISABLED_VIEW_BUTTON_${env.isAdmin ? 'ADMIN' : 'EMPLOYEE'}`,
							),
							withStateDecorator: true,
							stretched: true,
							size: ButtonSize.L,
							design: ButtonDesign.FILLED,
							testId: this.getTestId('button'),
							ref: (ref) => {
								this.buttonRef ??= ref;
							},
							onClick: () => this.#onButtonClick(),
						}),
					),
					safeArea: {
						bottom: true,
					},
					resizableByKeyboard: false,
					testId: this.getTestId('box'),
				},
				this.#renderContent(),
			);
		}

		#renderContent()
		{
			return StatusBlock({
				image: Image({
					style: {
						width: 207,
						height: 207,
					},
					uri: makeLibraryImagePath('disabled-check-in.png', 'graphic', 'stafftrack'),
				}),
				title: Loc.getMessage('STAFFTRACK_CHECK_IN_DISABLED_VIEW_TITLE'),
				description: Loc.getMessage(
					`STAFFTRACK_CHECK_IN_DISABLED_VIEW_DESCRIPTION_${env.isAdmin ? 'ADMIN' : 'EMPLOYEE'}`,
				),
				titleColor: Color.base1,
				descriptionColor: Color.base1,
				buttons: [
					Link4({
						testId: this.getTestId('help-link'),
						text: Loc.getMessage('STAFFTRACK_CHECK_IN_DISABLED_VIEW_HELP_LINK'),
						useInAppLink: false,
						onClick: () => helpdesk.openHelpArticle('28435980'),
					}),
				],
				testId: this.getTestId('content-container'),
			});
		}

		async #onButtonClick()
		{
			this.buttonRef?.setLoading(true);

			if (env.isAdmin)
			{
				if (await turnCheckInSettingOn())
				{
					BX.postComponentEvent('check-in-settings:enabled');
					this.props.onCheckInEnabled?.();
				}
				else
				{
					this.buttonRef?.setLoading(false);
				}

				return;
			}

			const chatId = await createChatWithDepartmentHead();
			if (chatId)
			{
				const dialogId = `chat${chatId}`;

				BX.postComponentEvent('ImMobile.Messenger.Dialog:open', [{ dialogId }], 'im.messenger');
			}

			this.buttonRef?.setLoading(false);
		}
	}

	DisabledCheckInView.defaultProps = {
		onCheckInEnabled: null,
	};

	DisabledCheckInView.propTypes = {
		onCheckInEnabled: PropTypes.func,
	};

	module.exports = { DisabledCheckInView };
});
