/**
 * In-memory cache for landing profile queries
 * Provides fast, temporary storage for API responses with TTL support.
 */

interface CacheItem<T> {
  data: T;
  timestamp: number;
}

interface FilterParams {
  thang?: string;
  dept?: string;
  unit?: string;
  prov?: string;
}

interface CacheStats {
  total: number;
  expired: number;
  active: number;
  ttl: string;
}

class QueryCache {
  private cache: Map<string, CacheItem<unknown>>;
  private maxItems: number;
  private ttl: number;

  constructor() {
    this.cache = new Map();
    this.maxItems = 50;
    this.ttl = 60 * 60 * 1000; // 1 hour
  }

  generateKey(queryType: string, params: FilterParams): string {
    return `landing_${queryType}_${params.thang ?? ""}_${params.dept ?? ""}_${params.unit ?? ""}_${params.prov ?? ""}`;
  }

  private isExpired(timestamp: number): boolean {
    return Date.now() - timestamp > this.ttl;
  }

  get<T>(key: string): T | null {
    const item = this.cache.get(key) as CacheItem<T> | undefined;
    if (!item) return null;
    if (this.isExpired(item.timestamp)) {
      this.cache.delete(key);
      return null;
    }
    return item.data;
  }

  set<T>(key: string, data: T): void {
    if (this.cache.size >= this.maxItems) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey !== undefined) this.cache.delete(firstKey);
    }
    this.cache.set(key, {
      data: JSON.parse(JSON.stringify(data)) as T,
      timestamp: Date.now(),
    });
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }

  getStats(): CacheStats {
    let expiredCount = 0;
    for (const [, item] of this.cache) {
      if (this.isExpired(item.timestamp)) expiredCount++;
    }
    return {
      total: this.cache.size,
      expired: expiredCount,
      active: this.cache.size - expiredCount,
      ttl: `${this.ttl / 1000 / 60} minutes`,
    };
  }
}

const queryCache = new QueryCache();
export default queryCache;
