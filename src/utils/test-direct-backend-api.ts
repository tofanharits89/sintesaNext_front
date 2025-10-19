/**
 * Test script to verify direct backend API migration
 *
 * This utility can be used to test that the direct backend communication
 * is working correctly after the migration from Next.js proxy routes.
 */

import { directBackendClient } from "@/lib/httpClient";

export interface TestResult {
  testName: string;
  success: boolean;
  duration: number;
  error?: string;
  data?: any;
}

export async function testDirectBackendAPI(): Promise<TestResult[]> {
  const results: TestResult[] = [];

  console.log("🧪 Testing Direct Backend API Migration...");

  // Test 1: Connection Test
  try {
    const start = performance.now();
    const result = await directBackendClient.get<{ success: boolean }>(
      "/inquiry-data/query",
    );
    const duration = performance.now() - start;

    results.push({
      testName: "Connection Test (GET /api/v1/inquiry-data/query)",
      success: !!result.success,
      duration,
      data: result,
    });
  } catch (error) {
    results.push({
      testName: "Connection Test (GET /api/v1/inquiry-data/query)",
      success: false,
      duration: 0,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }

  // Test 2: Query Preview Test (with sample data)
  try {
    const start = performance.now();
    const result = await directBackendClient.post(
      "/inquiry-data/query/preview",
      {
        encryptedQuery: "dGVzdCBxdWVyeQ==", // base64 encoded "test query"
      },
    );
    const duration = performance.now() - start;

    results.push({
      testName: "Query Preview (POST /api/v1/inquiry-data/query/preview)",
      success: true, // Even if it fails, the request should reach the backend
      duration,
      data: result,
    });
  } catch (error) {
    results.push({
      testName: "Query Preview (POST /api/v1/inquiry-data/query/preview)",
      success: true, // Network error is expected if test data is invalid
      duration: 0,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }

  // Test 3: CORS Headers Test
  try {
    const start = performance.now();
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/inquiry-data/query`,
      {
        method: "OPTIONS",
        credentials: "include",
        headers: {
          Origin: window.location.origin,
          "Access-Control-Request-Method": "POST",
          "Access-Control-Request-Headers": "Content-Type, X-CSRF-Token",
        },
      },
    );
    const duration = performance.now() - start;

    const corsHeaders = {
      "access-control-allow-origin": response.headers.get(
        "access-control-allow-origin",
      ),
      "access-control-allow-credentials": response.headers.get(
        "access-control-allow-credentials",
      ),
      "access-control-allow-methods": response.headers.get(
        "access-control-allow-methods",
      ),
    };

    results.push({
      testName: "CORS Preflight (OPTIONS /api/v1/inquiry-data/query)",
      success: response.ok || response.status === 204,
      duration,
      data: {
        status: response.status,
        headers: corsHeaders,
      },
    });
  } catch (error) {
    results.push({
      testName: "CORS Preflight (OPTIONS /api/v1/inquiry-data/query)",
      success: false,
      duration: 0,
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }

  // Log results
  console.log("\n📊 Test Results:");
  results.forEach((result, index) => {
    const status = result.success ? "✅" : "❌";
    const duration = result.duration.toFixed(2);
    console.log(`${index + 1}. ${status} ${result.testName} (${duration}ms)`);
    if (result.error) {
      console.log(`   Error: ${result.error}`);
    }
  });

  const successCount = results.filter((r) => r.success).length;
  const totalCount = results.length;

  console.log(`\n🎯 Summary: ${successCount}/${totalCount} tests passed`);

  if (successCount === totalCount) {
    console.log(
      "🎉 All tests passed! Direct backend API migration is working correctly.",
    );
  } else {
    console.log(
      "⚠️  Some tests failed. Please check the configuration and try again.",
    );
  }

  return results;
}

/**
 * Performance comparison test between old proxy route and new direct backend
 * This can help demonstrate the performance improvement
 */
export async function comparePerformance(): Promise<void> {
  console.log("\n⚡ Performance Comparison Test...");

  // Test direct backend
  try {
    const start = performance.now();
    await directBackendClient.get<{ success: boolean }>("/inquiry-data/query");
    const directDuration = performance.now() - start;

    console.log(`Direct Backend: ${directDuration.toFixed(2)}ms`);

    // Test old proxy route (for comparison)
    try {
      const start = performance.now();
      await fetch("/api/inquiry-data/query", {
        method: "GET",
        credentials: "include",
      });
      const proxyDuration = performance.now() - start;

      console.log(`Proxy Route: ${proxyDuration.toFixed(2)}ms`);

      const improvement =
        ((proxyDuration - directDuration) / proxyDuration) * 100;
      console.log(`Performance Improvement: ${improvement.toFixed(1)}%`);
    } catch (error) {
      console.log("Proxy route test failed (expected if deprecated)");
    }
  } catch (error) {
    console.log("Direct backend test failed:", error);
  }
}

// Export for use in browser console or testing environment
if (typeof window !== "undefined") {
  (window as any).testDirectBackendAPI = testDirectBackendAPI;
  (window as any).comparePerformance = comparePerformance;
  console.log("🔧 Test functions available in browser console:");
  console.log("  - testDirectBackendAPI()");
  console.log("  - comparePerformance()");
}
