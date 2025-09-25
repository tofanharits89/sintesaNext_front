/**
 * Comprehensive Authentication Error Reporting System
 * 
 * Provides detailed error analysis, recovery suggestions, and user-friendly
 * error messages for different authentication failure scenarios
 */

import { toast } from 'sonner';
import { logger } from '@/lib/utils';

// Error types and categories
export enum AuthErrorType {
  TOKEN_EXPIRED = 'TOKEN_EXPIRED',
  TOKEN_INVALID = 'TOKEN_INVALID',
  TOKEN_MISSING = 'TOKEN_MISSING',
  NETWORK_ERROR = 'NETWORK_ERROR',
  SERVER_ERROR = 'SERVER_ERROR',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  RATE_LIMITED = 'RATE_LIMITED',
  SESSION_EXPIRED = 'SESSION_EXPIRED',
  CORS_ERROR = 'CORS_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export interface AuthError {
  type: AuthErrorType;
  severity: ErrorSeverity;
  message: string;
  originalError?: any;
  context?: any;
  timestamp: number;
  userAgent?: string;
  url?: string;
}

export interface RecoverySuggestion {
  action: string;
  description: string;
  priority: number;
  automated?: boolean;
  userFriendly: string;
}

export interface ErrorReport {
  error: AuthError;
  suggestions: RecoverySuggestion[];
  diagnostics: any;
  canAutoRecover: boolean;
  requiresUserAction: boolean;
}

/**
 * Authentication Error Reporter and Recovery Advisor
 */
export class AuthErrorReporter {
  private errorHistory: AuthError[] = [];
  private maxHistorySize = 50;
  private debugMode: boolean;

  constructor(options: { debugMode?: boolean } = {}) {
    this.debugMode = options.debugMode ?? (process.env.NODE_ENV === 'development');
  }

  /**
   * Analyze and report an authentication error
   */
  reportError(error: any, context: any = {}): ErrorReport {
    const authError = this.categorizeError(error, context);
    this.addToHistory(authError);
    
    const suggestions = this.generateRecoverySuggestions(authError);
    const diagnostics = this.generateDiagnostics(authError, context);
    
    const report: ErrorReport = {
      error: authError,
      suggestions,
      diagnostics,
      canAutoRecover: this.canAutoRecover(authError),
      requiresUserAction: this.requiresUserAction(authError)
    };

    if (this.debugMode) {
      logger.group('🚨 Authentication Error Report');
      logger.error('Error:', authError);
      logger.debug('Suggestions:', suggestions);
      logger.debug('Diagnostics:', diagnostics);
      logger.debug('Can Auto Recover:', report.canAutoRecover);
      logger.debug('Requires User Action:', report.requiresUserAction);
      logger.groupEnd();
    }

    // Show user-friendly error notification
    this.showErrorNotification(report);

    return report;
  }

  /**
   * Categorize error into specific authentication error types
   */
  private categorizeError(error: any, context: any): AuthError {
    const errorMessage = error?.message || error?.toString() || 'Unknown error';
    const errorCode = error?.code || error?.status || error?.statusCode;
    
    let type = AuthErrorType.UNKNOWN_ERROR;
    let severity = ErrorSeverity.MEDIUM;

    // Token-related errors
    if (errorMessage.includes('expired') || errorMessage.includes('EXPIRED')) {
      type = AuthErrorType.TOKEN_EXPIRED;
      severity = ErrorSeverity.MEDIUM;
    } else if (errorMessage.includes('invalid') || errorMessage.includes('INVALID') || errorMessage.includes('malformed')) {
      type = AuthErrorType.TOKEN_INVALID;
      severity = ErrorSeverity.HIGH;
    } else if (errorMessage.includes('missing') || errorMessage.includes('required') || errorMessage.includes('NO_TOKEN')) {
      type = AuthErrorType.TOKEN_MISSING;
      severity = ErrorSeverity.HIGH;
    }
    
    // Network-related errors
    else if (errorMessage.includes('network') || errorMessage.includes('NETWORK') || 
             errorMessage.includes('fetch') || errorMessage.includes('connection')) {
      type = AuthErrorType.NETWORK_ERROR;
      severity = ErrorSeverity.MEDIUM;
    }
    
    // Server errors
    else if (errorCode >= 500 || errorMessage.includes('server') || errorMessage.includes('SERVER')) {
      type = AuthErrorType.SERVER_ERROR;
      severity = ErrorSeverity.HIGH;
    }
    
    // Permission errors
    else if (errorCode === 403 || errorMessage.includes('forbidden') || errorMessage.includes('permission')) {
      type = AuthErrorType.PERMISSION_DENIED;
      severity = ErrorSeverity.HIGH;
    }
    
    // Rate limiting
    else if (errorCode === 429 || errorMessage.includes('rate') || errorMessage.includes('limit')) {
      type = AuthErrorType.RATE_LIMITED;
      severity = ErrorSeverity.MEDIUM;
    }
    
    // Session errors
    else if (errorMessage.includes('session') || errorMessage.includes('SESSION')) {
      type = AuthErrorType.SESSION_EXPIRED;
      severity = ErrorSeverity.MEDIUM;
    }
    
    // CORS errors
    else if (errorMessage.includes('CORS') || errorMessage.includes('cross-origin')) {
      type = AuthErrorType.CORS_ERROR;
      severity = ErrorSeverity.HIGH;
    }

    return {
      type,
      severity,
      message: errorMessage,
      originalError: error,
      context,
      timestamp: Date.now(),
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
      url: typeof window !== 'undefined' ? window.location.href : undefined
    };
  }

  /**
   * Generate recovery suggestions based on error type
   */
  private generateRecoverySuggestions(error: AuthError): RecoverySuggestion[] {
    const suggestions: RecoverySuggestion[] = [];

    switch (error.type) {
      case AuthErrorType.TOKEN_EXPIRED:
        suggestions.push(
          {
            action: 'REFRESH_TOKEN',
            description: 'Attempt to refresh the authentication token',
            priority: 1,
            automated: true,
            userFriendly: 'Refreshing your session...'
          },
          {
            action: 'RELOGIN',
            description: 'Log out and log back in',
            priority: 2,
            automated: false,
            userFriendly: 'Please log in again'
          }
        );
        break;

      case AuthErrorType.TOKEN_INVALID:
        suggestions.push(
          {
            action: 'CLEAR_STORAGE',
            description: 'Clear stored authentication data',
            priority: 1,
            automated: true,
            userFriendly: 'Clearing invalid session data...'
          },
          {
            action: 'RELOGIN',
            description: 'Log in with fresh credentials',
            priority: 2,
            automated: false,
            userFriendly: 'Please log in again'
          }
        );
        break;

      case AuthErrorType.TOKEN_MISSING:
        suggestions.push(
          {
            action: 'CHECK_STORAGE',
            description: 'Check alternative storage locations for tokens',
            priority: 1,
            automated: true,
            userFriendly: 'Looking for saved session...'
          },
          {
            action: 'RELOGIN',
            description: 'Log in to create new session',
            priority: 2,
            automated: false,
            userFriendly: 'Please log in to continue'
          }
        );
        break;

      case AuthErrorType.NETWORK_ERROR:
        suggestions.push(
          {
            action: 'RETRY_CONNECTION',
            description: 'Retry the connection after a delay',
            priority: 1,
            automated: true,
            userFriendly: 'Retrying connection...'
          },
          {
            action: 'CHECK_INTERNET',
            description: 'Check internet connection',
            priority: 2,
            automated: false,
            userFriendly: 'Please check your internet connection'
          },
          {
            action: 'REFRESH_PAGE',
            description: 'Refresh the page',
            priority: 3,
            automated: false,
            userFriendly: 'Try refreshing the page'
          }
        );
        break;

      case AuthErrorType.SERVER_ERROR:
        suggestions.push(
          {
            action: 'WAIT_AND_RETRY',
            description: 'Wait and retry the request',
            priority: 1,
            automated: true,
            userFriendly: 'Server is busy, retrying...'
          },
          {
            action: 'CONTACT_SUPPORT',
            description: 'Contact technical support',
            priority: 2,
            automated: false,
            userFriendly: 'Please contact support if this continues'
          }
        );
        break;

      case AuthErrorType.PERMISSION_DENIED:
        suggestions.push(
          {
            action: 'CHECK_PERMISSIONS',
            description: 'Verify user permissions',
            priority: 1,
            automated: false,
            userFriendly: 'You may not have permission for this action'
          },
          {
            action: 'RELOGIN',
            description: 'Log in again to refresh permissions',
            priority: 2,
            automated: false,
            userFriendly: 'Try logging in again'
          }
        );
        break;

      case AuthErrorType.RATE_LIMITED:
        suggestions.push(
          {
            action: 'WAIT_COOLDOWN',
            description: 'Wait for rate limit cooldown',
            priority: 1,
            automated: true,
            userFriendly: 'Please wait a moment before trying again'
          },
          {
            action: 'REDUCE_REQUESTS',
            description: 'Reduce request frequency',
            priority: 2,
            automated: false,
            userFriendly: 'Please slow down your requests'
          }
        );
        break;

      case AuthErrorType.SESSION_EXPIRED:
        suggestions.push(
          {
            action: 'REFRESH_SESSION',
            description: 'Attempt to refresh the session',
            priority: 1,
            automated: true,
            userFriendly: 'Refreshing your session...'
          },
          {
            action: 'RELOGIN',
            description: 'Start a new session',
            priority: 2,
            automated: false,
            userFriendly: 'Please log in again'
          }
        );
        break;

      case AuthErrorType.CORS_ERROR:
        suggestions.push(
          {
            action: 'CHECK_CONFIGURATION',
            description: 'Check CORS configuration',
            priority: 1,
            automated: false,
            userFriendly: 'There may be a configuration issue'
          },
          {
            action: 'CONTACT_SUPPORT',
            description: 'Contact technical support',
            priority: 2,
            automated: false,
            userFriendly: 'Please contact support'
          }
        );
        break;

      default:
        suggestions.push(
          {
            action: 'REFRESH_PAGE',
            description: 'Refresh the page',
            priority: 1,
            automated: false,
            userFriendly: 'Try refreshing the page'
          },
          {
            action: 'CLEAR_CACHE',
            description: 'Clear browser cache',
            priority: 2,
            automated: false,
            userFriendly: 'Try clearing your browser cache'
          },
          {
            action: 'CONTACT_SUPPORT',
            description: 'Contact technical support',
            priority: 3,
            automated: false,
            userFriendly: 'Contact support if the problem persists'
          }
        );
    }

    return suggestions.sort((a, b) => a.priority - b.priority);
  }

  /**
   * Generate diagnostic information
   */
  private generateDiagnostics(error: AuthError, context: any) {
    return {
      error: {
        type: error.type,
        severity: error.severity,
        message: error.message,
        timestamp: new Date(error.timestamp).toISOString()
      },
      context: {
        url: error.url,
        userAgent: error.userAgent,
        ...context
      },
      browser: typeof window !== 'undefined' ? {
        cookiesEnabled: navigator.cookieEnabled,
        onLine: navigator.onLine,
        language: navigator.language,
        platform: navigator.platform
      } : null,
      storage: typeof window !== 'undefined' ? {
        localStorage: !!window.localStorage,
        sessionStorage: !!window.sessionStorage,
        cookies: !!document.cookie
      } : null,
      recentErrors: this.getRecentErrors(5),
      errorFrequency: this.getErrorFrequency(error.type)
    };
  }

  /**
   * Determine if error can be automatically recovered
   */
  private canAutoRecover(error: AuthError): boolean {
    const autoRecoverableTypes = [
      AuthErrorType.TOKEN_EXPIRED,
      AuthErrorType.NETWORK_ERROR,
      AuthErrorType.RATE_LIMITED,
      AuthErrorType.SESSION_EXPIRED
    ];
    
    return autoRecoverableTypes.includes(error.type);
  }

  /**
   * Determine if error requires user action
   */
  private requiresUserAction(error: AuthError): boolean {
    const userActionTypes = [
      AuthErrorType.TOKEN_INVALID,
      AuthErrorType.TOKEN_MISSING,
      AuthErrorType.PERMISSION_DENIED,
      AuthErrorType.CORS_ERROR
    ];
    
    return userActionTypes.includes(error.type);
  }

  /**
   * Show user-friendly error notification
   */
  private showErrorNotification(report: ErrorReport): void {
    const { error, suggestions } = report;
    
    const primarySuggestion = suggestions.find(s => s.automated) || suggestions[0];
    const userSuggestions = suggestions.filter(s => !s.automated).slice(0, 3);

    const title = this.getErrorTitle(error.type);
    const description = primarySuggestion?.userFriendly || error.message;

    if (error.severity === ErrorSeverity.CRITICAL) {
      toast.error(title, {
        description,
        duration: 10000,
        action: userSuggestions.length > 0 ? {
          label: 'Show Help',
          onClick: () => this.showDetailedHelp(report)
        } : undefined
      });
    } else if (error.severity === ErrorSeverity.HIGH) {
      toast.error(title, {
        description,
        duration: 7000,
        action: userSuggestions.length > 0 ? {
          label: 'Help',
          onClick: () => this.showDetailedHelp(report)
        } : undefined
      });
    } else {
      toast.warning(title, {
        description,
        duration: 5000
      });
    }
  }

  /**
   * Get user-friendly error title
   */
  private getErrorTitle(type: AuthErrorType): string {
    const titles = {
      [AuthErrorType.TOKEN_EXPIRED]: 'Session Expired',
      [AuthErrorType.TOKEN_INVALID]: 'Authentication Error',
      [AuthErrorType.TOKEN_MISSING]: 'Login Required',
      [AuthErrorType.NETWORK_ERROR]: 'Connection Error',
      [AuthErrorType.SERVER_ERROR]: 'Server Error',
      [AuthErrorType.PERMISSION_DENIED]: 'Access Denied',
      [AuthErrorType.RATE_LIMITED]: 'Too Many Requests',
      [AuthErrorType.SESSION_EXPIRED]: 'Session Expired',
      [AuthErrorType.CORS_ERROR]: 'Configuration Error',
      [AuthErrorType.UNKNOWN_ERROR]: 'Unexpected Error'
    };
    
    return titles[type] || 'Authentication Error';
  }

  /**
   * Show detailed help modal/toast
   */
  private showDetailedHelp(report: ErrorReport): void {
    const userSuggestions = report.suggestions
      .filter(s => !s.automated)
      .slice(0, 5)
      .map(s => `• ${s.userFriendly}`)
      .join('\n');

    toast.info('Recovery Suggestions', {
      description: userSuggestions || 'Please try refreshing the page or contact support.',
      duration: 15000
    });
  }

  /**
   * Add error to history
   */
  private addToHistory(error: AuthError): void {
    this.errorHistory.unshift(error);
    if (this.errorHistory.length > this.maxHistorySize) {
      this.errorHistory = this.errorHistory.slice(0, this.maxHistorySize);
    }
  }

  /**
   * Get recent errors
   */
  private getRecentErrors(count: number): AuthError[] {
    return this.errorHistory.slice(0, count);
  }

  /**
   * Get error frequency for a specific type
   */
  private getErrorFrequency(type: AuthErrorType): number {
    const recentWindow = Date.now() - (5 * 60 * 1000); // Last 5 minutes
    return this.errorHistory.filter(e => 
      e.type === type && e.timestamp > recentWindow
    ).length;
  }

  /**
   * Clear error history
   */
  clearHistory(): void {
    this.errorHistory = [];
  }

  /**
   * Get error statistics
   */
  getErrorStats() {
    const now = Date.now();
    const last24h = now - (24 * 60 * 60 * 1000);
    const lastHour = now - (60 * 60 * 1000);

    const recent24h = this.errorHistory.filter(e => e.timestamp > last24h);
    const recentHour = this.errorHistory.filter(e => e.timestamp > lastHour);

    const typeFrequency = this.errorHistory.reduce((acc, error) => {
      acc[error.type] = (acc[error.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      total: this.errorHistory.length,
      last24h: recent24h.length,
      lastHour: recentHour.length,
      typeFrequency,
      mostCommonType: Object.entries(typeFrequency)
        .sort(([,a], [,b]) => b - a)[0]?.[0] || null
    };
  }
}

// Export singleton instance
export const authErrorReporter = new AuthErrorReporter();