/**
 * Frontend Cache Debug API
 * Provides endpoints for frontend cache inspection and debugging
 */

import { NextRequest, NextResponse } from 'next/server';
import { CacheManager } from '@/lib/cache-manager';

// Initialize cache manager
const cacheManager = new CacheManager();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const limit = parseInt(searchParams.get('limit') || '50');

    switch (action) {
      case 'stats':
        return NextResponse.json({
          success: true,
          data: {
            performance: cacheManager.getCachePerformanceMetrics(),
            stats: cacheManager.getCacheStats()
          }
        });

      case 'audit':
        const filters: any = {};
        if (searchParams.get('operation')) filters.operation = searchParams.get('operation');
        if (searchParams.get('cacheType')) filters.cacheType = searchParams.get('cacheType');
        if (searchParams.get('userId')) filters.userId = searchParams.get('userId');
        if (searchParams.get('sessionId')) filters.sessionId = searchParams.get('sessionId');
        if (searchParams.get('success')) filters.success = searchParams.get('success') === 'true';
        if (searchParams.get('since')) filters.since = searchParams.get('since');

        const auditTrail = Object.keys(filters).length > 0
          ? cacheManager.getCacheAuditTrailFiltered(filters, limit)
          : cacheManager.getCacheAuditTrail(limit);

        return NextResponse.json({
          success: true,
          data: {
            entries: auditTrail,
            filters,
            totalReturned: auditTrail.length
          }
        });

      case 'health':
        const healthReport = cacheManager.generateCacheHealthReport();
        return NextResponse.json({
          success: true,
          data: healthReport
        });

      case 'cleanup':
        const cleanedCount = cacheManager.cleanupExpiredEntries();
        return NextResponse.json({
          success: true,
          data: {
            cleanedCount,
            message: `Cleaned up ${cleanedCount} expired cache entries`
          }
        });

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action. Use: stats, audit, health, or cleanup'
        }, { status: 400 });
    }
  } catch (error: any) {
    console.error('[Cache Debug API] Error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    switch (action) {
      case 'reset-metrics':
        cacheManager.resetCacheMetrics();
        return NextResponse.json({
          success: true,
          message: 'Cache performance metrics have been reset'
        });

      case 'clear-all':
        const clearedKeys = await cacheManager.clearAllAuthCaches();
        return NextResponse.json({
          success: true,
          data: {
            clearedKeys,
            message: `Cleared ${clearedKeys.length} cache entries`
          }
        });

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action. Use: reset-metrics or clear-all'
        }, { status: 400 });
    }
  } catch (error: any) {
    console.error('[Cache Debug API] Error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}