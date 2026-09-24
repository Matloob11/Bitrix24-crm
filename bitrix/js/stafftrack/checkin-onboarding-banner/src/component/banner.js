import { Extension, Loc } from 'main.core';
import { Button as UiButton, AirButtonStyle, ButtonSize } from 'ui.vue3.components.button';
import { BIcon, Outline } from 'ui.icon-set.api.vue';

import { checkinOnboardingBannerService } from '../service';
import { FeatureRow } from './feature-row';
import './banner.css';

// @vue/component
export const Banner = {
	name: 'CheckinOnboardingBanner',
	components: {
		UiButton,
		BIcon,
		FeatureRow,
	},
	props: {
		onClose: {
			type: Function,
			default: () => {},
		},
	},
	setup(): Object
	{
		const settings = Extension.getSettings('stafftrack.checkin-onboarding-banner');
		const showAiReportsFeature = Boolean(settings.get('showAiReportsFeature'));
		const isGeoFeaturesAvailable = Boolean(settings.get('isGeoFeaturesAvailable'));

		const geoFeature = {
			icon: Outline.CLOCK,
			title: Loc.getMessage('STAFFTRACK_CHECKIN_BANNER_SUBTITLE_1'),
			description: isGeoFeaturesAvailable
				? Loc.getMessage('STAFFTRACK_CHECKIN_BANNER_DESCRIPTION_1_MSGVER_1')
				: Loc.getMessage('STAFFTRACK_CHECKIN_BANNER_DESCRIPTION_1_ALT'),
		};

		const aiFeature = showAiReportsFeature
			? {
				icon: Outline.AI_STARS,
				title: Loc.getMessage('STAFFTRACK_CHECKIN_BANNER_SUBTITLE_2'),
				description: Loc.getMessage('STAFFTRACK_CHECKIN_BANNER_DESCRIPTION_2_MSGVER_1'),
			}
			: {
				icon: Outline.AI_STARS,
				title: Loc.getMessage('STAFFTRACK_CHECKIN_BANNER_SUBTITLE_2_ALT'),
				description: Loc.getMessage('STAFFTRACK_CHECKIN_BANNER_DESCRIPTION_2_ALT'),
			};

		const features = [
			geoFeature,
			aiFeature,
			{
				icon: Outline.BULLETED_LIST,
				title: Loc.getMessage('STAFFTRACK_CHECKIN_BANNER_SUBTITLE_3'),
				description: Loc.getMessage('STAFFTRACK_CHECKIN_BANNER_DESCRIPTION_3'),
			},
		];

		return {
			Loc,
			Outline,
			ButtonSize,
			AirButtonStyle,
			features,
			showAiReportsFeature,
			isGeoFeaturesAvailable,
		};
	},
	data(): Object
	{
		return {
			loading: false,
			activated: false,
			closeTimerId: null,
		};
	},
	beforeUnmount(): void
	{
		if (this.closeTimerId !== null)
		{
			clearTimeout(this.closeTimerId);
			this.closeTimerId = null;
		}
	},
	methods: {
		async onEnableClick(): Promise<void>
		{
			if (this.loading || this.activated)
			{
				return;
			}

			this.loading = true;
			try
			{
				const ok = await checkinOnboardingBannerService.enable();
				if (ok)
				{
					this.activated = true;
					this.closeTimerId = setTimeout(() => this.onClose(), 2000);
				}
			}
			catch (error)
			{
				console.error('[CheckinOnboardingBanner] enable failed', error);
			}
			finally
			{
				this.loading = false;
			}
		},
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
	`,
};
