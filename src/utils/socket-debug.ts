/**
 * Frontend Socket Authentication Debugging Utility
 * 
 * This utility provides comprehensive debugging tools for socket authentication
 * from the frontend perspective, including cookie analysis and connection testing.
 */

import { io, Socket } from 'socket.io-client';
import { parse } from 'cookie';

// Configuration
const CONFIG = {
  SOCKET_URL: process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:88',
  SOCKET_PATH: process.env.NEXT_PUBLIC_SOCKET_PATH || '/socket.io',
  API_BASE_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:88/api/v1'
};

// Logging utilities
const log = {
  info: (msg: string, data?: any) => console.log(`🔍 [SOCKET-DEBUG] ${msg}`, data || ''),
  success: (msg: string, data?: any) => console.log(`✅ [SOCKET-DEBUG] ${msg}`, data || ''),
  error: (msg: string, data?: any) => console.log(`❌ [SOCKET-DEBUG] ${msg}`, data || ''),
  warn: (msg: string, data?: any) => console.log(`⚠️  [SOCKET-DEBUG] ${msg}`, data || ''),
  section: (title: string) => console.log(`\n${'='.repeat(60)}\n${title}\n${'='.repeat(60)}`)
};

/**
 * Extract authentication token from cookies
 */
export function extractAuthTokenFromCookies(): string | null {
  log.section('Cookie Token Extraction');
  
  const cookieString = document.cookie;
  log.info('Raw cookie string', {
    length: cookieString.length,
    preview: cookieString.substring(0, 200) + (cookieString.length > 200 ? '...' : ''),
    isEmpty: !cookieString
  });
  
  if (!cookieString) {
    log.warn('No cookies found in document.cookie');
    return null;
  }
  
  // Parse cookies
  const cookies = parse(cookieString);
  
  // First check for the authState cookie (non-httpOnly, readable by JavaScript)
  if (cookies.authState && typeof cookies.authState === 'string' && cookies.authState.trim()) {
    const parts = cookies.authState.split('.');
    if (parts.length === 3) {
      try {
        const payload = JSON.parse(atob(parts[1]));
        if (payload.exp && payload.exp * 1000 > Date.now()) {
          log.success('Found valid authState token');
          return cookies.authState;
        }
      } catch (decodeError) {
        log.warn('authState cookie is invalid, trying fallback options');
      }
    }
  }
  
  log.info('Parsed cookies', {
    count: Object.keys(cookies).length,
    names: Object.keys(cookies),
    hasAuthCookies: {
      authState: 'authState' in cookies,
      accessToken: 'accessToken' in cookies,
      access_token: 'access_token' in cookies,
      authToken: 'authToken' in cookies,
      auth_token: 'auth_token' in cookies,
      token: 'token' in cookies
    }
  });
  
  // Try different cookie names in order of preference (fallback after authState)
  const tokenNames = ['accessToken', 'access_token', 'authToken', 'auth_token', 'token'];
  for (const name of tokenNames) {
    if (cookies[name]) {
      log.success(`Token found in cookie: ${name}`, {
        tokenLength: cookies[name].length,
        tokenPrefix: cookies[name].substring(0, 20) + '...',
        tokenSuffix: '...' + cookies[name].substring(cookies[name].length - 10)
      });
      return cookies[name];
    }
  }
  
  log.error('No authentication token found in cookies', {
    availableCookies: Object.keys(cookies),
    searchedFor: tokenNames
  });
  
  return null;
}

/**
 * Decode JWT token without verification (for debugging)
 */
export function decodeJWT(token: string): any {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return { error: 'Invalid JWT structure - expected 3 parts, got ' + parts.length };
    }
    
    const header = JSON.parse(atob(parts[0]));
    const payload = JSON.parse(atob(parts[1]));
    
    const now = Date.now() / 1000;
    const isExpired = payload.exp ? now > payload.exp : false;
    const timeToExpiry = payload.exp ? payload.exp - now : null;
    
    return {
      header,
      payload,
      isExpired,
      expiresAt: payload.exp ? new Date(payload.exp * 1000).toISOString() : 'never',
      issuedAt: payload.iat ? new Date(payload.iat * 1000).toISOString() : 'unknown',
      timeToExpirySeconds: timeToExpiry,
      timeToExpiryMinutes: timeToExpiry ? Math.floor(timeToExpiry / 60) : null
    };
  } catch (error) {
    return { error: `Failed to decode JWT: ${error instanceof Error ? error.message : 'Unknown error'}` };
  }
}

/**
 * Analyze authentication token
 */
export function analyzeAuthToken(token: string | null): any {
  log.section('Token Analysis');
  
  if (!token) {
    log.error('No token provided for analysis');
    return { valid: false, error: 'No token provided' };
  }
  
  log.info('Token basic info', {
    length: token.length,
    prefix: token.substring(0, 20) + '...',
    suffix: '...' + token.substring(token.length - 10),
    hasJwtStructure: token.split('.').length === 3
  });
  
  const decoded = decodeJWT(token);
  
  if (decoded.error) {
    log.error('Token decode failed', { error: decoded.error });
    return { valid: false, error: decoded.error };
  }
  
  log.success('Token decoded successfully', {
    header: decoded.header,
    payload: {
      userId: decoded.payload.userId,
      username: decoded.payload.username,
      role: decoded.payload.role,
      issuer: decoded.payload.iss,
      audience: decoded.payload.aud
    },
    timing: {
      issuedAt: decoded.issuedAt,
      expiresAt: decoded.expiresAt,
      isExpired: decoded.isExpired,
      timeToExpiryMinutes: decoded.timeToExpiryMinutes
    }
  });
  
  if (decoded.isExpired) {
    log.warn('Token is expired!');
  } else if (decoded.timeToExpiryMinutes && decoded.timeToExpiryMinutes < 30) {
    log.warn(`Token expires soon: ${decoded.timeToExpiryMinutes} minutes remaining`);
  }
  
  return {
    valid: true,
    decoded,
    isExpired: decoded.isExpired,
    expiresAt: decoded.expiresAt,
    userId: decoded.payload.userId,
    username: decoded.payload.username,
    role: decoded.payload.role
  };
}

/**
 * Test socket connection with detailed debugging
 */
export function testSocketConnection(token?: string): Promise<{
  success: boolean;
  socketId?: string;
  error?: string;
  details?: any;
}> {
  log.section('Socket Connection Test');
  
  return new Promise((resolve) => {
    let resolved = false;
    const startTime = Date.now();
    
    // Get token if not provided
    const finalToken = token || extractAuthTokenFromCookies();
    
    if (!finalToken) {
      log.error('No token available for socket connection');
      return resolve({ success: false, error: 'No authentication token available' });
    }
    
    // Analyze token before connection
    const tokenAnalysis = analyzeAuthToken(finalToken);
    if (!tokenAnalysis.valid) {
      return resolve({ success: false, error: tokenAnalysis.error });
    }
    
    log.info('Attempting socket connection', {
      url: CONFIG.SOCKET_URL,
      path: CONFIG.SOCKET_PATH,
      tokenLength: finalToken.length,
      userId: tokenAnalysis.userId,
      username: tokenAnalysis.username,
      role: tokenAnalysis.role
    });
    
    // Set timeout
    const timeout = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        log.error('Socket connection timeout (10s)');
        resolve({ success: false, error: 'Connection timeout' });
      }
    }, 10000);
    
    // Create socket connection
    const socket = io(CONFIG.SOCKET_URL, {
      path: CONFIG.SOCKET_PATH,
      auth: {
        token: finalToken
      },
      transports: ['websocket', 'polling'],
      timeout: 5000,
      forceNew: true
    });
    
    // Connection successful
    socket.on('connect', () => {
      if (!resolved) {
        resolved = true;
        clearTimeout(timeout);
        
        const connectionTime = Date.now() - startTime;
        
        log.success('Socket connected successfully', {
          socketId: socket.id,
          transport: socket.io.engine.transport.name,
          connected: socket.connected,
          connectionTimeMs: connectionTime,
          url: socket.io.opts?.hostname || 'unknown',
          userId: tokenAnalysis.userId,
          username: tokenAnalysis.username
        });
        
        // Test basic functionality
        socket.emit('ping', { timestamp: Date.now() });
        
        // Disconnect after a short delay
        setTimeout(() => {
          socket.disconnect();
        }, 2000);
        
        resolve({
          success: true,
          socketId: socket.id,
          details: {
            transport: socket.io.engine.transport.name,
            connectionTime: connectionTime,
            userId: tokenAnalysis.userId,
            username: tokenAnalysis.username
          }
        });
      }
    });
    
    // Connection failed
    socket.on('connect_error', (error: any) => {
      if (!resolved) {
        resolved = true;
        clearTimeout(timeout);
        
        log.error('Socket connection failed', {
          error: error.message,
          type: error.type,
          description: error.description,
          context: error.context,
          data: error.data,
          connectionTimeMs: Date.now() - startTime
        });
        
        resolve({
          success: false,
          error: error.message,
          details: {
            type: error.type,
            description: error.description,
            context: error.context,
            data: error.data
          }
        });
      }
    });
    
    // Other events for debugging
    socket.on('disconnect', (reason: string) => {
      log.info('Socket disconnected', { reason });
    });
    
    socket.on('error', (error: any) => {
      log.error('Socket error', { error });
    });
    
    socket.on('pong', (data: any) => {
      log.info('Received pong', data);
    });
  });
}

/**
 * Run comprehensive socket debugging
 */
export async function runSocketDebugging(): Promise<void> {
  log.section('Frontend Socket Authentication Debugging');
  
  try {
    // Step 1: Check environment configuration
    log.info('Environment configuration', {
      socketUrl: CONFIG.SOCKET_URL,
      socketPath: CONFIG.SOCKET_PATH,
      apiUrl: CONFIG.API_BASE_URL,
      userAgent: navigator.userAgent.substring(0, 100) + '...',
      origin: window.location.origin,
      href: window.location.href
    });
    
    // Step 2: Extract and analyze token
    const token = extractAuthTokenFromCookies();
    if (!token) {
      log.error('Cannot proceed - no authentication token found');
      return;
    }
    
    const tokenAnalysis = analyzeAuthToken(token);
    if (!tokenAnalysis.valid) {
      log.error('Cannot proceed - invalid token', { error: tokenAnalysis.error });
      return;
    }
    
    // Step 3: Test socket connection
    const connectionResult = await testSocketConnection(token);
    
    if (connectionResult.success) {
      log.success('Socket debugging completed successfully', {
        socketId: connectionResult.socketId,
        details: connectionResult.details
      });
    } else {
      log.error('Socket connection failed', {
        error: connectionResult.error,
        details: connectionResult.details
      });
    }
    
  } catch (error) {
    log.error('Socket debugging failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack?.split('\n').slice(0, 5) : undefined
    });
  }
}

/**
 * Add debugging to window object for browser console access
 */
if (typeof window !== 'undefined') {
  (window as any).socketDebug = {
    runDebugging: runSocketDebugging,
    testConnection: testSocketConnection,
    extractToken: extractAuthTokenFromCookies,
    analyzeToken: analyzeAuthToken,
    decodeJWT,
    config: CONFIG
  };
  
  console.log('🔧 Socket debugging utilities available at window.socketDebug');
  console.log('   - window.socketDebug.runDebugging() - Run full debugging suite');
  console.log('   - window.socketDebug.testConnection() - Test socket connection');
  console.log('   - window.socketDebug.extractToken() - Extract token from cookies');
  console.log('   - window.socketDebug.analyzeToken(token) - Analyze JWT token');
}

export default {
  runSocketDebugging,
  testSocketConnection,
  extractAuthTokenFromCookies,
  analyzeAuthToken,
  decodeJWT,
  CONFIG
};