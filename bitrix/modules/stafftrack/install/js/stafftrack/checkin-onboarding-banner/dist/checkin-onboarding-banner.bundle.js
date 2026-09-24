/* eslint-disable */
this.BX = this.BX || {};
(function (exports, main_core, main_popup, ui_vue3, ui_vue3_components_button, ui_iconSet_api_vue) {
	'use strict';

	class CheckinOnboardingBannerService {
		async shouldShow() {
			const response = await main_core.ajax.runAction('stafftrack.CheckInOnboarding.getShouldShow', {
				json: {}
			});
			return Boolean(response?.data);
		}
		async registerShown() {
			await main_core.ajax.runAction('stafftrack.CheckInOnboarding.registerShown', {
				json: {}
			});
		}
		async enable() {
			const response = await main_core.ajax.runAction('stafftrack.CheckInOnboarding.enableAll', {
				json: {}
			});
			return Boolean(response?.data);
		}
	}
	const checkinOnboardingBannerService = new CheckinOnboardingBannerService();

	// @vue/component
	const FeatureRow = {
		name: 'CheckinOnboardingBannerFeatureRow',
		components: {
			BIcon: ui_iconSet_api_vue.BIcon
		},
		props: {
			icon: {
				type: String,
				required: true
			},
			title: {
				type: String,
				required: true
			},
			description: {
				type: String,
				required: true
			}
		},
		template: `
		<div class="stafftrack-checkin-banner__text-item">
			<BIcon :name="icon" :size="32" color="var(--ui-color-base-0)" />
			<div class="stafftrack-checkin-banner__text-item_text">
				<div class="stafftrack-checkin-banner__text-item_text-title">{{ title }}</div>
				<div class="stafftrack-checkin-banner__text-item_text-description">{{ description }}</div>
			</div>
		</div>
	`
	};

	// @vue/component
	const Banner = {
		name: 'CheckinOnboardingBanner',
		components: {
			UiButton: ui_vue3_components_button.Button,
			BIcon: ui_iconSet_api_vue.BIcon,
			FeatureRow
		},
		props: {
			onClose: {
				type: Function,
				default: () => {}
			}
		},
		setup() {
			const settings = main_core.Extension.getSettings('stafftrack.checkin-onboarding-banner');
			const showAiReportsFeature = Boolean(settings.get('showAiReportsFeature'));
			const isGeoFeaturesAvailable = Boolean(settings.get('isGeoFeaturesAvailable'));
			const geoFeature = {
				icon: ui_iconSet_api_vue.Outline.CLOCK,
				title: main_core.Loc.getMessage('STAFFTRACK_CHECKIN_BANNER_SUBTITLE_1'),
				description: isGeoFeaturesAvailable ? main_core.Loc.getMessage('STAFFTRACK_CHECKIN_BANNER_DESCRIPTION_1_MSGVER_1') : main_core.Loc.getMessage('STAFFTRACK_CHECKIN_BANNER_DESCRIPTION_1_ALT')
			};
			const aiFeature = showAiReportsFeature ? {
				icon: ui_iconSet_api_vue.Outline.AI_STARS,
				title: main_core.Loc.getMessage('STAFFTRACK_CHECKIN_BANNER_SUBTITLE_2'),
				description: main_core.Loc.getMessage('STAFFTRACK_CHECKIN_BANNER_DESCRIPTION_2_MSGVER_1')
			} : {
				icon: ui_iconSet_api_vue.Outline.AI_STARS,
				title: main_core.Loc.getMessage('STAFFTRACK_CHECKIN_BANNER_SUBTITLE_2_ALT'),
				description: main_core.Loc.getMessage('STAFFTRACK_CHECKIN_BANNER_DESCRIPTION_2_ALT')
			};
			const features = [geoFeature, aiFeature, {
				icon: ui_iconSet_api_vue.Outline.BULLETED_LIST,
				title: main_core.Loc.getMessage('STAFFTRACK_CHECKIN_BANNER_SUBTITLE_3'),
				description: main_core.Loc.getMessage('STAFFTRACK_CHECKIN_BANNER_DESCRIPTION_3')
			}];
			return {
				Loc: main_core.Loc,
				Outline: ui_iconSet_api_vue.Outline,
				ButtonSize: ui_vue3_components_button.ButtonSize,
				AirButtonStyle: ui_vue3_components_button.AirButtonStyle,
				features,
				showAiReportsFeature,
				isGeoFeaturesAvailable
			};
		},
		data() {
			return {
				loading: false,
				activated: false,
				closeTimerId: null
			};
		},
		beforeUnmount() {
			if (this.closeTimerId !== null) {
				clearTimeout(this.closeTimerId);
				this.closeTimerId = null;
			}
		},
		methods: {
			async onEnableClick() {
				if (this.loading || this.activated) {
					return;
				}
				this.loading = true;
				try {
					const ok = await checkinOnboardingBannerService.enable();
					if (ok) {
						this.activated = true;
						this.closeTimerId = setTimeout(() => this.onClose(), 2000);
					}
				} catch (error) {
					console.error('[CheckinOnboardingBanner] enable failed', error);
				} finally {
					this.loading = false;
				}
			}
		},
		template: `
		<div class="stafftrack-checkin-banner --ui-context-content-dark" data-testid="stafftrack-checkin-banner">
			<div class="stafftrack-checkin-banner__text-block">
				<div class="stafftrack-checkin-banner__title">
					{{ Loc.getMessage('STAFFTRACK_CHECKIN_BANNER_TITLE_MSGVER_1') }}
				</div>

				<FeatureRow
					v-for="(feature, index) in features"
					:key="index"
					:icon="feature.icon"
					:title="feature.title"
					:description="feature.description"
					:data-testid="'stafftrack-checkin-banner-feature-' + index"
				/>

				<div class="stafftrack-checkin-banner__actions">
					<UiButton
						v-if="!activated"
						class="--ui-context-content-light"
						data-testid="stafftrack-checkin-banner-enable-btn"
						:text="Loc.getMessage('STAFFTRACK_CHECKIN_BANNER_BUTTON_ENABLE')"
						:loading="loading"
						:size="ButtonSize.EXTRA_LARGE"
						:style="AirButtonStyle.FILLED_BITRIX_GPT"
						@click="onEnableClick"
					/>
					<div v-else class="stafftrack-checkin-banner__activation-success" data-testid="stafftrack-checkin-banner-activated">
						<BIcon :name="Outline.CHECK_L" :size="24" color="var(--ui-color-base-0)" />
						<span class="stafftrack-checkin-banner__activation-success-text">
							{{ Loc.getMessage('STAFFTRACK_CHECKIN_BANNER_BUTTON_ACTIVATED') }}
						</span>
					</div>
				</div>
			</div>

			<div
				class="stafftrack-checkin-banner__image-block" data-testid="stafftrack-checkin-banner-image"
				:class="{
					'--image-geo': !isGeoFeaturesAvailable,
					'--image-alt': isGeoFeaturesAvailable && !showAiReportsFeature,
					'--ai-unavailable': !showAiReportsFeature,
				}"
			>
				<div class="stafftrack-checkin-banner__image-block_text-element --element-1">
					{{ Loc.getMessage('STAFFTRACK_CHECKIN_BANNER_INFO_1') }}
				</div>
				<div class="stafftrack-checkin-banner__image-block_text-element --element-2">
					{{ Loc.getMessage('STAFFTRACK_CHECKIN_BANNER_INFO_2') }}
				</div>
				<div class="stafftrack-checkin-banner__image-block_text-element --element-3">
					{{ Loc.getMessage('STAFFTRACK_CHECKIN_BANNER_INFO_3') }}
				</div>
			</div>
		</div>
	`
	};

	const POPUP_ID = 'stafftrack-checkin-banner';
	class CheckinOnboardingBanner {
		#popup = null;
		#app = null;
		#resizeObserver = null;
		static async openIfNeeded() {
			try {
				const shouldShow = await checkinOnboardingBannerService.shouldShow();
				if (!shouldShow) {
					return;
				}
				new CheckinOnboardingBanner().open();
			} catch (error) {
				console.error('[CheckinOnboardingBanner] shouldShow failed', error);
			}
		}
		open() {
			this.#popup = new main_popup.Popup({
				id: POPUP_ID,
				width: 905,
				content: '',
				closeIcon: true,
				autoHide: false,
				overlay: true,
				angle: false,
				padding: 0,
				borderRadius: '32px',
				background: 'transparent',
				className: 'stafftrack-checkin-banner-popup',
				events: {
					onPopupAfterClose: () => {
						this.#destroy();
					}
				}
			});
			this.#popup.show();
			const container = this.#popup.getContentContainer();
			const app = ui_vue3.BitrixVue.createApp(Banner, {
				onClose: () => {
					this.#popup?.close();
				}
			});
			app.mount(container);
			this.#app = app;
			if (!main_core.Type.isUndefined(ResizeObserver)) {
				this.#resizeObserver = new ResizeObserver(() => {
					this.#popup?.adjustPosition?.();
				});
				this.#resizeObserver.observe(container);
			}
			checkinOnboardingBannerService.registerShown().catch(error => {
				console.error('[CheckinOnboardingBanner] registerShown failed', error);
			});
		}
		#destroy() {
			if (this.#resizeObserver) {
				this.#resizeObserver.disconnect();
				this.#resizeObserver = null;
			}
			if (this.#app) {
				this.#app.unmount();
				this.#app = null;
			}
			if (this.#popup) {
				this.#popup.destroy();
				this.#popup = null;
			}
		}
	}

	window.BX.ready(() => CheckinOnboardingBanner.openIfNeeded());

	exports.CheckinOnboardingBanner = CheckinOnboardingBanner;

})(this.BX.Stafftrack = this.BX.Stafftrack || {}, BX, BX.Main, BX.Vue3, BX.Vue3.Components, BX.UI.IconSet);
//# sourceMappingURL=checkin-onboarding-banner.bundle.js.map
