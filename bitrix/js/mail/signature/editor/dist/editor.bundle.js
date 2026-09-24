/* eslint-disable */
this.BX = this.BX || {};
this.BX.Mail = this.BX.Mail || {};
this.BX.Mail.Signature = this.BX.Mail.Signature || {};
(function (exports, main_core, ui_alerts, ui_notification, ui_entitySelector, ui_system_radiobutton, ui_switcher, mail_lib_entitySelector) {
	'use strict';

	const ASSIGNMENTS_PROVIDED = 'Y';
	function pickPanelData(panels) {
		if (panels.scopeCard?.isSharedScope() === true) {
			return panels.scopeCard.getSaveData();
		}
		return panels.panel ? panels.panel.getSaveData() : null;
	}
	function buildUserSignatureSaveRequest(payload) {
		const fields = {
			signature: payload.signature,
			sender: payload.panelData?.sender ?? ''
		};
		if (payload.signatureId > 0) {
			return {
				action: 'mail.api.usersignature.update',
				data: {
					userSignatureId: payload.signatureId,
					fields
				}
			};
		}
		return {
			action: 'mail.api.usersignature.add',
			data: {
				fields
			}
		};
	}
	function buildSharedSignatureSaveRequest(payload) {
		const assignments = payload.panelData?.assignments;
		const data = payload.signatureId > 0 ? {
			id: payload.signatureId,
			signature: payload.signature
		} : {
			signature: payload.signature
		};
		if (assignments) {
			data.assignments = assignments;
			data.assignmentsProvided = ASSIGNMENTS_PROVIDED;
		}
		return {
			action: payload.signatureId > 0 ? 'mail.api.sharedsignature.update' : 'mail.api.sharedsignature.add',
			data
		};
	}
	function buildUnifiedSignatureUpdateRequest(payload) {
		const shared = payload.panelData?.kind === 'shared';
		const sender = payload.panelData?.sender ?? '';
		const assignments = shared ? payload.panelData?.assignments ?? [] : sender === '' ? [] : [{
			targetType: 'sender',
			targetId: 0,
			targetValue: sender,
			isFlat: false
		}];
		return {
			action: 'mail.api.signature.update',
			data: {
				id: payload.signatureId,
				signature: payload.signature,
				scope: shared ? 'shared' : 'owner',
				assignments,
				assignmentsProvided: ASSIGNMENTS_PROVIDED
			}
		};
	}
	function extractUserSignatureId(responseData) {
		return Number(responseData?.userSignature?.id ?? 0);
	}
	function extractSharedSignatureId(responseData) {
		return Number(responseData?.item?.id ?? 0);
	}

	class SignatureEditor {
		#options;
		constructor(options) {
			this.#options = options;
			if (options.panel && options.panelContainer) {
				options.panel.renderTo(options.panelContainer);
			}
			if (options.scopeCard && options.scopeCardContainer) {
				options.scopeCard.subscribeToScope(shared => {
					this.#applyScope(shared);
				});
				options.scopeCard.renderTo(options.scopeCardContainer);
				this.#applyScope(options.scopeCard.isSharedScope());
			}
		}
		save(closeAfter = false) {
			const {
				signatureId,
				scopeCard,
				transport
			} = this.#options;
			if (scopeCard && !scopeCard.validate()) {
				return;
			}
			const isNew = signatureId <= 0;
			transport.save({
				signatureId,
				signature: this.#getEditorContent(),
				panelData: pickPanelData(this.#options)
			}).then(savedId => {
				if (isNew || closeAfter) {
					this.closeSlider(savedId);
				} else {
					ui_notification.Center.notify({
						content: transport.getUpdateSuccessText()
					});
				}
			}).catch(response => {
				this.showError(response.errors.pop()?.message ?? '');
			});
		}
		showError(text) {
			const alert = new ui_alerts.Alert({
				color: ui_alerts.AlertColor.DANGER,
				icon: ui_alerts.AlertIcon.DANGER,
				text
			});
			main_core.Dom.clean(this.#options.alertContainer);
			main_core.Dom.append(alert.getContainer(), this.#options.alertContainer);
		}
		closeSlider(signatureId) {
			const {
				eventId,
				idKey
			} = this.#options.sliderMessage;
			const sidePanel = main_core.Reflection.getClass('BX.SidePanel');
			if (sidePanel) {
				const slider = sidePanel.Instance.getTopSlider();
				if (slider) {
					sidePanel.Instance.postMessage(slider, eventId, {
						[idKey]: signatureId
					});
				}
			}
			document.getElementById('ui-button-panel-close')?.click();
		}
		#applyScope(shared) {
			const {
				panelContainer
			} = this.#options;
			if (panelContainer) {
				main_core.Dom.style(panelContainer, 'display', shared ? 'none' : '');
			}
		}
		#getEditorContent() {
			const manager = main_core.Reflection.getClass('BXHtmlEditor');
			return manager.Get(this.#options.editorInstanceId).GetContent();
		}
	}

	const SENDER_OPTION_ENTITY_ID = 'mail-signature-sender';
	const SENDER_OPTION_TAB_ID = 'recents';
	function getInitialSenderOptionId(options) {
		const selected = options.find(option => option.selected === true);
		return (selected ?? options[0])?.id ?? null;
	}
	function buildSenderSelectorItems(options) {
		const initialId = getInitialSenderOptionId(options);
		return options.map((option, index) => ({
			id: option.id,
			entityId: SENDER_OPTION_ENTITY_ID,
			title: option.title,
			tabs: SENDER_OPTION_TAB_ID,
			sort: index,
			selected: option.id === initialId,
			deselectable: false
		}));
	}
	function getSenderValueById(options, id) {
		return options.find(option => option.id === id)?.value ?? '';
	}

	class SenderBindingPanel {
		#senderOptions;
		#initialOptionId;
		#selector = null;
		constructor(options) {
			this.#senderOptions = options.senderOptions ?? [];
			this.#initialOptionId = getInitialSenderOptionId(this.#senderOptions);
		}
		renderTo(container) {
			const selectorContainer = main_core.Tag.render`
			<div
				class="mail-signature-sender-binding__selector"
				data-role="sender-selector"
				data-testid="mail-signature-sender-selector"
			></div>
		`;
			const block = main_core.Tag.render`
			<div class="mail-signature-sender-binding" data-testid="mail-signature-sender-binding">
				<div class="mail-signature-sender-binding__label">
					${main_core.Loc.getMessage('MAIL_SIGNATURE_EDITOR_SENDER_BINDING_LABEL') ?? ''}
				</div>
				${selectorContainer}
			</div>
		`;
			main_core.Dom.append(block, container);
			const caption = main_core.Loc.getMessage('MAIL_SIGNATURE_EDITOR_SENDER_BINDING_CHANGE') ?? '';
			this.#selector = new ui_entitySelector.TagSelector({
				multiple: false,
				addButtonCaption: caption,
				addButtonCaptionMore: caption,
				dialogOptions: {
					targetNode: selectorContainer,
					context: 'MAIL_SIGNATURE_SENDER_BINDING',
					items: buildSenderSelectorItems(this.#senderOptions),
					dropdownMode: true,
					enableSearch: false,
					showAvatars: false,
					compactView: true
				}
			});
			this.#selector.renderTo(selectorContainer);
		}
		getSaveData() {
			return {
				kind: 'user',
				sender: getSenderValueById(this.#senderOptions, this.#getSelectedOptionId())
			};
		}
		#getSelectedOptionId() {
			const tag = this.#selector?.getTags()[0];
			return tag ? String(tag.getId()) : this.#initialOptionId;
		}
	}

	function needsUnifiedTransport(condition) {
		return (condition.unifiedSignatureId ?? 0) > 0 || condition.hasSharedScopeCard === true;
	}
	class CompositeTransport {
		#userTransport;
		#sharedTransport;
		#unifiedTransport;
		#sharedSignatureId;
		#unifiedSignatureId;
		#initialKind;
		#continueInUnifiedModel = false;
		constructor(userTransport, sharedTransport, options = {}) {
			this.#userTransport = userTransport;
			this.#sharedTransport = sharedTransport;
			this.#unifiedTransport = options.unifiedTransport ?? sharedTransport;
			this.#sharedSignatureId = options.sharedSignatureId ?? 0;
			this.#unifiedSignatureId = options.unifiedSignatureId ?? 0;
			this.#initialKind = options.initialKind ?? 'user';
		}
		save(payload) {
			const kind = payload.panelData?.kind ?? 'user';
			if (this.#unifiedSignatureId > 0 && (this.#continueInUnifiedModel || kind !== this.#initialKind || kind === 'user' && payload.signatureId <= 0)) {
				return this.#unifiedTransport.save({
					...payload,
					signatureId: this.#unifiedSignatureId
				}).then(savedId => {
					this.#unifiedSignatureId = savedId;
					this.#sharedSignatureId = kind === 'shared' ? savedId : 0;
					this.#initialKind = kind;
					this.#continueInUnifiedModel = true;
					return savedId;
				});
			}
			if (kind === 'shared') {
				return this.#sharedTransport.save({
					...payload,
					signatureId: this.#sharedSignatureId
				});
			}
			return this.#userTransport.save(payload);
		}
		getUpdateSuccessText() {
			return this.#userTransport.getUpdateSuccessText();
		}
	}

	const ASSIGNMENT_MODES = ['all', 'mailbox', 'department', 'draft'];
	const MODES_WITH_TARGETS = new Set(['mailbox', 'department']);
	const DEFAULT_ASSIGNMENT_MODE = 'draft';
	function detectAssignmentMode(assignments) {
		if (!assignments || assignments.length === 0) {
			return 'draft';
		}
		if (assignments.some(assignment => assignment.targetType === 'all')) {
			return 'all';
		}
		const byDepartment = assignments.some(assignment => assignment.targetType === 'department' || assignment.targetType === 'user');
		if (byDepartment) {
			return 'department';
		}
		return assignments.every(assignment => assignment.targetType === 'mailbox') ? 'mailbox' : DEFAULT_ASSIGNMENT_MODE;
	}
	function modeRequiresTargets(mode) {
		return MODES_WITH_TARGETS.has(mode);
	}

	class AssignmentBlock {
		#content = null;
		#mode = DEFAULT_ASSIGNMENT_MODE;
		#mailboxSelector = null;
		#departmentSelector = null;
		#initialAssignments;
		#onTargetAdd;
		constructor(options = {}) {
			this.#initialAssignments = options.assignments ?? [];
			this.#onTargetAdd = options.onTargetAdd ?? (() => {});
		}
		renderTo(container) {
			if (!container) {
				return;
			}
			this.#content = main_core.Tag.render`
			<div
				class="mail-signature-assignment-block"
				data-testid="mail-signature-assignment-container"
			></div>
		`;
			main_core.Dom.append(this.#content, container);
		}
		getSaveData() {
			return {
				kind: 'shared',
				assignments: this.getAssignments()
			};
		}
		getAssignments() {
			if (this.#mode === 'all') {
				return [{
					targetType: 'all',
					targetId: 0,
					isFlat: false
				}];
			}
			if (this.#mode === 'mailbox') {
				return this.#getMailboxAssignments();
			}
			if (this.#mode === 'department') {
				return this.#getDepartmentAssignments();
			}
			return [];
		}
		setMode(mode) {
			if (!ASSIGNMENT_MODES.includes(mode)) {
				return;
			}
			this.#mode = mode;
			if (!this.#content) {
				return;
			}
			main_core.Dom.clean(this.#content);
			if (mode === 'mailbox') {
				this.#renderMailboxSelector(this.#content);
			} else if (mode === 'department') {
				this.#renderDepartmentSelector(this.#content);
			}
		}
		#renderMailboxSelector(content) {
			const selectorContainer = main_core.Tag.render`
			<div
				class="mail-signature-assignment-block__selector"
				data-role="mailbox-selector"
				data-testid="mail-signature-mailbox-selector"
			></div>
		`;
			main_core.Dom.append(selectorContainer, content);
			this.#mailboxSelector = new ui_entitySelector.TagSelector({
				multiple: true,
				events: {
					onAfterTagAdd: () => {
						this.#onTargetAdd();
					}
				},
				dialogOptions: {
					targetNode: selectorContainer,
					context: 'MAIL_CORP_SIGNATURE_MAILBOXES',
					selectedItems: this.#getMailboxSelectorItems(),
					preselectedItems: this.#getMailboxSelectorPreselected(),
					entities: [{
						id: 'mail_mailbox',
						dynamicLoad: true,
						dynamicSearch: true
					}]
				}
			});
			this.#mailboxSelector.renderTo(selectorContainer);
		}
		#getMailboxAssignments() {
			if (!this.#mailboxSelector) {
				return [];
			}
			const result = [];
			this.#mailboxSelector.getTags().forEach(tag => {
				const parsed = mail_lib_entitySelector.parseSelectorTag(tag);
				if (parsed && parsed.entity === 'mail_mailbox') {
					result.push({
						targetType: 'mailbox',
						targetId: parsed.id,
						isFlat: false
					});
				}
			});
			return result;
		}
		#getMailboxSelectorPreselected() {
			return this.#initialAssignments.filter(assignment => assignment.targetType === 'mailbox' && assignment.targetId > 0).map(assignment => ['mail_mailbox', Number(assignment.targetId)]);
		}
		#getMailboxSelectorItems() {
			const items = [];
			this.#initialAssignments.forEach(assignment => {
				const title = assignment.title ?? '';
				if (assignment.targetType === 'mailbox' && assignment.targetId > 0 && title !== '') {
					items.push({
						entityId: 'mail_mailbox',
						id: Number(assignment.targetId),
						title
					});
				}
			});
			return items;
		}
		#renderDepartmentSelector(content) {
			const selectorContainer = main_core.Tag.render`
			<div
				class="mail-signature-assignment-block__selector"
				data-role="dept-selector"
				data-testid="mail-signature-department-selector"
			></div>
		`;
			main_core.Dom.append(selectorContainer, content);
			this.#departmentSelector = new ui_entitySelector.TagSelector({
				multiple: true,
				events: {
					onAfterTagAdd: () => {
						this.#onTargetAdd();
					}
				},
				dialogOptions: {
					targetNode: selectorContainer,
					context: 'MAIL_CORP_SIGNATURE_ASSIGNMENT',
					selectedItems: this.#getDepartmentSelectorItems(),
					preselectedItems: this.#getDepartmentSelectorPreselected(),
					entities: mail_lib_entitySelector.getUserDepartmentEntities(),
					preload: true,
					events: {
						onLoad: event => {
							const dialog = event.getTarget();
							if (dialog && !dialog.getRecentTab().getRootNode().hasChildren()) {
								dialog.selectTab('departments');
							}
						}
					}
				}
			});
			this.#departmentSelector.renderTo(selectorContainer);
		}
		#getDepartmentAssignments() {
			if (!this.#departmentSelector) {
				return [];
			}
			const result = [];
			this.#departmentSelector.getTags().forEach(tag => {
				const parsed = mail_lib_entitySelector.parseSelectorTag(tag);
				if (!parsed) {
					return;
				}
				if (parsed.entity === 'department') {
					result.push({
						targetType: 'department',
						targetId: parsed.id,
						isFlat: parsed.isFlat
					});
				} else if (parsed.entity === 'user') {
					result.push({
						targetType: 'user',
						targetId: parsed.id,
						isFlat: false
					});
				}
			});
			return result;
		}
		#getDepartmentSelectorPreselected() {
			const items = [];
			this.#initialAssignments.forEach(assignment => {
				if (assignment.targetType === 'department') {
					items.push(['department', mail_lib_entitySelector.buildDepartmentItemId(assignment.targetId, assignment.isFlat)]);
				} else if (assignment.targetType === 'user' && assignment.targetId > 0) {
					items.push(['user', assignment.targetId]);
				}
			});
			return items;
		}
		#getDepartmentSelectorItems() {
			const items = [];
			this.#initialAssignments.forEach(assignment => {
				const title = assignment.title ?? '';
				if (title === '') {
					return;
				}
				if (assignment.targetType === 'department') {
					items.push({
						entityId: 'department',
						id: mail_lib_entitySelector.buildDepartmentItemId(assignment.targetId, assignment.isFlat),
						title
					});
				} else if (assignment.targetType === 'user' && assignment.targetId > 0) {
					items.push({
						entityId: 'user',
						id: assignment.targetId,
						title
					});
				}
			});
			return items;
		}
	}

	const RADIO_GROUP = 'mail-signature-assignment-type';
	class AssignmentTypeSelector {
		#shared;
		#mode;
		#assignmentBlock;
		#switcher = null;
		#contentContainer = null;
		#errorContainer = null;
		#radios = new Map();
		#scopeHandlers = [];
		constructor(options = {}) {
			const assignments = options.assignments ?? [];
			this.#shared = options.shared === true;
			this.#mode = options.mode ?? detectAssignmentMode(assignments);
			this.#assignmentBlock = new AssignmentBlock({
				assignments,
				onTargetAdd: () => {
					this.#hideError();
				}
			});
		}
		renderTo(container) {
			const label = main_core.Loc.getMessage('MAIL_SIGNATURE_EDITOR_ASSIGN_TYPE_LABEL') ?? '';
			const switcherNode = main_core.Tag.render`
			<div
				class="mail-signature-shared-scope__switcher"
				data-testid="mail-signature-shared-switcher"
			></div>
		`;
			const card = main_core.Tag.render`
			<div class="mail-signature-shared-scope" data-testid="mail-signature-shared-scope">
				<div class="mail-signature-shared-scope__header">
					<div class="mail-signature-shared-scope__title-block">
						<div class="mail-signature-shared-scope__title">
							${main_core.Loc.getMessage('MAIL_SIGNATURE_EDITOR_SHARED_SCOPE_TITLE') ?? ''}
						</div>
						<div class="mail-signature-shared-scope__subtitle">
							${main_core.Loc.getMessage('MAIL_SIGNATURE_EDITOR_SHARED_SCOPE_HINT') ?? ''}
						</div>
					</div>
					${switcherNode}
				</div>
				<div class="mail-signature-shared-scope__content" data-role="shared-scope-content">
					<div class="mail-signature-assignment-type__label">${label}</div>
					<div
						class="mail-signature-assignment-type__options"
						role="radiogroup"
						aria-label="${label}"
					>
						${ASSIGNMENT_MODES.map(mode => this.#renderOption(mode))}
					</div>
					<div class="mail-signature-assignment-type__panel" data-role="shared-panel"></div>
					<div
						class="mail-signature-assignment-type__error"
						data-role="shared-error"
						data-testid="mail-signature-assignment-error"
					></div>
				</div>
			</div>
		`;
			main_core.Dom.append(card, container);
			this.#switcher = new ui_switcher.Switcher({
				node: switcherNode,
				size: ui_switcher.SwitcherSize.large,
				useAirDesign: true,
				showStateTitle: false,
				checked: this.#shared,
				handlers: {
					toggled: () => {
						this.#setShared(this.#switcher?.isChecked() === true);
					}
				}
			});
			this.#contentContainer = card.querySelector('[data-role="shared-scope-content"]');
			this.#errorContainer = card.querySelector('[data-role="shared-error"]');
			const panelContainer = card.querySelector('[data-role="shared-panel"]');
			if (panelContainer) {
				this.#assignmentBlock.renderTo(panelContainer);
				this.#assignmentBlock.setMode(this.#mode);
			}
			this.#updateVisibility();
		}
		isSharedScope() {
			return this.#shared;
		}
		subscribeToScope(handler) {
			this.#scopeHandlers.push(handler);
		}
		getSaveData() {
			const data = this.#assignmentBlock.getSaveData();
			return {
				...data,
				kind: 'shared',
				assignments: data.assignments?.length ? data.assignments : this.#fallbackAssignments()
			};
		}
		validate() {
			if (this.#shared && modeRequiresTargets(this.#mode) && this.#assignmentBlock.getAssignments().length === 0) {
				this.#showError();
				return false;
			}
			this.#hideError();
			return true;
		}
		#showError() {
			if (this.#errorContainer) {
				this.#errorContainer.textContent = main_core.Loc.getMessage('MAIL_SIGNATURE_EDITOR_ASSIGN_TARGETS_REQUIRED') ?? '';
			}
		}
		#hideError() {
			if (this.#errorContainer) {
				this.#errorContainer.textContent = '';
			}
		}
		#renderOption(mode) {
			const title = main_core.Loc.getMessage(`MAIL_SIGNATURE_EDITOR_ASSIGN_TYPE_${mode.toUpperCase()}`) ?? mode;
			const radio = new ui_system_radiobutton.RadioButton({
				group: RADIO_GROUP,
				size: ui_system_radiobutton.RadioButtonSize.Md,
				checked: mode === this.#mode,
				attributes: {
					value: mode,
					'aria-label': title,
					'data-testid': `mail-signature-assignment-${mode}`
				},
				onChange: ({
					checked
				}) => {
					if (checked) {
						this.#selectMode(mode);
					}
				}
			});
			this.#radios.set(mode, radio);
			const option = main_core.Tag.render`
			<div class="mail-signature-assignment-type__option">
				${radio.render()}
				<span class="mail-signature-assignment-type__option-text">${title}</span>
			</div>
		`;
			main_core.Event.bind(option, 'click', event => {
				if (event.target instanceof HTMLElement && event.target.closest('label')) {
					return;
				}
				this.#selectMode(mode);
			});
			return option;
		}
		#selectMode(mode) {
			this.#mode = mode;
			this.#hideError();
			this.#syncRadios();
			this.#assignmentBlock.setMode(mode);
		}
		#syncRadios() {
			this.#radios.forEach((radio, mode) => {
				radio.setChecked(mode === this.#mode);
			});
		}
		#setShared(shared) {
			if (shared === this.#shared) {
				return;
			}
			this.#shared = shared;
			this.#updateVisibility();
			this.#scopeHandlers.forEach(handler => {
				handler(shared);
			});
		}
		#updateVisibility() {
			if (this.#contentContainer) {
				main_core.Dom.style(this.#contentContainer, 'display', this.#shared ? '' : 'none');
			}
		}
		#fallbackAssignments() {
			if (this.#mode === 'all') {
				return [{
					targetType: 'all',
					targetId: 0,
					isFlat: false
				}];
			}
			return [];
		}
	}

	class UserSignatureTransport {
		save(payload) {
			const {
				action,
				data
			} = buildUserSignatureSaveRequest(payload);
			return main_core.ajax.runAction(action, {
				data
			}).then(response => payload.signatureId > 0 ? payload.signatureId : extractUserSignatureId(response.data));
		}
		getUpdateSuccessText() {
			return main_core.Loc.getMessage('MAIL_SIGNATURE_EDITOR_UPDATE_SUCCESS') ?? '';
		}
	}

	class SharedSignatureTransport {
		save(payload) {
			const {
				action,
				data
			} = buildSharedSignatureSaveRequest(payload);
			return main_core.ajax.runAction(action, {
				data
			}).then(response => payload.signatureId > 0 ? payload.signatureId : extractSharedSignatureId(response.data));
		}
		getUpdateSuccessText() {
			return main_core.Loc.getMessage('MAIL_SIGNATURE_EDITOR_SHARED_UPDATE_SUCCESS') ?? '';
		}
	}

	class UnifiedSignatureTransport {
		save(payload) {
			const {
				action,
				data
			} = buildUnifiedSignatureUpdateRequest(payload);
			return main_core.ajax.runAction(action, {
				data
			}).then(() => payload.signatureId);
		}
		getUpdateSuccessText() {
			return main_core.Loc.getMessage('MAIL_SIGNATURE_EDITOR_UPDATE_SUCCESS') ?? '';
		}
	}

	exports.ASSIGNMENTS_PROVIDED = ASSIGNMENTS_PROVIDED;
	exports.ASSIGNMENT_MODES = ASSIGNMENT_MODES;
	exports.AssignmentBlock = AssignmentBlock;
	exports.AssignmentTypeSelector = AssignmentTypeSelector;
	exports.CompositeTransport = CompositeTransport;
	exports.DEFAULT_ASSIGNMENT_MODE = DEFAULT_ASSIGNMENT_MODE;
	exports.SENDER_OPTION_ENTITY_ID = SENDER_OPTION_ENTITY_ID;
	exports.SenderBindingPanel = SenderBindingPanel;
	exports.SharedSignatureTransport = SharedSignatureTransport;
	exports.SignatureEditor = SignatureEditor;
	exports.UnifiedSignatureTransport = UnifiedSignatureTransport;
	exports.UserSignatureTransport = UserSignatureTransport;
	exports.buildSenderSelectorItems = buildSenderSelectorItems;
	exports.buildSharedSignatureSaveRequest = buildSharedSignatureSaveRequest;
	exports.buildUnifiedSignatureUpdateRequest = buildUnifiedSignatureUpdateRequest;
	exports.buildUserSignatureSaveRequest = buildUserSignatureSaveRequest;
	exports.detectAssignmentMode = detectAssignmentMode;
	exports.extractSharedSignatureId = extractSharedSignatureId;
	exports.extractUserSignatureId = extractUserSignatureId;
	exports.getInitialSenderOptionId = getInitialSenderOptionId;
	exports.getSenderValueById = getSenderValueById;
	exports.modeRequiresTargets = modeRequiresTargets;
	exports.needsUnifiedTransport = needsUnifiedTransport;
	exports.pickPanelData = pickPanelData;

})(this.BX.Mail.Signature.Editor = this.BX.Mail.Signature.Editor || {}, BX, BX.UI, BX.UI.Notification, BX.UI.EntitySelector, BX.UI.System.RadioButton, BX.UI, BX.Mail.Lib.EntitySelector);
//# sourceMappingURL=editor.bundle.js.map
