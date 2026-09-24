declare type OnboardingSlidePosition = {
	top: number,
	horizontal: number,
};

declare type OnboardingSlideConfig = {
	id: string,
	title: string,
	description: string,
	image: string,
	buttonText: string,
	requiresPlanningService?: boolean,
};

declare type OnboardingSlideProps = OnboardingSlideConfig & {
	position: OnboardingSlidePosition,
	onActivate?: (id: string) => Promise<void> | void,
};

declare type OnboardingSlideState = {
	loadingButton: boolean,
};
