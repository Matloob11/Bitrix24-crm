import { BIcon } from 'ui.icon-set.api.vue';

// @vue/component
export const FeatureRow = {
	name: 'CheckinOnboardingBannerFeatureRow',
	components: {
		BIcon,
	},
	props: {
		icon: {
			type: String,
			required: true,
		},
		title: {
			type: String,
			required: true,
		},
		description: {
			type: String,
			required: true,
		},
	},
	template: `
		<div class="stafftrack-checkin-banner__text-item">
			<BIcon :name="icon" :size="32" color="var(--ui-color-base-0)" />
			<div class="stafftrack-checkin-banner__text-item_text">
				<div class="stafftrack-checkin-banner__text-item_text-title">{{ title }}</div>
				<div class="stafftrack-checkin-banner__text-item_text-description">{{ description }}</div>
			</div>
		</div>
	`,
};
