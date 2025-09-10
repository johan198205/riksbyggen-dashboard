import { useEffect, useState } from 'react';

interface Ga4Data {
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

interface Ga4StreamResponse {
  data: Ga4Data;
  dateRange: {
    startDate: string;
    endDate: string;
  };
  timestamp: string;
  error?: string;
}

export function useGa4Stream(days: number = 28, includeGrowthRates: boolean = true) {
  const [data, setData] = useState<Ga4StreamResponse | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 
      (typeof window !== 'undefined' ? window.location.origin : 'https://riksbyggen-dashboard.vercel.app');
    
    const url = `${baseUrl}/api/ga4/stream?days=${days}&includeGrowthRates=${includeGrowthRates}`;
    
    const eventSource = new EventSource(url);
    
    eventSource.onopen = () => {
      console.log('GA4 stream connected');
      setIsConnected(true);
      setError(null);
    };
    
    eventSource.onmessage = (event) => {
      try {
        const newData: Ga4StreamResponse = JSON.parse(event.data);
        setData(newData);
        if (newData.error) {
          setError(newData.error);
        } else {
          setError(null);
        }
      } catch (err) {
        console.error('Error parsing GA4 stream data:', err);
        setError('Failed to parse data');
      }
    };
    
    eventSource.onerror = (err) => {
      console.error('GA4 stream error:', err);
      setIsConnected(false);
      setError('Connection lost');
    };
    
    return () => {
      eventSource.close();
      setIsConnected(false);
    };
  }, [days, includeGrowthRates]);

  return {
    data,
    isConnected,
    error,
    isLoading: !data && !error
  };
}
