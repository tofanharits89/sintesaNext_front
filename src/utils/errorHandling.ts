/**
 * Enhanced error handling utilities for frontend
 * Provides user-friendly error messages, automatic retry mechanisms, and recovery suggestions
 */

import { toast } from "sonner";
import { logger } from "@/lib/utils/utils";

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

// Strongly-typed error keys for safer usage across helpers
type ErrorType =
  | "NETWORK_ERROR"
  | "QUERY_SAVE_FAILED"
  | "QUERY_LOAD_FAILED"
  | "QUERY_UPDATE_FAILED"
  | "QUERY_DELETE_FAILED"
  | "QUERY_DUPLICATE_NAME"
  | "QUERY_NOT_FOUND"
  | "QUERY_INVALID_DATA"
  | "CONNECTION_TIMEOUT"
  | "SERVER_UNAVAILABLE"
  | "AUTHENTICATION_FAILED"
  | "TOKEN_EXPIRED"
  | "PERMISSION_DENIED"
  | "VALIDATION_ERROR"
  | "MISSING_REQUIRED_FIELD"
  | "INVALID_INPUT"
  | "MESSAGE_SEND_FAILED"
  | "MESSAGE_NOT_FOUND"
  | "CONVERSATION_NOT_FOUND"
  | "RECIPIENT_NOT_FOUND"
  | "RATE_LIMIT_EXCEEDED"
  | "UNKNOWN_ERROR";

const ERROR_CONFIGS: Record<ErrorType, ErrorConfig> = {
  // Network and connection errors
  NETWORK_ERROR: {
    message: "Terdeteksi masalah koneksi",
    suggestion: "Silakan periksa koneksi internet Anda dan coba lagi",
    recoverable: true,
    retryable: true,
    autoRetry: true,
    maxRetries: 3,
    retryDelay: 2000,
  },
  
  // Saved queries specific errors
  QUERY_SAVE_FAILED: {
    message: "Gagal menyimpan query",
    suggestion: "Silakan periksa input Anda dan coba lagi",
    recoverable: true,
    retryable: true,
    autoRetry: false,
    maxRetries: 2,
    retryDelay: 1000,
  },
  QUERY_LOAD_FAILED: {
    message: "Gagal memuat query",
    suggestion: "Query mungkin telah dihapus atau rusak",
    recoverable: true,
    retryable: true,
    autoRetry: false,
    maxRetries: 1,
    retryDelay: 1000,
  },
  QUERY_UPDATE_FAILED: {
    message: "Gagal memperbarui query",
    suggestion: "Silakan coba lagi atau muat ulang halaman",
    recoverable: true,
    retryable: true,
    autoRetry: false,
    maxRetries: 2,
    retryDelay: 1000,
  },
  QUERY_DELETE_FAILED: {
    message: "Gagal menghapus query",
    suggestion: "Silakan coba lagi atau muat ulang halaman",
    recoverable: true,
    retryable: true,
    autoRetry: false,
    maxRetries: 2,
    retryDelay: 1000,
  },
  QUERY_DUPLICATE_NAME: {
    message: "Nama query sudah ada",
    suggestion: "Silakan pilih nama yang berbeda untuk query Anda",
    recoverable: true,
    retryable: false,
  },
  QUERY_NOT_FOUND: {
    message: "Query tidak ditemukan",
    suggestion: "Query mungkin telah dihapus",
    recoverable: false,
    retryable: false,
  },
  QUERY_INVALID_DATA: {
    message: "Data query tidak valid",
    suggestion: "Query mengandung data yang tidak valid atau rusak",
    recoverable: true,
    retryable: false,
  },
  CONNECTION_TIMEOUT: {
    message: "Permintaan timeout",
    suggestion: "Server membutuhkan waktu terlalu lama untuk merespons. Mencoba lagi...",
    recoverable: true,
    retryable: true,
    autoRetry: true,
    maxRetries: 2,
    retryDelay: 3000,
  },
  SERVER_UNAVAILABLE: {
    message: "Layanan sementara tidak tersedia",
    suggestion: "Silakan coba lagi dalam beberapa saat",
    recoverable: true,
    retryable: true,
    autoRetry: false,
    maxRetries: 1,
    retryDelay: 5000,
  },

  // Authentication errors
  AUTHENTICATION_FAILED: {
    message: "Autentikasi gagal",
    suggestion: "Silakan login kembali untuk melanjutkan",
    recoverable: true,
    retryable: false,
  },
  TOKEN_EXPIRED: {
    message: "Sesi Anda telah berakhir",
    suggestion: "Mengalihkan ke halaman login...",
    recoverable: true,
    retryable: false,
  },
  PERMISSION_DENIED: {
    message: "Akses ditolak",
    suggestion: "Anda tidak memiliki izin untuk melakukan tindakan ini",
    recoverable: false,
    retryable: false,
  },

  // Validation errors
  VALIDATION_ERROR: {
    message: "Silakan periksa input Anda",
    suggestion: "Pastikan semua kolom yang wajib diisi telah terisi dengan benar",
    recoverable: true,
    retryable: false,
  },
  MISSING_REQUIRED_FIELD: {
    message: "Informasi yang diperlukan tidak lengkap",
    suggestion: "Silakan isi semua kolom yang wajib diisi",
    recoverable: true,
    retryable: false,
  },
  INVALID_INPUT: {
    message: "Format input tidak valid",
    suggestion: "Silakan periksa input Anda dan coba lagi",
    recoverable: true,
    retryable: false,
  },

  // Messaging specific errors
  MESSAGE_SEND_FAILED: {
    message: "Gagal mengirim pesan",
    suggestion: "Pesan Anda akan dikirim saat koneksi pulih",
    recoverable: true,
    retryable: true,
    autoRetry: true,
    maxRetries: 3,
    retryDelay: 1000,
  },
  MESSAGE_NOT_FOUND: {
    message: "Pesan tidak ditemukan",
    suggestion: "Pesan ini mungkin telah dihapus",
    recoverable: false,
    retryable: false,
  },
  CONVERSATION_NOT_FOUND: {
    message: "Percakapan tidak ditemukan",
    suggestion: "Percakapan ini mungkin telah dihapus",
    recoverable: false,
    retryable: false,
  },
  RECIPIENT_NOT_FOUND: {
    message: "Pengguna tidak ditemukan",
    suggestion: "Silakan periksa nama pengguna dan coba lagi",
    recoverable: true,
    retryable: false,
  },

  // Rate limiting
  RATE_LIMIT_EXCEEDED: {
    message: "Terlalu banyak permintaan",
    suggestion: "Silakan tunggu sebentar sebelum mencoba lagi",
    recoverable: true,
    retryable: true,
    autoRetry: false,
    maxRetries: 1,
    retryDelay: 10000,
  },

  // Generic errors
  UNKNOWN_ERROR: {
    message: "Terjadi kesalahan",
    suggestion: "Silakan coba lagi atau hubungi dukungan jika masalah berlanjut",
    recoverable: true,
    retryable: true,
    autoRetry: false,
    maxRetries: 1,
    retryDelay: 2000,
  },
};

// Type guard to safely check if a dynamic value is a valid ErrorType key
function isErrorTypeKey(key: unknown): key is ErrorType {
  return typeof key === "string" && key in ERROR_CONFIGS;
}

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

      logger.debug(
        `[retryOperation] Attempt ${attempt + 1}/${maxRetries + 1} failed:`,
        {
          error: (error as Error)?.message || String(error),
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

      logger.debug(
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
  const typeKey = error?.error?.type as unknown;
  if (isErrorTypeKey(typeKey)) {
    return ERROR_CONFIGS[typeKey].retryable;
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
  const typeKey = error?.error?.type as unknown;
  if (isErrorTypeKey(typeKey)) {
    return ERROR_CONFIGS[typeKey];
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

    logger.error(`[${context}] Error:`, error);

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
export function showUserFriendlyError(
  error: any,
  contextOrType: string = ""
) {
  // If the provided context matches a known error type, use its config.
  // This allows callers like handleSavedQueryError to force a specific user-facing message.
  const config = isErrorTypeKey(contextOrType)
    ? ERROR_CONFIGS[contextOrType]
    : getErrorConfig(error);

  logger.error(`[${contextOrType}] Error:`, error);

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
  errorType: ErrorType = "UNKNOWN_ERROR"
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

// Saved queries specific error handling functions
export function handleSavedQueryError(error: any, operation: string = "operation") {
  const config = getErrorConfig(error);
  
  logger.error(`[SavedQueries] ${operation} failed:`, error);
  
  // Determine if this is a specific saved query error
  const errorMessage = error?.message || error?.toString() || "";
  
  if (/duplicate.*name|already.*exists/i.test(errorMessage)) {
    return showUserFriendlyError(error, "QUERY_DUPLICATE_NAME");
  }
  
  if (/not.*found|404/i.test(errorMessage)) {
    return showUserFriendlyError(error, "QUERY_NOT_FOUND");
  }
  
  if (/invalid.*data|validation/i.test(errorMessage)) {
    return showUserFriendlyError(error, "QUERY_INVALID_DATA");
  }
  
  // Operation-specific errors
  switch (operation.toLowerCase()) {
    case "save":
    case "create":
      return showUserFriendlyError(error, "QUERY_SAVE_FAILED");
    case "load":
    case "fetch":
      return showUserFriendlyError(error, "QUERY_LOAD_FAILED");
    case "update":
    case "edit":
      return showUserFriendlyError(error, "QUERY_UPDATE_FAILED");
    case "delete":
    case "remove":
      return showUserFriendlyError(error, "QUERY_DELETE_FAILED");
    default:
      return showUserFriendlyError(error, operation);
  }
}

// Enhanced retry wrapper specifically for saved queries operations
export async function retrySavedQueryOperation<T>(
  operation: () => Promise<T>,
  operationType: string = "operation",
  options: {
    showToast?: boolean;
    onRetry?: (attempt: number, error: any) => void;
    onSuccess?: (result: T) => void;
    onFinalError?: (error: any) => void;
  } = {}
): Promise<T | null> {
  const { showToast = true, onRetry, onSuccess, onFinalError } = options;
  
  try {
    const result = await retryOperation(operation, {
      maxRetries: 2,
      baseDelay: 1000,
      retryCondition: (error) => {
        // Don't retry validation errors or not found errors
        const errorMessage = error?.message || error?.toString() || "";
        if (/validation|invalid|not.*found|404|duplicate/i.test(errorMessage)) {
          return false;
        }
        return isRetryableError(error);
      },
      onRetry: (attempt, error) => {
        if (showToast && attempt === 1) {
          toast.info(`Mencoba lagi... (Percobaan ${attempt})`);
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
    if (onFinalError) {
      onFinalError(error);
    } else if (showToast) {
      handleSavedQueryError(error, operationType);
    }
    
    return null;
  }
}

// Network status monitoring for saved queries
export function createNetworkAwareOperation<T>(
  operation: () => Promise<T>,
  fallbackMessage: string = "Operation will be retried when connection is restored"
) {
  return async (): Promise<T> => {
    // Check if we're online
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      throw new Error(`No internet connection. ${fallbackMessage}`);
    }
    
    try {
      return await operation();
    } catch (error) {
      // If it's a network error and we're offline, provide better messaging
      if (typeof navigator !== "undefined" && !navigator.onLine) {
        throw new Error(`Connection lost. ${fallbackMessage}`);
      }
      throw error;
    }
  };
}

// Bulk operation error handling
export async function handleBulkOperation<T>(
  items: T[],
  operation: (item: T) => Promise<void>,
  options: {
    onProgress?: (completed: number, total: number, failures: number) => void;
    onItemError?: (item: T, error: any) => void;
    continueOnError?: boolean;
    showToast?: boolean;
  } = {}
): Promise<{ successful: T[]; failed: Array<{ item: T; error: any }> }> {
  const { onProgress, onItemError, continueOnError = true, showToast = true } = options;
  
  const successful: T[] = [];
  const failed: Array<{ item: T; error: any }> = [];
  
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (typeof item === "undefined") {
      continue;
    }
    
    try {
      await operation(item);
      successful.push(item);
    } catch (error) {
      failed.push({ item, error });
      
      if (onItemError) {
        onItemError(item, error);
      }
      
      if (!continueOnError) {
        break;
      }
    }
    if (onProgress) {
      onProgress(successful.length, items.length, failed.length);
    }
  }
  
  // Show summary toast
  if (showToast) {
    if (failed.length === 0) {
      toast.success(`Semua ${items.length} operasi berhasil`);
    } else if (successful.length === 0) {
      toast.error(`Semua ${items.length} operasi gagal`);
    } else {
      toast.warning(`${successful.length} berhasil, ${failed.length} gagal dari ${items.length} operasi`);
    }
  }
  
  return { successful, failed };
}
