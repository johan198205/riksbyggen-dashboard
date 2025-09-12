import { insightsCache, type InsightData, type CacheKey } from './insights-cache';

interface PrefetchOptions {
  dateRange: { start: string; end: string };
  granularity: string;
  metrics: string[];
  onProgress?: (metric: string, status: 'started' | 'completed' | 'error') => void;
}

interface PrefetchResult {
  success: string[];
  errors: Array<{ metric: string; error: string }>;
}

class InsightsPrefetcher {
  private isPrefetching = false;
  private prefetchPromises = new Map<string, Promise<InsightData | null>>();

  async prefetchInsights({
    dateRange,
    granularity,
    metrics,
    onProgress
  }: PrefetchOptions): Promise<PrefetchResult> {
    if (this.isPrefetching) {
      console.log('Prefetch already in progress, skipping...');
      return { success: [], errors: [] };
    }

    this.isPrefetching = true;
    const success: string[] = [];
    const errors: Array<{ metric: string; error: string }> = [];

    try {
      console.log('Starting insights prefetch for metrics:', metrics);
      
      // Start prefetching for all metrics in parallel
      const prefetchPromises = metrics.map(async (metric) => {
        const cacheKey: CacheKey = {
          metric,
          startDate: dateRange.start,
          endDate: dateRange.end,
          granularity
        };

        // Check if already cached
        if (insightsCache.has(cacheKey)) {
          console.log(`Insights already cached for ${metric}`);
          onProgress?.(metric, 'completed');
          return insightsCache.get(cacheKey);
        }

        // Check if already prefetching this metric
        const prefetchKey = `${metric}:${dateRange.start}:${dateRange.end}:${granularity}`;
        if (this.prefetchPromises.has(prefetchKey)) {
          console.log(`Already prefetching ${metric}, waiting...`);
          return this.prefetchPromises.get(prefetchKey);
        }

        onProgress?.(metric, 'started');

        // Start prefetch
        const prefetchPromise = this.fetchInsights(metric, dateRange, granularity);
        this.prefetchPromises.set(prefetchKey, prefetchPromise);

        try {
          const insights = await prefetchPromise;
          if (insights) {
            insightsCache.set(cacheKey, insights);
            success.push(metric);
            onProgress?.(metric, 'completed');
          } else {
            errors.push({ metric, error: 'No insights returned' });
            onProgress?.(metric, 'error');
          }
          return insights;
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          errors.push({ metric, error: errorMessage });
          onProgress?.(metric, 'error');
          return null;
        } finally {
          this.prefetchPromises.delete(prefetchKey);
        }
      });

      await Promise.allSettled(prefetchPromises);
      
      console.log('Prefetch completed:', { success, errors });
      return { success, errors };
    } finally {
      this.isPrefetching = false;
    }
  }

  private async fetchInsights(
    metric: string,
    dateRange: { start: string; end: string },
    granularity: string
  ): Promise<InsightData | null> {
    try {
      console.log(`Fetching insights for ${metric}...`);
      
      // Add timeout to prevent hanging - longer timeout for longer date ranges
      const controller = new AbortController();
      const days = Math.ceil((new Date(dateRange.end).getTime() - new Date(dateRange.start).getTime()) / (1000 * 60 * 60 * 24));
      const timeoutMs = Math.max(60000, days * 1000); // At least 60s, plus 1s per day
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
      
      const response = await fetch('/api/insights', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          metric,
          dateRange,
          granularity,
        }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }

      console.log(`Successfully fetched insights for ${metric}`);
      return data as InsightData;
    } catch (error) {
      if (error.name === 'AbortError') {
        const days = Math.ceil((new Date(dateRange.end).getTime() - new Date(dateRange.start).getTime()) / (1000 * 60 * 60 * 24));
        const timeoutMs = Math.max(60000, days * 1000);
        console.error(`Timeout fetching insights for ${metric} (${timeoutMs/1000}s limit reached for ${days} days)`);
      } else {
        console.error(`Failed to fetch insights for ${metric}:`, error);
      }
      return null;
    }
  }

  getCachedInsights(metric: string, dateRange: { start: string; end: string }, granularity: string): InsightData | null {
    const cacheKey: CacheKey = {
      metric,
      startDate: dateRange.start,
      endDate: dateRange.end,
      granularity
    };
    return insightsCache.get(cacheKey);
  }

  isPrefetchingMetric(metric: string, dateRange: { start: string; end: string }, granularity: string): boolean {
    const prefetchKey = `${metric}:${dateRange.start}:${dateRange.end}:${granularity}`;
    return this.prefetchPromises.has(prefetchKey);
  }

  invalidateCache(dateRange: { start: string; end: string }): void {
    insightsCache.invalidateByDateRange(dateRange.start, dateRange.end);
  }

  clearCache(): void {
    insightsCache.clear();
  }
}

export const insightsPrefetcher = new InsightsPrefetcher();
export type { PrefetchOptions, PrefetchResult };
