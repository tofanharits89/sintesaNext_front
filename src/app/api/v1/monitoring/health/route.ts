import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Generate mock health status
    const health = {
      status: Math.random() > 0.1 ? 'healthy' : 'warning',
      hitRate: 85 + Math.random() * 10,
      averageQueryTime: 45 + Math.random() * 30,
      issues: Math.random() > 0.8 ? [
        { message: 'High memory usage detected' },
        { message: 'Slow response times' }
      ] : [],
    };

    const response = {
      data: {
        health,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching health status:', error);
    return NextResponse.json(
      { error: 'Failed to fetch health status' },
      { status: 500 }
    );
  }
}
