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

class Ga4OAuthService {
  private propertyId: string;
  private accessToken: string | null = null;

  constructor() {
    this.propertyId = process.env.GA4_PROPERTY_ID || '';
    
    if (!this.propertyId) {
      console.error('GA4_PROPERTY_ID environment variable is not set');
    }
  }

  private async getAccessToken(): Promise<string | null> {
    if (this.accessToken) {
      return this.accessToken;
    }

    try {
      // Try to get access token from environment or Vercel's built-in auth
      const token = process.env.GOOGLE_ACCESS_TOKEN;
      if (token) {
        this.accessToken = token;
        return token;
      }

      // If no token available, return null
      console.log('GA4OAuthService: No access token available');
      return null;
    } catch (error) {
      console.error('GA4OAuthService: Failed to get access token:', error);
      return null;
    }
  }

  async getMetrics(dateRange: { startDate: string; endDate: string }): Promise<Ga4MetricsResponse> {
    if (!this.propertyId) {
      return {
        data: { sessions: 0, totalUsers: 0, pageviews: 0, averageEngagementTime: 0 },
        error: 'GA4 property ID not configured'
      };
    }

    const accessToken = await this.getAccessToken();
    if (!accessToken) {
      return {
        data: { sessions: 0, totalUsers: 0, pageviews: 0, averageEngagementTime: 0 },
        error: 'No Google access token available'
      };
    }

    try {
      console.log(`GA4OAuthService: Fetching data for property: ${this.propertyId}`);
      console.log(`GA4OAuthService: Date range: ${dateRange.startDate} to ${dateRange.endDate}`);
      
      const response = await fetch(`https://analyticsdata.googleapis.com/v1beta/properties/${this.propertyId}:runReport`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          dateRanges: [dateRange],
          metrics: [
            { name: 'sessions' },
            { name: 'totalUsers' },
            { name: 'screenPageViews' },
            { name: 'userEngagementDuration' }
          ]
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('GA4OAuthService: API request failed:', response.status, errorText);
        return {
          data: { sessions: 0, totalUsers: 0, pageviews: 0, averageEngagementTime: 0 },
          error: `API request failed: ${response.status} - ${errorText}`
        };
      }

      const data = await response.json();
      const rows = data.rows || [];
      
      if (rows.length === 0) {
        return {
          data: { sessions: 0, totalUsers: 0, pageviews: 0, averageEngagementTime: 0 },
          error: 'No data found for the specified date range'
        };
      }

      const aggregatedData = rows.reduce((acc: any, row: any) => {
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
      console.error('GA4OAuthService: Error fetching GA4 metrics:', error);
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

export const ga4OAuthService = new Ga4OAuthService();
