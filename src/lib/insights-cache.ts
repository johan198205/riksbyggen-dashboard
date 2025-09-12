interface InsightData {
  summaryMarkdown: string;
  actions: string[];
  anomalies: string[];
  confidence: 'low' | 'medium' | 'high';
}

interface CacheEntry {
  data: InsightData;
  timestamp: number;
  ttl: number;
}

interface CacheKey {
  metric: string;
  startDate: string;
  endDate: string;
  granularity: string;
}

class InsightsCache {
  private cache = new Map<string, CacheEntry>();
  private readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes

  private generateKey({ metric, startDate, endDate, granularity }: CacheKey): string {
    return `insight:${metric}:${startDate}:${endDate}:${granularity}`;
  }

  private isExpired(entry: CacheEntry): boolean {
    return Date.now() - entry.timestamp > entry.ttl;
  }

  get(key: CacheKey): InsightData | null {
    const cacheKey = this.generateKey(key);
    const entry = this.cache.get(cacheKey);
    
    if (!entry) {
      return null;
    }

    if (this.isExpired(entry)) {
      this.cache.delete(cacheKey);
      return null;
    }

    return entry.data;
  }

  set(key: CacheKey, data: InsightData, ttl: number = this.DEFAULT_TTL): void {
    const cacheKey = this.generateKey(key);
    this.cache.set(cacheKey, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  has(key: CacheKey): boolean {
    const cacheKey = this.generateKey(key);
    const entry = this.cache.get(cacheKey);
    return entry ? !this.isExpired(entry) : false;
  }

  invalidate(key: CacheKey): void {
    const cacheKey = this.generateKey(key);
    this.cache.delete(cacheKey);
  }

  invalidateByMetric(metric: string): void {
    for (const [cacheKey] of this.cache) {
      if (cacheKey.startsWith(`insight:${metric}:`)) {
        this.cache.delete(cacheKey);
      }
    }
  }

  invalidateByDateRange(startDate: string, endDate: string): void {
    for (const [cacheKey] of this.cache) {
      if (cacheKey.includes(`:${startDate}:${endDate}:`)) {
        this.cache.delete(cacheKey);
      }
    }
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }
}

export const insightsCache = new InsightsCache();
export type { InsightData, CacheKey };
