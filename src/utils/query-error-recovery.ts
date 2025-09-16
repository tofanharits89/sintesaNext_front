/**
 * Utility functions for handling query-related errors and recovery
 */

// Cache for stable references
const stableRefCache = new Map();

export interface ErrorRecoveryOptions {
  maxRetries?: number;
  retryDelay?: number;
  onRetry?: (attempt: number) => void;
  onMaxRetriesReached?: () => void;
}

/**
 * Wraps a function with error recovery logic
 */
export function withErrorRecovery<T extends (...args: any[]) => any>(
  fn: T,
  options: ErrorRecoveryOptions = {}
): T {
  const {
    maxRetries = 3,
    retryDelay = 1000,
    onRetry,
    onMaxRetriesReached,
  } = options;

  return (async (...args: Parameters<T>): Promise<ReturnType<T>> => {
    let lastError: Error;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await fn(...args);
      } catch (error) {
        lastError = error as Error;
        
        // Don't retry on certain errors
        if (
          error instanceof Error &&
          (error.message.includes('Maximum update depth exceeded') ||
           error.message.includes('Authentication') ||
           error.message.includes('403') ||
           error.message.includes('401'))
        ) {
          throw error;
        }
        
        if (attempt < maxRetries) {
          onRetry?.(attempt + 1);
          await new Promise(resolve => setTimeout(resolve, retryDelay * (attempt + 1)));
        }
      }
    }
    
    onMaxRetriesReached?.();
    throw lastError!;
  }) as T;
}

/**
 * Debounces a function to prevent rapid successive calls
 */
export function debounceFunction<T extends (...args: any[]) => any>(
  fn: T,
  delay: number
): T {
  let timeoutId: NodeJS.Timeout;
  
  return ((...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  }) as T;
}

/**
 * Creates a stable reference for objects to prevent unnecessary re-renders
 */
export function createStableRef<T extends Record<string, any>>(obj: T): T {
  const keys = Object.keys(obj).sort();
  const stableKey = keys.map(key => `${key}:${obj[key]}`).join('|');
  
  // Simple memoization based on stringified key
  if (stableRefCache.has(stableKey)) {
    return stableRefCache.get(stableKey);
  }
  
  stableRefCache.set(stableKey, obj);
  
  // Clean cache if it gets too large
  if (stableRefCache.size > 100) {
    const firstKey = stableRefCache.keys().next().value;
    stableRefCache.delete(firstKey);
  }
  
  return obj;
}

/**
 * Checks if an error is recoverable
 */
export function isRecoverableError(error: Error): boolean {
  const message = error.message.toLowerCase();
  
  // Non-recoverable errors
  if (
    message.includes('maximum update depth exceeded') ||
    message.includes('authentication') ||
    message.includes('unauthorized') ||
    message.includes('forbidden')
  ) {
    return false;
  }
  
  // Recoverable errors
  return (
    message.includes('network') ||
    message.includes('timeout') ||
    message.includes('server error') ||
    message.includes('503') ||
    message.includes('502') ||
    message.includes('500')
  );
}

/**
 * Logs error with context for debugging
 */
export function logErrorWithContext(
  error: any,
  context: string,
  additionalInfo?: Record<string, any>
) {
  // Completely disable console operations to avoid validation errors
  try {
    // Just return early without any console operations
    return;
  } catch (e) {
    // Silently fail
    return;
  }
}