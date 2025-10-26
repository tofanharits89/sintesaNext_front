import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const timeRange = searchParams.get('timeRange') || '1h';

    // Generate mock historical data based on time range
    const now = new Date();
    const points = timeRange === '1h' ? 12 : timeRange === '6h' ? 24 : timeRange === '24h' ? 24 : 7;
    const interval = timeRange === '1h' ? 5 : timeRange === '6h' ? 15 : timeRange === '24h' ? 60 : 1440; // minutes

    const hitRateHistory = [];
    const responseTimeHistory = [];
    const compressionHistory = [];
    const errorRateHistory = [];

    for (let i = points - 1; i >= 0; i--) {
      const time = new Date(now.getTime() - i * interval * 60000);
      
      const baseHitRate = 85 + Math.random() * 10;
      const baseResponseTime = 45 + Math.random() * 30;
      const baseCompressionRatio = 65 + Math.random() * 15;
      const baseErrorRate = Math.random() * 2;

      hitRateHistory.push({
        timestamp: time.toISOString(),
        hit_rate: baseHitRate,
        miss_rate: 100 - baseHitRate,
      });

      responseTimeHistory.push({
        timestamp: time.toISOString(),
        avg_response_time: baseResponseTime,
        p95_response_time: baseResponseTime * 1.5,
        p99_response_time: baseResponseTime * 2.2,
      });

      compressionHistory.push({
        timestamp: time.toISOString(),
        compression_ratio: baseCompressionRatio,
        original_size: 1000 + Math.random() * 500,
        compressed_size: (1000 + Math.random() * 500) * (1 - baseCompressionRatio / 100),
      });

      errorRateHistory.push({
        timestamp: time.toISOString(),
        error_rate: baseErrorRate,
        success_rate: 100 - baseErrorRate,
      });
    }

    const response = {
      hit_rate_history: hitRateHistory,
      response_time_history: responseTimeHistory,
      compression_history: compressionHistory,
      error_rate_history: errorRateHistory,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching historical data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch historical data' },
      { status: 500 }
    );
  }
}
