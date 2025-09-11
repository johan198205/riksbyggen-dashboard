import { BetaAnalyticsDataClient } from '@google-analytics/data';

export interface Ga4Metrics {
  sessions: number;
  totalUsers: number;
  pageviews: number;
  averageEngagementTime: number;
  growthRates?: {
    sessions: number;
    totalUsers: number;
    pageviews: number;
    averageEngagementTime: number;
  };
}

export interface Ga4MetricsResponse {
  data: Ga4Metrics;
  error?: string;
}

export interface Ga4TimeSeriesData {
  date: string;
  value: number;
}

export interface Ga4TimeSeriesResponse {
  current: Ga4TimeSeriesData[];
  previousYear: Ga4TimeSeriesData[];
  error?: string;
}

export type Ga4MetricType = 'pageviews' | 'sessions' | 'users' | 'engagement';
export type Ga4Granularity = 'DAY' | 'WEEK' | 'MONTH';

class Ga4ClientEmailService {
  private client: BetaAnalyticsDataClient | null = null;
  private propertyId: string;

  constructor() {
    this.propertyId = process.env.GA4_PROPERTY_ID || '';
    
    if (!this.propertyId) {
      console.error('GA4_PROPERTY_ID environment variable is not set');
      return;
    }

    this.initializeClient();
  }

  private initializeClient() {
    try {
      const clientEmail = process.env.GA4_CLIENT_EMAIL;
      const privateKey = process.env.GA4_PRIVATE_KEY;

      if (!clientEmail || !privateKey) {
        console.error('GA4_CLIENT_EMAIL or GA4_PRIVATE_KEY environment variables are not set');
        return;
      }

      // Create credentials object from environment variables
      const credentials = {
        type: 'service_account',
        project_id: 'your-project-id', // This can be extracted from client_email if needed
        private_key_id: 'key-id', // Optional
        private_key: privateKey.replace(/\\n/g, '\n'), // Replace \n with actual newlines
        client_email: clientEmail,
        client_id: 'client-id', // Optional
        auth_uri: 'https://accounts.google.com/o/oauth2/auth',
        token_uri: 'https://oauth2.googleapis.com/token',
        auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
        client_x509_cert_url: `https://www.googleapis.com/robot/v1/metadata/x509/${encodeURIComponent(clientEmail)}`
      };

      console.log('GA4ClientEmailService: Initializing with client email:', clientEmail);
      this.client = new BetaAnalyticsDataClient({ credentials });
    } catch (error) {
      console.error('GA4ClientEmailService: Failed to initialize GA4 client:', error);
    }
  }

  async getMetrics(dateRange: { startDate: string; endDate: string }, includeGrowthRates: boolean = false): Promise<Ga4MetricsResponse> {
    if (!this.client) {
      return {
        data: { sessions: 0, totalUsers: 0, pageviews: 0, averageEngagementTime: 0 },
        error: 'GA4 client not initialized'
      };
    }

    try {
      console.log(`GA4ClientEmailService: Fetching data for property: ${this.propertyId}`);
      console.log(`GA4ClientEmailService: Date range: ${dateRange.startDate} to ${dateRange.endDate}`);
      
      const [response] = await this.client.runReport({
        property: `properties/${this.propertyId}`,
        dateRanges: [dateRange],
        metrics: [
          { name: 'sessions' },
          { name: 'totalUsers' },
          { name: 'screenPageViews' },
          { name: 'userEngagementDuration' }
        ]
      });

      const rows = response.rows || [];
      if (rows.length === 0) {
        return {
          data: { sessions: 0, totalUsers: 0, pageviews: 0, averageEngagementTime: 0 },
          error: 'No data found for the specified date range'
        };
      }

      const aggregatedData = rows.reduce((acc, row) => {
        const metrics = row.metricValues || [];
        return {
          sessions: acc.sessions + parseInt(metrics[0]?.value || '0'),
          totalUsers: acc.totalUsers + parseInt(metrics[1]?.value || '0'),
          pageviews: acc.pageviews + parseInt(metrics[2]?.value || '0'),
          userEngagementDuration: acc.userEngagementDuration + parseFloat(metrics[3]?.value || '0')
        };
      }, { sessions: 0, totalUsers: 0, pageviews: 0, userEngagementDuration: 0 });

      let averageEngagementTime = 0;
      if (aggregatedData.sessions > 0) {
        averageEngagementTime = aggregatedData.userEngagementDuration / aggregatedData.sessions;
      }

      const currentData = {
        sessions: aggregatedData.sessions,
        totalUsers: aggregatedData.totalUsers,
        pageviews: aggregatedData.pageviews,
        averageEngagementTime: Math.round(averageEngagementTime)
      };

      // Calculate growth rates if requested
      if (includeGrowthRates) {
        const growthRates = await this.calculateGrowthRates(dateRange, currentData);
        return { 
          data: {
            ...currentData,
            growthRates
          }
        };
      }

      return { 
        data: currentData
      };
    } catch (error) {
      console.error('GA4ClientEmailService: Error fetching GA4 metrics:', error);
      return {
        data: { sessions: 0, totalUsers: 0, pageviews: 0, averageEngagementTime: 0 },
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  private async calculateGrowthRates(currentDateRange: { startDate: string; endDate: string }, currentData: any) {
    try {
      // Calculate same period 1 year ago (year-over-year comparison)
      const currentStart = new Date(currentDateRange.startDate);
      const currentEnd = new Date(currentDateRange.endDate);
      
      const previousStart = new Date(currentStart);
      previousStart.setFullYear(previousStart.getFullYear() - 1);
      const previousEnd = new Date(currentEnd);
      previousEnd.setFullYear(previousEnd.getFullYear() - 1);

      const previousDateRange = {
        startDate: previousStart.toISOString().split('T')[0],
        endDate: previousEnd.toISOString().split('T')[0]
      };

      console.log(`GA4ClientEmailService: Calculating year-over-year growth rates for period ${previousDateRange.startDate} to ${previousDateRange.endDate}`);

      // Fetch previous period data
      const [response] = await this.client!.runReport({
        property: `properties/${this.propertyId}`,
        dateRanges: [previousDateRange],
        metrics: [
          { name: 'sessions' },
          { name: 'totalUsers' },
          { name: 'screenPageViews' },
          { name: 'userEngagementDuration' }
        ]
      });

      const rows = response.rows || [];
      if (rows.length === 0) {
        console.log('GA4ClientEmailService: No previous year data found, returning zero growth rates');
        return {
          sessions: 0.00,
          totalUsers: 0.00,
          pageviews: 0.00,
          averageEngagementTime: 0.00
        };
      }

      const previousData = rows.reduce((acc, row) => {
        const metrics = row.metricValues || [];
        return {
          sessions: acc.sessions + parseInt(metrics[0]?.value || '0'),
          totalUsers: acc.totalUsers + parseInt(metrics[1]?.value || '0'),
          pageviews: acc.pageviews + parseInt(metrics[2]?.value || '0'),
          userEngagementDuration: acc.userEngagementDuration + parseFloat(metrics[3]?.value || '0')
        };
      }, { sessions: 0, totalUsers: 0, pageviews: 0, userEngagementDuration: 0 });

      let previousAverageEngagementTime = 0;
      if (previousData.sessions > 0) {
        previousAverageEngagementTime = previousData.userEngagementDuration / previousData.sessions;
      }

      // Calculate growth rates with 2 decimal places
      const calculateGrowthRate = (current: number, previous: number) => {
        if (previous === 0) return current > 0 ? 100.00 : 0.00;
        return Math.round(((current - previous) / previous) * 100 * 100) / 100; // Round to 2 decimal places
      };

      const growthRates = {
        sessions: calculateGrowthRate(currentData.sessions, previousData.sessions),
        totalUsers: calculateGrowthRate(currentData.totalUsers, previousData.totalUsers),
        pageviews: calculateGrowthRate(currentData.pageviews, previousData.pageviews),
        averageEngagementTime: calculateGrowthRate(currentData.averageEngagementTime, previousAverageEngagementTime)
      };

      console.log('GA4ClientEmailService: Growth rates calculated:', growthRates);
      return growthRates;

    } catch (error) {
      console.error('GA4ClientEmailService: Error calculating growth rates:', error);
      return {
        sessions: 0.00,
        totalUsers: 0.00,
        pageviews: 0.00,
        averageEngagementTime: 0.00
      };
    }
  }

  async getTimeSeries(
    metric: Ga4MetricType,
    startDate: string,
    endDate: string,
    granularity: Ga4Granularity = 'DAY'
  ): Promise<Ga4TimeSeriesResponse> {
    if (!this.client) {
      return {
        current: [],
        previousYear: [],
        error: 'GA4 client not initialized'
      };
    }

    try {
      console.log(`GA4ClientEmailService: Fetching time series for metric: ${metric}, period: ${startDate} to ${endDate}, granularity: ${granularity}`);

      // Map metric types to GA4 API metric names
      const metricMap: Record<Ga4MetricType, string> = {
        pageviews: 'screenPageViews',
        sessions: 'sessions',
        users: 'totalUsers',
        engagement: 'userEngagementDuration'
      };

      const ga4Metric = metricMap[metric];

      // Get current period data
      const currentData = await this.fetchTimeSeriesData(startDate, endDate, ga4Metric, granularity);
      
      // Calculate previous year period
      const currentStart = new Date(startDate);
      const currentEnd = new Date(endDate);
      const previousStart = new Date(currentStart);
      previousStart.setFullYear(previousStart.getFullYear() - 1);
      const previousEnd = new Date(currentEnd);
      previousEnd.setFullYear(previousEnd.getFullYear() - 1);

      const previousStartStr = previousStart.toISOString().split('T')[0];
      const previousEndStr = previousEnd.toISOString().split('T')[0];

      // Get previous year data
      const previousData = await this.fetchTimeSeriesData(previousStartStr, previousEndStr, ga4Metric, granularity);

      // For engagement metric, calculate average per session
      if (metric === 'engagement') {
        const currentSessions = await this.fetchTimeSeriesData(startDate, endDate, 'sessions', granularity);
        const previousSessions = await this.fetchTimeSeriesData(previousStartStr, previousEndStr, 'sessions', granularity);
        
        const currentWithAvg = currentData.map((item, index) => ({
          ...item,
          value: currentSessions[index]?.value > 0 ? item.value / currentSessions[index].value : 0
        }));

        const previousWithAvg = previousData.map((item, index) => ({
          ...item,
          value: previousSessions[index]?.value > 0 ? item.value / previousSessions[index].value : 0
        }));

        return {
          current: currentWithAvg,
          previousYear: previousWithAvg
        };
      }

      return {
        current: currentData,
        previousYear: previousData
      };

    } catch (error) {
      console.error('GA4ClientEmailService: Error fetching time series:', error);
      return {
        current: [],
        previousYear: [],
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  private async fetchTimeSeriesData(
    startDate: string,
    endDate: string,
    metric: string,
    granularity: Ga4Granularity
  ): Promise<Ga4TimeSeriesData[]> {
    const [response] = await this.client!.runReport({
      property: `properties/${this.propertyId}`,
      dateRanges: [{ startDate, endDate }],
      metrics: [{ name: metric }],
      dimensions: [{ name: 'date' }],
      orderBys: [{ dimension: { dimensionName: 'date' } }]
    });

    const rows = response.rows || [];
    
    return rows.map(row => ({
      date: row.dimensionValues?.[0]?.value || '',
      value: parseFloat(row.metricValues?.[0]?.value || '0')
    }));
  }

  getDateRange(days: number = 30): { startDate: string; endDate: string } {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - days);

    return {
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0]
    };
  }
}

export const ga4ClientEmailService = new Ga4ClientEmailService();
