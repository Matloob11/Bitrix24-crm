import { ajax } from 'main.core';
import type { Store } from 'ui.vue3.vuex';
import type { FieldSettings, RootState } from '../types/state';

export type DatasetViewHeader = {
	type: string,
	name?: string,
	externalCode: string,
	description?: string,
};

export type DatasetViewResponse = {
	data?: {
		headers?: Array<DatasetViewHeader>,
		data?: Array<Array<string | number | null>>,
	},
	errors?: Array<{ message: string }>,
};

export function requestDatasetView(store: Store<RootState>, sourceCode: string): Promise<DatasetViewResponse>
{
	const state = store.state.config;

	return ajax.runAction('biconnector.externalsource.dataset.view', {
		data: {
			type: sourceCode,
			fields: {
				fileProperties: state.fileProperties,
				datasetProperties: state.datasetProperties,
				fieldsSettings: state.fieldsSettings,
				dataFormats: state.dataFormats,
			},
		},
	}) as Promise<DatasetViewResponse>;
}

export function mapHeadersToFieldsSettings(headers: Array<DatasetViewHeader>): Array<FieldSettings>
{
	return headers.map((header, index) => ({
		id: 0,
		visible: true,
		type: header.type,
		name: header.name && header.name.length > 0 ? header.name : `FIELD_${index}`,
		originalName: header.externalCode,
		externalCode: header.externalCode,
		description: header.description ?? '',
	}));
}

export function extractPreviewRows(response: DatasetViewResponse): Array<Array<string | number | null>>
{
	return response?.data?.data ?? [];
}
