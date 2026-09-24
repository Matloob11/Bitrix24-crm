/* eslint-disable */
this.BX = this.BX || {};
this.BX.Disk = this.BX.Disk || {};
(function (exports, main_core, main_core_events, main_loader, ui_buttons, pull_client, disk_users) {
	'use strict';

	var helper_umd$1 = {exports: {}};

	var helper_umd = helper_umd$1.exports;

	var hasRequiredHelper_umd;

	function requireHelper_umd () {
		if (hasRequiredHelper_umd) return helper_umd$1.exports;
		hasRequiredHelper_umd = 1;
		(function (module, exports) {
			(function(f,m){m(exports);})(helper_umd,function(f){class m{constructor(){this.listeners=new Map;}on(e,t){let s=this.listeners.get(e);return s||(s=new Set,this.listeners.set(e,s)),s.add(t),()=>{var i;(i=this.listeners.get(e))==null||i.delete(t);}}emit(e,...t){const s=this.listeners.get(e);if(s)for(const i of [...s])try{i(...t);}catch{}}clear(){this.listeners.clear();}}const g={fetchTimeoutMs:1e4,fetchRetries:3,refreshFileTimeoutMs:15e3,recreateTimeoutMs:3e4,createReadyTimeoutMs:6e4};class a extends Error{constructor(e,t,s){super(t??e,s!==void 0?{cause:s}:void 0),this.name="VibeOfficeError",this.code=e,Object.setPrototypeOf(this,a.prototype);}}const w="vibeoffice-ds-api-js",E=3e4;function _(r){if(typeof window>"u"||typeof document>"u")return Promise.reject(new a("api-js-load-failed","no DOM environment"));if(window.DocsAPI)return Promise.resolve(window.DocsAPI);const e=window,t=e.__vibeofficeApiJsPromise;if(t)return t;const s=new Promise((i,n)=>{const d=()=>{window.DocsAPI?i(window.DocsAPI):n(new a("api-js-load-failed","api.js loaded but window.DocsAPI is undefined"));},l=u=>{delete e.__vibeofficeApiJsPromise,n(new a("api-js-load-failed",`failed to load ${r}`,u));},o=document.getElementById(w);if(o){const u=setTimeout(()=>{l(new a("api-js-load-failed",`existing <script id="${w}"> did not become ready within ${E}ms`));},E);o.addEventListener("load",()=>{clearTimeout(u),d();},{once:true}),o.addEventListener("error",v=>{clearTimeout(u),l(v);},{once:true});return}const h=document.createElement("script");h.id=w,h.type="text/javascript",h.async=true,h.src=r,h.addEventListener("load",d,{once:true}),h.addEventListener("error",l,{once:true}),document.head.appendChild(h);});return e.__vibeofficeApiJsPromise=s,s}const F=new Set(["onAppReady","onDocumentReady","onError","onRequestRefreshFile"]);class I{constructor(e,t,s){this.element=e,this.documentServerEvents=t,this.hooks=s,this.instanceRef=null,this.waiter=null,typeof this.documentServerEvents.onOutdatedVersion=="function"&&console.warn("[vibeoffice] onOutdatedVersion is deprecated and not supported; recovery is driven via onRequestRefreshFile. Handler ignored.");}get instance(){return this.instanceRef}async create(e,t){const s=await _(t),i=this.buildConfig(e);try{this.instanceRef=new s.DocEditor(this.element,i);}catch(n){throw new a("editor-create-failed","new DocsAPI.DocEditor threw",n)}}recreate(e,t){return this.destroyInstance(),this.create(e,t)}refreshFile(e){if(!this.instanceRef)throw new a("recovery-failed","no live instance for refreshFile");this.instanceRef.refreshFile(e);}waitForStep(e){return new Promise((t,s)=>{const i=setTimeout(()=>{this.waiter===d&&(this.waiter=null),s(new a("recovery-failed","step timed out"));},e),n=l=>{clearTimeout(i),this.waiter===d&&(this.waiter=null),l();},d={onReady:()=>n(t),onError:l=>n(()=>s(new a("recovery-failed","onError during step",l))),cancel:()=>n(t)};this.waiter=d;})}cancelStep(){var e;(e=this.waiter)==null||e.cancel();}destroyInstance(){if(this.instanceRef){try{this.instanceRef.destroyEditor();}catch{}this.instanceRef=null;}}buildConfig(e){const t={};for(const[i,n]of Object.entries(this.documentServerEvents))i!=="onOutdatedVersion"&&(F.has(i)||(t[i]=n));const s=this.documentServerEvents;return t.onAppReady=i=>{var n;(n=s.onAppReady)==null||n.call(s,i);},t.onDocumentReady=i=>{var d;const n=this.waiter;n?n.onReady():this.hooks.onIdleDocumentReady(),(d=s.onDocumentReady)==null||d.call(s,i);},t.onError=i=>{var d;const n=this.waiter;n?n.onError(i.data):this.hooks.onIdleError(i.data),(d=s.onError)==null||d.call(s,i);},t.onRequestRefreshFile=i=>{var n;this.hooks.onRequestRefreshFile(),(n=s.onRequestRefreshFile)==null||n.call(s,i);},{...e,events:t}}}function S(r,e){const t=new a("refresh-fetch-failed",r);return t.retryable=e,t}class y extends a{constructor(e,t){super("session-dead",e,t),this.name="SessionDeadError",Object.setPrototypeOf(this,y.prototype);}}function R(r){var t;if(!r||typeof r!="object")throw new a("invalid-open-config","openConfig is not an object");const e=r.urls;if(!e||!e.api_js||!e.events||!e.refresh)throw new a("invalid-open-config","openConfig.urls incomplete");if(!r.vo_sess)throw new a("invalid-open-config","openConfig.vo_sess missing");if(!r.session_id||!r.doc_id||!r.editor_key)throw new a("invalid-open-config","openConfig identity fields missing");if(!r.config||typeof r.config!="object")throw new a("invalid-open-config","openConfig.config missing");if(((t=r.config.document)==null?void 0:t.key)!==r.editor_key)throw new a("invalid-open-config","config.document.key != editor_key");return {docId:r.doc_id,sessionId:r.session_id,editorKey:r.editor_key,rev:r.rev,voSess:r.vo_sess,apiJsUrl:e.api_js,eventsUrl:e.events,refreshUrl:e.refresh,config:r.config}}function C(r,e,t){const s={...r,vo_sess:e},i=R(s);return t?i.refreshUrl=t:i.refreshUrl=s.urls.refresh,i}function b(r,e){const t=r.includes("?");return /[?&]vo_sess=/.test(r)?r:`${r}${t?"&":"?"}vo_sess=${encodeURIComponent(e)}`}const D=r=>new Promise(e=>setTimeout(e,r));async function O(r,e,t){const s=b(r,e);let i;for(let n=0;n<=t.retries;n++){if(n>0){const o=1e3*2**(n-1)+Math.floor(Math.random()*500);await D(o);}const d=new AbortController,l=setTimeout(()=>d.abort(),t.timeoutMs);try{const o=await fetch(s,{method:"GET",signal:d.signal,credentials:"omit",headers:{accept:"application/json"}});if(o.status===401||o.status===403)throw new y(`refresh_url returned ${o.status}`);if(o.status===409||o.status>=500){i=S(`refresh_url returned ${o.status}`,!0);continue}if(!o.ok)throw S(`refresh_url returned ${o.status}`,!1);return await o.json()}catch(o){if(o instanceof y||o instanceof a&&o.code==="refresh-fetch-failed"&&o.retryable===false)throw o;i=o;}finally{clearTimeout(l);}}throw new a("refresh-fetch-failed","refresh_url exhausted retries",i)}function A(r){const e={...r};return delete e.events,delete e.documentType,delete e.type,e}class U{constructor(e,t,s,i){this.host=e,this.cb=t,this.timeouts=s,this.apiJsUrlForRecreate=i,this.inFlight=false,this.dirty=null;}recover(e){if(this.cb.getState()!=="closed"){if(this.inFlight){this.dirty=e;return}this.run(e);}}async run(e){this.inFlight=true;try{await this.cycle(e);}finally{this.inFlight=false;const t=this.dirty;this.dirty=null,t&&this.cb.getState()!=="closed"&&(t.expectedEditorKey===void 0||t.expectedEditorKey!==this.cb.getModel().editorKey)&&this.run(t);}}async cycle(e){const t=this.cb.getModel();this.cb.setState("refreshing");let s;try{const i=await O(e.refreshUrlOverride??t.refreshUrl,t.voSess,{timeoutMs:this.timeouts.fetchTimeoutMs,retries:this.timeouts.fetchRetries});s=C(i,t.voSess,e.refreshUrlOverride);}catch(i){if(i instanceof y){this.cb.setState("closed"),this.cb.emitSessionClosed("expired");return}this.cb.setState("error");const n=i instanceof a?i:new a("recovery-failed","fetch failed",i);this.cb.emitError(n),this.cb.emitFailover({recovered:false,method:null,trigger:e.trigger,reason:e.reason,editorKey:t.editorKey});return}if(s.editorKey===t.editorKey){this.cb.setState("ready");return}try{const i=this.host.waitForStep(this.timeouts.refreshFileTimeoutMs);try{this.host.refreshFile(A(s.config));}catch(n){throw this.host.cancelStep(),await i,n}await i,this.succeed(s,"refreshFile",e);return}catch{}this.cb.setState("recreating");try{const i=this.host.waitForStep(this.timeouts.recreateTimeoutMs);await this.host.recreate(s.config,this.apiJsUrlForRecreate()),await i,this.succeed(s,"recreate",e);return}catch(i){this.cb.setState("error"),this.cb.emitError(i instanceof a?i:new a("recovery-failed","recreate failed",i)),this.cb.emitFailover({recovered:false,method:null,trigger:e.trigger,reason:e.reason,editorKey:s.editorKey});}}succeed(e,t,s){this.cb.setModel(e),this.cb.setState("ready"),this.cb.emitDocumentReady(),this.cb.emitFailover({recovered:true,method:t,trigger:s.trigger,reason:s.reason,editorKey:e.editorKey});}}const M=256,P=3e4,k=5,j=1e3,K=r=>new EventSource(r);class L{constructor(e,t,s,i=K){this.cb=s,this.factory=i,this.es=null,this.closedByUs=false,this.reconnectAttempt=0,this.consecutiveInstantCloses=0,this.degradedEmitted=false,this.lastOpenAt=0,this.reconnectTimer=null,this.seenIds=new Set,this.seenQueue=[],this.url=b(e,t);}start(){this.closedByUs=false,this.connect();}close(){this.closedByUs=true,this.reconnectTimer!==null&&(clearTimeout(this.reconnectTimer),this.reconnectTimer=null),this.es&&(this.es.close(),this.es=null);}connect(){let e;try{e=this.factory(this.url);}catch{this.es=null,this.markInstantClose(),this.scheduleReconnect();return}this.es=e,this.lastOpenAt=0,e.addEventListener("open",()=>{this.lastOpenAt=Date.now(),this.reconnectAttempt=0;}),e.addEventListener("hello",t=>{const s=this.parseDeduped(t);s!==void 0&&this.cb.onHello(s);}),e.addEventListener("session-refresh",t=>{const s=t.lastEventId??"",i=this.parseDeduped(t);i!==void 0&&this.cb.onSessionRefresh(i,s);}),e.addEventListener("session-closed",t=>{const s=this.parseDeduped(t);s!==void 0&&(this.closedByUs=true,this.cb.onSessionClosed(s),this.es&&(this.es.close(),this.es=null));}),e.addEventListener("error",()=>{this.onError();});}parseDeduped(e){const t=e,s=t.lastEventId;if(s){if(this.seenIds.has(s))return;this.remember(s);}try{return JSON.parse(t.data)}catch{return}}remember(e){if(this.seenIds.add(e),this.seenQueue.push(e),this.seenQueue.length>M){const t=this.seenQueue.shift();t!==void 0&&this.seenIds.delete(t);}}onError(){if(this.closedByUs)return;const e=this.es;if(!e||e.readyState!==EventSource.CLOSED)return;const t=this.lastOpenAt>0?Date.now()-this.lastOpenAt:0;this.lastOpenAt===0||t<j?this.markInstantClose():(this.consecutiveInstantCloses=0,this.degradedEmitted=false),e.close(),this.es=null,this.scheduleReconnect();}markInstantClose(){this.consecutiveInstantCloses++,this.consecutiveInstantCloses>=k&&!this.degradedEmitted&&(this.degradedEmitted=true,this.cb.onDegraded());}scheduleReconnect(){if(this.closedByUs)return;const e=Math.min(1e3*2**this.reconnectAttempt,P);this.reconnectAttempt++,this.reconnectTimer=setTimeout(()=>{this.reconnectTimer=null,this.closedByUs||this.connect();},e);}}const T=Symbol("vibeoffice.eventSourceFactory");function V(r){return r[T]}async function B(r){const e=R(r.openConfig),t={...g,...r.timeouts??{}};let s=e,i="loading";const n=new m,d=c=>{if(c===i)return;const p=i;i=c,n.emit("stateChange",c,p);},l={onRequestRefreshFile:()=>{h.recover({trigger:"ds-request"});},onIdleError:c=>{n.emit("error",new a("ds-error","api.js onError",c));},onIdleDocumentReady:()=>{n.emit("documentReady");}},o=new I(r.element,r.documentServerEvents??{},l),h=new U(o,{getModel:()=>s,setModel:c=>{s=c;},setState:c=>d(c),getState:()=>i,emitFailover:c=>n.emit("failover",c),emitDocumentReady:()=>n.emit("documentReady"),emitError:c=>n.emit("error",c),emitSessionClosed:c=>{u.close(),n.emit("sessionClosed",c);}},t,()=>s.apiJsUrl),u=new L(s.eventsUrl,s.voSess,{onHello:c=>{i!=="closed"&&c.editor_key!==s.editorKey&&h.recover({trigger:"hello-mismatch",expectedEditorKey:c.editor_key});},onSessionRefresh:c=>{i!=="closed"&&h.recover({trigger:"session-refresh",reason:c.reason,refreshUrlOverride:c.refresh_url,expectedEditorKey:c.editor_key});},onSessionClosed:c=>{d("closed"),n.emit("sessionClosed",c.reason);},onDegraded:()=>{n.emit("error",new a("sse-degraded","SSE channel degraded"));}},V(r));d("creating");const v=o.waitForStep(t.createReadyTimeoutMs);try{await o.create(s.config,s.apiJsUrl),await v;}catch(c){throw o.cancelStep(),d("error"),c instanceof a?c:new a("editor-create-failed","failed to create editor",c)}return d("ready"),u.start(),{get state(){return i},get editorKey(){return s.editorKey},get instance(){return o.instance},on(c,p){return n.on(c,p)},destroy(){u.close(),o.cancelStep(),o.destroyInstance(),d("closed"),n.clear();}}}f.DEFAULT_TIMEOUTS=g,f.EVENT_SOURCE_FACTORY=T,f.VibeOfficeError=a,f.createEditor=B,Object.defineProperty(f,Symbol.toStringTag,{value:"Module"});});
			
		} (helper_umd$1, helper_umd$1.exports));
		return helper_umd$1.exports;
	}

	var helper_umdExports = requireHelper_umd();

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
		'api-js-load-failed': {
			messageId: 'DISK_EDITOR_VIBEOFFICE_ERR_API_JS_LOAD_FAILED',
			terminal: true
		},
		'editor-create-failed': {
			messageId: 'DISK_EDITOR_VIBEOFFICE_ERR_EDITOR_CREATE_FAILED',
			terminal: true
		},
		'invalid-open-config': {
			messageId: 'DISK_EDITOR_VIBEOFFICE_ERR_INVALID_OPEN_CONFIG',
			terminal: true
		},
		'refresh-fetch-failed': {
			messageId: 'DISK_EDITOR_VIBEOFFICE_ERR_REFRESH_FETCH_FAILED',
			terminal: false
		},
		'session-dead': {
			messageId: 'DISK_EDITOR_VIBEOFFICE_ERR_SESSION_DEAD',
			terminal: true
		},
		'sse-degraded': {
			messageId: 'DISK_EDITOR_VIBEOFFICE_ERR_SSE_DEGRADED',
			terminal: false
		},
		'recovery-failed': {
			messageId: 'DISK_EDITOR_VIBEOFFICE_ERR_RECOVERY_FAILED',
			terminal: true
		},
		'ds-error': {
			messageId: 'DISK_EDITOR_VIBEOFFICE_ERR_DS_ERROR',
			terminal: true
		}
	};

	// Fallback for an unknown / missing code: still surfaced (never silent), and treated as terminal.
	const ERROR_FALLBACK = {
		messageId: 'DISK_EDITOR_VIBEOFFICE_ERR_GENERIC',
		terminal: true
	};

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
	class Vibeoffice {
		// `@vibeoffice/helper` API, injected by index.js after the vendored UMD runs. Static so a
		// single capture serves every instance; tests can override it.
		static #helper = null;
		static setHelper(helper) {
			Vibeoffice.#helper = helper;
		}
		static getHelper() {
			return Vibeoffice.#helper;
		}
		openConfig = null;
		documentSession = null;
		object = null;
		attachedObject = null;
		context = null;
		targetNode = null;
		editorNode = null;
		userBoxNode = null;
		elementId = null;
		linkToView = null;
		linkToEdit = null;
		linkToDownload = null;
		panelButtonUniqIds = null;
		historyEnabled = false;
		texts = {};
		pullConfig = null;
		publicChannel = null;
		editor = null;
		usersBox = null;
		loader = null;
		documentWasChanged = false;
		dontEndCurrentDocumentSession = false;
		#unsubscribers = [];
		#trackWorkTimer = null;
		#documentServerEvents = {};
		// Only a real server answer resets this; cache hits issue no request and leave it untouched.
		#badUserInfoAttempts = 0;
		// Author display names resolved through getUserInfo, keyed by userId (the response depends on
		// the user alone - infoToken only authorizes the call). The promise is cached, not the value,
		// so events arriving while a request is in flight join it instead of firing their own.
		#userNameCache = new Map();
		// Timestamps of the native "editor settled" events, used to gate document-change tracking
		// (see #handleDocumentStateChange). Parity with the OnlyOffice sibling.
		#caughtDocumentReady = null;
		#caughtInfoEvent = null;
		// When #handleError last surfaced a reaction to the user. The helper emits error(...) THEN
		// failover({recovered:false}) for the same recovery failure (helper.umd.cjs), so handleFailover
		// uses this to suppress its duplicate toast.
		#lastErrorNotifiedAt = null;
		// Pending deferred session-close navigation (expired reload / standalone downgrade-to-view),
		// cleared on destroy so it never navigates a torn-down editor.
		#pendingNavigationTimer = null;
		// Idempotency guard for handleClose(): three independent sources (SidePanel.Slider:onClose,
		// beforeunload, postMessage 'closeIframe') can all fire it, but the teardown / endEditSession
		// must run once. Never reset (a new wrapper is a new instance).
		#closed = false;
		constructor(editorOptions) {
			const options = main_core.Type.isPlainObject(editorOptions) ? editorOptions : {};
			this.openConfig = options.openConfig;
			this.documentSession = options.documentSession;
			this.object = options.object || {};
			this.attachedObject = options.attachedObject || {
				id: null
			};
			this.targetNode = options.targetNode;
			this.editorNode = options.editorNode;
			this.userBoxNode = options.userBoxNode;
			this.linkToView = options.linkToView;
			this.linkToEdit = options.linkToEdit;
			this.linkToDownload = options.linkToDownload;
			this.panelButtonUniqIds = main_core.Type.isPlainObject(options.panelButtonUniqIds) ? options.panelButtonUniqIds : null;
			this.historyEnabled = options.historyEnabled === true;
			this.texts = options.texts || {};
			this.pullConfig = options.pullConfig || null;
			this.publicChannel = main_core.Type.isStringFilled(options.publicChannel) ? options.publicChannel : null;
			this.context = {
				currentUser: options.currentUser,
				documentSession: this.documentSession,
				object: this.object,
				attachedObject: this.attachedObject
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
				onDocumentStateChange: this.#handleDocumentStateChange.bind(this)
			};
			this.#renderOnlineBox();
			this.loadDiskExtensionInTopWindow();
			this.bindEvents();
			this.#initPull();
			void this.#createEditor();
		}
		async #createEditor() {
			const createEditor = Vibeoffice.#helper?.createEditor;
			if (!main_core.Type.isFunction(createEditor)) {
				// The vendored helper UMD must have run (index.js side-effect import). If it did not,
				// the editor can never be created — surface the terminal reaction rather than only
				// logging, so the class keeps its "never fails silently" contract.
				console.error('[vibeoffice] helper is not available (createEditor missing)');
				this.#handleError({
					code: 'editor-create-failed'
				});
				return;
			}

			// Show the loader synchronously across the most expensive first-open phase — the helper's
			// api.js load + SSE handshake inside createEditor. The facade loading states (creating →
			// ready / documentReady) are only wired AFTER the await resolves, so they cannot cover this
			// first phase; drive the loader manually here and hide it once the editor is up.
			this.#showLoader();
			try {
				this.editor = await createEditor({
					element: this.elementId,
					openConfig: this.openConfig,
					documentServerEvents: this.#documentServerEvents
				});
			} catch (error) {
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
			if (this.isEditMode()) {
				this.registerTimerToTrackWork();
			}
		}
		#subscribeFacadeEvents() {
			if (!this.editor) {
				return;
			}
			const handlers = {
				documentReady: this.handleDocumentReady.bind(this),
				stateChange: this.handleStateChange.bind(this),
				failover: this.handleFailover.bind(this),
				sessionClosed: this.handleSessionClosed.bind(this),
				error: this.#handleError.bind(this)
			};
			HELPER_EVENTS.forEach(event => {
				const off = this.editor.on(event, handlers[event]);
				if (main_core.Type.isFunction(off)) {
					this.#unsubscribers.push(off);
				}
			});
		}

		// region [P2.T2] facade event reactions ----------------------------------------------

		handleDocumentReady() {
			this.#hideLoader();
		}
		handleStateChange(state) {
			if (LOADING_STATES.includes(state)) {
				this.#showLoader();
			} else if (state === 'ready') {
				this.#hideLoader();
			}
		}
		handleFailover(event) {
			// The helper already attempted (and possibly completed) recovery on its own. The
			// wrapper only reflects the outcome in the UI — it never touches the platform session.
			if (event && event.recovered === true) {
				this.#notify(this.#text('failoverRecovered', 'DISK_EDITOR_VIBEOFFICE_FAILOVER_RECOVERED'), 'success');
				return;
			}

			// A failed recovery is emitted by the helper as error(...) immediately followed by
			// failover({recovered:false}) for the SAME event (helper.umd.cjs cycle()), so #handleError
			// has already surfaced it (terminal messagebox or transient toast). Skip this toast when an
			// error was just shown so the user sees one message, not two. With no preceding error we
			// still notify — never fail silently.
			if (this.#lastErrorNotifiedAt !== null && Date.now() - this.#lastErrorNotifiedAt < FAILOVER_ERROR_DEDUP_WINDOW_MS) {
				return;
			}
			this.#notify(this.#text('failoverFailed', 'DISK_EDITOR_VIBEOFFICE_FAILOVER_FAILED'));
		}
		handleSessionClosed(reason) {
			switch (reason) {
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
		#handleError(error) {
			console.error('[vibeoffice] error', error);
			const reaction = this.#resolveErrorReaction(error);
			const message = main_core.Loc.getMessage(reaction.messageId) || '';

			// Mark that an error was just surfaced so a failover({recovered:false}) fired in the same
			// helper cycle does not double-notify the user (see handleFailover).
			this.#lastErrorNotifiedAt = Date.now();
			if (reaction.terminal) {
				this.#showErrorMessageBox(message);
			} else {
				this.#notify(message);
			}
		}

		// Resolve a `VibeOfficeError` onto its reaction descriptor (code → message + terminal flag).
		// The unit tests assert this mapping via the public `error` event (terminal → messagebox,
		// `sse-degraded`/`refresh-fetch-failed` → toast, unknown/missing code → generic terminal).
		#resolveErrorReaction(error) {
			const code = error && main_core.Type.isStringFilled(error.code) ? error.code : null;
			return code && ERROR_REACTIONS[code] ? ERROR_REACTIONS[code] : ERROR_FALLBACK;
		}
		#showErrorMessageBox(message) {
			if (!main_core.Type.isStringFilled(message)) {
				return;
			}

			// The page shell (template.php) loads `ui.dialogs.messagebox`; access it via the global,
			// mirroring the `BX.UI.Notification` usage in `#notify`. No custom popup is created.
			const MessageBox = BX.UI?.Dialogs?.MessageBox;
			if (MessageBox && main_core.Type.isFunction(MessageBox.alert)) {
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
		#handleNativeDocumentReady() {
			this.#caughtDocumentReady = Date.now();
		}
		#handleNativeInfo() {
			this.#caughtInfoEvent = Date.now();
		}

		// Native api.js `onDocumentStateChange`. Same guard as the OnlyOffice sibling
		// (onlyoffice.js:504-517): ignore changes fired before the editor settled or within 500ms of
		// it (load-time echoes, incoming co-editing deltas), then treat any change as a real edit.
		// Once set, `documentWasChanged` makes handleClose → endEditSession create the "document is
		// being saved" balloon in c_disk.js, which the `vibeoffice` pull command later turns into
		// the "saved" toast; emitEventOnClosed also reports the truthful flag to the hosts.
		#handleDocumentStateChange() {
			if (this.#caughtDocumentReady === null || this.#caughtInfoEvent === null) {
				return;
			}
			if (Date.now() - Math.max(this.#caughtDocumentReady, this.#caughtInfoEvent) < 500) {
				return;
			}
			this.documentWasChanged = true;
		}

		// endregion

		// region engine-orthogonal behaviours reused from the OnlyOffice wrapper ---------------

		registerTimerToTrackWork() {
			this.#trackWorkTimer = setInterval(this.#trackWork.bind(this), SECONDS_TO_MARK_AS_STILL_WORKING * 1000);
		}
		#trackWork() {
			// Mirrors the OnlyOffice wrapper's keep-alive: ping the component so the document
			// session is not garbage-collected while the user keeps editing. Requires the
			// `markAsStillWorkingSession` action on the vibeoffice component (backend).
			main_core.ajax.runComponentAction('bitrix:disk.file.editor-vibeoffice', 'markAsStillWorkingSession', {
				mode: 'ajax',
				json: {
					documentSessionId: this.documentSession.id,
					documentSessionHash: this.documentSession.hash
				}
			}).catch(() => {});
		}
		bindEvents() {
			const onSliderClose = this.handleSliderClose.bind(this);
			main_core_events.EventEmitter.subscribe('SidePanel.Slider:onClose', onSliderClose);
			this.#unsubscribers.push(() => main_core_events.EventEmitter.unsubscribe('SidePanel.Slider:onClose', onSliderClose));
			const onBeforeUnload = this.handleClose.bind(this);
			main_core_events.EventEmitter.subscribe(window, 'beforeunload', onBeforeUnload);
			this.#unsubscribers.push(() => main_core_events.EventEmitter.unsubscribe(window, 'beforeunload', onBeforeUnload));
			if (window.top !== window) {
				const onMessage = event => {
					// Only the same-origin portal parent that hosts this editor iframe legitimately posts
					// 'closeIframe' (disk.onlyoffice-im-integration/create-document.js sends it with
					// targetOrigin '*'); the editor page is served from the portal, so a trusted message
					// carries our own origin. Reject any other origin so a cross-origin frame cannot
					// force-close the editor / end the edit session.
					if (event.origin !== window.location.origin) {
						return;
					}
					if (event.data === 'closeIframe') {
						this.handleClose();
					}
				};
				main_core_events.EventEmitter.subscribe(window, 'message', onMessage);
				this.#unsubscribers.push(() => main_core_events.EventEmitter.unsubscribe(window, 'message', onMessage));
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
		#bindEditButton() {
			const uniqId = this.panelButtonUniqIds?.edit;
			if (!main_core.Type.isStringFilled(uniqId) || !main_core.Type.isStringFilled(this.linkToEdit)) {
				return;
			}
			const button = ui_buttons.ButtonManager.createByUniqId(uniqId);
			if (!button) {
				return;
			}

			// A SplitButton owns a `mainButton`; a plain Button does not. Same probe as OnlyOffice.
			if (Object.prototype.hasOwnProperty.call(button, 'mainButton')) {
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
				if (menuWindow) {
					const menuItems = main_core.Runtime.clone(menuWindow.getMenuItems());
					menuItems.forEach(menuItem => {
						const menuItemOptions = main_core.Runtime.clone(menuItem.options);
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
		#navigateToEdit() {
			if (!main_core.Type.isStringFilled(this.linkToEdit)) {
				return;
			}
			this.dontEndCurrentDocumentSession = true;
			const currentSlider = BX.SidePanel?.Instance?.getSliderByWindow(window);
			if (!currentSlider) {
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
					documentEditor: true
				}
			});
		}

		// "Open in..." sub-item click. The item id is the document-handler code. The "own" code
		// (EDIT_HERE_SERVICE_CODE) opens the current editor in place; any other code is a foreign
		// engine delegated to BX.Disk.Viewer.Actions.runActionEdit. Guarded so a missing menu item or
		// object is a silent no-op. Parity with the OnlyOffice wrapper.
		async #handleClickEditSubItems(event, menuItem) {
			const serviceCode = menuItem?.getId?.();
			if (!main_core.Type.isStringFilled(serviceCode)) {
				return;
			}
			if (serviceCode === EDIT_HERE_SERVICE_CODE) {
				this.#navigateToEdit();
				return;
			}

			// `disk.viewer.actions` is only needed on this foreign-engine "Open in..." path, so it is
			// loaded lazily here (mirroring the sharing-popup lazy-load in #handleClickSharing) instead
			// of being pulled into the shell eagerly.
			await main_core.Runtime.loadExtension('disk.viewer.actions');
			const runActionEdit = BX.Disk?.Viewer?.Actions?.runActionEdit;
			if (!main_core.Type.isFunction(runActionEdit)) {
				return;
			}
			runActionEdit({
				name: this.object?.name,
				objectId: this.object?.id,
				attachedObjectId: this.attachedObject?.id ?? 0,
				serviceCode
			});
		}

		// Wire the header "Share by link" button. The button is emitted by the template only when the
		// backend resolved a SHARING_CONTROL_TYPE (and did not disable it for external-link / non-intranet
		// users), so an empty uniqId is the normal "no sharing affordance" case and must be a silent no-op
		// — never a thrown error. Mirrors the OnlyOffice sibling: lazily load `disk.sharing-access-popup`
		// and open `SharingPopupDialog` with this object's id + uniqueCode. The external-link feature gate
		// stays entirely on the backend (getSharingControlType()/shouldDisableSharingButton()), exactly as
		// in the OnlyOffice editor; no per-button blocker dataset is carried over from flipchart.
		#bindSharingButton() {
			const uniqId = this.panelButtonUniqIds?.setupSharing;
			if (!main_core.Type.isStringFilled(uniqId)) {
				return;
			}
			const button = ui_buttons.ButtonManager.createByUniqId(uniqId);
			if (!button) {
				return;
			}
			button.bindEvent('click', () => this.#handleClickSharing());
			this.#unsubscribers.push(() => button.unbindEvent('click'));
		}
		#handleClickSharing() {
			const popupParams = {
				objectId: this.object?.id,
				uniqueCode: this.object?.uniqueCode ?? null
			};

			// Lazy-load the sharing popup, mirroring the OnlyOffice/flipchart editors. This keeps the
			// dependency out of the editor bundle (loaded only on demand) and out of config.php `rel`.
			main_core.Runtime.loadExtension('disk.sharing-access-popup').then(({
				SharingPopupDialog
			}) => {
				const popup = new SharingPopupDialog();
				popup.open(popupParams);
			});
		}
		loadDiskExtensionInTopWindow() {
			if (window.top !== window && !BX.getClass('window.top.BX.Disk.endEditSession')) {
				top.BX.loadExt('disk');
			}
		}

		// The 'Disk.OnlyOffice:*' event names below are the engine-agnostic contract of the hosts
		// (disk/document/editprocess.js, disk.folder.list, disk.documents, c_disk.js): they finalize
		// create/edit flows by listening to these exact names, whichever editor engine rendered the page.
		emitEventOnSaved() {
			const payload = {
				documentSession: this.documentSession,
				object: this.object
			};
			const sliderByWindow = BX.SidePanel?.Instance?.getSliderByWindow(window);
			if (sliderByWindow) {
				BX.SidePanel.Instance.postMessageAll(window, 'Disk.OnlyOffice:onSaved', payload);
			}
			main_core_events.EventEmitter.emit('Disk.OnlyOffice:onSaved', payload);
		}
		emitEventOnClosed() {
			let process = 'edit';
			const sliderByWindow = BX.SidePanel?.Instance?.getSliderByWindow(window);
			if (sliderByWindow) {
				process = sliderByWindow.getData().get('process') || 'edit';
				BX.SidePanel.Instance.postMessageAll(window, 'Disk.OnlyOffice:onClosed', {
					documentSession: this.documentSession,
					object: this.object,
					process,
					documentWasChanged: this.documentWasChanged
				});
			}
			main_core_events.EventEmitter.emit('Disk.OnlyOffice:onClosed', {
				documentSession: this.documentSession,
				object: this.object,
				process,
				documentWasChanged: this.documentWasChanged
			});
		}
		handleSliderClose(event) {
			const currentSlider = BX.SidePanel?.Instance?.getSliderByWindow(window);
			if (!currentSlider) {
				return;
			}
			const uid = currentSlider.getData().get('uid');
			const [sliderEvent] = event.getData();
			if (sliderEvent.getSlider().getData().get('uid') !== uid) {
				return;
			}
			this.handleClose();
		}
		handleClose() {
			if (this.#closed) {
				return;
			}
			this.#closed = true;

			// Tear down SSE + native editor (helper destroy(); index.ts:183).
			this.destroy();
			this.emitEventOnClosed();
			if (this.dontEndCurrentDocumentSession) {
				return;
			}
			top.BX.Disk.endEditSession({
				id: this.documentSession.id,
				hash: this.documentSession.hash,
				documentWasChanged: this.documentWasChanged
			});
		}

		// endregion

		#renderOnlineBox() {
			if (!this.userBoxNode || !this.context.currentUser) {
				return;
			}

			// Minimal online box seeded with the current user. Live co-editor presence is still out of
			// scope; only the object pull channel below is wired (for the `contentUpdated` view toast).
			this.usersBox = new disk_users.Users([]);
			this.usersBox.addUser(this.context.currentUser);
			if (!this.userBoxNode.childElementCount) {
				this.userBoxNode.appendChild(this.usersBox.getContainer());
			}
		}

		// region object pull channel — live "content updated" notification for an open VIEW -----

		// Subscribe to the existing Disk object pull channel (object_{id}) so a viewer already
		// looking at the document gets a live "modified" toast when another user saves a new
		// version, mirroring the OnlyOffice shell. The backend already emits the `contentUpdated`
		// command from File::uploadVersion(); we only subscribe here. Silent no-op when the shell
		// did not hand a pull config / publicChannel (e.g. pull module unavailable).
		#initPull() {
			if (!this.isViewMode()) {
				return;
			}
			if (!this.pullConfig || !this.publicChannel) {
				return;
			}

			// Always start a fresh public-channel client with this object's pull config, exactly like
			// the OnlyOffice editor shell. A login session almost always already has a `BX.PULL`
			// (im/notifications) that is NOT listening on this object's public channel (object_{id}),
			// so reusing it would never deliver the `contentUpdated` command. The editor page owns the
			// channel, so replacing `BX.PULL` with a client started from `this.pullConfig` is safe.
			BX.PULL = new pull_client.PullClient({
				skipStorageInit: true
			});
			BX.PULL.start(this.pullConfig);

			// params-form subscription on the object client we just started. A handler-literal
			// (getModuleId/getSubscriptionType/getMap) is a plain object, so `subscribe()` skips the
			// `attachCommandHandler` branch (emitter.js:95) and falls into the flat params branch with
			// every field undefined — the callback would never fire. The params-form registers the
			// callback under `disk`/`contentUpdated` directly; on emit it receives `data.params`
			// (the `{object, updatedBy}` payload) as its first argument (emitter.js:246-251), which is
			// exactly what `#handleContentUpdated(data)` expects.
			const unsubscribe = BX.PULL.subscribe({
				type: pull_client.PullClient.SubscriptionType.Server,
				moduleId: 'disk',
				command: 'contentUpdated',
				callback: this.#handleContentUpdated.bind(this)
			});
			this.#unsubscribers.push(unsubscribe);
		}

		// Live host notification that the object got a new version. Three guards, in order:
		//  (1) ignore other objects (the channel is per-object, but be defensive);
		//  (2) ignore our own change (no point telling the editor about their own save);
		//  (3) only act in VIEW mode — our defect is the stale open viewer; edit mode handles its
		//      own concurrency. Then show a toast naming the author with a clickable "Refresh".
		#handleContentUpdated(data) {
			if (!data || !data.object) {
				return;
			}
			if (Number(data.object.id) !== Number(this.object?.id)) {
				return;
			}
			const updatedBy = data.object.updatedBy;
			if (!updatedBy || this.#isCurrentUser(updatedBy)) {
				return;
			}
			if (!this.isViewMode()) {
				return;
			}
			const infoToken = data.updatedBy?.infoToken;
			this.#resolveUserName(updatedBy, infoToken).then(userName => this.#notifyNonActualVersion(data.object.name, userName), () => this.#notifyNonActualVersion(data.object.name, null));
		}
		#isCurrentUser(userId) {
			return Number(this.context.currentUser?.id) === Number(userId);
		}

		// Resolve the author's display name for parity with OnlyOffice (token-gated component
		// action). Rejects instead of throwing (the caller renders a name-less toast), so name
		// resolution never blocks the notification. The cache is read before the guards: they gate
		// issuing a NEW request, not a name already resolved under a token valid at that time.
		#resolveUserName(userId, infoToken) {
			const cacheKey = this.#resolveNameCacheKey(userId);
			const cached = this.#userNameCache.get(cacheKey);
			if (cached) {
				return cached;
			}
			if (!main_core.Type.isStringFilled(infoToken) || this.#badUserInfoAttempts >= 3) {
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
				main_core.ajax.runComponentAction('bitrix:disk.file.editor-vibeoffice', 'getUserInfo', {
					mode: 'ajax',
					json: {
						documentSessionId: this.documentSession.id,
						documentSessionHash: this.documentSession.hash,
						userId,
						infoToken
					}
				}).then(response => {
					if (response.status === 'success' && response.data?.user?.name) {
						this.#badUserInfoAttempts = 0;
						resolve(response.data.user.name);
						return;
					}
					fail();
				}, fail);
			});

			// Cached before the request settles: that is what deduplicates concurrent lookups.
			if (cacheKey !== null) {
				this.#userNameCache.set(cacheKey, request);
			}
			return request;
		}

		// Cache slot for an author id, or null when the id is not a positive int: `updatedBy` comes
		// from a pull message, and Number() would collapse every non-numeric value onto one NaN slot
		// shared by unrelated authors. A slot-less id is still requested from the backend.
		#resolveNameCacheKey(userId) {
			const cacheKey = Number(userId);
			return Number.isInteger(cacheKey) && cacheKey > 0 ? cacheKey : null;
		}

		// Toast with a clickable "Refresh" anchor (matches the OnlyOffice `[data-refresh-btn]`
		// pattern). With an author name → the `#USER_NAME#` variant; without → the no-name variant
		// so the user is still notified when name resolution fails.
		#notifyNonActualVersion(objectName, userName) {
			const messageId = main_core.Type.isStringFilled(userName) ? 'DISK_EDITOR_VIBEOFFICE_VIEW_NON_ACTUAL_VERSION' : 'DISK_EDITOR_VIBEOFFICE_VIEW_NON_ACTUAL_VERSION_NO_NAME';
			const replacements = {
				'#NAME#': main_core.Text.encode(objectName || '')
			};
			if (main_core.Type.isStringFilled(userName)) {
				replacements['#USER_NAME#'] = main_core.Text.encode(userName);
			}
			const message = main_core.Loc.getMessage(messageId, replacements);
			if (!main_core.Type.isStringFilled(message)) {
				return;
			}
			const content = main_core.Tag.render`<span>${message}</span>`;
			const refreshButton = content.querySelector('[data-refresh-btn]');
			if (refreshButton) {
				main_core.Tag.style(refreshButton)`
				cursor: pointer;
			`;
				refreshButton.addEventListener('click', this.#reloadView.bind(this));
			}
			BX.UI?.Notification?.Center?.notify({
				content
			});
		}

		// endregion

		#showLoader() {
			if (!this.targetNode) {
				return;
			}
			if (!this.loader) {
				this.loader = new main_loader.Loader({
					target: this.targetNode
				});
			}
			this.loader.show();
		}
		#hideLoader() {
			this.loader?.hide();
		}

		// Prefer the text the template handed in `texts`; fall back to the extension's own
		// localization. No user-facing string is ever hardcoded here.
		#text(textKey, messageId) {
			if (main_core.Type.isStringFilled(this.texts[textKey])) {
				return this.texts[textKey];
			}
			return main_core.Loc.getMessage(messageId) || '';
		}
		#notify(message, type = null) {
			if (!main_core.Type.isStringFilled(message)) {
				return;
			}
			BX.UI?.Notification?.Center?.notify({
				content: message,
				autoHideDelay: type === 'success' ? 3000 : 5000
			});
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
		#closeSliderOrDowngradeToView(deferNavigation = true) {
			const currentSlider = BX.SidePanel?.Instance?.getSliderByWindow(window);
			if (currentSlider) {
				currentSlider.close();
				return;
			}
			if (!deferNavigation) {
				this.#downgradeToView();
				return;
			}

			// Deferred so a just-shown message (e.g. "access revoked") paints before we navigate.
			this.#scheduleNavigation(() => this.#downgradeToView());
		}

		// Leave the (now closed) editor for the plain document view. Prefer the server-built view URL;
		// fall back to a reload when it is absent so the stale editor is never left in place.
		#downgradeToView() {
			if (main_core.Type.isStringFilled(this.linkToView)) {
				document.location = this.linkToView;
				return;
			}
			document.location.reload();
		}

		// Run a page-navigating session-close reaction after a short delay so its message is seen
		// first. Single-shot: a second close reason cannot stack another navigation. Cleared on destroy
		// so a torn-down editor never navigates.
		#scheduleNavigation(navigate) {
			if (this.#pendingNavigationTimer !== null) {
				return;
			}
			this.#pendingNavigationTimer = setTimeout(() => {
				this.#pendingNavigationTimer = null;
				navigate();
			}, SESSION_CLOSE_NAVIGATION_DELAY_MS);
		}
		#reloadView() {
			if (this.isViewMode() && main_core.Type.isStringFilled(this.linkToView)) {
				document.location = this.linkToView;
				return;
			}
			document.location.reload();
		}
		#resolveElementId(element, fallbackNode) {
			if (main_core.Type.isStringFilled(element)) {
				return element;
			}
			if (main_core.Type.isDomNode(element) && element.id) {
				return element.id;
			}
			if (fallbackNode && fallbackNode.id) {
				return fallbackNode.id;
			}
			return null;
		}
		isEditMode() {
			return this.openConfig?.config?.editorConfig?.mode === 'edit';
		}
		isViewMode() {
			return !this.isEditMode();
		}
		getEditor() {
			return this.editor;
		}
		destroy() {
			if (this.#trackWorkTimer !== null) {
				clearInterval(this.#trackWorkTimer);
				this.#trackWorkTimer = null;
			}
			if (this.#pendingNavigationTimer !== null) {
				clearTimeout(this.#pendingNavigationTimer);
				this.#pendingNavigationTimer = null;
			}
			this.#unsubscribers.forEach(off => {
				try {
					off();
				} catch (e) {
					// best-effort teardown
				}
			});
			this.#unsubscribers = [];
			this.#userNameCache.clear();
			this.#hideLoader();
			if (this.editor) {
				this.editor.destroy();
				this.editor = null;
			}
		}
	}

	// Vendored UMD build of `@vibeoffice/helper` (zero runtime deps; provenance:
	// vibeoffice-demo/src/web/vendor/helper.umd.cjs). We do NOT build/ship the helper from its
	// source here — the published UMD artifact is the contract.
	//
	// The API is imported BY VALUE, not via a `window.*` global: under chef/rollup the
	// commonjs plugin resolves the UMD through its CommonJS branch (`m(exports)`), so the API
	// is attached to `exports`, never to `window.VibeOffice`. A side-effect import would
	// therefore leave `window.VibeOffice` undefined in the built bundle. Importing the named
	// export lets rollup-commonjs hand us the real `createEditor`.
	Vibeoffice.setHelper({
		createEditor: helper_umdExports.createEditor
	});

	exports.Vibeoffice = Vibeoffice;

})(this.BX.Disk.Editor = this.BX.Disk.Editor || {}, BX, BX.Event, BX, BX.UI, BX, BX.Disk);
//# sourceMappingURL=editor-vibeoffice.bundle.js.map
