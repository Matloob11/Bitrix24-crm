import { Type } from 'main.core';
import { Popup } from 'main.popup';
import { BitrixVue, type VueCreateAppResult } from 'ui.vue3';

import { Banner } from './component/banner';
import { checkinOnboardingBannerService } from './service';

const POPUP_ID = 'stafftrack-checkin-banner';

export class CheckinOnboardingBanner
{
	#popup: ?Popup = null;
	#app: ?VueCreateAppResult = null;
	#resizeObserver: ?ResizeObserver = null;

	static async openIfNeeded(): Promise<void>
	{
		try
		{
			const shouldShow = await checkinOnboardingBannerService.shouldShow();
			if (!shouldShow)
			{
				return;
			}

			new CheckinOnboardingBanner().open();
		}
		catch (error)
		{
			console.error('[CheckinOnboardingBanner] shouldShow failed', error);
		}
	}

	open(): void
	{
		this.#popup = new Popup({
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
				onPopupAfterClose: (): void => {
					this.#destroy();
				},
			},
		});

		this.#popup.show();

		const container = this.#popup.getContentContainer();

		const app = BitrixVue.createApp(Banner, {
			onClose: (): void => {
				this.#popup?.close();
			},
		});
		app.mount(container);
		this.#app = app;

		if (!Type.isUndefined(ResizeObserver))
		{
			this.#resizeObserver = new ResizeObserver((): void => {
				this.#popup?.adjustPosition?.();
			});
			this.#resizeObserver.observe(container);
		}

		checkinOnboardingBannerService.registerShown().catch((error: Error): void => {
			console.error('[CheckinOnboardingBanner] registerShown failed', error);
		});
	}

	#destroy(): void
	{
		if (this.#resizeObserver)
		{
			this.#resizeObserver.disconnect();
			this.#resizeObserver = null;
		}

		if (this.#app)
		{
			this.#app.unmount();
			this.#app = null;
		}

		if (this.#popup)
		{
			this.#popup.destroy();
			this.#popup = null;
		}
	}
}
