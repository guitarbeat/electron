import { readStoredJson, writeStoredJson } from './storageClient.ts';

// ---------------------------------------------------------------------------
// Analytics metrics
// ---------------------------------------------------------------------------

export type AnalyticsMetric =
  | 'suggestion_submitted'
  | 'suggestion_accepted';

type AnalyticsMetrics = Partial<Record<AnalyticsMetric, number>>;

const ANALYTICS_STORAGE_KEY = 'movieList.analyticsMetrics';

const cloneAnalyticsMetrics = (metrics: AnalyticsMetrics): AnalyticsMetrics => ({
  ...metrics,
});

const isAnalyticsMetric = (value: string): value is AnalyticsMetric =>
  value === 'suggestion_submitted' ||
  value === 'suggestion_accepted';

const isAnalyticsMetricsRecord = (value: unknown): value is AnalyticsMetrics => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return false;
  }

  return Object.entries(value as Record<string, unknown>).every(
    ([metric, count]) => isAnalyticsMetric(metric) && typeof count === 'number'
  );
};

const readAnalyticsMetrics = (): AnalyticsMetrics =>
  readStoredJson({
    storageKey: ANALYTICS_STORAGE_KEY,
    validate: isAnalyticsMetricsRecord,
    clone: cloneAnalyticsMetrics,
    label: 'local analytics metrics',
  }) ?? {};

export const trackMetric = (metric: AnalyticsMetric): AnalyticsMetrics => {
  const currentMetrics = readAnalyticsMetrics();
  const nextMetrics: AnalyticsMetrics = {
    ...currentMetrics,
    [metric]: (currentMetrics[metric] ?? 0) + 1,
  };

  return writeStoredJson({
    storageKey: ANALYTICS_STORAGE_KEY,
    value: nextMetrics,
    clone: cloneAnalyticsMetrics,
    label: 'local analytics metrics',
  });
};

export const getMetricCount = (metric: AnalyticsMetric): number => {
  const metrics = readAnalyticsMetrics();
  return metrics[metric] ?? 0;
};
