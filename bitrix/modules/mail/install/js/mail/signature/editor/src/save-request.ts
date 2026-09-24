import {
	type EditorPanels,
	type PanelSaveData,
	type SavePayload,
	type SaveRequest,
	type SharedSignatureResponseData,
	type UserSignatureResponseData,
} from './types';

/**
 * A request body goes to the server form-encoded, and an empty list does not survive that: the
 * `assignments` key disappears together with its contents, and an absent key has always meant "do
 * not change the assignments". This flag says the set is being sent, so that a signature assigned to
 * nobody — the draft — reaches the server as the empty set it is.
 */
export const ASSIGNMENTS_PROVIDED = 'Y';

/**
 * Picks the card the save request is built from. The switcher of the third card is the single
 * primary choice: with the shared scope on the assignments answer, with it off the sender binding
 * does. An editor without the third card — a plain employee, or the shared interface turned off —
 * has the personal path alone.
 */
export function pickPanelData(panels: EditorPanels): PanelSaveData | null
{
	if (panels.scopeCard?.isSharedScope() === true)
	{
		return panels.scopeCard.getSaveData();
	}

	return panels.panel ? panels.panel.getSaveData() : null;
}

export function buildUserSignatureSaveRequest(payload: SavePayload): SaveRequest
{
	const fields = {
		signature: payload.signature,
		sender: payload.panelData?.sender ?? '',
	};

	if (payload.signatureId > 0)
	{
		return {
			action: 'mail.api.usersignature.update',
			data: {
				userSignatureId: payload.signatureId,
				fields,
			},
		};
	}

	return {
		action: 'mail.api.usersignature.add',
		data: { fields },
	};
}

export function buildSharedSignatureSaveRequest(payload: SavePayload): SaveRequest
{
	// absent assignments key means "do not change assignments" on the server side
	const assignments = payload.panelData?.assignments;

	const data: Record<string, unknown> = payload.signatureId > 0
		? { id: payload.signatureId, signature: payload.signature }
		: { signature: payload.signature };

	if (assignments)
	{
		data.assignments = assignments;
		data.assignmentsProvided = ASSIGNMENTS_PROVIDED;
	}

	return {
		action: payload.signatureId > 0 ? 'mail.api.sharedsignature.update' : 'mail.api.sharedsignature.add',
		data,
	};
}

export function buildUnifiedSignatureUpdateRequest(payload: SavePayload): SaveRequest
{
	const shared = payload.panelData?.kind === 'shared';
	const sender = payload.panelData?.sender ?? '';
	const assignments = shared
		? (payload.panelData?.assignments ?? [])
		: (
			sender === ''
				? []
				: [{ targetType: 'sender', targetId: 0, targetValue: sender, isFlat: false }]
		)
	;

	return {
		action: 'mail.api.signature.update',
		data: {
			id: payload.signatureId,
			signature: payload.signature,
			scope: shared ? 'shared' : 'owner',
			assignments,
			assignmentsProvided: ASSIGNMENTS_PROVIDED,
		},
	};
}

export function extractUserSignatureId(responseData: UserSignatureResponseData | null | undefined): number
{
	return Number(responseData?.userSignature?.id ?? 0);
}

export function extractSharedSignatureId(responseData: SharedSignatureResponseData | null | undefined): number
{
	return Number(responseData?.item?.id ?? 0);
}
