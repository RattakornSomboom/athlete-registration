// Real aggregation lives in analytics.ts; database access is server-only.
export { summarize } from "./analytics";
export type { AnalyticsSummary, AnalyticsRow, AnalyticsQuota } from "./analytics";

