import 'ui.design-tokens';
import 'ui.buttons';
import 'ui.fonts.opensans';
import './css/style.css';
import { EventEmitter } from 'main.core.events';
import { Dom, Tag, Loc, Type, Text, Event, Runtime, ajax } from 'main.core';
import { buildAttachmentMenuItems } from './attachments';
import { toggleFavoriteOnServer } from './favorites-toggle';
import { applyFavoriteFilter, isFavoriteFilterApplied } from 'mail.favorites-filter-state';
import { LiveAnnouncer } from 'ui.a11y';

const ARCHIVE_MIN_FILES = 2;

export class MessageGrid
{
	EXPAND_LICENSE_URL = '/settings/license_all.php';
	#loadingMessagesStubInGridWrapper;
	#gridWrapper;
	#gridStub;
	#id;
	#allRowsSelectedStatus = false;
	#panel;
	#checkboxNodeForCheckAll;
	#listHandlersBound = false;
	#attachmentsPopup = null;
	#attachmentsMessageId = null;
	#listImprovementsEnabled = false;
	#archiveDownloadEnabled = false;

	constructor(mailboxIsAvailable = false)
	{
		this.mailboxIsAvailable = mailboxIsAvailable;
		if (typeof MessageGrid.instance === 'object') {
			return MessageGrid.instance
		}
		MessageGrid.instance = this;
		this.#listImprovementsEnabled = BX.message('MAIL_LIST_IMPROVEMENTS_ENABLED') === 'Y';
		this.#archiveDownloadEnabled = BX.message('MAIL_LIST_ARCHIVE_DOWNLOAD_AVAILABLE') === 'Y';

		EventEmitter.subscribe('Grid::allRowsSelected', (event) =>
		{
			if(this.#compareGrid(event)) this.#allRowsSelectedStatus = true;
		})

		EventEmitter.subscribe('Grid::allRowsUnselected', (event) =>
		{
			if(this.#compareGrid(event)) this.#allRowsSelectedStatus = false;
		})

		EventEmitter.subscribe('Grid::updated', (event) =>
		{
			if(this.#compareGrid(event) && this.#allRowsSelectedStatus)
			{
				if(this.#checkboxNodeForCheckAll !== undefined)
				{
					this.#checkboxNodeForCheckAll.checked = true;
				}
				this.selectAll();
			}
		})

		EventEmitter.subscribe('Mail::resetGridSelection', (event) =>
		{
			this.#allRowsSelectedStatus = false;
		})

		EventEmitter.subscribe('Mail::directoryChanged', () =>
		{
			this.#allRowsSelectedStatus = false;
		})

		EventEmitter.subscribe('Grid::thereSelectedRows', (event) =>
		{
			if(this.#compareGrid(event)) this.#allRowsSelectedStatus = false;
		})

		EventEmitter.subscribe('Grid::updated', (event) => {
			const [grid] = event.getCompatData();
			if(grid !== undefined && Type.isFunction(grid.getId) && grid.getId() === this.getId()){
				this.replaceTheBlankEmailStub();
			}
		});
		this.replaceTheBlankEmailStub();

		if (this.#listImprovementsEnabled)
		{
			EventEmitter.subscribe('Grid::updated', (event) => {
				const [grid] = event.getCompatData();
				if (grid !== undefined && Type.isFunction(grid.getId) && grid.getId() === this.getId())
				{
					this.#destroyAttachmentsPopup();
					this.#bindListHandlers();
					this.#announceFavoritesFilter();
				}
			});

			EventEmitter.subscribe('BX.Mail.Favorites:filterToggle', (event) => {
				const data = event.getData();
				this.toggleFavoritesFilter(Boolean(data && data.active));
			});
		}

		return MessageGrid.instance
	}

	setGridStub(gridStub)
	{
		this.#gridStub = gridStub;
	}

	setGridWrapper(gridWrapper)
	{
		this.#gridWrapper = gridWrapper;
	}

	getGridWrapper()
	{
		return this.#gridWrapper;
	}

	getGridStub()
	{
		return this.#gridStub;
	}

	enableLoadingMessagesStub()
	{
		if(this.getGridWrapper()!==undefined)
		{

			Dom.addClass(this.getGridWrapper(), 'mail-msg-list-grid-hidden');
			this.#loadingMessagesStubInGridWrapper = this.getGridStub().appendChild(
				Tag.render`
					<div class="mail-msg-list-grid-loader mail-msg-list-grid-loader-animate">
						<div class="mail-msg-list-grid-loader-inner">
							<img src="/bitrix/images/mail/mail-loader.svg" alt="Load...">
						</div>
					</div>`
			);

			setTimeout(()=>{
				if(this.#loadingMessagesStubInGridWrapper !== undefined)
				{
					this.#loadingMessagesStubInGridWrapper.remove();
					Dom.removeClass(this.getGridWrapper(), 'mail-msg-list-grid-hidden');
				}
			}, 15000);
		}
	}

	replaceTheBlankEmailStub()
	{
		let blankEmailStubs = document.getElementsByClassName("main-grid-row main-grid-row-empty main-grid-row-body");
		if(blankEmailStubs.length > 0)
		{
			let blankEmailStub = blankEmailStubs[0];
			if(blankEmailStub.firstElementChild.firstElementChild)
			{
				if (this.mailboxIsAvailable)
				{
					blankEmailStub.firstElementChild.firstElementChild.replaceWith(
						Tag.render`
						<div class="mail-msg-list-grid-empty">
						<div class="mail-msg-list-grid-empty-inner">
						<div class="mail-msg-list-grid-empty-title">${Loc.getMessage("MAIL_MSG_LIST_GRID_EMPTY_TITLE")}</div>
						<p class="mail-msg-list-grid-empty-text">${Loc.getMessage("MAIL_MSG_LIST_GRID_EMPTY_TEXT_1")}</p>
						<p class="mail-msg-list-grid-empty-text">${Loc.getMessage("MAIL_MSG_LIST_GRID_EMPTY_TEXT_2")}</p>
						</div>
						</div>`
					);
				}
				else
				{
					let tariffButton = Tag.render`
					<button class="ui-btn ui-btn-round ui-btn-lg ui-btn-success">
						${Loc.getMessage("MAIL_MSG_LIST_MAILBOX_TARIFF_RESTRICTIONS_BUTTON")}
					</button>`;

					tariffButton.onclick = (event) => {
						event.preventDefault();
						window.open(this.EXPAND_LICENSE_URL, '_blank')
					};

					const tariffPlug = Tag.render`
					<div class="mail-msg-list-grid-empty">
						<div class="mail-msg-list-grid-empty-inner">
							<div class="mail-msg-list-grid-empty-title">${Loc.getMessage("MAIL_MSG_LIST_MAILBOX_TARIFF_RESTRICTIONS_TITLE")}</div>
							<p class="mail-msg-list-grid-empty-text">${Loc.getMessage("MAIL_MSG_LIST_MAILBOX_TARIFF_RESTRICTIONS_TEXT_1")}</p>
							<p class="mail-msg-list-grid-empty-text">${Loc.getMessage("MAIL_MSG_LIST_MAILBOX_TARIFF_RESTRICTIONS_TEXT_2")}</p>
						</div>
						<br/>
					</div>`;

					tariffPlug.append(tariffButton);
					blankEmailStub.firstElementChild.firstElementChild.replaceWith(tariffPlug);
				}
			}
		}
	}

	setCheckboxNodeForCheckAll(node)
	{
		this.#checkboxNodeForCheckAll = node;
	}

	setPanel(panel)
	{
		this.#panel = panel;
	}

	getPanel()
	{
		return this.#panel;
	}

	hidePanel()
	{
		const panel = this.getPanel();
		if(panel && Type.isFunction(panel.hidePanel())){
			this.getPanel().hidePanel();
		}
	}

	#compareGrid(eventWithGrid,grid)
	{
		if(this.getId() !== undefined)
		{
			if(grid===undefined && eventWithGrid.getCompatData())
			{
				[grid] = eventWithGrid.getCompatData();
			}
			if(grid !== undefined && Type.isFunction(grid.getId) && grid.getId()===this.getId()) return true;
		}
		return false;
	}

	setAllRowsSelectedStatus()
	{
		this.#allRowsSelectedStatus = true;
	}

	unsetAllRowsSelectedStatus()
	{
		this.#allRowsSelectedStatus = false;
	}

	reloadTable()
	{
		this.getGrid().reloadTable();
		this.getGrid().tableUnfade();
	}

	setGridId(gridId)
	{
		if (this.#id === gridId) {
			return;
		}
		this.#id = gridId;
		this.grid = BX.Main.gridManager.getInstanceById(gridId);

		if (this.#listImprovementsEnabled)
		{
			this.#bindListHandlers();
		}
	}

	selectAll()
	{
		this.getGrid().getRows().selectAll();
	}

	getId()
	{
		return this.#id;
	}

	getCountDisplayed()
	{
		if(this.getGrid())
		{
			return this.getGrid().getRows().getCountDisplayed();
		}
	}

	getGrid()
	{
		return this.grid;
	}

	getRows()
	{
		return this.getGrid().getRows().getBodyChild();
	}

	getRowById(id)
	{
		return this.getGrid().getRows().getById(id);
	}

	getRowNodeById(id)
	{
		return this.getRowById(id).getNode();
	}

	getSelectedIds()
	{
		return this.getGrid().getRows().getSelectedIds();
	}

	hideRowByIds(ids)
	{
		for (let i = 0; i < ids.length; i++)
		{
			const rowNode = this.getRowNodeById(ids[i]);
			Dom.style(rowNode, 'display', 'none');
		}
	}

	resetGridSelection()
	{
		EventEmitter.emit(window,'Mail::resetGridSelection');
		this.getGrid().getRows().unselectAll();
		this.getGrid().adjustCheckAllCheckboxes();
		this.hidePanel();
	}

	openGridSettingsWindow()
	{
		this.getGrid().getSettingsWindow()._onSettingsButtonClick();
	}

	#bindListHandlers()
	{
		if (this.#listHandlersBound)
		{
			return;
		}

		const container = document.querySelector('[data-role="mail-msg-list-grid"]');
		if (!container)
		{
			return;
		}

		this.#listHandlersBound = true;
		Event.bind(container, 'click', this.#onAttachmentsClick.bind(this));
		Event.bind(container, 'keydown', this.#onAttachmentsKeydown.bind(this));
		Event.bind(container, 'click', this.#onFavoriteClick.bind(this));
		Event.bind(container, 'keydown', this.#onFavoriteKeydown.bind(this));
	}

	#onAttachmentsClick(event)
	{
		const stack = event.target.closest('[data-role="mail-list-attachments-stack"]');
		if (!stack)
		{
			return;
		}

		event.preventDefault();
		event.stopPropagation();
		this.#openAttachmentsPopup(stack);
	}

	#onAttachmentsKeydown(event)
	{
		if (event.key !== 'Enter' && event.key !== ' ' && event.key !== 'Spacebar')
		{
			return;
		}

		const stack = event.target.closest('[data-role="mail-list-attachments-stack"]');
		if (!stack)
		{
			return;
		}

		event.preventDefault();
		event.stopPropagation();
		this.#openAttachmentsPopup(stack);
	}

	#openAttachmentsPopup(stack)
	{
		const messageId = Text.toInteger(stack.getAttribute('data-message-id'));
		if (messageId <= 0)
		{
			return;
		}

		this.#destroyAttachmentsPopup();
		this.#attachmentsMessageId = stack.getAttribute('data-message-id');

		const menu = Tag.render`<div class="mail-msg-list-attachments-menu" data-testid="mail-list-attachments-menu"></div>`;
		Dom.append(this.#renderAttachmentsStatus(), menu);
		Event.bind(menu, 'click', (event) => {
			if (event.target.closest('.mail-msg-list-attachments-menu__download'))
			{
				this.#closeAttachmentsPopup();
			}
		});

		// BX.Main.Popup aligns the angle with the bind element's left edge; shift the popup
		// right by half the stack width so the angle points at the stack centre.
		const angleOffsetLeft = Math.round(stack.getBoundingClientRect().width / 2);
		this.#attachmentsPopup = new BX.Main.Popup({
			id: 'mail-msg-list-attachments-popup',
			bindElement: stack,
			content: menu,
			autoHide: true,
			closeByEsc: true,
			cacheable: false,
			angle: true,
			offsetLeft: angleOffsetLeft,
			padding: 0,
			className: 'mail-msg-list-attachments-popup',
			ariaLabel: stack.getAttribute('aria-label'),
			focusTrap: {
				initialFocus: ['first-tabbable', 'container'],
				restoreFocus: () => this.#getAttachmentsFocusTarget(),
			},
			events: {
				onShow: () => this.#setAttachmentsExpanded(true),
				onClose: () => this.#setAttachmentsExpanded(false),
				onDestroy: () => {
					this.#setAttachmentsExpanded(false);
					this.#attachmentsPopup = null;
				},
			},
		});
		this.#attachmentsPopup.show();
		this.#setAttachmentsStatus(menu, Loc.getMessage('MAIL_MESSAGE_LIST_ATTACHMENTS_LOADING'));
		this.#loadAttachments(messageId, menu);
	}

	#loadAttachments(messageId, menu)
	{
		Promise.all([
			ajax.runComponentAction('bitrix:mail.client.message.list', 'getAttachments', {
				mode: 'class',
				data: { messageId },
			}),
			Runtime.loadExtension('ui.viewer').catch(() => null),
		])
			.then(([response]) => {
				if (!menu.isConnected)
				{
					return;
				}

				const items = buildAttachmentMenuItems((response.data || {}).attachments);
				if (items.length === 0)
				{
					this.#setAttachmentsStatus(menu, Loc.getMessage('MAIL_MESSAGE_LIST_ATTACHMENTS_EMPTY'));

					return;
				}

				this.#fillAttachmentsMenu(menu, items);
			})
			.catch(() => {
				if (!menu.isConnected)
				{
					return;
				}

				this.#setAttachmentsStatus(menu, Loc.getMessage('MAIL_MESSAGE_LIST_ATTACHMENTS_ERROR'), true);
			});
	}

	#fillAttachmentsMenu(menu, items)
	{
		Dom.clean(menu);
		Dom.append(this.#renderAttachmentsList(items), menu);

		if (this.#archiveDownloadEnabled && items.length >= ARCHIVE_MIN_FILES)
		{
			Dom.append(this.#renderArchiveDownloadFooter(), menu);
		}

		if (this.#attachmentsPopup)
		{
			this.#attachmentsPopup.adjustPosition();
		}

		this.#focusAttachmentsMenu();
	}

	#focusAttachmentsMenu()
	{
		const focusTrap = this.#attachmentsPopup ? this.#attachmentsPopup.getFocusTrap() : null;
		if (!focusTrap || !focusTrap.contains(document.activeElement))
		{
			return;
		}

		focusTrap.focusFirst();
	}

	#renderAttachmentsStatus()
	{
		return Tag.render`
			<div class="mail-msg-list-attachments-menu__status" role="status" aria-live="polite"
				data-testid="mail-list-attachments-menu-status"></div>
		`;
	}

	#setAttachmentsStatus(menu, text, isError = false)
	{
		this.#writeStatus(menu, '.mail-msg-list-attachments-menu__status', text, isError);
	}

	#writeStatus(menu, selector, text, isError)
	{
		const status = menu ? menu.querySelector(selector) : null;
		if (!status)
		{
			return;
		}

		status.textContent = text;
		if (isError)
		{
			Dom.addClass(status, '--error');
		}
		else
		{
			Dom.removeClass(status, '--error');
		}
	}

	#findAttachmentsStack()
	{
		if (!this.#attachmentsMessageId)
		{
			return null;
		}

		return document.querySelector(
			`[data-role="mail-list-attachments-stack"][data-message-id="${this.#attachmentsMessageId}"]`,
		);
	}

	#setAttachmentsExpanded(expanded)
	{
		const stack = this.#findAttachmentsStack();
		if (stack)
		{
			stack.setAttribute('aria-expanded', expanded ? 'true' : 'false');
		}
	}

	#getAttachmentsFocusTarget()
	{
		return this.#findAttachmentsStack() || this.#getGridFocusFallback();
	}

	#getGridFocusFallback()
	{
		const container = document.querySelector('[data-role="mail-msg-list-grid"]');
		if (!container)
		{
			return null;
		}

		if (!container.hasAttribute('tabindex'))
		{
			container.setAttribute('tabindex', '-1');
		}

		return container;
	}

	#closeAttachmentsPopup()
	{
		if (this.#attachmentsPopup)
		{
			this.#attachmentsPopup.close();
		}
	}

	#renderAttachmentsList(items)
	{
		const downloadLabel = Loc.getMessage('MAIL_MESSAGE_LIST_ATTACHMENTS_DOWNLOAD');
		const list = Tag.render`<div class="mail-msg-list-attachments-menu__list" data-testid="mail-list-attachments-menu-list"></div>`;

		items.forEach((item) => {
			const row = Tag.render`<div class="mail-msg-list-attachments-menu__item"></div>`;
			const name = Tag.render`
				<a class="mail-msg-list-attachments-menu__name" data-testid="mail-list-attachments-menu-item-view">
					<span class="mail-msg-list-attachments__name">${Text.encode(item.name)}</span>
					<span class="mail-msg-list-attachments__size">${Text.encode(item.size)}</span>
				</a>
			`;

			if (item.downloadable)
			{
				Dom.attr(name, 'href', item.url);
				Dom.attr(name, 'target', '_blank');
				this.#applyViewerAttributes(name, item.viewerAttrs);
				Dom.append(name, row);

				const downloadFileLabel = item.name
					? Loc.getMessage('MAIL_MESSAGE_LIST_ATTACHMENTS_DOWNLOAD_FILE', { '#NAME#': item.name })
					: downloadLabel;
				const download = Tag.render`
					<a class="mail-msg-list-attachments-menu__download" data-testid="mail-list-attachments-menu-item-download"
						title="${Text.encode(downloadLabel)}" aria-label="${Text.encode(downloadFileLabel)}"></a>
				`;
				Dom.attr(download, 'href', item.url);
				Dom.attr(download, 'download', '');
				Dom.append(download, row);
			}
			else
			{
				Dom.append(name, row);
			}

			Dom.append(row, list);
		});

		return list;
	}

	#renderArchiveDownloadFooter()
	{
		const label = Loc.getMessage('MAIL_DISK_FILE_DOWNLOAD_ARCHIVE');
		const footer = Tag.render`<div class="mail-msg-list-attachments-menu__footer"></div>`;
		const button = Tag.render`
			<button type="button" class="mail-msg-list-attachments-menu__archive" data-testid="mail-list-attachments-menu-archive">
				<span class="mail-msg-list-attachments-menu__archive-icon" aria-hidden="true"></span>
				<span class="mail-msg-list-attachments-menu__archive-text">${Text.encode(label)}</span>
			</button>
		`;
		const status = Tag.render`
			<span class="mail-msg-list-attachments-menu__archive-status" role="status" aria-live="polite"
				data-testid="mail-list-attachments-menu-archive-status"></span>
		`;

		Event.bind(button, 'click', () => this.#onArchiveDownloadClick(button));
		Dom.append(button, footer);
		Dom.append(status, footer);

		return footer;
	}

	#onArchiveDownloadClick(button)
	{
		if (button.getAttribute('aria-disabled') === 'true')
		{
			return;
		}

		const messageId = Text.toInteger(this.#attachmentsMessageId);
		if (messageId <= 0)
		{
			return;
		}

		this.#setArchiveButtonLoading(button, true);

		ajax.runComponentAction('bitrix:mail.client.message.list', 'getAttachmentsArchiveUrl', {
			mode: 'class',
			data: { messageId },
		})
			.then((response) => {
				const data = response.data || {};
				if (data.available && Type.isStringFilled(data.archiveUrl))
				{
					this.#startArchiveDownload(data.archiveUrl);
					this.#setArchiveButtonLoading(button, false);
				}
				else
				{
					this.#hideArchiveDownloadButton(button);
				}
			})
			.catch(() => {
				this.#setArchiveButtonLoading(button, false);
				this.#setArchiveStatus(button, Loc.getMessage('MAIL_MESSAGE_LIST_ARCHIVE_ERROR'), true);
			});
	}

	#setArchiveStatus(button, text, isError = false)
	{
		this.#writeStatus(
			button.closest('.mail-msg-list-attachments-menu'),
			'.mail-msg-list-attachments-menu__archive-status',
			text,
			isError,
		);
	}

	#setArchiveButtonLoading(button, loading)
	{
		if (loading)
		{
			button.setAttribute('aria-disabled', 'true');
			button.setAttribute('aria-busy', 'true');
			Dom.addClass(button, '--loading');
			this.#setArchiveStatus(button, Loc.getMessage('MAIL_MESSAGE_LIST_ARCHIVE_PREPARING'));
		}
		else
		{
			button.removeAttribute('aria-disabled');
			button.removeAttribute('aria-busy');
			Dom.removeClass(button, '--loading');
			this.#setArchiveStatus(button, '');
		}
	}

	#hideArchiveDownloadButton(button)
	{
		this.#setArchiveButtonLoading(button, false);

		const footer = button.closest('.mail-msg-list-attachments-menu__footer') || button;
		const menu = footer.closest('.mail-msg-list-attachments-menu');
		const firstLink = menu ? menu.querySelector('.mail-msg-list-attachments-menu__name[href]') : null;
		const focusTarget = firstLink || this.#getAttachmentsFocusTarget();

		Dom.addClass(footer, '--hidden');

		if (focusTarget)
		{
			focusTarget.focus({ preventScroll: true });
		}
	}

	#startArchiveDownload(url)
	{
		const anchor = Tag.render`<a></a>`;
		Dom.attr(anchor, 'href', url);
		Dom.attr(anchor, 'download', '');
		Dom.style(anchor, 'display', 'none');
		Dom.append(anchor, document.body);
		anchor.click();
		Dom.remove(anchor);
	}

	#applyViewerAttributes(target, attrs)
	{
		if (!attrs || typeof attrs !== 'object')
		{
			return;
		}

		Object.entries(attrs).forEach(([name, value]) => {
			Dom.attr(target, name, value === null ? '' : String(value));
		});
	}

	#destroyAttachmentsPopup()
	{
		if (!this.#attachmentsPopup)
		{
			return;
		}

		const popup = this.#attachmentsPopup;
		const content = popup.getContentContainer();
		if (content && content.contains(document.activeElement))
		{
			const target = this.#getAttachmentsFocusTarget();
			if (target)
			{
				target.focus({ preventScroll: true });
			}
		}

		popup.destroy();
		this.#attachmentsPopup = null;
	}

	#onFavoriteClick(event)
	{
		const star = event.target.closest('[data-role="mail-list-favorite"]');
		if (!star)
		{
			return;
		}

		event.preventDefault();
		event.stopPropagation();
		this.#toggleFavorite(star);
	}

	#onFavoriteKeydown(event)
	{
		if (event.key !== 'Enter' && event.key !== ' ' && event.key !== 'Spacebar')
		{
			return;
		}

		const star = event.target.closest('[data-role="mail-list-favorite"]');
		if (!star)
		{
			return;
		}

		event.preventDefault();
		event.stopPropagation();
		this.#toggleFavorite(star);
	}

	#toggleFavorite(star)
	{
		toggleFavoriteOnServer({
			star,
			ajax,
			applyToStar: (node, active) => this.#applyFavoriteToStar(node, active),
			announce: (text) => this.#setFavoritesStatus(text),
			messages: {
				added: Loc.getMessage('MAIL_MESSAGE_LIST_FAVORITE_ADDED'),
				removed: Loc.getMessage('MAIL_MESSAGE_LIST_FAVORITE_REMOVED'),
				error: Loc.getMessage('MAIL_MESSAGE_LIST_FAVORITE_ERROR'),
			},
		});
	}

	#applyFavoriteToStar(star, active)
	{
		if (active)
		{
			Dom.addClass(star, '--active');
			star.setAttribute('aria-pressed', 'true');
		}
		else
		{
			Dom.removeClass(star, '--active');
			star.setAttribute('aria-pressed', 'false');
		}
	}

	toggleFavoritesFilter(active)
	{
		applyFavoriteFilter(this.#getFilterApi(), active);
	}

	#getFilter()
	{
		const filterId = BX.message('MAIL_MESSAGE_FILTER_ID');
		if (!filterId || !BX.Main || !BX.Main.filterManager)
		{
			return null;
		}

		return BX.Main.filterManager.getById(filterId);
	}

	#getFilterApi()
	{
		const filter = this.#getFilter();

		return filter ? filter.getApi() : null;
	}

	#isFavoritesFilterApplied()
	{
		const filter = this.#getFilter();

		return filter ? isFavoriteFilterApplied(filter.getFilterFieldsValues()) : false;
	}

	#announceFavoritesFilter()
	{
		if (!this.#isFavoritesFilterApplied())
		{
			return;
		}

		const count = this.getCountDisplayed() || 0;
		this.#setFavoritesStatus(
			count > 0
				? Loc.getMessagePlural('MAIL_MESSAGE_LIST_FAVORITES_SHOWN', count, { '#COUNT#': count })
				: Loc.getMessage('MAIL_MESSAGE_LIST_FAVORITES_EMPTY'),
		);
	}

	#setFavoritesStatus(text)
	{
		LiveAnnouncer.announce(text);
	}
}
