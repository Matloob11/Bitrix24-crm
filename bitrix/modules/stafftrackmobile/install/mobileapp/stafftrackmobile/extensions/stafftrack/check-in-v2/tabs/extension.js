/**
 * @module stafftrack/check-in-v2/tabs
 */
jn.define('stafftrack/check-in-v2/tabs', (require, exports, module) => {
	const { requireLazy } = require('require-lazy');
	const { TabId } = require('stafftrack/check-in-v2/tabs/src/tab-id');
	const { Type } = require('type');
	const { isESClass } = require('utils/type');

	const SET_TAB_LABEL_EVENT = 'stafftrack.check-in-v2.tabs:set-tab-label';

	class Tabs
	{
		constructor({ tabs, unavailableTabIds = [] })
		{
			this.tabsWidget = tabs;
			this.nestedWidgets = tabs.nestedWidgets();
			this.unavailableTabIds = unavailableTabIds;

			this.initedTabs = new Set();

			this.#makeTabImplementations();
			this.#showStubs();

			const codeOfFirstTabWithAlreadyShownStub = Object.keys(this.nestedWidgets)[0];

			BX.onViewLoaded(() => {
				this.nestedWidgets = this.tabsWidget.nestedWidgets();

				if (Application.getPlatform() !== 'ios')
				{
					this.#showStubs(codeOfFirstTabWithAlreadyShownStub);
				}
				this.#bindEvents();
				void this.#initTabById(tabs.getCurrentItem().id);
			});
		}

		#makeTabImplementations()
		{
			this.tabImplementations = Object.fromEntries(
				Object.values(TabId).map((tabId) => [
					tabId,
					`stafftrack:layout/check-in-v2/tabs/${tabId}`,
				]),
			);
		}

		#showStubs(codeOfFirstTabWithAlreadyShownStub = null)
		{
			Object.entries(this.tabImplementations).forEach(([tabCode, extensionPath]) => {
				if (tabCode === codeOfFirstTabWithAlreadyShownStub)
				{
					return;
				}

				const { Stub } = require(`${extensionPath.replace(':', '/')}/stub`);

				this.nestedWidgets[tabCode]?.showComponent(new Stub({}));
			});
		}

		#bindEvents()
		{
			this.tabsWidget.on('onTabSelected', (tab, changed) => this.#onTabSelected(tab, changed));
			BX.addCustomEvent(SET_TAB_LABEL_EVENT, (payload) => this.#setTabLabel(payload));
		}

		#setTabLabel({ tabId, label = '' } = {})
		{
			if (!tabId || !this.nestedWidgets[tabId])
			{
				return;
			}

			this.tabsWidget.updateItem(tabId, { label: String(label) });
		}

		#onTabSelected({ id: tabId }, changed)
		{
			if (changed)
			{
				void this.#initTabById(tabId);
			}

			BX.postComponentEvent('stafftrack.check-in-v2.tabs:onTabSelected', [{ tabId, changed }]);
		}

		#isTabUnavailable(tabId)
		{
			return this.unavailableTabIds.includes(tabId);
		}

		async #initTabById(id)
		{
			if (this.initedTabs.has(id))
			{
				return;
			}

			const widget = this.nestedWidgets[id];
			if (!widget)
			{
				return;
			}

			const contentPath = `${this.tabImplementations[id]}/content`;
			const contentPromise = requireLazy(contentPath, false);

			const preloadPath = `${this.tabImplementations[id]}/preload`;
			const preloadData = (
				await requireLazy(preloadPath, false)
					.then(({ preload } = {}) => preload?.() ?? {})
			);

			const { Content } = await contentPromise;

			if (!Content || isESClass(Content) || !Type.isFunction(Content))
			{
				console.error(`Content is not a function in tab '${id}' (${contentPath})`);

				return;
			}

			widget.showComponent(
				Content({
					preloadData,
					tabsWidget: this.tabsWidget,
					parentWidget: widget,
					tabId: id,
					isTabUnavailable: this.#isTabUnavailable(id),
				}),
			);

			this.initedTabs.add(id);
		}
	}

	module.exports = { Tabs, SET_TAB_LABEL_EVENT };
});
