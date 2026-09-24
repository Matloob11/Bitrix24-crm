/* eslint-disable */
this.BX = this.BX || {};
this.BX.Bizproc = this.BX.Bizproc || {};
(function (exports, main_core, main_core_events, ui_notification, ui_dialogs_messagebox) {
	'use strict';

	class StorageList {
		static Instance = null;
		#gridId;
		#onStorageRemoveHandler;
		constructor(options) {
			StorageList.Instance = this;
			this.#gridId = options.gridId;
			main_core.Runtime.loadExtension('bizproc.router').then(({
				Router
			}) => {
				Router.init();
			}).catch(e => console.error(e));
			this.#onStorageRemoveHandler = this.#onStorageRemove.bind(this);
			top.BX.Event.EventEmitter.subscribe('BX.Bizproc.Component.StorageItemList:onStorageRemove', this.#onStorageRemoveHandler);
			const slider = BX.SidePanel?.Instance?.getSliderByWindow(window);
			if (slider) {
				main_core_events.EventEmitter.subscribeOnce(slider, 'SidePanel.Slider:onDestroy', () => {
					this.destroy();
				});
			}
		}
		destroy() {
			top.BX.Event.EventEmitter.unsubscribe('BX.Bizproc.Component.StorageItemList:onStorageRemove', this.#onStorageRemoveHandler);
		}
		deleteSelected() {
			const grid = BX.Main.gridManager.getInstanceById(this.#gridId);
			const ids = grid?.getRows()?.getSelectedIds?.() || [];
			if (!ids.length) {
				return;
			}
			main_core.ajax.runAction('bizproc.storage.deleteList', {
				data: {
					ids
				}
			}).then(() => grid.reloadTable()).catch(({
				errors
			}) => {
				if (errors?.length) {
					const content = errors.map(({
						message
					}) => message).join('<br>');
					ui_notification.UI.Notification.Center.notify({
						content
					});
				}
			});
		}
		#onStorageRemove() {
			const grid = BX.Main.gridManager.getInstanceById(this.#gridId);
			if (grid) {
				grid.reloadTable();
			}
		}
		removeStorage(storageId) {
			ui_dialogs_messagebox.MessageBox.confirm(main_core.Loc.getMessage('BIZPROC_STORAGE_LIST_CONFIRM_MESSAGE'), messageBox => {
				main_core.ajax.runAction('bizproc.storage.delete', {
					data: {
						id: storageId
					}
				}).then(response => {
					if (response.data) {
						ui_notification.UI.Notification.Center.notify({
							content: main_core.Loc.getMessage('BIZPROC_STORAGE_LIST_DELETE_SUCCESS')
						});
						if (messageBox) {
							messageBox.close();
						}
						this.#onStorageRemove();
					}
				}).catch(error => {
					ui_dialogs_messagebox.MessageBox.alert(error.errors.pop().message);
				});
			}, main_core.Loc.getMessage('BIZPROC_STORAGE_LIST_CONFIRM_OK'));
		}
	}

	exports.StorageList = StorageList;

})(this.BX.Bizproc.Component = this.BX.Bizproc.Component || {}, BX, BX.Event, BX.UI.Notification, BX.UI.Dialogs);
//# sourceMappingURL=script.js.map
