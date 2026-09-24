import { ajax } from 'main.core';

class CheckinOnboardingBannerService
{
	async shouldShow(): Promise<boolean>
	{
		const response = await ajax.runAction('stafftrack.CheckInOnboarding.getShouldShow', { json: {} });

		return Boolean(response?.data);
	}

	async registerShown(): Promise<void>
	{
		await ajax.runAction('stafftrack.CheckInOnboarding.registerShown', { json: {} });
	}

	async enable(): Promise<boolean>
	{
		const response = await ajax.runAction('stafftrack.CheckInOnboarding.enableAll', { json: {} });

		return Boolean(response?.data);
	}
}

export { CheckinOnboardingBannerService };
export const checkinOnboardingBannerService = new CheckinOnboardingBannerService();
