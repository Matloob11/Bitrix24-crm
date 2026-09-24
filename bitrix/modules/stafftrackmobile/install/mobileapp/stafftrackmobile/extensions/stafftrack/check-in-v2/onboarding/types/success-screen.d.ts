declare type OnboardingSuccessScreenProps = {
	title: string,
	description: string,
	buttonText: string,
	image?: string,
	position: OnboardingSlidePosition,
	onClose?: () => void,
};
