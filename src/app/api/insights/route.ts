import { NextRequest, NextResponse } from 'next/server';
import { ga4ClientEmailService } from '@/services/ga4-client-email.service';

interface InsightRequest {
  metric: string;
  dateRange: { start: string; end: string };
  granularity: string;
}

interface InsightData {
  summaryMarkdown: string;
  actions: string[];
  anomalies: string[];
  confidence: 'low' | 'medium' | 'high';
}

interface TimeSeriesData {
  date: string;
  value: number;
}

interface CalculatedFeatures {
  total: number;
  average: number;
  min: number;
  max: number;
  median: number;
  stdDev: number;
  trend: number;
  yoyChange: number;
  spikes: Array<{ date: string; value: number; change: number }>;
  dips: Array<{ date: string; value: number; change: number }>;
  outliers: Array<{ date: string; value: number; zScore: number }>;
}

function calculateFeatures(currentData: TimeSeriesData[], previousData: TimeSeriesData[]): CalculatedFeatures {
  const values = currentData.map(d => d.value);
  const previousValues = previousData.map(d => d.value);
  
  // Basic statistics
  const total = values.reduce((sum, val) => sum + val, 0);
  const average = total / values.length;
  const min = Math.min(...values);
  const max = Math.max(...values);
  
  // Median
  const sortedValues = [...values].sort((a, b) => a - b);
  const median = sortedValues.length % 2 === 0
    ? (sortedValues[sortedValues.length / 2 - 1] + sortedValues[sortedValues.length / 2]) / 2
    : sortedValues[Math.floor(sortedValues.length / 2)];
  
  // Standard deviation
  const variance = values.reduce((sum, val) => sum + Math.pow(val - average, 2), 0) / values.length;
  const stdDev = Math.sqrt(variance);
  
  // Trend (linear regression slope)
  const n = values.length;
  const x = Array.from({ length: n }, (_, i) => i);
  const sumX = x.reduce((sum, val) => sum + val, 0);
  const sumY = values.reduce((sum, val) => sum + val, 0);
  const sumXY = x.reduce((sum, val, i) => sum + val * values[i], 0);
  const sumXX = x.reduce((sum, val) => sum + val * val, 0);
  const trend = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  
  // YoY change
  const previousTotal = previousValues.reduce((sum, val) => sum + val, 0);
  const yoyChange = previousTotal > 0 ? ((total - previousTotal) / previousTotal) * 100 : 0;
  
  // Detect spikes and dips (30% threshold)
  const spikes: Array<{ date: string; value: number; change: number }> = [];
  const dips: Array<{ date: string; value: number; change: number }> = [];
  
  for (let i = 1; i < values.length; i++) {
    const change = ((values[i] - values[i-1]) / values[i-1]) * 100;
    if (change > 30) {
      spikes.push({
        date: currentData[i].date,
        value: values[i],
        change
      });
    } else if (change < -20) {
      dips.push({
        date: currentData[i].date,
        value: values[i],
        change
      });
    }
  }
  
  // Detect outliers (z-score > 2)
  const outliers: Array<{ date: string; value: number; zScore: number }> = [];
  for (let i = 0; i < values.length; i++) {
    const zScore = Math.abs((values[i] - average) / stdDev);
    if (zScore > 2) {
      outliers.push({
        date: currentData[i].date,
        value: values[i],
        zScore
      });
    }
  }
  
  return {
    total,
    average,
    min,
    max,
    median,
    stdDev,
    trend,
    yoyChange,
    spikes,
    dips,
    outliers
  };
}

async function callOpenAI(features: CalculatedFeatures, metric: string, dateRange: { start: string; end: string }): Promise<InsightData> {
  const apiKey = process.env.OPENAI_API_KEY;
  
  console.log('OpenAI API Key check:', {
    hasKey: !!apiKey,
    keyLength: apiKey?.length || 0,
    keyPrefix: apiKey?.substring(0, 10) + '...' || 'none',
    allEnvVars: Object.keys(process.env).filter(key => key.includes('OPENAI'))
  });
  
  if (!apiKey) {
    console.error('OpenAI API key not configured. Please set OPENAI_API_KEY environment variable.');
    throw new Error('OpenAI API key not configured. Please set OPENAI_API_KEY environment variable.');
  }

  const systemPrompt = `You are a senior data analyst specializing in web analytics. Analyze the provided metric data and provide insights in Swedish.

Key responsibilities:
- Identify patterns, trends, and anomalies in the data
- Compare current period performance with previous year
- Provide actionable recommendations
- Use clear, professional Swedish language
- Be specific and data-driven in your analysis

Response format:
- summaryMarkdown: HTML-formatted summary in Swedish
- actions: Array of specific, actionable recommendations in Swedish
- anomalies: Array of detected anomalies or unusual patterns in Swedish
- confidence: "low", "medium", or "high" based on data quality and clarity of patterns

IMPORTANT: Respond with ONLY valid JSON. Do not include any markdown code blocks, explanations, or additional text. Start your response directly with { and end with }.`;

  const userPrompt = `Analyze the following ${metric} data for the period ${dateRange.start} to ${dateRange.end}:

CURRENT PERIOD STATISTICS:
- Total: ${features.total.toLocaleString()}
- Average: ${features.average.toFixed(2)}
- Min: ${features.min.toLocaleString()}
- Max: ${features.max.toLocaleString()}
- Median: ${features.median.toFixed(2)}
- Standard Deviation: ${features.stdDev.toFixed(2)}
- Trend: ${features.trend > 0 ? '+' : ''}${features.trend.toFixed(2)} per day
- Year-over-Year Change: ${features.yoyChange > 0 ? '+' : ''}${features.yoyChange.toFixed(1)}%

ANOMALIES DETECTED:
- Spikes: ${features.spikes.length} detected
- Dips: ${features.dips.length} detected  
- Outliers: ${features.outliers.length} detected

${features.spikes.length > 0 ? `SPIKES: ${features.spikes.map(s => `${s.date}: +${s.change.toFixed(1)}%`).join(', ')}` : ''}
${features.dips.length > 0 ? `DIPS: ${features.dips.map(d => `${d.date}: ${d.change.toFixed(1)}%`).join(', ')}` : ''}
${features.outliers.length > 0 ? `OUTLIERS: ${features.outliers.map(o => `${o.date}: z-score ${o.zScore.toFixed(2)}`).join(', ')}` : ''}

Provide a comprehensive analysis focusing on:
1. Overall performance and trends
2. Key anomalies and their potential causes
3. Specific actionable recommendations
4. Confidence level in the analysis

Respond with ONLY valid JSON. No markdown, no explanations, just pure JSON starting with { and ending with }.`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.1,
        max_tokens: 1500,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`OpenAI API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content;
    
    if (!content) {
      throw new Error('No content received from OpenAI');
    }

    console.log('OpenAI raw response:', content);

    // Clean and parse JSON response
    let cleanedContent = content.trim();
    
    // Remove markdown code blocks if present
    if (cleanedContent.startsWith('```json')) {
      cleanedContent = cleanedContent.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (cleanedContent.startsWith('```')) {
      cleanedContent = cleanedContent.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }
    
    console.log('Cleaned content:', cleanedContent);
    
    const parsed = JSON.parse(cleanedContent);
    
    return {
      summaryMarkdown: parsed.summaryMarkdown || 'Ingen sammanfattning tillgänglig.',
      actions: parsed.actions || [],
      anomalies: parsed.anomalies || [],
      confidence: parsed.confidence || 'low'
    };
  } catch (error) {
    console.error('OpenAI API error:', error);
    throw new Error('Failed to generate AI insights');
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('Insights API called');
    
    const body: InsightRequest = await request.json();
    const { metric, dateRange, granularity } = body;

    console.log('Request body:', { metric, dateRange, granularity });

    // Validate input
    if (!metric || !dateRange?.start || !dateRange?.end) {
      console.error('Missing required parameters:', { metric, dateRange });
      return NextResponse.json(
        { error: 'Missing required parameters: metric, dateRange' },
        { status: 400 }
      );
    }

    // Validate metric type
    const validMetrics = ['pageviews', 'sessions', 'users', 'engagement'];
    if (!validMetrics.includes(metric)) {
      console.error('Invalid metric:', metric);
      return NextResponse.json(
        { error: `Invalid metric. Must be one of: ${validMetrics.join(', ')}` },
        { status: 400 }
      );
    }

    // Get both aggregated metrics and time series data for consistency
    console.log('Fetching metrics and time series data...');
    
    // Get current period metrics (same as widget)
    const currentMetricsResponse = await ga4ClientEmailService.getMetrics({
      startDate: dateRange.start,
      endDate: dateRange.end
    }, true);

    if (currentMetricsResponse.error) {
      console.error('GA4 metrics error:', currentMetricsResponse.error);
      return NextResponse.json(
        { error: `Failed to fetch metrics data: ${currentMetricsResponse.error}` },
        { status: 500 }
      );
    }

    // Get time series data for analysis
    const timeSeriesResponse = await ga4ClientEmailService.getTimeSeries(
      metric as any,
      dateRange.start,
      dateRange.end,
      (granularity as any) || 'DAY'
    );

    if (timeSeriesResponse.error) {
      console.error('GA4 time series error:', timeSeriesResponse.error);
      return NextResponse.json(
        { error: `Failed to fetch time series data: ${timeSeriesResponse.error}` },
        { status: 500 }
      );
    }

    console.log('Data fetched successfully');
    console.log('Current metrics (same as widget):', {
      sessions: currentMetricsResponse.data.sessions,
      pageviews: currentMetricsResponse.data.pageviews,
      totalUsers: currentMetricsResponse.data.totalUsers
    });
    console.log('Time series data points:', timeSeriesResponse.current.length);

    // Calculate previous year period
    const currentStart = new Date(dateRange.start);
    const currentEnd = new Date(dateRange.end);
    const previousStart = new Date(currentStart);
    previousStart.setFullYear(previousStart.getFullYear() - 1);
    const previousEnd = new Date(currentEnd);
    previousEnd.setFullYear(previousEnd.getFullYear() - 1);

    const previousTimeSeriesResponse = await ga4ClientEmailService.getTimeSeries(
      metric as any,
      previousStart.toISOString().split('T')[0],
      previousEnd.toISOString().split('T')[0],
      (granularity as any) || 'DAY'
    );

    if (previousTimeSeriesResponse.error) {
      return NextResponse.json(
        { error: `Failed to fetch previous year data: ${previousTimeSeriesResponse.error}` },
        { status: 500 }
      );
    }

    console.log('Previous year data points:', previousTimeSeriesResponse.current.length);

    // Calculate features using time series data for analysis
    const features = calculateFeatures(
      timeSeriesResponse.current,
      previousTimeSeriesResponse.current
    );

    // Override total with widget data for consistency based on metric type
    let widgetTotal;
    switch (metric) {
      case 'sessions':
        widgetTotal = currentMetricsResponse.data.sessions;
        break;
      case 'users':
        widgetTotal = currentMetricsResponse.data.totalUsers;
        break;
      case 'pageviews':
        widgetTotal = currentMetricsResponse.data.pageviews;
        break;
      case 'engagement':
        widgetTotal = currentMetricsResponse.data.averageEngagementTime;
        break;
      default:
        widgetTotal = features.total; // fallback to calculated total
    }
    features.total = widgetTotal;

    console.log('Calculated features for insights:', {
      metric,
      total: features.total,
      average: features.average,
      trend: features.trend,
      yoyChange: features.yoyChange,
      dataPoints: timeSeriesResponse.current.length,
      widgetTotal: widgetTotal,
      timeSeriesTotal: timeSeriesResponse.current.reduce((sum, item) => sum + item.value, 0),
      currentMetrics: {
        sessions: currentMetricsResponse.data.sessions,
        totalUsers: currentMetricsResponse.data.totalUsers,
        pageviews: currentMetricsResponse.data.pageviews,
        averageEngagementTime: currentMetricsResponse.data.averageEngagementTime
      }
    });

    // Generate AI insights
    try {
      console.log('Attempting to call OpenAI...');
      const insights = await callOpenAI(features, metric, dateRange);
      console.log('OpenAI call successful, returning insights');
      return NextResponse.json(insights);
    } catch (openAIError) {
      console.error('OpenAI error, returning fallback insights:', openAIError);
      
      // Return fallback insights when OpenAI fails
      const fallbackInsights: InsightData = {
        summaryMarkdown: `
          <h3>Analys av ${metric} data</h3>
          <p><strong>Period:</strong> ${dateRange.start} till ${dateRange.end}</p>
          <p><strong>Total (samma som widget):</strong> ${features.total.toLocaleString()}</p>
          <p><strong>Genomsnitt per dag:</strong> ${features.average.toFixed(2)}</p>
          <p><strong>Trend:</strong> ${features.trend > 0 ? 'Uppåt' : 'Nedåt'} (${features.trend > 0 ? '+' : ''}${features.trend.toFixed(2)} per dag)</p>
          <p><strong>Årsförändring:</strong> ${features.yoyChange > 0 ? '+' : ''}${features.yoyChange.toFixed(1)}%</p>
          <p><em>AI-analys är inte tillgänglig för tillfället. Kontakta administratören för att konfigurera OpenAI API-nyckel.</em></p>
        `,
        actions: [
          'Kontrollera att OpenAI API-nyckel är korrekt konfigurerad',
          'Starta om utvecklingsservern efter att ha lagt till miljövariabeln',
          'Kontrollera att API-nyckeln har tillräcklig kredit'
        ],
        anomalies: features.outliers.length > 0 ? [
          `Upptäckte ${features.outliers.length} avvikande datapunkter`,
          `Högsta avvikelsen: ${Math.max(...features.outliers.map(o => o.zScore)).toFixed(2)} standardavvikelser`
        ] : ['Inga avvikelser upptäckta'],
        confidence: 'low'
      };
      
      console.log('Returning fallback insights');
      return NextResponse.json(fallbackInsights);
    }

  } catch (error) {
    console.error('Insights API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
