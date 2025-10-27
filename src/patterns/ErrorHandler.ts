/**
 * Error handling pattern
 * Centralizes error handling logic across the application
 */

interface ErrorConfig {
  [statusCode: number]: string;
}

interface RetryConfig {
  maxAttempts: number;
  delayMs: number;
  backoffMultiplier?: number;
}

/**
 * Wrap a function with error handling
 */
export function withErrorHandling<T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  options?: {
    errorMap?: ErrorConfig;
    defaultMessage?: string;
    onError?: (error: Error, ...args: T) => void;
    retryConfig?: RetryConfig;
  }
) {
  const { errorMap = {}, defaultMessage = "An error occurred", onError, retryConfig } = options || {};

  return async (...args: T): Promise<R> => {
    let lastError: Error = new Error(defaultMessage);

    const attempts = retryConfig ? retryConfig.maxAttempts : 1;
    const baseDelay = retryConfig?.delayMs || 0;
    const backoff = retryConfig?.backoffMultiplier || 1;

    for (let attempt = 1; attempt <= attempts; attempt++) {
      try {
        return await fn(...args);
      } catch (error) {
        lastError = error as Error;

        // Call error handler if provided
        if (onError) {
          onError(lastError, ...args);
        }

        // If not the last attempt, wait and retry
        if (attempt < attempts) {
          const delay = baseDelay * Math.pow(backoff, attempt - 1);
          await sleep(delay);
          continue;
        }
      }
    }

    // All attempts failed, throw with appropriate message
    const statusCode = (lastError as any)?.status;
    const message = statusCode && errorMap[statusCode]
      ? errorMap[statusCode]
      : lastError.message || defaultMessage;

    throw new Error(message);
  };
}

/**
 * Create a retryable function
 */
export function createRetryable<T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  config: RetryConfig
) {
  return async (...args: T): Promise<R> => {
    let lastError: Error = new Error("All retry attempts failed");

    for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
      try {
        return await fn(...args);
      } catch (error) {
        lastError = error as Error;

        if (attempt === config.maxAttempts) {
          break;
        }

        const delay = config.delayMs * Math.pow(config.backoffMultiplier || 1, attempt - 1);
        await sleep(delay);
      }
    }

    throw lastError;
  };
}

/**
 * Handle specific error types
 */
export function handleSpecificErrors<T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  handlers: {
    [errorType: string]: (error: Error, ...args: T) => Error | Promise<Error>;
  }
) {
  return async (...args: T): Promise<R> => {
    try {
      return await fn(...args);
    } catch (error) {
      const err = error as Error;
      const handler = handlers[err.name];

      if (handler) {
        const newError = await handler(err, ...args);
        throw newError;
      }

      throw err;
    }
  };
}

/**
 * Log errors with context
 */
export function withLogging<T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  context: string
) {
  return withErrorHandling(fn, {
    onError: (error, ...args) => {
      console.error(`[${context}] Error:`, {
        message: error.message,
        stack: error.stack,
        args,
      });
    },
  });
}

/**
 * Convert errors to user-friendly messages
 */
export function toUserMessage(error: unknown): string {
  if (error instanceof Error) {
    // Network errors
    if (error.name === "NetworkError" || error.message.includes("fetch")) {
      return "Network error. Please check your connection.";
    }

    // Timeout errors
    if (error.name === "TimeoutError") {
      return "Request timed out. Please try again.";
    }

    // HTTP errors
    const status = (error as any).status;
    if (status) {
      if (status === 401) return "You are not authorized to perform this action.";
      if (status === 403) return "You don't have permission to access this resource.";
      if (status === 404) return "The requested resource was not found.";
      if (status >= 500) return "Server error. Please try again later.";
    }

    return error.message;
  }

  return "An unexpected error occurred";
}

/**
 * Helper to sleep/delay
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Example usage:
 *
 * // With error mapping
 * const apiCall = withErrorHandling(
 *   fetchData,
 *   {
 *     errorMap: {
 *       401: "Please log in to continue",
 *       403: "You don't have permission",
 *       404: "Resource not found",
 *     },
 *     defaultMessage: "Something went wrong"
 *   }
 * );
 *
 * // With retry
 * const retryableCall = withErrorHandling(
 *   fetchData,
 *   {
 *     retryConfig: {
 *       maxAttempts: 3,
 *       delayMs: 1000,
 *       backoffMultiplier: 2,
 *     }
 *   }
 * );
 *
 * // With logging
 * const loggedCall = withLogging(fetchData, "UserService");
 */
