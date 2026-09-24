import { Loc, Reflection } from 'main.core';
import { EventEmitter } from 'main.core.events';
import { SidePanel } from 'ui.sidepanel';

const FIELD_KEYS = ['date', 'datetime', 'money', 'double', 'timezone'];
const DATA_FORMATS_HELP_ARTICLE = '23378698';
const SAVE_EVENT = 'biconnector:dataset-import-v2:formats-save';
const RESULT_EVENT = 'BIConnector.DatasetImportV2.DataFormats:onSave';

export const DataFormatsDialog = {
	props: {
		initial: {
			type: Object,
			required: true,
		},
	},
	data()
	{
		return {
			timezoneLabel: Loc.getMessage('DATASET_IMPORT_V2_DATA_FORMATS_TIMEZONE_LABEL'),
			timezoneHint: Loc.getMessage('DATASET_IMPORT_V2_DATA_FORMATS_TIMEZONE_HINT'),
			timezoneDefaultLabel: Loc.getMessage('DATASET_IMPORT_V2_DATA_FORMATS_TIMEZONE_DEFAULT'),
			dateLabel: Loc.getMessage('DATASET_IMPORT_V2_DATA_FORMATS_DATE_LABEL'),
			dateHint: Loc.getMessage('DATASET_IMPORT_V2_DATA_FORMATS_DATE_HINT'),
			datetimeLabel: Loc.getMessage('DATASET_IMPORT_V2_DATA_FORMATS_DATETIME_LABEL'),
			datetimeHint: Loc.getMessage('DATASET_IMPORT_V2_DATA_FORMATS_DATETIME_HINT'),
			moneyLabel: Loc.getMessage('DATASET_IMPORT_V2_DATA_FORMATS_MONEY_LABEL'),
			moneyHint: Loc.getMessage('DATASET_IMPORT_V2_DATA_FORMATS_MONEY_HINT'),
			doubleLabel: Loc.getMessage('DATASET_IMPORT_V2_DATA_FORMATS_DOUBLE_LABEL'),
			doubleHint: Loc.getMessage('DATASET_IMPORT_V2_DATA_FORMATS_DOUBLE_HINT'),
			draft: this.makeDraft(),
		};
	},
	computed:
	{
		hintParts()
		{
			const message = Loc.getMessage('DATASET_IMPORT_V2_DATA_FORMATS_HINT') ?? '';
			const [textBeforeLink, messageTail = ''] = message.split('[link]');
			const [linkText, textAfterLink = ''] = messageTail.split('[/link]');

			return { textBeforeLink, linkText, textAfterLink };
		},
		dateOptions() { return this.initial?.templates?.date ?? []; },
		datetimeOptions() { return this.initial?.templates?.datetime ?? []; },
		moneyOptions() { return this.initial?.templates?.money ?? []; },
		doubleOptions() { return this.initial?.templates?.double ?? []; },
		timezoneOptions() { return this.initial?.templates?.timezone ?? []; },
	},
	mounted()
	{
		this.onSaveClick = () => this.onSave();
		EventEmitter.subscribe(SAVE_EVENT, this.onSaveClick);
	},
	beforeUnmount()
	{
		EventEmitter.unsubscribe(SAVE_EVENT, this.onSaveClick);
	},
	methods:
	{
		showHelpArticle()
		{
			Reflection.getClass('top.BX.Helper')?.show(`redirect=detail&code=${DATA_FORMATS_HELP_ARTICLE}`);
		},
		makeDraft()
		{
			const current = this.initial?.current ?? {};
			const draft = {};
			FIELD_KEYS.forEach((key) => { draft[key] = current[key] ?? ''; });

			return draft;
		},
		onSave()
		{
			const payload = {};
			FIELD_KEYS.forEach((key) => { payload[key] = this.draft[key]; });
			SidePanel.Instance.postMessage(window, RESULT_EVENT, payload);
			const slider = SidePanel.Instance.getTopSlider?.();
			slider?.close();
		},
	},
	// language=Vue
	template: `
		<div class="biconnector-dataset-import-v2-formats">
			<div class="biconnector-dataset-import-v2-formats__body">
				<div class="biconnector-dataset-import-v2-formats__hint">
					{{ hintParts.textBeforeLink }}<a
						v-if="hintParts.linkText"
						href="#"
						class="biconnector-dataset-import-v2-formats__hint-link"
						@click.prevent="showHelpArticle"
					>{{ hintParts.linkText }}</a>{{ hintParts.textAfterLink }}
				</div>

				<label class="biconnector-dataset-import-v2-formats__field">
					<span class="biconnector-dataset-import-v2-formats__field-label">{{ timezoneLabel }}</span>
					<span class="biconnector-dataset-import-v2-formats__field-sublabel">{{ timezoneHint }}</span>
					<select v-model="draft.timezone" class="biconnector-dataset-import-v2-formats__select">
						<option value="">{{ timezoneDefaultLabel }}</option>
						<option
							v-for="opt in timezoneOptions"
							:key="opt.value"
							:value="opt.value"
						>{{ opt.title || opt.value }}</option>
					</select>
				</label>

				<label class="biconnector-dataset-import-v2-formats__field">
					<span class="biconnector-dataset-import-v2-formats__field-label">{{ dateLabel }}</span>
					<span class="biconnector-dataset-import-v2-formats__field-sublabel">{{ dateHint }}</span>
					<select v-model="draft.date" class="biconnector-dataset-import-v2-formats__select">
						<option
							v-for="opt in dateOptions"
							:key="opt.value"
							:value="opt.value"
						>{{ opt.title || opt.value }}</option>
					</select>
				</label>

				<label class="biconnector-dataset-import-v2-formats__field">
					<span class="biconnector-dataset-import-v2-formats__field-label">{{ datetimeLabel }}</span>
					<span class="biconnector-dataset-import-v2-formats__field-sublabel">{{ datetimeHint }}</span>
					<select v-model="draft.datetime" class="biconnector-dataset-import-v2-formats__select">
						<option
							v-for="opt in datetimeOptions"
							:key="opt.value"
							:value="opt.value"
						>{{ opt.title || opt.value }}</option>
					</select>
				</label>

				<label class="biconnector-dataset-import-v2-formats__field">
					<span class="biconnector-dataset-import-v2-formats__field-label">{{ moneyLabel }}</span>
					<span class="biconnector-dataset-import-v2-formats__field-sublabel">{{ moneyHint }}</span>
					<select v-model="draft.money" class="biconnector-dataset-import-v2-formats__select">
						<option
							v-for="opt in moneyOptions"
							:key="opt.value"
							:value="opt.value"
						>{{ opt.title || opt.value }}</option>
					</select>
				</label>

				<label class="biconnector-dataset-import-v2-formats__field">
					<span class="biconnector-dataset-import-v2-formats__field-label">{{ doubleLabel }}</span>
					<span class="biconnector-dataset-import-v2-formats__field-sublabel">{{ doubleHint }}</span>
					<select v-model="draft.double" class="biconnector-dataset-import-v2-formats__select">
						<option
							v-for="opt in doubleOptions"
							:key="opt.value"
							:value="opt.value"
						>{{ opt.title || opt.value }}</option>
					</select>
				</label>
			</div>
		</div>
	`,
};
