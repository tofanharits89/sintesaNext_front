/**
 * Memoization Utilities
 * High-performance caching utilities for expensive calculations and operations
 */

// WeakMap-based memoization for objects
const weakMemoCache = new WeakMap();

// LRU Cache implementation for general purpose memoization
class LRUCache<K, V> {
  private cache = new Map<K, V>();
  private maxSize: number;

  constructor(maxSize: number = 100) {
    this.maxSize = maxSize;
  }

  get(key: K): V | undefined {
    const value = this.cache.get(key);
    if (value !== undefined) {
      // Move to end (most recently used)
      this.cache.delete(key);
      this.cache.set(key, value);
    }
    return value;
  }

  set(key: K, value: V): void {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.maxSize) {
      // Remove least recently used item
      const firstKey = this.cache.keys().next().value;
      if (firstKey !== undefined) {
        this.cache.delete(firstKey);
      }
    }
    this.cache.set(key, value);
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }
}

/**
 * Memoize a pure function with LRU cache
 * @param fn - Function to memoize
 * @param maxSize - Maximum cache size
 * @param keyGenerator - Optional custom key generator
 */
export function memoize<TArgs extends any[], TReturn>(
  fn: (...args: TArgs) => TReturn,
  maxSize: number = 100,
  keyGenerator?: (...args: TArgs) => string
): (...args: TArgs) => TReturn {
  const cache = new LRUCache<string, TReturn>(maxSize);

  return (...args: TArgs): TReturn => {
    const key = keyGenerator ? keyGenerator(...args) : JSON.stringify(args);
    
    const cached = cache.get(key);
    if (cached !== undefined) {
      return cached;
    }

    const result = fn(...args);
    cache.set(key, result);
    return result;
  };
}

/**
 * Memoize a function that takes objects as arguments using WeakMap
 * @param fn - Function to memoize
 */
export function memoizeWeak<T extends object, TReturn>(
  fn: (arg: T) => TReturn
): (arg: T) => TReturn {
  return (arg: T): TReturn => {
    if (weakMemoCache.has(arg)) {
      return weakMemoCache.get(arg);
    }

    const result = fn(arg);
    weakMemoCache.set(arg, result);
    return result;
  };
}

/**
 * Memoize async functions with promise caching
 * @param fn - Async function to memoize
 * @param maxSize - Maximum cache size
 * @param ttl - Time to live in milliseconds
 */
export function memoizeAsync<TArgs extends any[], TReturn>(
  fn: (...args: TArgs) => Promise<TReturn>,
  maxSize: number = 50,
  ttl: number = 5 * 60 * 1000 // 5 minutes default
): (...args: TArgs) => Promise<TReturn> {
  const cache = new Map<string, { promise: Promise<TReturn>; timestamp: number }>();

  return (...args: TArgs): Promise<TReturn> => {
    const key = JSON.stringify(args);
    const now = Date.now();
    
    const cached = cache.get(key);
    if (cached && (now - cached.timestamp) < ttl) {
      return cached.promise;
    }

    const promise = fn(...args);
    cache.set(key, { promise, timestamp: now });

    // Clean up old entries periodically
    if (cache.size > maxSize) {
      for (const [cacheKey, entry] of cache.entries()) {
        if (now - entry.timestamp >= ttl) {
          cache.delete(cacheKey);
        }
      }
    }

    return promise;
  };
}

/**
 * Create a debounced version of a function
 * @param fn - Function to debounce
 * @param delay - Delay in milliseconds
 */
export function debounce<TArgs extends any[]>(
  fn: (...args: TArgs) => void,
  delay: number
): (...args: TArgs) => void {
  let timeoutId: NodeJS.Timeout;

  return (...args: TArgs) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

/**
 * Create a throttled version of a function
 * @param fn - Function to throttle
 * @param limit - Time limit in milliseconds
 */
export function throttle<TArgs extends any[]>(
  fn: (...args: TArgs) => void,
  limit: number
): (...args: TArgs) => void {
  let inThrottle = false;

  return (...args: TArgs) => {
    if (!inThrottle) {
      fn(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}



/**
 * Create a memoized selector for complex data transformations
 * @param selector - Selector function
 * @param dependencies - Dependency functions
 */
export function createSelector<TInput, TOutput>(
  selector: (input: TInput) => TOutput,
  ...dependencies: Array<(input: TInput) => any>
): (input: TInput) => TOutput {
  const memoizedSelector = memoize(selector);
  const memoizedDependencies = dependencies.map(dep => memoize(dep));

  return (input: TInput): TOutput => {
    // Check if any dependency changed
    const dependencyValues = memoizedDependencies.map(dep => dep(input));
    const cacheKey = JSON.stringify(dependencyValues);
    
    return memoizedSelector(input);
  };
}

/**
 * Performance monitoring wrapper for functions
 * @param fn - Function to monitor
 * @param name - Function name for logging
 */
export function withPerformanceMonitoring<TArgs extends any[], TReturn>(
  fn: (...args: TArgs) => TReturn,
  name: string
): (...args: TArgs) => TReturn {
  return (...args: TArgs): TReturn => {
    const start = performance.now();
    const result = fn(...args);
    const end = performance.now();
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Performance] ${name} took ${(end - start).toFixed(2)}ms`);
    }
    
    return result;
  };
}

/**
 * Memoize expensive array operations
 */
export const arrayUtils = {
  // Memoized filter function
  memoizedFilter: memoize(
    <T>(array: T[], predicate: (item: T) => boolean): T[] => 
      array.filter(predicate),
    50,
    (array, predicate) => `${array.length}_${predicate.toString()}`
  ),

  // Memoized sort function
  memoizedSort: memoize(
    <T>(array: T[], compareFn?: (a: T, b: T) => number): T[] => 
      [...array].sort(compareFn),
    50,
    (array, compareFn) => `${array.length}_${compareFn?.toString() || 'default'}`
  ),

  // Memoized unique function
  memoizedUnique: memoize(
    <T>(array: T[]): T[] => [...new Set(array)],
    50,
    (array) => `${array.length}_${array.slice(0, 5).join(',')}`
  ),

  // Memoized group by function
  memoizedGroupBy: memoize(
    <T, K extends string | number>(
      array: T[], 
      keyFn: (item: T) => K
    ): Record<K, T[]> => {
      return array.reduce((groups, item) => {
        const key = keyFn(item);
        if (!groups[key]) groups[key] = [];
        groups[key].push(item);
        return groups;
      }, {} as Record<K, T[]>);
    },
    30,
    (array, keyFn) => `${array.length}_${keyFn.toString()}`
  )
};

/**
 * Memoize expensive string operations
 */
export const stringUtils = {
  // Memoized JSON parsing
  memoizedJsonParse: memoize(
    (str: string): any => JSON.parse(str),
    100
  ),

  // Memoized regex operations
  memoizedRegexTest: memoize(
    (str: string, pattern: string, flags?: string): boolean => {
      const regex = new RegExp(pattern, flags);
      return regex.test(str);
    },
    50,
    (str, pattern, flags) => `${str.slice(0, 50)}_${pattern}_${flags || ''}`
  ),

  // Memoized string formatting
  memoizedFormat: memoize(
    (template: string, ...args: any[]): string => {
      return template.replace(/\{(\d+)\}/g, (match, index) => 
        args[parseInt(index, 10)] ?? match
      );
    },
    30
  )
};

/**
 * Memoize React component render function
 */
import React from 'react'

export function memoizeComponent<P extends object>(
  Component: React.ComponentType<P>,
  areEqual?: (prevProps: P, nextProps: P) => boolean
): React.MemoExoticComponent<React.ComponentType<P>> {
  return React.memo(Component, areEqual);
}

// Export types for TypeScript users
export type { LRUCache };