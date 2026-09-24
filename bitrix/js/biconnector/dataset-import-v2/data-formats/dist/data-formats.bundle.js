/* eslint-disable */
this.BX = this.BX || {};
this.BX.BIConnector = this.BX.BIConnector || {};
(function (exports, ui_vue3, main_core, main_core_events, ui_sidepanel) {
	'use strict';

	const FIELD_KEYS = ['date', 'datetime', 'money', 'double', 'timezone'];
	const DATA_FORMATS_HELP_ARTICLE = '23378698';
	const SAVE_EVENT = 'biconnector:dataset-import-v2:formats-save';
	const RESULT_EVENT = 'BIConnector.DatasetImportV2.DataFormats:onSave';
	const DataFormatsDialog = {
		props: {
			initial: {
				type: Object,
				required: true
			}
		},
		data() {
			return {
				timezoneLabel: main_core.Loc.getMessage('DATASET_IMPORT_V2_DATA_FORMATS_TIMEZONE_LABEL'),
				timezoneHint: main_core.Loc.getMessage('DATASET_IMPORT_V2_DATA_FORMATS_TIMEZONE_HINT'),
				timezoneDefaultLabel: main_core.Loc.getMessage('DATASET_IMPORT_V2_DATA_FORMATS_TIMEZONE_DEFAULT'),
				dateLabel: main_core.Loc.getMessage('DATASET_IMPORT_V2_DATA_FORMATS_DATE_LABEL'),
				dateHint: main_core.Loc.getMessage('DATASET_IMPORT_V2_DATA_FORMATS_DATE_HINT'),
				datetimeLabel: main_core.Loc.getMessage('DATASET_IMPORT_V2_DATA_FORMATS_DATETIME_LABEL'),
				datetimeHint: main_core.Loc.getMessage('DATASET_IMPORT_V2_DATA_FORMATS_DATETIME_HINT'),
				moneyLabel: main_core.Loc.getMessage('DATASET_IMPORT_V2_DATA_FORMATS_MONEY_LABEL'),
				moneyHint: main_core.Loc.getMessage('DATASET_IMPORT_V2_DATA_FORMATS_MONEY_HINT'),
				doubleLabel: main_core.Loc.getMessage('DATASET_IMPORT_V2_DATA_FORMATS_DOUBLE_LABEL'),
				doubleHint: main_core.Loc.getMessage('DATASET_IMPORT_V2_DATA_FORMATS_DOUBLE_HINT'),
				draft: this.makeDraft()
			};
		},
		computed: {
			hintParts() {
				const message = main_core.Loc.getMessage('DATASET_IMPORT_V2_DATA_FORMATS_HINT') ?? '';
				const [textBeforeLink, messageTail = ''] = message.split('[link]');
				const [linkText, textAfterLink = ''] = messageTail.split('[/link]');
				return {
					textBeforeLink,
					linkText,
					textAfterLink
				};
			},
			dateOptions() {
				return this.initial?.templates?.date ?? [];
			},
			datetimeOptions() {
				return this.initial?.templates?.datetime ?? [];
			},
			moneyOptions() {
				return this.initial?.templates?.money ?? [];
			},
			doubleOptions() {
				return this.initial?.templates?.double ?? [];
			},
			timezoneOptions() {
				return this.initial?.templates?.timezone ?? [];
			}
		},
		mounted() {
			this.onSaveClick = () => this.onSave();
			main_core_events.EventEmitter.subscribe(SAVE_EVENT, this.onSaveClick);
		},
		beforeUnmount() {
			main_core_events.EventEmitter.unsubscribe(SAVE_EVENT, this.onSaveClick);
		},
		methods: {
			showHelpArticle() {
				main_core.Reflection.getClass('top.BX.Helper')?.show(`redirect=detail&code=${DATA_FORMATS_HELP_ARTICLE}`);
			},
			makeDraft() {
				const current = this.initial?.current ?? {};
				const draft = {};
				FIELD_KEYS.forEach(key => {
					draft[key] = current[key] ?? '';
				});
				return draft;
			},
			onSave() {
				const payload = {};
				FIELD_KEYS.forEach(key => {
					payload[key] = this.draft[key];
				});
				ui_sidepanel.SidePanel.Instance.postMessage(window, RESULT_EVENT, payload);
				const slider = ui_sidepanel.SidePanel.Instance.getTopSlider?.();
				slider?.close();
			}
		},
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
	`
	};

	class DataFormatsAppFactory {
		static getApp(initialData) {
			return ui_vue3.BitrixVue.createApp({
				name: 'DataFormatsApp',
				components: {
					DataFormatsDialog
				},
				data() {
					return {
						initialData
					};
				},
				template: '<DataFormatsDialog :initial="initialData" />'
			});
		}
	}

	exports.DataFormatsAppFactory = DataFormatsAppFactory;

})(this.BX.BIConnector.DatasetImportV2 = this.BX.BIConnector.DatasetImportV2 || {}, BX.Vue3, BX, BX.Event, BX);
//# sourceMappingURL=data-formats.bundle.js.map
