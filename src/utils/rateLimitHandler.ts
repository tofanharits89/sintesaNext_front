/**
 * Rate Limit Error Handler
 * 
 * Provides user-friendly notifications for rate limit errors
 * using Sonner toast notifications
 */

import { toast } from 'sonner';
import { AxiosError } from 'axios';

interface RateLimitError {
  success: false;
  error: string;
  resetTime?: number;
  retryAfter?: number;
  code?: string;
  expiresAt?: number;
  expiresIn?: number;
  blockReason?: string;
  current?: number;
  limit?: number;
}

/**
 * Format time remaining in human-readable format
 */
function formatTimeRemaining(seconds: number): string {
  if (seconds < 60) {
    return `${seconds} second${seconds !== 1 ? 's' : ''}`;
  }
  const minutes = Math.ceil(seconds / 60);
  return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
}

/**
 * Format timestamp to local time
 */
function formatResetTime(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
}

/**
 * Handle rate limit errors with user-friendly notifications
 */
export function handleRateLimitError(error: AxiosError<RateLimitError>): void {
  const data = error.response?.data;
  
  if (!data) {
    toast.error('Request failed', {
      description: 'Please try again later'
    });
    return;
  }

  // Handle IP blocking
  if (data.code === 'IP_BLOCKED') {
    const expiresIn = data.expiresIn || 3600;
    const timeRemaining = formatTimeRemaining(expiresIn);
    
    toast.error('Access Temporarily Blocked', {
      description: `Your access has been temporarily blocked due to suspicious activity. Please try again in ${timeRemaining}.`,
      duration: 10000,
      action: {
        label: 'Understand',
        onClick: () => {
          toast.info('Security Notice', {
            description: 'Multiple failed attempts or rate limit violations triggered this block. The block will be automatically lifted after the time period.',
            duration: 8000
          });
        }
      }
    });
    return;
  }

  // Handle authentication rate limits
  if (data.error?.includes('auth-login')) {
    const retryAfter = data.retryAfter || 60;
    const timeRemaining = formatTimeRemaining(retryAfter);
    
    toast.error('Too Many Login Attempts', {
      description: `Please wait ${timeRemaining} before trying again. This protects your account from unauthorized access.`,
      duration: 8000,
      action: {
        label: 'Why?',
        onClick: () => {
          toast.info('Security Protection', {
            description: 'We limit login attempts to 5 per minute to protect against brute force attacks. This keeps your account secure.',
            duration: 8000
          });
        }
      }
    });
    return;
  }

  if (data.error?.includes('auth-refresh')) {
    const retryAfter = data.retryAfter || 60;
    const timeRemaining = formatTimeRemaining(retryAfter);
    
    toast.warning('Session Refresh Limit', {
      description: `Too many refresh attempts. Please wait ${timeRemaining}.`,
      duration: 6000
    });
    return;
  }

  if (data.error?.includes('auth-register')) {
    const retryAfter = data.retryAfter || 300;
    const timeRemaining = formatTimeRemaining(retryAfter);
    
    toast.error('Registration Limit Reached', {
      description: `Please wait ${timeRemaining} before creating another account.`,
      duration: 8000
    });
    return;
  }

  // Handle general API rate limits
  if (data.error?.includes('Rate limit exceeded')) {
    const resetTime = data.resetTime;
    const retryAfter = data.retryAfter;
    
    let description = 'You\'ve made too many requests. Please slow down.';
    
    if (retryAfter) {
      const timeRemaining = formatTimeRemaining(retryAfter);
      description = `Please wait ${timeRemaining} before trying again.`;
    } else if (resetTime) {
      const resetTimeStr = formatResetTime(resetTime);
      description = `Rate limit resets at ${resetTimeStr}.`;
    }
    
    if (data.current && data.limit) {
      description += ` (${data.current}/${data.limit} requests used)`;
    }
    
    toast.warning('Rate Limit Exceeded', {
      description,
      duration: 6000,
      action: {
        label: 'Got it',
        onClick: () => toast.dismiss()
      }
    });
    return;
  }

  // Generic rate limit error
  toast.warning('Too Many Requests', {
    description: data.error || 'Please slow down and try again in a moment.',
    duration: 5000
  });
}

/**
 * Check if error is a rate limit error
 */
export function isRateLimitError(error: any): error is AxiosError<RateLimitError> {
  if (!error?.response) return false;
  
  const status = error.response.status;
  const data = error.response.data;
  
  // Check for 429 status code
  if (status === 429) return true;
  
  // Check for 403 with IP_BLOCKED code
  if (status === 403 && data?.code === 'IP_BLOCKED') return true;
  
  // Check for rate limit error messages
  if (data?.error?.includes('Rate limit') || data?.error?.includes('rate limit')) {
    return true;
  }
  
  return false;
}

/**
 * Axios interceptor for automatic rate limit handling
 */
export function setupRateLimitInterceptor(axiosInstance: any): void {
  axiosInstance.interceptors.response.use(
    (response: any) => response,
    (error: AxiosError) => {
      // Only handle rate limit errors
      if (isRateLimitError(error)) {
        handleRateLimitError(error);
      }
      
      // Always reject to allow error handling in components
      return Promise.reject(error);
    }
  );
}

/**
 * Manual rate limit error handler for use in try-catch blocks
 */
export function handleError(error: any): void {
  if (isRateLimitError(error)) {
    handleRateLimitError(error);
  } else {
    // Generic error handling
    const message = error?.response?.data?.error || 
                   error?.response?.data?.message || 
                   error?.message || 
                   'An error occurred';
    
    toast.error('Error', {
      description: message,
      duration: 5000
    });
  }
}

export default {
  handleRateLimitError,
  isRateLimitError,
  setupRateLimitInterceptor,
  handleError
};
