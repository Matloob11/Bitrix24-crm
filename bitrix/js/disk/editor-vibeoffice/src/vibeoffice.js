import { Type, Loc, Tag, Text, Runtime, ajax as Ajax } from 'main.core';
import { EventEmitter } from 'main.core.events';
import { Loader } from 'main.loader';
import { ButtonManager } from 'ui.buttons';
import type { MenuItem } from 'main.popup';
import { PullClient } from 'pull.client';
import { Users } from 'disk.users';
import type { EditorOptions, VibeOfficeEditor, CreateEditor, PanelButtonUniqIds, ContentUpdatedMessage } from './types';

const SECONDS_TO_MARK_AS_STILL_WORKING = 60;

// The one menu code that maps back to the CURRENT editor engine. In the "Open in..." split-menu
// the "Битрикс24.Docs" item is emitted under OnlyOfficeHandler's code ('onlyoffice'); the backend
// (DocumentHandlersManager::resolveEffectiveHandler) routes that code to the vibeoffice engine, so
// picking it must open here in place (navigate to linkToEdit), exactly like the OnlyOffice sibling.
// Every other code is a foreign engine and is delegated to BX.Disk.Viewer.Actions.runActionEdit.
const EDIT_HERE_SERVICE_CODE = 'onlyoffice';

// All UI events the helper facade emits (HelperEvents, types.ts:178-186). Recovery itself
// is fully owned by the helper; the wrapper only reacts to these for Disk-side UI/channels.
const HELPER_EVENTS = ['documentReady', 'stateChange', 'failover', 'sessionClosed', 'error'];

// Session-close reasons the helper relays from the SSE channel (SseSessionClosed,
// types.ts:116-119).
const SESSION_CLOSED_SAVED = 'saved';
const SESSION_CLOSED_REVOKED = 'revoked';
const SESSION_CLOSED_EXPIRED = 'expired';

// Editor states that should show the loader (helper state machine, types.ts:156-163).
const LOADING_STATES = ['creating', 'refreshing', 'recreating'];

// A session-close reaction that has to navigate the page (expired → reload, revoked/saved on a
// standalone page → downgrade to view) is deferred by this long so the accompanying message is
// actually painted before the navigation happens — an immediate `document.location` change would
// swap the page before the toast is seen (parity with the OnlyOffice force-reload UX).
const SESSION_CLOSE_NAVIGATION_DELAY_MS = 3000;

// The helper emits error(...) and failover({recovered:false}) synchronously for one recovery
// failure; a failover within this window of the last surfaced error is that same event and its
// toast is suppressed (see handleFailover).
const FAILOVER_ERROR_DEDUP_WINDOW_MS = 1000;

// VibeOfficeError.code → user-facing reaction (helper types.ts:199-207). Every code maps to a
// localized message so the editor never fails silently. `terminal: true` means the editor is no
// longer usable → a blocking messagebox; `terminal: false` is a transient degradation → a toast.
// `sse-degraded` is the only non-terminal code here: the live channel is degraded but editing can
// continue, so the actual terminal point stays on `sessionClosed`/a terminal `error`.
const ERROR_REACTIONS = {
	'api-js-load-failed': { messageId: 'DISK_EDITOR_VIBEOFFICE_ERR_API_JS_LOAD_FAILED', terminal: true },
	'editor-create-failed': { messageId: 'DISK_EDITOR_VIBEOFFICE_ERR_EDITOR_CREATE_FAILED', terminal: true },
	'invalid-open-config': { messageId: 'DISK_EDITOR_VIBEOFFICE_ERR_INVALID_OPEN_CONFIG', terminal: true },
	'refresh-fetch-failed': { messageId: 'DISK_EDITOR_VIBEOFFICE_ERR_REFRESH_FETCH_FAILED', terminal: false },
	'session-dead': { messageId: 'DISK_EDITOR_VIBEOFFICE_ERR_SESSION_DEAD', terminal: true },
	'sse-degraded': { messageId: 'DISK_EDITOR_VIBEOFFICE_ERR_SSE_DEGRADED', terminal: false },
	'recovery-failed': { messageId: 'DISK_EDITOR_VIBEOFFICE_ERR_RECOVERY_FAILED', terminal: true },
	'ds-error': { messageId: 'DISK_EDITOR_VIBEOFFICE_ERR_DS_ERROR', terminal: true },
};

// Fallback for an unknown / missing code: still surfaced (never silent), and treated as terminal.
const ERROR_FALLBACK = { messageId: 'DISK_EDITOR_VIBEOFFICE_ERR_GENERIC', terminal: true };

/**
 * Disk wrapper around `@vibeoffice/helper`.
 *
 * Additive sibling of {@see OnlyOffice}, but the engine boundary is different: the native
 * `DocsAPI.DocEditor` is NEVER created here — the helper's `createEditor` owns api.js
 * loading, the SSE session channel and seamless failover/recreate. This class only:
 *   - feeds the platform-signed `openConfig` to `createEditor` as-is,
 *   - subscribes to the five facade events and maps them onto Disk UI/channels,
 *   - reuses the engine-orthogonal OnlyOffice behaviours (SidePanel close, endEditSession,
 *     markAsStillWorking, online user-box, onSaved/onClosed emits),
 *   - tears the editor (SSE + native) down via `editor.destroy()` on unmount.
 *
 * `#documentServerEvents` is the pass-through seam for api.js handlers not reserved by the
 * helper (e.g. `onRequestHistory*` for history, driven via `historyEnabled`).
 */
export class Vibeoffice
{
	// `@vibeoffice/helper` API, injected by index.js after the vendored UMD runs. Static so a
	// single capture serves every instance; tests can override it.
	static #helper: ?{ createEditor: CreateEditor } = null;

	static setHelper(helper: ?{ createEditor: CreateEditor }): void
	{
		Vibeoffice.#helper = helper;
	}

	static getHelper(): ?{ createEditor: CreateEditor }
	{
		return Vibeoffice.#helper;
	}

	openConfig: Object = null;
	documentSession: Object = null;
	object: Object = null;
	attachedObject: Object = null;
	context: Object = null;
	targetNode: HTMLElement = null;
	editorNode: HTMLElement = null;
	userBoxNode: HTMLElement = null;
	elementId: string = null;
	linkToView: string = null;
	linkToEdit: string = null;
	linkToDownload: string = null;
	panelButtonUniqIds: ?PanelButtonUniqIds = null;
	historyEnabled: boolean = false;
	texts: Object = {};
	pullConfig: any = null;
	publicChannel: ?string = null;

	editor: ?VibeOfficeEditor = null;
	usersBox: ?Users = null;
	loader: ?Loader = null;
	documentWasChanged: boolean = false;
	dontEndCurrentDocumentSession: boolean = false;
	#unsubscribers: Array<() => void> = [];
	#trackWorkTimer: ?IntervalID = null;
	#documentServerEvents: Object = {};
	// Only a real server answer resets this; cache hits issue no request and leave it untouched.
	#badUserInfoAttempts: number = 0;
	// Author display names resolved through getUserInfo, keyed by userId (the response depends on
	// the user alone - infoToken only authorizes the call). The promise is cached, not the value,
	// so events arriving while a request is in flight join it instead of firing their own.
	#userNameCache: Map<number, Promise<?string>> = new Map();
	// Timestamps of the native "editor settled" events, used to gate document-change tracking
	// (see #handleDocumentStateChange). Parity with the OnlyOffice sibling.
	#caughtDocumentReady: ?number = null;
	#caughtInfoEvent: ?number = null;
	// When #handleError last surfaced a reaction to the user. The helper emits error(...) THEN
	// failover({recovered:false}) for the same recovery failure (helper.umd.cjs), so handleFailover
	// uses this to suppress its duplicate toast.
	#lastErrorNotifiedAt: ?number = null;
	// Pending deferred session-close navigation (expired reload / standalone downgrade-to-view),
	// cleared on destroy so it never navigates a torn-down editor.
	#pendingNavigationTimer: ?TimeoutID = null;
	// Idempotency guard for handleClose(): three independent sources (SidePanel.Slider:onClose,
	// beforeunload, postMessage 'closeIframe') can all fire it, but the teardown / endEditSession
	// must run once. Never reset (a new wrapper is a new instance).
	#closed: boolean = false;

	constructor(editorOptions: EditorOptions)
	{
		const options = Type.isPlainObject(editorOptions) ? editorOptions : {};

		this.openConfig = options.openConfig;
		this.documentSession = options.documentSession;
		this.object = options.object || {};
		this.attachedObject = options.attachedObject || { id: null };
		this.targetNode = options.targetNode;
		this.editorNode = options.editorNode;
		this.userBoxNode = options.userBoxNode;
		this.linkToView = options.linkToView;
		this.linkToEdit = options.linkToEdit;
		this.linkToDownload = options.linkToDownload;
		this.panelButtonUniqIds = Type.isPlainObject(options.panelButtonUniqIds) ? options.panelButtonUniqIds : null;
		this.historyEnabled = options.historyEnabled === true;
		this.texts = options.texts || {};
		this.pullConfig = options.pullConfig || null;
		this.publicChannel = Type.isStringFilled(options.publicChannel) ? options.publicChannel : null;

		this.context = {
			currentUser: options.currentUser,
			documentSession: this.documentSession,
			object: this.object,
			attachedObject: this.attachedObject,
		};

		// The api.js contract works with an element id. The template passes the node; resolve
		// it to its id (helper passes `element` straight into `new DocsAPI.DocEditor(id, ...)`).
		this.elementId = this.#resolveElementId(options.element, this.editorNode);

		// api.js handlers the helper does not reserve (vendor helper.umd.cjs only reserves
		// onAppReady/onDocumentReady/onError/onRequestRefreshFile) flow through here to the native
		// DocsAPI editor. We wire the same document-change signal the OnlyOffice sibling uses
		// (onlyoffice.js:504-517): onDocumentStateChange marks the document as changed once the
		// editor has settled, so endEditSession/emitEventOnClosed report a truthful
		// `documentWasChanged` (drives the c_disk.js "document is being saved" balloon and its
		// `vibeoffice` pull "saved" toast). onDocumentReady/onInfo only timestamp the guard.
		// P4 history wiring (onRequestHistory*, gated by `historyEnabled`) lands here later.
		this.#documentServerEvents = {
			onDocumentReady: this.#handleNativeDocumentReady.bind(this),
			onInfo: this.#handleNativeInfo.bind(this),
			onDocumentStateChange: this.#handleDocumentStateChange.bind(this),
		};

		this.#renderOnlineBox();
		this.loadDiskExtensionInTopWindow();
		this.bindEvents();
		this.#initPull();

		void this.#createEditor();
	}

	async #createEditor(): Promise<void>
	{
		const createEditor: ?CreateEditor = Vibeoffice.#helper?.createEditor;
		if (!Type.isFunction(createEditor))
		{
			// The vendored helper UMD must have run (index.js side-effect import). If it did not,
			// the editor can never be created — surface the terminal reaction rather than only
			// logging, so the class keeps its "never fails silently" contract.
			console.error('[vibeoffice] helper is not available (createEditor missing)');
			this.#handleError({ code: 'editor-create-failed' });

			return;
		}

		// Show the loader synchronously across the most expensive first-open phase — the helper's
		// api.js load + SSE handshake inside createEditor. The facade loading states (creating →
		// ready / documentReady) are only wired AFTER the await resolves, so they cannot cover this
		// first phase; drive the loader manually here and hide it once the editor is up.
		this.#showLoader();

		try
		{
			this.editor = await createEditor({
				element: this.elementId,
				openConfig: this.openConfig,
				documentServerEvents: this.#documentServerEvents,
			});
		}
		catch (error)
		{
			// Initial creation failed; surface the reaction without masking diagnostics.
			this.#hideLoader();
			console.error('[vibeoffice] createEditor failed', error);
			this.#handleError(error);

			return;
		}

		this.#subscribeFacadeEvents();

		// Editor is up (api.js loaded, SSE handshaken). A late `documentReady` also hides the
		// loader, but the initial creating → ready transition may have fired before we subscribed
		// above, so hide here too — #hideLoader is idempotent and never leaves the loader hanging.
		this.#hideLoader();

		if (this.isEditMode())
		{
			this.registerTimerToTrackWork();
		}
	}

	#subscribeFacadeEvents(): void
	{
		if (!this.editor)
		{
			return;
		}

		const handlers = {
			documentReady: this.handleDocumentReady.bind(this),
			stateChange: this.handleStateChange.bind(this),
			failover: this.handleFailover.bind(this),
			sessionClosed: this.handleSessionClosed.bind(this),
			error: this.#handleError.bind(this),
		};

		HELPER_EVENTS.forEach((event) => {
			const off = this.editor.on(event, handlers[event]);
			if (Type.isFunction(off))
			{
				this.#unsubscribers.push(off);
			}
		});
	}

	// region [P2.T2] facade event reactions ----------------------------------------------

	handleDocumentReady(): void
	{
		this.#hideLoader();
	}

	handleStateChange(state: string): void
	{
		if (LOADING_STATES.includes(state))
		{
			this.#showLoader();
		}
		else if (state === 'ready')
		{
			this.#hideLoader();
		}
	}

	handleFailover(event: { recovered: boolean }): void
	{
		// The helper already attempted (and possibly completed) recovery on its own. The
		// wrapper only reflects the outcome in the UI — it never touches the platform session.
		if (event && event.recovered === true)
		{
			this.#notify(this.#text('failoverRecovered', 'DISK_EDITOR_VIBEOFFICE_FAILOVER_RECOVERED'), 'success');

			return;
		}

		// A failed recovery is emitted by the helper as error(...) immediately followed by
		// failover({recovered:false}) for the SAME event (helper.umd.cjs cycle()), so #handleError
		// has already surfaced it (terminal messagebox or transient toast). Skip this toast when an
		// error was just shown so the user sees one message, not two. With no preceding error we
		// still notify — never fail silently.
		if (this.#lastErrorNotifiedAt !== null
			&& Date.now() - this.#lastErrorNotifiedAt < FAILOVER_ERROR_DEDUP_WINDOW_MS)
		{
			return;
		}

		this.#notify(this.#text('failoverFailed', 'DISK_EDITOR_VIBEOFFICE_FAILOVER_FAILED'));
	}

	handleSessionClosed(reason: string): void
	{
		switch (reason)
		{
			case SESSION_CLOSED_SAVED:
				// vibeoffice persists versions via webhook (backend), so the onSaved-equivalent
				// is driven by sessionClosed('saved') / documentReady, NOT a pull command.
				this.emitEventOnSaved();
				// A save shows no message here (the host list surfaces its own "saved" balloon
				// via the c_disk pull command, and the view page we land on is itself the
				// confirmation), so there is nothing to let paint: navigate at once instead of
				// holding the user on the finished editor for the message delay. revoked/expired
				// keep the delay because they DO show a message first.
				this.#closeSliderOrDowngradeToView(false);
				break;

			case SESSION_CLOSED_REVOKED:
				// SDD-frontend: revoked → message + downgrade to view / close.
				this.#notify(this.#text('sessionRevoked', 'DISK_EDITOR_VIBEOFFICE_SESSION_REVOKED'));
				this.#closeSliderOrDowngradeToView();
				break;

			case SESSION_CLOSED_EXPIRED:
				// 401/403 from refresh is folded into 'expired' by the helper; no HTTP-code
				// handling needed on the front. Reload after a short delay so the message is seen
				// (an immediate reload would navigate before the toast paints).
				this.#notify(this.#text('sessionExpired', 'DISK_EDITOR_VIBEOFFICE_SESSION_EXPIRED'));
				this.#scheduleNavigation(() => this.#reloadView());
				break;

			default:
				break;
		}
	}

	/**
	 * Single point for error reactions. Maps a `VibeOfficeError.code` (helper types.ts:199-207)
	 * onto a localized, user-facing reaction — never a silent failure. Terminal codes raise a
	 * blocking `ui.dialogs.messagebox`; transient codes (only `sse-degraded`) raise a toast and
	 * let editing continue. An unknown/missing code falls back to a generic terminal message.
	 *
	 * Only the standard UI surfaces (`ui.notification` / `ui.dialogs.messagebox`) are used; no
	 * custom popup class is introduced.
	 */
	#handleError(error: ?Object): void
	{
		console.error('[vibeoffice] error', error);

		const reaction = this.#resolveErrorReaction(error);
		const message = Loc.getMessage(reaction.messageId) || '';

		// Mark that an error was just surfaced so a failover({recovered:false}) fired in the same
		// helper cycle does not double-notify the user (see handleFailover).
		this.#lastErrorNotifiedAt = Date.now();

		if (reaction.terminal)
		{
			this.#showErrorMessageBox(message);
		}
		else
		{
			this.#notify(message);
		}
	}

	// Resolve a `VibeOfficeError` onto its reaction descriptor (code → message + terminal flag).
	// The unit tests assert this mapping via the public `error` event (terminal → messagebox,
	// `sse-degraded`/`refresh-fetch-failed` → toast, unknown/missing code → generic terminal).
	#resolveErrorReaction(error: ?Object): { messageId: string, terminal: boolean }
	{
		const code = error && Type.isStringFilled(error.code) ? error.code : null;

		return (code && ERROR_REACTIONS[code]) ? ERROR_REACTIONS[code] : ERROR_FALLBACK;
	}

	#showErrorMessageBox(message: ?string): void
	{
		if (!Type.isStringFilled(message))
		{
			return;
		}

		// The page shell (template.php) loads `ui.dialogs.messagebox`; access it via the global,
		// mirroring the `BX.UI.Notification` usage in `#notify`. No custom popup is created.
		const MessageBox = BX.UI?.Dialogs?.MessageBox;
		if (MessageBox && Type.isFunction(MessageBox.alert))
		{
			MessageBox.alert(message);

			return;
		}

		// Last-resort fallback so the failure is never swallowed if the extension is missing.
		this.#notify(message);
	}

	// endregion

	// region [FF-V1] document-change tracking (parity with OnlyOffice handleDocumentStateChange) --

	// Native api.js `onDocumentReady` / `onInfo`, forwarded by the helper (neither is reserved).
	// They only timestamp the moment the editor settled so the load-time / co-editing state
	// changes below are not mistaken for a genuine user edit.
	#handleNativeDocumentReady(): void
	{
		this.#caughtDocumentReady = Date.now();
	}

	#handleNativeInfo(): void
	{
		this.#caughtInfoEvent = Date.now();
	}

	// Native api.js `onDocumentStateChange`. Same guard as the OnlyOffice sibling
	// (onlyoffice.js:504-517): ignore changes fired before the editor settled or within 500ms of
	// it (load-time echoes, incoming co-editing deltas), then treat any change as a real edit.
	// Once set, `documentWasChanged` makes handleClose → endEditSession create the "document is
	// being saved" balloon in c_disk.js, which the `vibeoffice` pull command later turns into
	// the "saved" toast; emitEventOnClosed also reports the truthful flag to the hosts.
	#handleDocumentStateChange(): void
	{
		if (this.#caughtDocumentReady === null || this.#caughtInfoEvent === null)
		{
			return;
		}

		if (Date.now() - Math.max(this.#caughtDocumentReady, this.#caughtInfoEvent) < 500)
		{
			return;
		}

		this.documentWasChanged = true;
	}

	// endregion

	// region engine-orthogonal behaviours reused from the OnlyOffice wrapper ---------------

	registerTimerToTrackWork(): void
	{
		this.#trackWorkTimer = setInterval(
			this.#trackWork.bind(this),
			SECONDS_TO_MARK_AS_STILL_WORKING * 1000,
		);
	}

	#trackWork(): void
	{
		// Mirrors the OnlyOffice wrapper's keep-alive: ping the component so the document
		// session is not garbage-collected while the user keeps editing. Requires the
		// `markAsStillWorkingSession` action on the vibeoffice component (backend).
		Ajax.runComponentAction('bitrix:disk.file.editor-vibeoffice', 'markAsStillWorkingSession', {
			mode: 'ajax',
			json: {
				documentSessionId: this.documentSession.id,
				documentSessionHash: this.documentSession.hash,
			},
		}).catch(() => {});
	}

	bindEvents(): void
	{
		const onSliderClose = this.handleSliderClose.bind(this);
		EventEmitter.subscribe('SidePanel.Slider:onClose', onSliderClose);
		this.#unsubscribers.push(() => EventEmitter.unsubscribe('SidePanel.Slider:onClose', onSliderClose));

		const onBeforeUnload = this.handleClose.bind(this);
		EventEmitter.subscribe(window, 'beforeunload', onBeforeUnload);
		this.#unsubscribers.push(() => EventEmitter.unsubscribe(window, 'beforeunload', onBeforeUnload));

		if (window.top !== window)
		{
			const onMessage = (event: MessageEvent) => {
				// Only the same-origin portal parent that hosts this editor iframe legitimately posts
				// 'closeIframe' (disk.onlyoffice-im-integration/create-document.js sends it with
				// targetOrigin '*'); the editor page is served from the portal, so a trusted message
				// carries our own origin. Reject any other origin so a cross-origin frame cannot
				// force-close the editor / end the edit session.
				if (event.origin !== window.location.origin)
				{
					return;
				}

				if (event.data === 'closeIframe')
				{
					this.handleClose();
				}
			};
			EventEmitter.subscribe(window, 'message', onMessage);
			this.#unsubscribers.push(() => EventEmitter.unsubscribe(window, 'message', onMessage));
		}

		this.#bindEditButton();
		this.#bindSharingButton();
	}

	// Wire the header "Edit" button (view mode only). The button and `linkToEdit` are both
	// emitted by the template solely when the user may edit, so empty values are the normal
	// "no edit affordance" case and must be a silent no-op — never a thrown error.
	//
	// Two shapes, parity with the OnlyOffice sibling:
	//  - split button (in-portal editor): the main button opens the current editor in place
	//    (`#navigateToEdit`); every "Open in..." menu sub-item is re-bound to
	//    `#handleClickEditSubItems` so a foreign engine can be launched via runActionEdit;
	//  - plain button (external-link viewer / no menu): a single click runs `#navigateToEdit`.
	#bindEditButton(): void
	{
		const uniqId = this.panelButtonUniqIds?.edit;
		if (!Type.isStringFilled(uniqId) || !Type.isStringFilled(this.linkToEdit))
		{
			return;
		}

		const button = ButtonManager.createByUniqId(uniqId);
		if (!button)
		{
			return;
		}

		// A SplitButton owns a `mainButton`; a plain Button does not. Same probe as OnlyOffice.
		if (Object.prototype.hasOwnProperty.call(button, 'mainButton'))
		{
			// Main button → open the current (vibeoffice) editor in place.
			const mainButton = button.getMainButton();
			const onMainClick = () => {
				this.#navigateToEdit();
			};
			mainButton.bindEvent('click', onMainClick);
			this.#unsubscribers.push(() => mainButton.unbindEvent('click'));

			// Re-point every "Open in..." sub-item onclick at our handler. Rebuilding the item
			// (remove + add with a cloned options object) is the same technique the OnlyOffice
			// wrapper uses, because MenuItem options are frozen after construction.
			const menuWindow = button.getMenuWindow();
			if (menuWindow)
			{
				const menuItems = Runtime.clone(menuWindow.getMenuItems());
				menuItems.forEach((menuItem: MenuItem) => {
					const menuItemOptions = Runtime.clone(menuItem.options);
					menuItemOptions.onclick = this.#handleClickEditSubItems.bind(this);

					menuWindow.removeMenuItem(menuItem.getId());
					menuWindow.addMenuItem(menuItemOptions);
				});
			}

			return;
		}

		// Plain button: `linkToEdit` is a server-built navigable edit URL (no user input spliced
		// in); `#navigateToEdit` performs the view→edit switch (OnlyOffice-parity).
		button.bindEvent('click', () => {
			this.#navigateToEdit();
		});
		this.#unsubscribers.push(() => button.unbindEvent('click'));
	}

	// View→edit switch, mirroring the OnlyOffice sibling (onlyoffice.js:627-666,
	// handleRequestEditRights). Two things must happen before leaving the current view:
	//  (a) set `dontEndCurrentDocumentSession = true` so the beforeunload → handleClose →
	//      endEditSession chain does NOT force-end the view session while it is being upgraded
	//      to an edit session;
	//  (b) inside a slider, close the current slider and re-open `linkToEdit` as a fresh
	//      full-width slider carrying `data.documentEditor` — a bare `document.location` swap
	//      would reuse the old slider's params and drop the editor context.
	// Outside a slider (external-link viewer / standalone page) a plain navigation is correct.
	// `linkToEdit` is a server-built URL; an empty value is the normal "no edit affordance"
	// case and is a silent no-op.
	#navigateToEdit(): void
	{
		if (!Type.isStringFilled(this.linkToEdit))
		{
			return;
		}

		this.dontEndCurrentDocumentSession = true;

		const currentSlider = BX.SidePanel?.Instance?.getSliderByWindow(window);
		if (!currentSlider)
		{
			document.location = this.linkToEdit;

			return;
		}

		const customLeftBoundary = currentSlider.getCustomLeftBoundary();
		currentSlider.close();

		BX.SidePanel.Instance.open(this.linkToEdit, {
			width: '100%',
			customLeftBoundary,
			cacheable: false,
			allowChangeHistory: false,
			data: {
				documentEditor: true,
			},
		});
	}

	// "Open in..." sub-item click. The item id is the document-handler code. The "own" code
	// (EDIT_HERE_SERVICE_CODE) opens the current editor in place; any other code is a foreign
	// engine delegated to BX.Disk.Viewer.Actions.runActionEdit. Guarded so a missing menu item or
	// object is a silent no-op. Parity with the OnlyOffice wrapper.
	async #handleClickEditSubItems(event, menuItem: MenuItem): Promise<void>
	{
		const serviceCode = menuItem?.getId?.();
		if (!Type.isStringFilled(serviceCode))
		{
			return;
		}

		if (serviceCode === EDIT_HERE_SERVICE_CODE)
		{
			this.#navigateToEdit();

			return;
		}

		// `disk.viewer.actions` is only needed on this foreign-engine "Open in..." path, so it is
		// loaded lazily here (mirroring the sharing-popup lazy-load in #handleClickSharing) instead
		// of being pulled into the shell eagerly.
		await Runtime.loadExtension('disk.viewer.actions');

		const runActionEdit = BX.Disk?.Viewer?.Actions?.runActionEdit;
		if (!Type.isFunction(runActionEdit))
		{
			return;
		}

		runActionEdit({
			name: this.object?.name,
			objectId: this.object?.id,
			attachedObjectId: this.attachedObject?.id ?? 0,
			serviceCode,
		});
	}

	// Wire the header "Share by link" button. The button is emitted by the template only when the
	// backend resolved a SHARING_CONTROL_TYPE (and did not disable it for external-link / non-intranet
	// users), so an empty uniqId is the normal "no sharing affordance" case and must be a silent no-op
	// — never a thrown error. Mirrors the OnlyOffice sibling: lazily load `disk.sharing-access-popup`
	// and open `SharingPopupDialog` with this object's id + uniqueCode. The external-link feature gate
	// stays entirely on the backend (getSharingControlType()/shouldDisableSharingButton()), exactly as
	// in the OnlyOffice editor; no per-button blocker dataset is carried over from flipchart.
	#bindSharingButton(): void
	{
		const uniqId = this.panelButtonUniqIds?.setupSharing;
		if (!Type.isStringFilled(uniqId))
		{
			return;
		}

		const button = ButtonManager.createByUniqId(uniqId);
		if (!button)
		{
			return;
		}

		button.bindEvent('click', () => this.#handleClickSharing());
		this.#unsubscribers.push(() => button.unbindEvent('click'));
	}

	#handleClickSharing(): void
	{
		const popupParams = {
			objectId: this.object?.id,
			uniqueCode: this.object?.uniqueCode ?? null,
		};

		// Lazy-load the sharing popup, mirroring the OnlyOffice/flipchart editors. This keeps the
		// dependency out of the editor bundle (loaded only on demand) and out of config.php `rel`.
		Runtime.loadExtension('disk.sharing-access-popup').then(({ SharingPopupDialog }) => {
			const popup = new SharingPopupDialog();
			popup.open(popupParams);
		});
	}

	loadDiskExtensionInTopWindow(): void
	{
		if (window.top !== window && !BX.getClass('window.top.BX.Disk.endEditSession'))
		{
			top.BX.loadExt('disk');
		}
	}

	// The 'Disk.OnlyOffice:*' event names below are the engine-agnostic contract of the hosts
	// (disk/document/editprocess.js, disk.folder.list, disk.documents, c_disk.js): they finalize
	// create/edit flows by listening to these exact names, whichever editor engine rendered the page.
	emitEventOnSaved(): void
	{
		const payload = {
			documentSession: this.documentSession,
			object: this.object,
		};

		const sliderByWindow = BX.SidePanel?.Instance?.getSliderByWindow(window);
		if (sliderByWindow)
		{
			BX.SidePanel.Instance.postMessageAll(window, 'Disk.OnlyOffice:onSaved', payload);
		}

		EventEmitter.emit('Disk.OnlyOffice:onSaved', payload);
	}

	emitEventOnClosed(): void
	{
		let process = 'edit';
		const sliderByWindow = BX.SidePanel?.Instance?.getSliderByWindow(window);
		if (sliderByWindow)
		{
			process = sliderByWindow.getData().get('process') || 'edit';

			BX.SidePanel.Instance.postMessageAll(window, 'Disk.OnlyOffice:onClosed', {
				documentSession: this.documentSession,
				object: this.object,
				process,
				documentWasChanged: this.documentWasChanged,
			});
		}

		EventEmitter.emit('Disk.OnlyOffice:onClosed', {
			documentSession: this.documentSession,
			object: this.object,
			process,
			documentWasChanged: this.documentWasChanged,
		});
	}

	handleSliderClose(event): void
	{
		const currentSlider = BX.SidePanel?.Instance?.getSliderByWindow(window);
		if (!currentSlider)
		{
			return;
		}

		const uid = currentSlider.getData().get('uid');
		const [sliderEvent] = event.getData();
		if (sliderEvent.getSlider().getData().get('uid') !== uid)
		{
			return;
		}

		this.handleClose();
	}

	handleClose(): void
	{
		if (this.#closed)
		{
			return;
		}
		this.#closed = true;

		// Tear down SSE + native editor (helper destroy(); index.ts:183).
		this.destroy();

		this.emitEventOnClosed();

		if (this.dontEndCurrentDocumentSession)
		{
			return;
		}

		top.BX.Disk.endEditSession({
			id: this.documentSession.id,
			hash: this.documentSession.hash,
			documentWasChanged: this.documentWasChanged,
		});
	}

	// endregion

	#renderOnlineBox(): void
	{
		if (!this.userBoxNode || !this.context.currentUser)
		{
			return;
		}

		// Minimal online box seeded with the current user. Live co-editor presence is still out of
		// scope; only the object pull channel below is wired (for the `contentUpdated` view toast).
		this.usersBox = new Users([]);
		this.usersBox.addUser(this.context.currentUser);
		if (!this.userBoxNode.childElementCount)
		{
			this.userBoxNode.appendChild(this.usersBox.getContainer());
		}
	}

	// region object pull channel — live "content updated" notification for an open VIEW -----

	// Subscribe to the existing Disk object pull channel (object_{id}) so a viewer already
	// looking at the document gets a live "modified" toast when another user saves a new
	// version, mirroring the OnlyOffice shell. The backend already emits the `contentUpdated`
	// command from File::uploadVersion(); we only subscribe here. Silent no-op when the shell
	// did not hand a pull config / publicChannel (e.g. pull module unavailable).
	#initPull(): void
	{
		if (!this.isViewMode())
		{
			return;
		}

		if (!this.pullConfig || !this.publicChannel)
		{
			return;
		}

		// Always start a fresh public-channel client with this object's pull config, exactly like
		// the OnlyOffice editor shell. A login session almost always already has a `BX.PULL`
		// (im/notifications) that is NOT listening on this object's public channel (object_{id}),
		// so reusing it would never deliver the `contentUpdated` command. The editor page owns the
		// channel, so replacing `BX.PULL` with a client started from `this.pullConfig` is safe.
		BX.PULL = new PullClient({ skipStorageInit: true });
		BX.PULL.start(this.pullConfig);

		// params-form subscription on the object client we just started. A handler-literal
		// (getModuleId/getSubscriptionType/getMap) is a plain object, so `subscribe()` skips the
		// `attachCommandHandler` branch (emitter.js:95) and falls into the flat params branch with
		// every field undefined — the callback would never fire. The params-form registers the
		// callback under `disk`/`contentUpdated` directly; on emit it receives `data.params`
		// (the `{object, updatedBy}` payload) as its first argument (emitter.js:246-251), which is
		// exactly what `#handleContentUpdated(data)` expects.
		const unsubscribe = BX.PULL.subscribe({
			type: PullClient.SubscriptionType.Server,
			moduleId: 'disk',
			command: 'contentUpdated',
			callback: this.#handleContentUpdated.bind(this),
		});
		this.#unsubscribers.push(unsubscribe);
	}

	// Live host notification that the object got a new version. Three guards, in order:
	//  (1) ignore other objects (the channel is per-object, but be defensive);
	//  (2) ignore our own change (no point telling the editor about their own save);
	//  (3) only act in VIEW mode — our defect is the stale open viewer; edit mode handles its
	//      own concurrency. Then show a toast naming the author with a clickable "Refresh".
	#handleContentUpdated(data: ContentUpdatedMessage): void
	{
		if (!data || !data.object)
		{
			return;
		}

		if (Number(data.object.id) !== Number(this.object?.id))
		{
			return;
		}

		const updatedBy = data.object.updatedBy;
		if (!updatedBy || this.#isCurrentUser(updatedBy))
		{
			return;
		}

		if (!this.isViewMode())
		{
			return;
		}

		const infoToken = data.updatedBy?.infoToken;
		this.#resolveUserName(updatedBy, infoToken).then(
			(userName) => this.#notifyNonActualVersion(data.object.name, userName),
			() => this.#notifyNonActualVersion(data.object.name, null),
		);
	}

	#isCurrentUser(userId: number): boolean
	{
		return Number(this.context.currentUser?.id) === Number(userId);
	}

	// Resolve the author's display name for parity with OnlyOffice (token-gated component
	// action). Rejects instead of throwing (the caller renders a name-less toast), so name
	// resolution never blocks the notification. The cache is read before the guards: they gate
	// issuing a NEW request, not a name already resolved under a token valid at that time.
	#resolveUserName(userId: ?number, infoToken: ?string): Promise<?string>
	{
		const cacheKey = this.#resolveNameCacheKey(userId);
		const cached = this.#userNameCache.get(cacheKey);
		if (cached)
		{
			return cached;
		}

		if (!Type.isStringFilled(infoToken) || this.#badUserInfoAttempts >= 3)
		{
			return Promise.reject();
		}

		const request = new Promise((resolve, reject) => {
			// A failed attempt counts toward the breaker (a stably failing backend stops being
			// re-asked) and drops its cache entry, so a transient failure does not lock the name
			// out for the rest of the viewing session.
			const fail = () => {
				this.#badUserInfoAttempts += 1;
				this.#userNameCache.delete(cacheKey);
				reject();
			};

			Ajax.runComponentAction('bitrix:disk.file.editor-vibeoffice', 'getUserInfo', {
				mode: 'ajax',
				json: {
					documentSessionId: this.documentSession.id,
					documentSessionHash: this.documentSession.hash,
					userId,
					infoToken,
				},
			}).then(
				(response) => {
					if (response.status === 'success' && response.data?.user?.name)
					{
						this.#badUserInfoAttempts = 0;
						resolve(response.data.user.name);

						return;
					}

					fail();
				},
				fail,
			);
		});

		// Cached before the request settles: that is what deduplicates concurrent lookups.
		if (cacheKey !== null)
		{
			this.#userNameCache.set(cacheKey, request);
		}

		return request;
	}

	// Cache slot for an author id, or null when the id is not a positive int: `updatedBy` comes
	// from a pull message, and Number() would collapse every non-numeric value onto one NaN slot
	// shared by unrelated authors. A slot-less id is still requested from the backend.
	#resolveNameCacheKey(userId: ?number): ?number
	{
		const cacheKey = Number(userId);

		return (Number.isInteger(cacheKey) && cacheKey > 0) ? cacheKey : null;
	}

	// Toast with a clickable "Refresh" anchor (matches the OnlyOffice `[data-refresh-btn]`
	// pattern). With an author name → the `#USER_NAME#` variant; without → the no-name variant
	// so the user is still notified when name resolution fails.
	#notifyNonActualVersion(objectName: ?string, userName: ?string): void
	{
		const messageId = Type.isStringFilled(userName)
			? 'DISK_EDITOR_VIBEOFFICE_VIEW_NON_ACTUAL_VERSION'
			: 'DISK_EDITOR_VIBEOFFICE_VIEW_NON_ACTUAL_VERSION_NO_NAME';

		const replacements = { '#NAME#': Text.encode(objectName || '') };
		if (Type.isStringFilled(userName))
		{
			replacements['#USER_NAME#'] = Text.encode(userName);
		}

		const message = Loc.getMessage(messageId, replacements);
		if (!Type.isStringFilled(message))
		{
			return;
		}

		const content = Tag.render`<span>${message}</span>`;
		const refreshButton = content.querySelector('[data-refresh-btn]');
		if (refreshButton)
		{
			Tag.style(refreshButton)`
				cursor: pointer;
			`;
			refreshButton.addEventListener('click', this.#reloadView.bind(this));
		}

		BX.UI?.Notification?.Center?.notify({ content });
	}

	// endregion

	#showLoader(): void
	{
		if (!this.targetNode)
		{
			return;
		}

		if (!this.loader)
		{
			this.loader = new Loader({ target: this.targetNode });
		}
		this.loader.show();
	}

	#hideLoader(): void
	{
		this.loader?.hide();
	}

	// Prefer the text the template handed in `texts`; fall back to the extension's own
	// localization. No user-facing string is ever hardcoded here.
	#text(textKey: string, messageId: string): string
	{
		if (Type.isStringFilled(this.texts[textKey]))
		{
			return this.texts[textKey];
		}

		return Loc.getMessage(messageId) || '';
	}

	#notify(message: ?string, type: ?string = null): void
	{
		if (!Type.isStringFilled(message))
		{
			return;
		}

		BX.UI?.Notification?.Center?.notify({ content: message, autoHideDelay: type === 'success' ? 3000 : 5000 });
	}

	// Reaction to a closed session. Inside a slider we just close it (the host list / caller is
	// behind it). On a standalone page (external link / "open in new window") there is no slider to
	// close, so `#closeSlider`'s old `BX.SidePanel.Instance.close()` was a no-op that left a dead
	// editor on screen — downgrade to the document view instead. This satisfies the SDD requirement
	// (revoked → downgrade to view/close) and keeps `saved` from stranding the user on a finished
	// session.
	//
	// `deferNavigation` gates only the standalone navigation timing: revoked shows a message first,
	// so the navigation is delayed until it paints; saved shows no message, so it navigates at once
	// rather than leaving the user on the finished editor for the (message-only) delay.
	#closeSliderOrDowngradeToView(deferNavigation: boolean = true): void
	{
		const currentSlider = BX.SidePanel?.Instance?.getSliderByWindow(window);
		if (currentSlider)
		{
			currentSlider.close();

			return;
		}

		if (!deferNavigation)
		{
			this.#downgradeToView();

			return;
		}

		// Deferred so a just-shown message (e.g. "access revoked") paints before we navigate.
		this.#scheduleNavigation(() => this.#downgradeToView());
	}

	// Leave the (now closed) editor for the plain document view. Prefer the server-built view URL;
	// fall back to a reload when it is absent so the stale editor is never left in place.
	#downgradeToView(): void
	{
		if (Type.isStringFilled(this.linkToView))
		{
			document.location = this.linkToView;

			return;
		}

		document.location.reload();
	}

	// Run a page-navigating session-close reaction after a short delay so its message is seen
	// first. Single-shot: a second close reason cannot stack another navigation. Cleared on destroy
	// so a torn-down editor never navigates.
	#scheduleNavigation(navigate: () => void): void
	{
		if (this.#pendingNavigationTimer !== null)
		{
			return;
		}

		this.#pendingNavigationTimer = setTimeout(() => {
			this.#pendingNavigationTimer = null;
			navigate();
		}, SESSION_CLOSE_NAVIGATION_DELAY_MS);
	}

	#reloadView(): void
	{
		if (this.isViewMode() && Type.isStringFilled(this.linkToView))
		{
			document.location = this.linkToView;

			return;
		}

		document.location.reload();
	}

	#resolveElementId(element: HTMLElement | string, fallbackNode: ?HTMLElement): ?string
	{
		if (Type.isStringFilled(element))
		{
			return element;
		}

		if (Type.isDomNode(element) && element.id)
		{
			return element.id;
		}

		if (fallbackNode && fallbackNode.id)
		{
			return fallbackNode.id;
		}

		return null;
	}

	isEditMode(): boolean
	{
		return this.openConfig?.config?.editorConfig?.mode === 'edit';
	}

	isViewMode(): boolean
	{
		return !this.isEditMode();
	}

	getEditor(): ?VibeOfficeEditor
	{
		return this.editor;
	}

	destroy(): void
	{
		if (this.#trackWorkTimer !== null)
		{
			clearInterval(this.#trackWorkTimer);
			this.#trackWorkTimer = null;
		}

		if (this.#pendingNavigationTimer !== null)
		{
			clearTimeout(this.#pendingNavigationTimer);
			this.#pendingNavigationTimer = null;
		}

		this.#unsubscribers.forEach((off) => {
			try
			{
				off();
			}
			catch (e)
			{
				// best-effort teardown
			}
		});
		this.#unsubscribers = [];

		this.#userNameCache.clear();

		this.#hideLoader();

		if (this.editor)
		{
			this.editor.destroy();
			this.editor = null;
		}
	}
}
