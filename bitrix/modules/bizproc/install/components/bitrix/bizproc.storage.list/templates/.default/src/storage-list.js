import { Loc, Runtime, ajax } from 'main.core';
import { EventEmitter } from 'main.core.events';
import { UI } from 'ui.notification';
import { MessageBox } from 'ui.dialogs.messagebox';

export class StorageList
{
	static Instance: ?StorageList = null;

	#gridId: string;
	#onStorageRemoveHandler: Function;

	constructor(options: { gridId: string })
	{
		StorageList.Instance = this;
		this.#gridId = options.gridId;

		Runtime.loadExtension('bizproc.router').then(({ Router }) => {
			Router.init();
		}).catch((e) => console.error(e));

		this.#onStorageRemoveHandler = this.#onStorageRemove.bind(this);
		top.BX.Event.EventEmitter.subscribe(
			'BX.Bizproc.Component.StorageItemList:onStorageRemove',
			this.#onStorageRemoveHandler,
		);

		const slider = BX.SidePanel?.Instance?.getSliderByWindow(window);
		if (slider)
		{
			EventEmitter.subscribeOnce(slider, 'SidePanel.Slider:onDestroy', () => {
				this.destroy();
			});
		}
	}

	destroy(): void
	{
		top.BX.Event.EventEmitter.unsubscribe(
			'BX.Bizproc.Component.StorageItemList:onStorageRemove',
			this.#onStorageRemoveHandler,
		);
	}

	deleteSelected(): void
	{
		const grid = BX.Main.gridManager.getInstanceById(this.#gridId);
		const ids = grid?.getRows()?.getSelectedIds?.() || [];

		if (!ids.length)
		{
			return;
		}

		ajax.runAction('bizproc.storage.deleteList', { data: { ids } })
			.then(() => grid.reloadTable())
			.catch(({ errors }) => {
				if (errors?.length)
				{
					const content = errors
						.map(({ message }) => message)
						.join('<br>')
					;

					UI.Notification.Center.notify({ content });
				}
			})
		;
	}

	#onStorageRemove(): void
	{
		const grid = BX.Main.gridManager.getInstanceById(this.#gridId);
		if (grid)
		{
			grid.reloadTable();
		}
	}

	removeStorage(storageId: number): void
	{
		MessageBox.confirm(
			Loc.getMessage('BIZPROC_STORAGE_LIST_CONFIRM_MESSAGE'),
			(messageBox) => {
				ajax.runAction('bizproc.storage.delete', { data: { id: storageId } })
					.then((response) => {
						if (response.data)
						{
							UI.Notification.Center.notify({
								content: Loc.getMessage('BIZPROC_STORAGE_LIST_DELETE_SUCCESS'),
							});

							if (messageBox)
							{
								messageBox.close();
							}

							this.#onStorageRemove();
						}
					})
					.catch((error) => {
						MessageBox.alert(error.errors.pop().message);
					});
			},
			Loc.getMessage('BIZPROC_STORAGE_LIST_CONFIRM_OK'),
		);
	}
}
