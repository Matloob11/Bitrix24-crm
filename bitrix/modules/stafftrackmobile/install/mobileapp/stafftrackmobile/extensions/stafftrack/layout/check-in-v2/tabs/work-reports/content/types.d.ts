import type { FullReportToSend, ReportSettings } from 'timeman/work-reports/api/types';

declare global {
	type WorkReportsPreloadData = {
		draftReport: FullReportToSend | null,
		settings?: ReportSettings,
	};

	type WorkReportsContentProps = {
		parentWidget: object,
		tabsWidget?: object,
		preloadData?: WorkReportsPreloadData,
		tabId?: string,
		isTabUnavailable?: boolean,
	};
}
