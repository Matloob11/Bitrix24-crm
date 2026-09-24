declare type CheckInFormOpenOptions = {
	parentWidget?: object,
	dialogId?: string | null,
	dialogName?: string | null,
};

declare type CheckInFormProps = {
	layoutWidget: object,
	dialogId?: string | null,
	dialogName?: string | null,
	loadingViewStyle?: object,
	title?: string | null,
	onCheckInSent?: (() => void) | null,
};

declare type CheckInFormFile = {
	token?: string,
	isDiskFile?: boolean,
	id?: string | number,
	hasError?: boolean,
};

declare type CheckInFormState = {
	isLoading: boolean,
	isDisabled: boolean,
	isSubmitting: boolean,
	isUnavailable: boolean,
	snapshotUrl: string | null,
	address: string | null,
	files: CheckInFormFile[],
	dialogId: string | null,
	dialogName: string | null,
};

declare type CheckInViewProps = {
	snapshotUrl: string | null,
	address: string | null,
	files: CheckInFormFile[],
	dialogName: string | null,
	isSubmitting: boolean,
	title?: string | null,
	testId: (suffix?: string) => string,
	hasInputError: boolean,
	hasUploadingFiles: boolean,
	remainderCharacters: number,
	onChangeDescription: (description: string) => void,
	canUploadFiles: boolean,
	onChangeFiles: (files: CheckInFormFile[]) => void,
	fileFieldRef: (ref: object) => void,
	onRef: (ref: object) => void,
	parentWidget: object,
	onOpenChat: () => void,
	onClearChat: () => void,
	onSendCheckIn: () => void,
};

declare type LoadingViewProps = {
	testId?: (suffix?: string) => string,
	onRef: (ref: object) => void,
	style: object,
	title?: string | null,
};
