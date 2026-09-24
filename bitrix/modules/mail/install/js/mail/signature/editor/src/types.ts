// One entry of the personal signature binding list built by mail.usersignature.edit:
// `value` is what goes into b_mail_user_signature.SENDER ('' means "any sender").
export type SenderOption = {
	id: string,
	title: string,
	value: string,
	selected?: boolean,
};

// `title` is the name of the target, as SharedSignatureDto builds it: the card renders the targets
// of an opened signature by it, without waiting for a provider to name them.
export type Assignment = {
	targetType: string,
	targetId: number,
	targetValue?: string,
	isFlat: boolean,
	title?: string,
};

// The ways a shared signature may be assigned, as the third card offers them. 'draft' is the
// signature assigned to nobody: a legitimate state of its own, not an unfinished choice.
export type AssignmentMode = 'all' | 'mailbox' | 'department' | 'draft';

// Discriminates which save path the editor must take:
//   - 'user'   → UserSignature controller (personal signature)
//   - 'shared' → SharedSignature controller (corporate assignment)
export type PanelKind = 'user' | 'shared';

export type PanelSaveData = {
	kind?: PanelKind,
	sender?: string,
	assignments?: Assignment[],
};

export type PanelSlot = {
	renderTo(container: HTMLElement): void,
	getSaveData(): PanelSaveData,
};

/**
 * The third card of the editor: the switcher of the scope in its header and the assignments
 * behind it. The switcher is the primary choice of the screen — the editor gives the sender card
 * away to the assignments by it — so the card lets the editor subscribe instead of taking a
 * handler at construction, where the editor does not exist yet.
 */
export type ScopeCardSlot = PanelSlot & {
	isSharedScope(): boolean,
	subscribeToScope(handler: (shared: boolean) => void): void,
	/**
	 * Whether the choice of the card is finished. A way of assigning made of a selector with nothing
	 * chosen in it is not: the signature has an own way of being assigned to nobody. The card says
	 * what is missing itself, the editor only learns that there is nothing to save yet.
	 */
	validate(): boolean,
};

export type SavePayload = {
	signatureId: number,
	signature: string,
	panelData: PanelSaveData | null,
};

export type SaveRequest = {
	action: string,
	data: Record<string, unknown>,
};

export type UserSignatureResponseData = {
	userSignature?: { id?: number | string },
};

export type SharedSignatureResponseData = {
	item?: { id?: number | string },
};

export type AjaxError = {
	message: string,
};

export type AjaxErrorResponse = {
	errors: AjaxError[],
};

export interface SignatureTransport
{
	save(payload: SavePayload): Promise<number>;
	getUpdateSuccessText(): string;
}

export type SliderMessage = {
	eventId: string,
	idKey: string,
};

/**
 * The cards the save data may come from. The editor itself is one of them, hence the shape is
 * a part of SignatureEditorOptions rather than an argument of its own.
 */
export type EditorPanels = {
	panel?: PanelSlot | null,
	scopeCard?: ScopeCardSlot | null,
};

export type SignatureEditorOptions = EditorPanels & {
	editorInstanceId: string,
	signatureId: number,
	alertContainer: HTMLElement,
	transport: SignatureTransport,
	sliderMessage: SliderMessage,
	panelContainer?: HTMLElement | null,
	scopeCardContainer?: HTMLElement | null,
};
