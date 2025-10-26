import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Generate mock real-time data
    const metrics = {
      activeConnections: Math.floor(Math.random() * 100) + 20,
      requestsPerSecond: Math.floor(Math.random() * 50) + 10,
      memoryUsage: Math.floor(Math.random() * 80) + 20,
      cpuUsage: Math.floor(Math.random() * 60) + 10,
    };

    const response = {
      data: {
        metrics,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching real-time data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch real-time data' },
      { status: 500 }
    );
  }
}
