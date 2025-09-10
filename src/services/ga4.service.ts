import { BetaAnalyticsDataClient } from '@google-analytics/data';

export interface Ga4Metrics {
  sessions: number;
  totalUsers: number;
  pageviews: number;
  averageEngagementTime: number;
}

export interface Ga4MetricsResponse {
  data: Ga4Metrics;
  error?: string;
}

class Ga4Service {
  private client: BetaAnalyticsDataClient | null = null;
  private propertyId: string;

  constructor() {
    this.propertyId = process.env.GA4_PROPERTY_ID || '';
    
    if (!this.propertyId) {
      console.error('GA4_PROPERTY_ID environment variable is not set');
      return;
    }

    try {
      // Handle both file path and JSON string credentials
      const credentials = this.getCredentials();
      console.log('Initializing GA4 client with credentials:', credentials ? 'FOUND' : 'NOT FOUND');
      this.client = new BetaAnalyticsDataClient(credentials);
    } catch (error) {
      console.error('Failed to initialize GA4 client:', error);
    }
  }

  private getCredentials() {
    console.log('Environment check:');
    console.log('- GA4_PROPERTY_ID:', process.env.GA4_PROPERTY_ID ? 'SET' : 'NOT SET');
    console.log('- GOOGLE_APPLICATION_CREDENTIALS_JSON:', process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON ? 'SET' : 'NOT SET');
    console.log('- GOOGLE_APPLICATION_CREDENTIALS:', process.env.GOOGLE_APPLICATION_CREDENTIALS ? 'SET' : 'NOT SET');

    // Option 1: JSON string from environment variable (production)
    if (process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON) {
      try {
        console.log('Using GOOGLE_APPLICATION_CREDENTIALS_JSON');
        const credentialsJson = JSON.parse(process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON);
        return { credentials: credentialsJson };
      } catch (error) {
        console.error('Failed to parse GOOGLE_APPLICATION_CREDENTIALS_JSON:', error);
      }
    }

    // Option 2: File path (development)
    if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      console.log('Using GOOGLE_APPLICATION_CREDENTIALS file path');
      return { keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS };
    }

    // Option 3: Default credentials (if running on GCP)
    console.log('Using default credentials');
    return {};
  }

  async getMetrics(dateRange: { startDate: string; endDate: string }): Promise<Ga4MetricsResponse> {
    if (!this.client) {
      return {
        data: { sessions: 0, totalUsers: 0, pageviews: 0, averageEngagementTime: 0 },
        error: 'GA4 client not initialized'
      };
    }

    try {
      console.log(`Fetching GA4 data for property: ${this.propertyId}`);
      console.log(`Date range: ${dateRange.startDate} to ${dateRange.endDate}`);
      
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

      // Aggregate data from all rows
      const aggregatedData = rows.reduce((acc, row) => {
        const metrics = row.metricValues || [];
        return {
          sessions: acc.sessions + parseInt(metrics[0]?.value || '0'),
          totalUsers: acc.totalUsers + parseInt(metrics[1]?.value || '0'),
          pageviews: acc.pageviews + parseInt(metrics[2]?.value || '0'),
          userEngagementDuration: acc.userEngagementDuration + parseFloat(metrics[3]?.value || '0')
        };
      }, { sessions: 0, totalUsers: 0, pageviews: 0, userEngagementDuration: 0 });

      // Calculate average engagement time per session
      let averageEngagementTime = 0;
      if (aggregatedData.sessions > 0) {
        averageEngagementTime = aggregatedData.userEngagementDuration / aggregatedData.sessions;
      }

      return { 
        data: {
          sessions: aggregatedData.sessions,
          totalUsers: aggregatedData.totalUsers,
          pageviews: aggregatedData.pageviews,
          averageEngagementTime: Math.round(averageEngagementTime)
        }
      };
    } catch (error) {
      console.error('Error fetching GA4 metrics:', error);
      return {
        data: { sessions: 0, totalUsers: 0, pageviews: 0, averageEngagementTime: 0 },
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
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

export const ga4Service = new Ga4Service();
