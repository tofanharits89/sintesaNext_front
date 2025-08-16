/**
 * Debug script to check authentication cookies and socket connection
 */

// Simple cookie parser (no external dependencies)
function parseCookies(cookieString) {
  const cookies = {};
  if (!cookieString) return cookies;
  
  cookieString.split(';').forEach(cookie => {
    const parts = cookie.trim().split('=');
    if (parts.length === 2) {
      cookies[parts[0]] = decodeURIComponent(parts[1]);
    }
  });
  return cookies;
}

// Simple JWT decoder (no verification, just parsing)
function decodeJWT(token) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid JWT format');
    }
    
    // Decode the payload (second part)
    const payload = parts[1];
    // Add padding if needed
    const paddedPayload = payload + '='.repeat((4 - payload.length % 4) % 4);
    const decoded = JSON.parse(atob(paddedPayload));
    return decoded;
  } catch (error) {
    throw new Error(`JWT decode failed: ${error.message}`);
  }
}

// Configuration from environment
const COOKIE_NAMES = ['accessToken', 'access_token', 'authToken', 'auth_token', 'token'];
const SOCKET_TOKEN_COOKIE = 'accessToken';

// Mock document.cookie for testing (you would get this from browser)
const mockCookies = 'accessToken=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxMjMiLCJ1c2VybmFtZSI6InRlc3QiLCJleHAiOjk5OTk5OTk5OTl9.test; other=value';

function debugAuthCookies(cookieString = '') {
  console.log('🔍 Debugging Authentication Cookies');
  console.log('=' .repeat(50));
  
  if (!cookieString) {
    console.log('❌ No cookies provided');
    return null;
  }
  
  console.log('📋 Raw cookies:', cookieString);
  
  try {
    const cookies = parseCookies(cookieString);
    console.log('🍪 Parsed cookies:', Object.keys(cookies));
    
    // Check each possible cookie name
    for (const cookieName of COOKIE_NAMES) {
      const token = cookies[cookieName];
      if (token) {
        console.log(`✅ Found token in '${cookieName}':`, token.substring(0, 20) + '...');
        
        // Try to decode JWT (without verification for debugging)
        try {
          const decoded = decodeJWT(token);
          if (decoded) {
            console.log('📄 Token payload:', {
              userId: decoded.userId || decoded.sub,
              username: decoded.username,
              exp: decoded.exp ? new Date(decoded.exp * 1000).toISOString() : 'No expiration',
              iat: decoded.iat ? new Date(decoded.iat * 1000).toISOString() : 'No issued time'
            });
            
            // Check if token is expired
            if (decoded.exp && decoded.exp < Date.now() / 1000) {
              console.log('⚠️  Token is EXPIRED');
            } else {
              console.log('✅ Token is valid (not expired)');
            }
          } else {
            console.log('❌ Failed to decode token');
          }
        } catch (jwtError) {
          console.log('❌ JWT decode error:', jwtError.message);
        }
        
        return token;
      }
    }
    
    console.log('❌ No authentication token found in any expected cookie');
    return null;
    
  } catch (error) {
    console.log('❌ Cookie parsing error:', error.message);
    return null;
  }
}

// Test with mock data
console.log('Testing with mock cookies...');
debugAuthCookies(mockCookies);

console.log('\n' + '='.repeat(50));
console.log('🔧 To test with real cookies:');
console.log('1. Open browser developer tools');
console.log('2. Go to Application/Storage > Cookies');
console.log('3. Copy the cookie string and run:');
console.log('   debugAuthCookies("your-cookie-string-here")');

module.exports = { debugAuthCookies };