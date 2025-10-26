import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Generate mock compression stats
    const stats = {
      totalCompressed: Math.floor(Math.random() * 1000000) + 500000,
      totalUncompressed: Math.floor(Math.random() * 2000000) + 1000000,
      compressionRatio: 65 + Math.random() * 20,
      brotliUsage: 70 + Math.random() * 20,
      gzipUsage: 20 + Math.random() * 10,
      averageCompressionTime: 10 + Math.random() * 20,
    };

    const response = {
      data: {
        stats,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching compression stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch compression stats' },
      { status: 500 }
    );
  }
}
