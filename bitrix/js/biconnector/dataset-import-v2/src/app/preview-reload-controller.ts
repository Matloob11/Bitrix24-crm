import { Loc } from 'main.core';
import type { Store } from 'ui.vue3.vuex';
import type { FileProperties, RootState } from '../types/state';
import { showErrorPopup } from './error-popup';
import { extractPreviewRows, mapHeadersToFieldsSettings, requestDatasetView } from './dataset-view';

const DEBOUNCE_MS = 400;
const COLUMN_TRIGGER_KEYS: ReadonlyArray<keyof FileProperties> = ['encoding', 'separator', 'firstLineHeader'];

type ReloadMode = 'columns' | 'preview';

export type PreviewReloadControllerOptions = {
	sourceCode: string,
};

export class PreviewReloadController
{
	private readonly store: Store<RootState>;

	private readonly sourceCode: string;

	private unsubscribe: (() => void) | null = null;

	private debounceTimer: ReturnType<typeof setTimeout> | null = null;

	private currentRequestId: number = 0;

	private pendingRebuildColumns: boolean = false;

	constructor(store: Store<RootState>, options: PreviewReloadControllerOptions)
	{
		this.store = store;
		this.sourceCode = options.sourceCode;
	}

	attach(): void
	{
		this.unsubscribe = (this.store as unknown as {
			subscribe: (cb: (mutation: { type: string, payload?: unknown }) => void) => () => void,
		}).subscribe((mutation) => {
			const mode = this.resolveReloadMode(mutation);
			if (mode === null)
			{
				return;
			}
			if (mode === 'columns')
			{
				this.pendingRebuildColumns = true;
			}
			this.schedule();
		});
	}

	detach(): void
	{
		if (this.unsubscribe)
		{
			this.unsubscribe();
			this.unsubscribe = null;
		}
		if (this.debounceTimer !== null)
		{
			clearTimeout(this.debounceTimer);
			this.debounceTimer = null;
		}
	}

	private resolveReloadMode(mutation: { type: string, payload?: unknown }): ReloadMode | null
	{
		switch (mutation.type)
		{
			case 'setFileProperties':
				if (!this.hasColumnTriggerKey(mutation.payload))
				{
					return null;
				}

				return this.store.getters.isEditMode ? 'preview' : 'columns';
			case 'setDataFormats':
				return 'preview';
			case 'setFieldRowSettings':
				return this.isTypeChange(mutation.payload) ? 'preview' : null;
			default:
				return null;
		}
	}

	private hasColumnTriggerKey(payload: unknown): boolean
	{
		const patch = payload as Partial<FileProperties> | undefined;
		if (!patch)
		{
			return false;
		}

		return COLUMN_TRIGGER_KEYS.some((key) => key in patch);
	}

	private isTypeChange(payload: unknown): boolean
	{
		const settings = (payload as { settings?: Record<string, unknown> } | undefined)?.settings;

		return Boolean(settings) && 'type' in (settings as Record<string, unknown>);
	}

	private schedule(): void
	{
		if (this.debounceTimer !== null)
		{
			clearTimeout(this.debounceTimer);
		}
		this.debounceTimer = setTimeout(() => {
			this.debounceTimer = null;
			this.reload();
		}, DEBOUNCE_MS);
	}

	async reload(): Promise<void>
	{
		const rebuildColumns = this.pendingRebuildColumns;
		this.pendingRebuildColumns = false;

		const state = this.store.state.config;
		if (this.sourceCode !== 'csv' || !state.fileProperties.fileToken)
		{
			return;
		}

		const requestId = ++this.currentRequestId;
		this.store.commit('setPreviewReloading', true);

		try
		{
			const response = await requestDatasetView(this.store, this.sourceCode);

			if (requestId !== this.currentRequestId)
			{
				return;
			}

			if (rebuildColumns)
			{
				this.store.commit('setFieldsSettings', mapHeadersToFieldsSettings(response?.data?.headers ?? []));
			}
			this.store.commit('setPreviewData', extractPreviewRows(response));
		}
		catch (error)
		{
			if (requestId === this.currentRequestId)
			{
				showErrorPopup(error, Loc.getMessage('DATASET_IMPORT_V2_ERROR_POPUP_TITLE_LOAD'));
			}
		}
		finally
		{
			if (requestId === this.currentRequestId)
			{
				this.store.commit('setPreviewReloading', false);
			}
		}
	}
}
