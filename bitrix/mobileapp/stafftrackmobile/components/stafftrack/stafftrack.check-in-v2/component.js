(() => {
	const require = (ext) => jn.require(ext);

	const { CheckInForm } = require('stafftrack/layout/check-in-v2/form');

	BX.onViewLoaded(() => {
		const dialogId = BX.componentParameters.get('DIALOG_ID', null);
		const dialogName = BX.componentParameters.get('DIALOG_NAME', null);

		layout.preventBottomSheetDismiss(true);
		layout.showComponent(
			new CheckInForm({
				layoutWidget: layout,
				dialogId,
				dialogName,
			}),
		);
	});
})();
