import { NextRequest, NextResponse } from 'next/server';
import { ga4Service } from '@/services/ga4.service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '30');
    
    // Validate days parameter
    if (days < 1 || days > 365) {
      return NextResponse.json(
        { error: 'Days parameter must be between 1 and 365' },
        { status: 400 }
      );
    }

    const dateRange = ga4Service.getDateRange(days);
    const result = await ga4Service.getMetrics(dateRange);

    if (result.error) {
      return NextResponse.json(
        { 
          error: result.error,
          data: result.data // Return fallback data
        },
        { status: 200 } // Return 200 with error message for graceful degradation
      );
    }

    return NextResponse.json({
      data: result.data,
      dateRange,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        data: { sessions: 0, totalUsers: 0, pageviews: 0, averageEngagementTime: 0 }
      },
      { status: 500 }
    );
  }
}
