import { ActionFactory } from './action/action-factory';

type runActionConfig = {
	actionId: string,
	options: Array<{ [key: string]: any }>,
	params: Array<{ [key: string]: any }>,
}

type panelActionParams = {
	actionId: string,
	gridId: string,
}

const createdActionPanels = new Map();

BX.addCustomEvent('BX.UI.ActionPanel:created', (panel) => {
	const gridId = panel?.params?.gridId;
	if (gridId)
	{
		createdActionPanels.set(gridId, panel);
	}
});

export class GridManager
{
	static instances: Array<GridManager> = [];
	#grid: BX.Main.grid;
	#gridId: string;
	#actionPanel: ?BX.UI.ActionPanel = null;
	#panelObserver: ?MutationObserver = null;

	constructor(gridId: string)
	{
		this.#gridId = gridId;

		const existingPanel = createdActionPanels.get(gridId);
		if (existingPanel)
		{
			this.#setupActionPanel(existingPanel);

			return;
		}

		BX.addCustomEvent('BX.UI.ActionPanel:created', (panel) => {
			if (panel?.params?.gridId === this.#gridId)
			{
				this.#setupActionPanel(panel);
			}
		});
	}

	#setupActionPanel(panel: BX.UI.ActionPanel): void
	{
		if (this.#actionPanel)
		{
			return;
		}

		this.#actionPanel = panel;

		// On single-row selection ActionPanel rebuilds from that row's actions,
		// which are UPPERCASE (not understood by ActionPanel.Item) and carry no
		// mass actions; this grid must always show the group (mass) actions.
		panel.buildPanelByItem = () => panel.buildPanelByGroup();

		// A click outside the panel and grid must not reset the selection,
		// same as the message list panel.
		panel.handleOuterClick = () => {};

		const container = panel.getPanelContainer();
		container.dataset.testid = 'mail-mailbox-grid-bulk-panel';

		this.#panelObserver = new MutationObserver(() => this.#applyPanelTestIds());
		this.#panelObserver.observe(container, { childList: true, subtree: true });

		this.#applyPanelTestIds();
	}

	#applyPanelTestIds(): void
	{
		if (!this.#actionPanel)
		{
			return;
		}

		const items = this.#actionPanel.getPanelContainer().querySelectorAll('[data-role="action-panel-item"]');
		items.forEach((item) => {
			if (item.id)
			{
				item.dataset.testid = `mail-mailbox-grid-bulk-action-${item.id}`;
			}
		});
	}

	static getInstance(gridId: string): GridManager
	{
		if (!this.instances[gridId])
		{
			this.instances[gridId] = new GridManager(gridId);
		}

		return this.instances[gridId];
	}

	static executePanelAction(params: panelActionParams): void
	{
		const { actionId, gridId } = params;
		const manager = GridManager.getInstance(gridId);
		const grid = manager.getGrid();
		if (!grid)
		{
			return;
		}

		const selectedIds = grid.getRows().getSelectedIds();
		if (!selectedIds || selectedIds.length === 0)
		{
			return;
		}

		const mailboxIds = selectedIds.map(Number);

		const action = ActionFactory.create(actionId, { grid });
		if (action)
		{
			action.setActionParams({ mailboxIds });
			action.execute();
		}
	}

	getGrid(): BX.Main.grid
	{
		return this.#grid ??= BX.Main.gridManager.getById(this.#gridId)?.instance;
	}

	runAction(config: runActionConfig): void
	{
		const actionId = config.actionId;
		const options = config.options;
		options.grid = this.getGrid();

		const action = ActionFactory.create(actionId, options);
		if (action)
		{
			const params = config.params;
			action.setActionParams(params);
			action.execute();
		}
	}
}
