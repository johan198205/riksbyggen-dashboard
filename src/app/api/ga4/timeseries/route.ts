import { NextRequest, NextResponse } from 'next/server';
import { ga4ClientEmailService } from '@/services/ga4-client-email.service';

type Ga4MetricType = 'pageviews' | 'sessions' | 'users' | 'engagement';
type Ga4Granularity = 'DAY' | 'WEEK' | 'MONTH';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const metric = searchParams.get('metric') as Ga4MetricType;
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const granularity = (searchParams.get('granularity') as Ga4Granularity) || 'DAY';
    
    // Validate required parameters
    if (!metric || !startDate || !endDate) {
      return NextResponse.json(
        { error: 'Missing required parameters: metric, startDate, endDate' },
        { status: 400 }
      );
    }

    // Validate metric type
    const validMetrics: Ga4MetricType[] = ['pageviews', 'sessions', 'users', 'engagement'];
    if (!validMetrics.includes(metric)) {
      return NextResponse.json(
        { error: `Invalid metric. Must be one of: ${validMetrics.join(', ')}` },
        { status: 400 }
      );
    }

    // Validate date format (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(startDate) || !dateRegex.test(endDate)) {
      return NextResponse.json(
        { error: 'Invalid date format. Use YYYY-MM-DD' },
        { status: 400 }
      );
    }

    // Validate granularity
    const validGranularities: Ga4Granularity[] = ['DAY', 'WEEK', 'MONTH'];
    if (!validGranularities.includes(granularity)) {
      return NextResponse.json(
        { error: `Invalid granularity. Must be one of: ${validGranularities.join(', ')}` },
        { status: 400 }
      );
    }

    const result = await ga4ClientEmailService.getTimeSeries(metric, startDate, endDate, granularity);

    if (result.error) {
      return NextResponse.json(
        { 
          error: result.error,
          current: result.current,
          previousYear: result.previousYear
        },
        { 
          status: 200, // Return 200 with error message for graceful degradation
          headers: {
            'Cache-Control': 'public, max-age=300' // Cache for 5 minutes even on error
          }
        }
      );
    }

    return NextResponse.json({
      current: result.current,
      previousYear: result.previousYear,
      metric,
      startDate,
      endDate,
      granularity,
      timestamp: new Date().toISOString()
    }, {
      headers: {
        'Cache-Control': 'public, max-age=300' // Cache for 5 minutes
      }
    });

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        current: [],
        previousYear: []
      },
      { 
        status: 500,
        headers: {
          'Cache-Control': 'public, max-age=60' // Cache errors for 1 minute
        }
      }
    );
  }
}
