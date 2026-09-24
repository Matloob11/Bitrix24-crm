import { Dom, Reflection } from 'main.core';
import { Alert, AlertColor, AlertIcon } from 'ui.alerts';
import { Center } from 'ui.notification';

import { pickPanelData } from './save-request';
import { type AjaxErrorResponse, type SignatureEditorOptions } from './types';
import './style.css';

type HtmlEditorManager = {
	Get: (id: string) => { GetContent: () => string },
};

type SidePanelManager = {
	Instance: {
		getTopSlider: () => object | null,
		postMessage: (slider: object, eventId: string, data: Record<string, number>) => void,
	},
};

export class SignatureEditor
{
	#options: SignatureEditorOptions;

	constructor(options: SignatureEditorOptions)
	{
		this.#options = options;

		if (options.panel && options.panelContainer)
		{
			options.panel.renderTo(options.panelContainer);
		}

		if (options.scopeCard && options.scopeCardContainer)
		{
			options.scopeCard.subscribeToScope((shared: boolean) => {
				this.#applyScope(shared);
			});
			options.scopeCard.renderTo(options.scopeCardContainer);
			this.#applyScope(options.scopeCard.isSharedScope());
		}
	}

	save(closeAfter: boolean = false): void
	{
		const { signatureId, scopeCard, transport } = this.#options;

		// The card says what is missing in its own place on the screen, so there is nothing to add
		if (scopeCard && !scopeCard.validate())
		{
			return;
		}

		const isNew = signatureId <= 0;

		transport
			.save({
				signatureId,
				signature: this.#getEditorContent(),
				panelData: pickPanelData(this.#options),
			})
			.then((savedId: number) => {
				if (isNew || closeAfter)
				{
					this.closeSlider(savedId);
				}
				else
				{
					Center.notify({ content: transport.getUpdateSuccessText() });
				}
			})
			.catch((response: AjaxErrorResponse) => {
				this.showError(response.errors.pop()?.message ?? '');
			});
	}

	showError(text: string): void
	{
		// Alert Flow typings mark all options as required, the runtime does not
		const alert = new Alert({
			color: AlertColor.DANGER,
			icon: AlertIcon.DANGER,
			text,
		} as unknown as ConstructorParameters<typeof Alert>[0]);

		Dom.clean(this.#options.alertContainer);
		Dom.append(alert.getContainer(), this.#options.alertContainer);
	}

	closeSlider(signatureId: number): void
	{
		const { eventId, idKey } = this.#options.sliderMessage;
		const sidePanel = Reflection.getClass('BX.SidePanel') as SidePanelManager | null;

		if (sidePanel)
		{
			const slider = sidePanel.Instance.getTopSlider();
			if (slider)
			{
				sidePanel.Instance.postMessage(slider, eventId, { [idKey]: signatureId });
			}
		}

		document.getElementById('ui-button-panel-close')?.click();
	}

	/*
	 * The sender card and the assignments are the two answers to one question, so only one of them
	 * is on the screen. Hiding keeps the card rendered: the chosen sender survives the switcher
	 * being flicked back and forth, and the text of the signature belongs to the first card, which
	 * neither of them touches.
	 */
	#applyScope(shared: boolean): void
	{
		const { panelContainer } = this.#options;

		if (panelContainer)
		{
			Dom.style(panelContainer, 'display', shared ? 'none' : '');
		}
	}

	#getEditorContent(): string
	{
		const manager = Reflection.getClass('BXHtmlEditor') as unknown as HtmlEditorManager;

		return manager.Get(this.#options.editorInstanceId).GetContent();
	}
}
