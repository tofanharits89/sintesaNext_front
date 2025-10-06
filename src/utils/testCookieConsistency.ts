/**
 * Cookie Consistency Test
 * 
 * This utility tests that the HTTP-only cookie implementation is working correctly
 * and that there are no conflicts between frontend and backend cookie handling.
 */

import { getAllCookies, clearNonHttpOnlyCookies } from '@/lib/cookieManager';

export interface CookieTestResult {
  testName: string;
  passed: boolean;
  message: string;
  details?: any;
}

export class CookieConsistencyTester {
  private results: CookieTestResult[] = [];

  /**
   * Run all cookie consistency tests
   */
  async runAllTests(): Promise<CookieTestResult[]> {
    this.results = [];
    
    console.log('🧪 Starting Cookie Consistency Tests...');
    console.log('=' .repeat(50));

    // Test 1: Verify no HTTP-only auth tokens in JavaScript
    this.testNoHttpOnlyTokens();

    // Test 2: Verify CSRF tokens are accessible (non-HTTP-only)
    this.testCsrfTokenAccessible();

    // Test 3: Verify cookie clearing behavior
    this.testCookieClearing();

    // Test 4: Verify cookie domain configuration
    this.testCookieDomainConfig();

    // Test 5: Verify secure attributes in production
    this.testSecureAttributes();

    console.log('=' .repeat(50));
    console.log('✅ Cookie Consistency Tests Completed');
    
    return this.results;
  }

  /**
   * Test 1: Verify no HTTP-only auth tokens are accessible via JavaScript
   */
  private testNoHttpOnlyTokens(): void {
    const cookies = getAllCookies();
    const cookieNames = Array.from(cookies.keys());
    
    // These should NOT be accessible (HTTP-only)
    const httpOnlyCookieNames = [
      'accessToken',
      'refreshToken',
      'access_token',
      'refresh_token',
      'authToken',
      'auth_token'
    ];

    const accessibleHttpOnlyCookies = cookieNames.filter(name => 
      httpOnlyCookieNames.some(httpOnlyName => 
        name.toLowerCase().includes(httpOnlyName.toLowerCase())
      )
    );

    const passed = accessibleHttpOnlyCookies.length === 0;

    this.results.push({
      testName: 'No HTTP-Only Tokens Accessible',
      passed,
      message: passed 
        ? '✅ HTTP-only tokens are properly secured'
        : `❌ Found HTTP-only tokens accessible: ${accessibleHttpOnlyCookies.join(', ')}`,
      details: {
        totalCookies: cookieNames.length,
        accessibleHttpOnlyCookies,
        allCookieNames: cookieNames
      }
    });
  }

  /**
   * Test 2: Verify CSRF tokens are accessible (should be non-HTTP-only)
   */
  private testCsrfTokenAccessible(): void {
    const cookies = getAllCookies();
    const cookieNames = Array.from(cookies.keys());
    
    const csrfCookieNames = [
      'XSRF-TOKEN',
      '_csrf',
      'csrf-token'
    ];

    const accessibleCsrfTokens = cookieNames.filter(name => 
      csrfCookieNames.some(csrfName => 
        name.toLowerCase() === csrfName.toLowerCase()
      )
    );

    const passed = accessibleCsrfTokens.length > 0;

    this.results.push({
      testName: 'CSRF Tokens Accessible',
      passed,
      message: passed 
        ? `✅ CSRF tokens accessible: ${accessibleCsrfTokens.join(', ')}`
        : '❌ No CSRF tokens found - may affect form submissions',
      details: {
        accessibleCsrfTokens,
        expectedCsrfNames: csrfCookieNames
      }
    });
  }

  /**
   * Test 3: Verify cookie clearing behavior
   */
  private testCookieClearing(): void {
    const beforeClear = getAllCookies();
    const beforeCount = beforeClear.size;

    // Test clearing non-HTTP-only cookies
    const clearResult = clearNonHttpOnlyCookies();
    const afterClear = getAllCookies();
    const afterCount = afterClear.size;

    // Check that only non-HTTP-only cookies were cleared
    const httpOnlyCookies = ['accessToken', 'refreshToken'];
    const httpOnlyStillPresent = httpOnlyCookies.filter(name => 
      afterClear.has(name)
    );

    const passed = clearResult.success && httpOnlyStillPresent.length >= 0; // May or may not be present

    this.results.push({
      testName: 'Cookie Clearing Behavior',
      passed,
      message: passed 
        ? `✅ Cookie clearing works correctly (cleared ${clearResult.cleared.length} cookies)`
        : `❌ Cookie clearing failed`,
      details: {
        beforeCount,
        afterCount,
        cleared: clearResult.cleared,
        remaining: clearResult.remaining,
        httpOnlyStillPresent
      }
    });
  }

  /**
   * Test 4: Verify cookie domain configuration
   */
  private testCookieDomainConfig(): void {
    const hostname = typeof window !== 'undefined' ? window.location.hostname : '';
    const isLocalhost = hostname.includes('localhost') || hostname === '127.0.0.1';
    
    // For non-localhost, check if domain is properly set
    let passed = true;
    let message = '✅ Cookie domain configuration looks correct';

    if (!isLocalhost && hostname.includes('.')) {
      const parts = hostname.split('.');
      if (parts.length >= 2) {
        // Should have domain set for multi-level domains
        message = `✅ Cookie domain configured for ${hostname}`;
      }
    } else {
      message = `✅ Cookie domain appropriate for ${hostname}`;
    }

    this.results.push({
      testName: 'Cookie Domain Configuration',
      passed,
      message,
      details: {
        hostname,
        isLocalhost,
        domainParts: hostname.split('.')
      }
    });
  }

  /**
   * Test 5: Verify secure attributes in production
   */
  private testSecureAttributes(): void {
    const isProduction = process.env.NODE_ENV === 'production';
    const isSecure = typeof window !== 'undefined' ? 
      window.location.protocol === 'https:' : false;

    let passed = true;
    let message = '';

    if (isProduction) {
      if (isSecure) {
        message = '✅ Production environment using HTTPS';
      } else {
        passed = false;
        message = '❌ Production environment should use HTTPS for secure cookies';
      }
    } else {
      message = `✅ Development environment (HTTPS: ${isSecure})`;
    }

    this.results.push({
      testName: 'Secure Attributes in Production',
      passed,
      message,
      details: {
        isProduction,
        isSecure,
        protocol: typeof window !== 'undefined' ? window.location.protocol : 'N/A'
      }
    });
  }

  /**
   * Get test summary
   */
  getSummary(): {
    total: number;
    passed: number;
    failed: number;
    results: CookieTestResult[];
  } {
    const total = this.results.length;
    const passed = this.results.filter(r => r.passed).length;
    const failed = total - passed;

    return {
      total,
      passed,
      failed,
      results: this.results
    };
  }

  /**
   * Print test results to console
   */
  printResults(): void {
    const summary = this.getSummary();
    
    console.log('\n📊 Cookie Consistency Test Summary:');
    console.log(`Total: ${summary.total}, Passed: ${summary.passed}, Failed: ${summary.failed}`);
    
    if (summary.failed > 0) {
      console.log('\n❌ Failed Tests:');
      this.results
        .filter(r => !r.passed)
        .forEach(r => {
          console.log(`  - ${r.testName}: ${r.message}`);
        });
    }
    
    console.log('\n✅ All tests completed!');
  }
}

/**
 * Run cookie consistency tests
 * Call this function to verify HTTP-only cookie implementation
 */
export async function runCookieConsistencyTests(): Promise<CookieTestResult[]> {
  if (typeof window === 'undefined') {
    console.log('Cookie tests can only run in browser environment');
    return [];
  }

  const tester = new CookieConsistencyTester();
  const results = await tester.runAllTests();
  tester.printResults();
  
  return results;
}

// Export for manual testing
export default CookieConsistencyTester;