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

  async getMetrics(dateRange: { startDate: string; endDate: string }): Promise<Ga4MetricsResponse> {
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

      return { 
        data: {
          sessions: aggregatedData.sessions,
          totalUsers: aggregatedData.totalUsers,
          pageviews: aggregatedData.pageviews,
          averageEngagementTime: Math.round(averageEngagementTime)
        }
      };
    } catch (error) {
      console.error('GA4ClientEmailService: Error fetching GA4 metrics:', error);
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

export const ga4ClientEmailService = new Ga4ClientEmailService();
