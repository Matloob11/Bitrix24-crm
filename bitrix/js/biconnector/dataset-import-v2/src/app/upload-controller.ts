import { Loc, Runtime } from 'main.core';
import type { Store } from 'ui.vue3.vuex';
import type { RootState } from '../types/state';
import { showErrorPopup } from './error-popup';
import {
	extractPreviewRows,
	mapHeadersToFieldsSettings,
	requestDatasetView,
} from './dataset-view';
import type { DatasetViewResponse } from './dataset-view';

const STEP_FILE = 1;
const STEP_PARSE = 2;
const STEP_REPORT = 3;
const STEP_3_HOLD_MS = 600;
const MAX_FILE_SIZE = 60 * 1024 * 1024;

type UploaderFile = {
	isComplete?: () => boolean,
	getServerFileId: () => string,
	getName: () => string,
};

type UploaderInstance = {
	addFiles: (files: Array<File>) => void,
	getFiles: () => Array<UploaderFile>,
	destroy: () => void,
};

export class UploadController
{
	private readonly store: Store<RootState>;

	private readonly sourceCode: string;

	private uploader: UploaderInstance | null = null;

	constructor(store: Store<RootState>, options: { sourceCode: string })
	{
		this.store = store;
		this.sourceCode = options.sourceCode;
	}

	destroy(): void
	{
		this.disposeUploader();
	}

	async upload(file: File): Promise<void>
	{
		this.store.commit('setUploadStatus', { isUploading: true, step: STEP_FILE });

		try
		{
			const { token, name } = await this.runUpload(file);
			this.store.commit('setFileProperties', { fileToken: token, fileName: name });

			const datasetName = this.store.state.config.datasetProperties.name;
			if (!datasetName || datasetName.length === 0)
			{
				const autoName = this.makeDatasetName(name);
				if (autoName)
				{
					this.store.commit('setDatasetProperties', { name: autoName });
				}
			}

			this.store.commit('setUploadStatus', { step: STEP_PARSE });
			const response = await requestDatasetView(this.store, this.sourceCode);

			this.store.commit('setUploadStatus', { step: STEP_REPORT });
			this.applyResponse(response);

			await new Promise((resolve) => setTimeout(resolve, STEP_3_HOLD_MS));
		}
		catch (error)
		{
			showErrorPopup(error, Loc.getMessage('DATASET_IMPORT_V2_ERROR_POPUP_TITLE_UPLOAD'));
		}
		finally
		{
			this.store.commit('setUploadStatus', { isUploading: false, step: 0 });
		}
	}

	private async runUpload(file: File): Promise<{ token: string, name: string }>
	{
		const { Uploader } = await Runtime.loadExtension('ui.uploader.core') as unknown as {
			Uploader: new (options: Record<string, unknown>) => UploaderInstance,
		};
		this.disposeUploader();

		return new Promise((resolve, reject) => {
			const uploader: UploaderInstance = new Uploader({
				controller: 'biconnector.integration.ui.fileUploaderController.datasetUploaderController',
				controllerOptions: {},
				multiple: false,
				autoUpload: true,
				maxFileSize: MAX_FILE_SIZE,
				acceptedFileTypes: ['.csv'],
				events: {
					'File:onUploadComplete': () => {
						const f = uploader.getFiles()[0];
						if (f && (!f.isComplete || f.isComplete()))
						{
							resolve({
								token: f.getServerFileId(),
								name: f.getName(),
							});
						}
					},
					'File:onError': (event: unknown) => {
						reject(this.normalizeError(event));
					},
					onError: (event: unknown) => {
						reject(this.normalizeError(event));
					},
				},
			});
			this.uploader = uploader;
			uploader.addFiles([file]);
		});
	}

	private disposeUploader(): void
	{
		this.uploader?.destroy();
		this.uploader = null;
	}

	private applyResponse(response: DatasetViewResponse): void
	{
		const headers = response?.data?.headers ?? [];

		this.store.commit('setFieldsSettings', mapHeadersToFieldsSettings(headers));
		this.store.commit('setPreviewData', extractPreviewRows(response));
	}

	private normalizeError(event: unknown): Error
	{
		const data = (event as { getData?: () => Array<unknown> })?.getData?.()?.[0];
		const message = (data as { message?: string })?.message
			|| (event as { message?: string })?.message
			|| Loc.getMessage('DATASET_IMPORT_V2_UPLOAD_ERROR')
			|| '';

		return new Error(message);
	}

	private makeDatasetName(fileName: string): string
	{
		const base = String(fileName ?? '').replace(/\.[^./\\]+$/, '');
		const cleaned = base
			.replace(/[^A-Za-z0-9_]/g, '_')
			.replace(/_+/g, '_')
			.replace(/^_+|_+$/g, '');

		if (cleaned.length === 0)
		{
			return '';
		}

		const prefixed = /^[A-Za-z]/.test(cleaned) ? cleaned : `D_${cleaned}`;

		return prefixed.slice(0, 30).toLowerCase();
	}
}
