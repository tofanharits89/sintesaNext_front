/**
 * Error Handler Manager
 * Enterprise-grade centralized error handling and categorization
 */

import {
  SocketClientError,
  SOCKET_CLIENT_ERROR_CODES,
  SocketState
} from "../types";
import Logger from "../utils/Logger";

export interface ErrorCategory {
  type: "auth" | "network" | "session" | "cors" | "token" | "unknown";
  severity: "critical" | "high" | "medium" | "low";
  retryable: boolean;
  userMessage: string;
  technicalMessage: string;
}

export interface ErrorHandlerOptions {
  onAuthError?: (error: ErrorCategory) => void;
  onNetworkError?: (error: ErrorCategory) => void;
  onSessionError?: (error: ErrorCategory) => void;
  onCriticalError?: (error: ErrorCategory) => void;
}

/**
 * Centralized error handling manager
 * Categorizes errors and provides appropriate handling strategies
 */
export class ErrorHandlerManager {
  private logger: Logger;
  private options: ErrorHandlerOptions;
  private errorHistory: Array<{ error: ErrorCategory; timestamp: number }> = [];
  private readonly MAX_ERROR_HISTORY = 50;

  constructor(logger: Logger, options: ErrorHandlerOptions = {}) {
    this.logger = logger;
    this.options = options;
    this.logger.debug("ErrorHandlerManager initialized");
  }

  /**
   * Categorize and handle connection errors
   */
  handleConnectionError(error: any): ErrorCategory {
    const category = this.categorizeError(error);
    this.recordError(category);

    this.logger.error("Connection error categorized", {
      type: category.type,
      severity: category.severity,
      retryable: category.retryable,
      message: category.technicalMessage,
    });

    // Route to appropriate handler
    switch (category.type) {
      case "auth":
      case "token":
        this.options.onAuthError?.(category);
        break;
      case "network":
        this.options.onNetworkError?.(category);
        break;
      case "session":
        this.options.onSessionError?.(category);
        break;
      default:
        if (category.severity === "critical") {
          this.options.onCriticalError?.(category);
        }
    }

    return category;
  }

  /**
   * Handle socket-level errors
   */
  handleSocketError(error: Error): ErrorCategory {
    const code = (error as any)?.code || (error as any)?.error?.code;
    
    let category: ErrorCategory;
    
    if (code === "SESSION_EXPIRED" || code === "SESSION_REVOKED") {
      category = {
        type: "session",
        severity: "high",
        retryable: false,
        userMessage: "Your session has expired",
        technicalMessage: `Session error: ${code}`,
      };
      this.options.onSessionError?.(category);
    } else {
      category = this.categorizeError(error);
    }

    this.recordError(category);
    this.logger.error("Socket error handled", { category });

    return category;
  }

  /**
   * Handle token refresh errors
   */
  handleTokenRefreshError(error?: string): ErrorCategory {
    const category: ErrorCategory = {
      type: "token",
      severity: "high",
      retryable: false,
      userMessage: "Your session has expired. Please log in again.",
      technicalMessage: error || "Token refresh failed",
    };

    this.recordError(category);
    this.logger.error("Token refresh error", { category });
    this.options.onAuthError?.(category);

    return category;
  }

  /**
   * Categorize error based on message and properties
   */
  private categorizeError(error: any): ErrorCategory {
    const message = error.message || String(error);
    const errorType = error.type;
    const description = error.description;

    // Token/Auth errors
    if (this.isTokenExpiredError(message)) {
      return {
        type: "token",
        severity: "high",
        retryable: false,
        userMessage: "Your session has expired. Please refresh the page.",
        technicalMessage: message,
      };
    }

    if (this.isAuthError(message)) {
      return {
        type: "auth",
        severity: "high",
        retryable: false,
        userMessage: "Authentication failed. Please refresh the page and log in again.",
        technicalMessage: message,
      };
    }

    // CORS errors
    if (this.isCorsError(message)) {
      return {
        type: "cors",
        severity: "critical",
        retryable: false,
        userMessage: "Connection blocked. Please contact support.",
        technicalMessage: message,
      };
    }

    // Network errors
    if (this.isNetworkError(message, errorType)) {
      return {
        type: "network",
        severity: "medium",
        retryable: true,
        userMessage: "Network connection issue. Retrying...",
        technicalMessage: message,
      };
    }

    // Unknown errors
    return {
      type: "unknown",
      severity: "medium",
      retryable: true,
      userMessage: "Connection error. Please try again.",
      technicalMessage: message,
    };
  }

  /**
   * Check if error is token expiration
   */
  private isTokenExpiredError(message: string): boolean {
    const tokenExpiredPatterns = [
      "TOKEN_EXPIRED",
      "Access token has expired",
      "token expired",
      "jwt expired",
    ];

    return tokenExpiredPatterns.some(pattern =>
      message.toLowerCase().includes(pattern.toLowerCase())
    );
  }

  /**
   * Check if error is authentication related
   */
  private isAuthError(message: string): boolean {
    const authPatterns = [
      "token",
      "auth",
      "unauthorized",
      "AUTH_REQUIRED",
      "INVALID_TOKEN",
      "authentication",
    ];

    return authPatterns.some(pattern =>
      message.toLowerCase().includes(pattern.toLowerCase())
    );
  }

  /**
   * Check if error is CORS related
   */
  private isCorsError(message: string): boolean {
    const corsPatterns = ["CORS", "cross-origin", "cors"];

    return corsPatterns.some(pattern =>
      message.toLowerCase().includes(pattern.toLowerCase())
    );
  }

  /**
   * Check if error is network related
   */
  private isNetworkError(message: string, errorType?: string): boolean {
    const networkPatterns = ["network", "timeout", "connection"];

    return (
      errorType === "TransportError" ||
      networkPatterns.some(pattern =>
        message.toLowerCase().includes(pattern.toLowerCase())
      )
    );
  }

  /**
   * Record error in history for analysis
   */
  private recordError(error: ErrorCategory): void {
    this.errorHistory.push({
      error,
      timestamp: Date.now(),
    });

    // Maintain history size
    if (this.errorHistory.length > this.MAX_ERROR_HISTORY) {
      this.errorHistory.shift();
    }
  }

  /**
   * Get error statistics
   */
  getErrorStats(): {
    total: number;
    byType: Record<string, number>;
    bySeverity: Record<string, number>;
    recentErrors: number;
  } {
    const now = Date.now();
    const fiveMinutesAgo = now - 5 * 60 * 1000;

    const byType: Record<string, number> = {};
    const bySeverity: Record<string, number> = {};
    let recentErrors = 0;

    for (const { error, timestamp } of this.errorHistory) {
      byType[error.type] = (byType[error.type] || 0) + 1;
      bySeverity[error.severity] = (bySeverity[error.severity] || 0) + 1;

      if (timestamp >= fiveMinutesAgo) {
        recentErrors++;
      }
    }

    return {
      total: this.errorHistory.length,
      byType,
      bySeverity,
      recentErrors,
    };
  }

  /**
   * Get error history
   */
  getErrorHistory(): Array<{ error: ErrorCategory; timestamp: number }> {
    return [...this.errorHistory];
  }

  /**
   * Clear error history
   */
  clearHistory(): void {
    this.errorHistory = [];
    this.logger.debug("Error history cleared");
  }

  /**
   * Cleanup
   */
  cleanup(): void {
    this.errorHistory = [];
    this.logger.debug("ErrorHandlerManager cleaned up");
  }
}

export default ErrorHandlerManager;
