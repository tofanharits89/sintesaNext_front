/**
 * Enhanced error handling utilities for frontend
 * Provides user-friendly error messages, automatic retry mechanisms, and recovery suggestions
 */

import { toast } from "sonner";

// Error types and their user-friendly configurations
interface ErrorConfig {
  message: string;
  suggestion: string;
  recoverable: boolean;
  retryable: boolean;
  autoRetry?: boolean;
  maxRetries?: number;
  retryDelay?: number;
}

const ERROR_CONFIGS: Record<string, ErrorConfig> = {
  // Network and connection errors
  NETWORK_ERROR: {
    message: "Connection problem detected",
    suggestion: "Please check your internet connection and try again",
    recoverable: true,
    retryable: true,
    autoRetry: true,
    maxRetries: 3,
    retryDelay: 2000,
  },
  CONNECTION_TIMEOUT: {
    message: "Request timed out",
    suggestion: "The server is taking too long to respond. Trying again...",
    recoverable: true,
    retryable: true,
    autoRetry: true,
    maxRetries: 2,
    retryDelay: 3000,
  },
  SERVER_UNAVAILABLE: {
    message: "Service temporarily unavailable",
    suggestion: "Please try again in a few moments",
    recoverable: true,
    retryable: true,
    autoRetry: false,
    maxRetries: 1,
    retryDelay: 5000,
  },

  // Authentication errors
  AUTHENTICATION_FAILED: {
    message: "Authentication failed",
    suggestion: "Please log in again to continue",
    recoverable: true,
    retryable: false,
  },
  TOKEN_EXPIRED: {
    message: "Your session has expired",
    suggestion: "Redirecting to login page...",
    recoverable: true,
    retryable: false,
  },
  PERMISSION_DENIED: {
    message: "Access denied",
    suggestion: "You don't have permission to perform this action",
    recoverable: false,
    retryable: false,
  },

  // Validation errors
  VALIDATION_ERROR: {
    message: "Please check your input",
    suggestion: "Make sure all required fields are filled correctly",
    recoverable: true,
    retryable: false,
  },
  MISSING_REQUIRED_FIELD: {
    message: "Required information is missing",
    suggestion: "Please fill in all required fields",
    recoverable: true,
    retryable: false,
  },
  INVALID_INPUT: {
    message: "Invalid input format",
    suggestion: "Please check your input and try again",
    recoverable: true,
    retryable: false,
  },

  // Messaging specific errors
  MESSAGE_SEND_FAILED: {
    message: "Failed to send message",
    suggestion: "Your message will be sent when connection is restored",
    recoverable: true,
    retryable: true,
    autoRetry: true,
    maxRetries: 3,
    retryDelay: 1000,
  },
  MESSAGE_NOT_FOUND: {
    message: "Message not found",
    suggestion: "This message may have been deleted",
    recoverable: false,
    retryable: false,
  },
  CONVERSATION_NOT_FOUND: {
    message: "Conversation not found",
    suggestion: "This conversation may have been deleted",
    recoverable: false,
    retryable: false,
  },
  RECIPIENT_NOT_FOUND: {
    message: "User not found",
    suggestion: "Please check the username and try again",
    recoverable: true,
    retryable: false,
  },

  // Rate limiting
  RATE_LIMIT_EXCEEDED: {
    message: "Too many requests",
    suggestion: "Please wait a moment before trying again",
    recoverable: true,
    retryable: true,
    autoRetry: false,
    maxRetries: 1,
    retryDelay: 10000,
  },

  // Generic errors
  UNKNOWN_ERROR: {
    message: "Something went wrong",
    suggestion: "Please try again or contact support if the problem continues",
    recoverable: true,
    retryable: true,
    autoRetry: false,
    maxRetries: 1,
    retryDelay: 2000,
  },
};

// Retry operation with exponential backoff
export async function retryOperation<T>(
  operation: (attempt?: number) => Promise<T>,
  options: {
    maxRetries?: number;
    baseDelay?: number;
    maxDelay?: number;
    backoffFactor?: number;
    retryCondition?: (error: any) => boolean;
    onRetry?: (attempt: number, error: any) => void;
  } = {}
): Promise<T> {
  const {
    maxRetries = 3,
    baseDelay = 1000,
    maxDelay = 10000,
    backoffFactor = 2,
    retryCondition = isRetryableError,
    onRetry,
  } = options;

  let lastError: any;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation(attempt);
    } catch (error) {
      lastError = error;

      console.log(
        `[retryOperation] Attempt ${attempt + 1}/${maxRetries + 1} failed:`,
        {
          error: error?.message,
          retryable: retryCondition(error),
          isLastAttempt: attempt === maxRetries,
        }
      );

      // Don't retry if this is the last attempt or if retry condition fails
      if (attempt === maxRetries || !retryCondition(error)) {
        break;
      }

      // Calculate delay with exponential backoff
      const delay = Math.min(
        baseDelay * Math.pow(backoffFactor, attempt),
        maxDelay
      );

      // Call retry callback if provided
      if (onRetry) {
        onRetry(attempt + 1, error);
      }

      console.log(
        `[retryOperation] Waiting ${delay}ms before retry ${attempt + 2}/${
          maxRetries + 1
        }`
      );

      // Wait before retrying
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

// Check if an error is retryable
export function isRetryableError(error: any): boolean {
  // Check if error has a type that's configured as retryable
  if (error?.error?.type && ERROR_CONFIGS[error.error.type]) {
    return ERROR_CONFIGS[error.error.type].retryable;
  }

  // Check error message patterns
  const errorMessage =
    error?.message || error?.error?.message || error?.toString() || "";

  const retryablePatterns = [
    /network/i,
    /timeout/i,
    /connection/i,
    /unavailable/i,
    /temporary/i,
    /rate.?limit/i,
    /fetch/i,
    /socket.*send.*timeout/i,
    /socket.*error/i,
    /send.*failed/i,
    /websocket/i,
    /polling/i,
  ];

  // Non-retryable patterns (authentication, validation, etc.)
  const nonRetryablePatterns = [
    /authentication.*failed/i,
    /access.*denied/i,
    /unauthorized/i,
    /forbidden/i,
    /not.*found/i,
    /invalid.*message.*data/i,
    /validation.*error/i,
    /cannot.*send.*message.*to.*yourself/i,
  ];

  // Check non-retryable patterns first
  if (nonRetryablePatterns.some((pattern) => pattern.test(errorMessage))) {
    return false;
  }

  return retryablePatterns.some((pattern) => pattern.test(errorMessage));
}

// Get error configuration
function getErrorConfig(error: any): ErrorConfig {
  // Check if error has a specific type
  if (error?.error?.type && ERROR_CONFIGS[error.error.type]) {
    return ERROR_CONFIGS[error.error.type];
  }

  // Try to match error message patterns
  const errorMessage =
    error?.message || error?.error?.message || error?.toString() || "";

  if (/network|connection|fetch/i.test(errorMessage)) {
    return ERROR_CONFIGS.NETWORK_ERROR;
  }

  if (/timeout/i.test(errorMessage)) {
    return ERROR_CONFIGS.CONNECTION_TIMEOUT;
  }

  if (/auth|token|unauthorized|forbidden/i.test(errorMessage)) {
    return ERROR_CONFIGS.AUTHENTICATION_FAILED;
  }

  if (/validation|invalid|required/i.test(errorMessage)) {
    return ERROR_CONFIGS.VALIDATION_ERROR;
  }

  if (/rate.?limit/i.test(errorMessage)) {
    return ERROR_CONFIGS.RATE_LIMIT_EXCEEDED;
  }

  return ERROR_CONFIGS.UNKNOWN_ERROR;
}

// Enhanced error handler with automatic retry and user-friendly messages
export async function handleErrorWithRetry<T>(
  operation: () => Promise<T>,
  context: string = "Operation",
  customOptions: {
    showToast?: boolean;
    autoRetry?: boolean;
    onSuccess?: (result: T) => void;
    onError?: (error: any) => void;
    onRetry?: (attempt: number, error: any) => void;
  } = {}
): Promise<T | null> {
  const {
    showToast = true,
    autoRetry = true,
    onSuccess,
    onError,
    onRetry,
  } = customOptions;

  try {
    const result = await retryOperation(operation, {
      retryCondition: (error) => autoRetry && isRetryableError(error),
      onRetry: (attempt, error) => {
        const config = getErrorConfig(error);
        if (showToast && attempt === 1) {
          toast.info(`${config.suggestion} (Attempt ${attempt})`);
        }
        if (onRetry) {
          onRetry(attempt, error);
        }
      },
    });

    if (onSuccess) {
      onSuccess(result);
    }

    return result;
  } catch (error) {
    const config = getErrorConfig(error);

    console.error(`[${context}] Error:`, error);

    if (showToast) {
      if (config.recoverable) {
        toast.error(config.message, {
          description: config.suggestion,
          action: config.retryable
            ? {
                label: "Retry",
                onClick: () =>
                  handleErrorWithRetry(operation, context, customOptions),
              }
            : undefined,
        });
      } else {
        toast.error(config.message, {
          description: config.suggestion,
        });
      }
    }

    if (onError) {
      onError(error);
    }

    return null;
  }
}

// Simple error display function
export function showUserFriendlyError(error: any, context: string = "") {
  const config = getErrorConfig(error);

  console.error(`[${context}] Error:`, error);

  toast.error(config.message, {
    description: config.suggestion,
  });
}

// Success message display
export function showSuccessMessage(message: string, description?: string) {
  toast.success(message, {
    description,
  });
}

// Info message display
export function showInfoMessage(message: string, description?: string) {
  toast.info(message, {
    description,
  });
}

// Warning message display
export function showWarningMessage(message: string, description?: string) {
  toast.warning(message, {
    description,
  });
}

// Auto-retry wrapper for socket operations
export function createAutoRetrySocketOperation<T>(
  operation: () => Promise<T>,
  errorType: string = "UNKNOWN_ERROR"
) {
  const config = ERROR_CONFIGS[errorType] || ERROR_CONFIGS.UNKNOWN_ERROR;

  if (config.autoRetry) {
    return () =>
      retryOperation(operation, {
        maxRetries: config.maxRetries || 3,
        baseDelay: config.retryDelay || 1000,
        retryCondition: isRetryableError,
        onRetry: (attempt, error) => {
          if (attempt === 1) {
            toast.info(`${config.suggestion} (Attempt ${attempt})`);
          }
        },
      });
  }

  return operation;
}

export { ERROR_CONFIGS };
