// ---------------------------------------------------------------------------
// Local-storage helpers (merged from storageClient.ts)
// ---------------------------------------------------------------------------

interface StoredJsonReadOptions<T> {
  storageKey: string;
  validate: (value: unknown) => value is T;
  clone: (value: T) => T;
  label: string;
}

interface StoredJsonWriteOptions<T> {
  storageKey: string;
  value: T;
  clone: (value: T) => T;
  label: string;
}

export const readStoredJson = <T>({
  storageKey,
  validate,
  clone,
  label,
}: StoredJsonReadOptions<T>): T | null => {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw);
    if (validate(parsed)) {
      return clone(parsed);
    }
  } catch (error) {
    console.warn(`Failed to read ${label}.`, error);
  }

  return null;
};

export const writeStoredJson = <T>({
  storageKey,
  value,
  clone,
  label,
}: StoredJsonWriteOptions<T>): T => {
  const nextValue = clone(value);

  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(nextValue));
    } catch (error) {
      console.warn(`Failed to persist ${label}.`, error);
    }
  }

  return nextValue;
};

export const removeStoredJson = (storageKey: string, label: string): void => {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.localStorage.removeItem(storageKey);
  } catch (error) {
    console.warn(`Failed to clear ${label}.`, error);
  }
};

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
