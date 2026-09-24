declare type OnboardingProps = {
	onActivate: (id: string) => Promise<void>,
	onClose?: (result: { wasSuccessful: boolean, shouldRevealCheckIn: boolean }) => void,
	isPlanningServiceEnabled?: boolean,
	canEnableFeatures?: boolean,
};

declare type OnboardingState = {
	showSuccess: boolean,
};
