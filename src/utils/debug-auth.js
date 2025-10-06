/**
 * Authentication Debugging Utility
 * Run this in the browser console to debug authentication state
 */

window.debugAuth = {
  // Check current auth state
  checkAuthState() {
    console.group('🔍 Authentication State Debug');

    // Check cookies
    const cookies = document.cookie.split(';').map(c => c.trim());
    const authCookies = cookies.filter(c =>
      c.includes('access') || c.includes('refresh') || c.includes('token')
    );
    console.log('🍪 Auth Cookies:', authCookies);

    // Check localStorage
    const authState = localStorage.getItem('auth-state');
    console.log('💾 LocalStorage Auth State:', authState ? JSON.parse(authState) : null);

    // Check if we can access user data
    console.log('🌐 Window Location:', window.location.href);
    console.log('📱 User Agent:', navigator.userAgent);

    console.groupEnd();
  },

  // Test API endpoints
  async testAPIEndpoints() {
    console.group('🧪 API Endpoint Tests');

    const endpoints = [
      '/api/auth/me',
      '/api/users/profile/me',
      '/api/dashboard/quick-stats'
    ];

    for (const endpoint of endpoints) {
      try {
        const response = await fetch(endpoint, {
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' }
        });
        console.log(`✅ ${endpoint}: ${response.status}`);

        if (response.ok) {
          const data = await response.json();
          console.log(`📊 Data for ${endpoint}:`, data);
        } else {
          console.warn(`⚠️ ${endpoint} failed:`, response.statusText);
        }
      } catch (error) {
        console.error(`❌ ${endpoint} error:`, error);
      }
    }

    console.groupEnd();
  },

  // Clear auth state
  clearAuthState() {
    console.log('🗑️ Clearing auth state...');

    // Clear localStorage
    localStorage.removeItem('auth-state');

    // Clear session storage
    sessionStorage.clear();

    // Clear cookies (non-HTTP only)
    document.cookie.split(';').forEach(cookie => {
      const eqPos = cookie.indexOf('=');
      const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
      document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
    });

    console.log('✅ Auth state cleared');
  },

  // Simulate login check
  async checkLoginStatus() {
    try {
      const response = await fetch('/api/auth/me', {
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        console.log('✅ User is authenticated:', data);
        return true;
      } else {
        console.log('❌ User is not authenticated');
        return false;
      }
    } catch (error) {
      console.error('❌ Error checking login status:', error);
      return false;
    }
  }
};

console.log('🔧 Auth debugging utilities loaded! Use window.debugAuth.checkAuthState() to start debugging.');