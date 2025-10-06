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
    toast.error('Permintaan gagal', {
      description: 'Silakan coba lagi nanti'
    });
    return;
  }

  // Handle IP blocking - redirect to dedicated page
  if (data.code === 'IP_BLOCKED') {
    const expiresIn = data.expiresIn || 3600;
    const blockedAt = Date.now();
    const reason = data.blockReason || data.error || 'Too many failed attempts or suspicious activity detected';
    
    // Show toast notification
    toast.error('Akses Diblokir', {
      description: 'Mengalihkan ke halaman blokir...',
      duration: 3000,
    });
    
    // Redirect to IP blocked page with details
    setTimeout(() => {
      if (typeof window !== 'undefined') {
        const params = new URLSearchParams({
          duration: expiresIn.toString(),
          blockedAt: blockedAt.toString(),
          reason: reason,
        });
        window.location.href = `/ip-blocked?${params.toString()}`;
      }
    }, 1000);
    
    return;
  }

  // Handle authentication rate limits
  if (data.error?.includes('auth-login')) {
    const retryAfter = data.retryAfter || 60;
    const timeRemaining = formatTimeRemaining(retryAfter);
    
    toast.error('Terlalu Banyak Percobaan Login', {
      description: `Silakan tunggu ${timeRemaining} sebelum mencoba lagi. Ini melindungi akun Anda dari akses tidak sah.`,
      duration: 8000,
      action: {
        label: 'Kenapa?',
        onClick: () => {
          toast.info('Perlindungan Keamanan', {
            description: 'Kami membatasi percobaan login hingga 5 kali per menit untuk melindungi dari serangan brute force. Ini menjaga keamanan akun Anda.',
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
    
    toast.warning('Batas Refresh Sesi', {
      description: `Terlalu banyak percobaan refresh. Silakan tunggu ${timeRemaining}.`,
      duration: 6000
    });
    return;
  }

  if (data.error?.includes('auth-register')) {
    const retryAfter = data.retryAfter || 300;
    const timeRemaining = formatTimeRemaining(retryAfter);
    
    toast.error('Batas Registrasi Tercapai', {
      description: `Silakan tunggu ${timeRemaining} sebelum membuat akun lain.`,
      duration: 8000
    });
    return;
  }

  // Handle general API rate limits
  if (data.error?.includes('Rate limit exceeded')) {
    const resetTime = data.resetTime;
    const retryAfter = data.retryAfter;
    
    let description = 'Anda telah membuat terlalu banyak permintaan. Silakan perlambat.';
    
    if (retryAfter) {
      const timeRemaining = formatTimeRemaining(retryAfter);
      description = `Silakan tunggu ${timeRemaining} sebelum mencoba lagi.`;
    } else if (resetTime) {
      const resetTimeStr = formatResetTime(resetTime);
      description = `Batas rate limit direset pada ${resetTimeStr}.`;
    }
    
    if (data.current && data.limit) {
      description += ` (${data.current}/${data.limit} requests used)`;
    }
    
    toast.warning('Batas Rate Limit Terlampaui', {
      description,
      duration: 6000,
      action: {
        label: 'Mengerti',
        onClick: () => toast.dismiss()
      }
    });
    return;
  }

  // Generic rate limit error
  toast.warning('Terlalu Banyak Permintaan', {
    description: data.error || 'Silakan perlambat dan coba lagi sebentar lagi.',
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
  
  // Check for 403 with IP_BLOCKED code or blocked message
  if (status === 403 && (
    data?.code === 'IP_BLOCKED' || 
    data?.error?.toLowerCase().includes('blocked') ||
    data?.error?.toLowerCase().includes('suspicious activity')
  )) {
    return true;
  }
  
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
    
    toast.error('Kesalahan', {
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
