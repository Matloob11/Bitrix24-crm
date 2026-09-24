type UnsupportedFeatureImage = {
	name: string,
	folder: string,
	moduleId?: string,
	width: number,
	height: number,
};

type UnsupportedFeatureItem = {
	icon: object,
	text: string,
};

type UnsupportedFeaturePresetValue = {
	testIdPrefix: string,
	title: string,
	subtitle?: string,
	description?: string,
	footnote?: string,
	image: UnsupportedFeatureImage,
	items?: UnsupportedFeatureItem[],
	redirectUrl?: string,
	qrTitle?: string,
	buttonText?: string,
};

type UnsupportedFeatureProps = {
	layout: object,
	type: UnsupportedFeaturePreset,
};

declare class UnsupportedFeaturePreset
{
	static readonly FLOWS: UnsupportedFeaturePreset;
	static readonly ANALYTICS: UnsupportedFeaturePreset;
	static readonly SCRUM: UnsupportedFeaturePreset;
	static readonly PROJECT_RESTRICTION: UnsupportedFeaturePreset;

	constructor(name: string, value: UnsupportedFeaturePresetValue);

	static has(preset: any): boolean;

	getTitle(): string;
	getQrTitle(): string | undefined;
	getButtonText(): string;
	getSubtitle(): string | undefined;
	getDescription(): string | undefined;
	getFootnote(): string | undefined;
	getImageWidth(): number;
	getImageHeight(): number;
	getImageUri(): string;
	getItems(): UnsupportedFeatureItem[] | undefined;
	getRedirectUrl(): string | undefined;
	hasRedirectUrl(): boolean;
	hasFootnote(): boolean;
	getTestIdPrefix(): string;
}

declare class UnsupportedFeature
{
	constructor(props: UnsupportedFeatureProps);
	render(): object;
}
