'use client';

import { compactFormat } from "@/lib/format-number";
import { useGa4Stream } from "@/hooks/use-ga4-stream";
import { OverviewCard } from "./card";
import * as icons from "./icons";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { InsightsSidebar } from "@/components/InsightsSidebar";
import { DateRangePicker } from "@/components/DateRangePicker";
import { insightsPrefetcher } from "@/lib/insights-prefetcher";

function formatEngagementTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  
  if (minutes === 0) {
    return `${remainingSeconds}s`;
  }
  
  return `${minutes}m ${remainingSeconds}s`;
}

export function RealtimeOverviewCardsGroup() {
  // Calculate days from date range
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>(() => {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - 28); // Default to 28 days
    return {
      start: startDate.toISOString().split('T')[0],
      end: endDate.toISOString().split('T')[0]
    };
  });
  
  // Calculate days from date range
  const days = Math.ceil((new Date(dateRange.end).getTime() - new Date(dateRange.start).getTime()) / (1000 * 60 * 60 * 24));
  
  const { data, isConnected, error, isLoading } = useGa4Stream(days, true);
  const [selectedMetric, setSelectedMetric] = useState<string>('pageviews');
  const [insightsSidebar, setInsightsSidebar] = useState<{
    isOpen: boolean;
    metric: string;
    metricLabel: string;
  }>({
    isOpen: false,
    metric: '',
    metricLabel: ''
  });
  const [prefetchStatus, setPrefetchStatus] = useState<Record<string, 'idle' | 'loading' | 'completed' | 'error'>>({});
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Get selected metric from URL params
    const metricParam = searchParams.get('selected_metric');
    if (metricParam && ['pageviews', 'sessions', 'users', 'engagement'].includes(metricParam)) {
      setSelectedMetric(metricParam);
    }
    
    // Get date range from URL params
    const dateRangeParam = searchParams.get('date_range');
    if (dateRangeParam) {
      const [start, end] = dateRangeParam.split(',');
      if (start && end) {
        setDateRange({ start, end });
      }
    }
  }, [searchParams]);

  // Prefetch insights ONLY after GA4 data is loaded
  useEffect(() => {
    if (!data) return; // Don't start AI prefetching until we have real data
    
    const prefetchInsights = async () => {
      console.log('Starting insights prefetch for date range:', dateRange);
      
      const metrics = ['pageviews', 'sessions', 'users', 'engagement'];
      const result = await insightsPrefetcher.prefetchInsights({
        dateRange,
        granularity: 'DAY',
        metrics,
        onProgress: (metric, status) => {
          setPrefetchStatus(prev => ({
            ...prev,
            [metric]: status === 'started' ? 'loading' : status === 'completed' ? 'completed' : 'error'
          }));
        }
      });

      console.log('Prefetch result:', result);
    };

    // Start AI prefetching only after we have real GA4 data
    prefetchInsights();
  }, [dateRange, data]);

  const handleDateRangeChange = (newDateRange: { start: string; end: string }) => {
    console.log('Date range changed:', newDateRange);
    setDateRange(newDateRange);
    
    // Update URL params to include date range
    const params = new URLSearchParams(searchParams.toString());
    params.set('date_range', `${newDateRange.start},${newDateRange.end}`);
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
    
    // Invalidate cache for old date range and start prefetching for new range
    insightsPrefetcher.invalidateCache(dateRange);
    setPrefetchStatus({});
  };

  const handleMetricSelect = (metric: string) => {
    setSelectedMetric(metric);
    
    // Update URL with selected metric
    const params = new URLSearchParams(searchParams.toString());
    params.set('selected_metric', metric);
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const handleAIClick = (metric: string, metricLabel: string) => {
    setInsightsSidebar({
      isOpen: true,
      metric,
      metricLabel
    });
  };

  const closeInsightsSidebar = () => {
    setInsightsSidebar({
      isOpen: false,
      metric: '',
      metricLabel: ''
    });
  };

  // Use real GA4 data if available, otherwise use fallback values
  const { sessions, totalUsers, pageviews, averageEngagementTime, growthRates } = data?.data || {
    sessions: 0,
    totalUsers: 0,
    pageviews: 0,
    averageEngagementTime: 0,
    growthRates: {
      sessions: 0,
      totalUsers: 0,
      pageviews: 0,
      averageEngagementTime: 0
    }
  };


  return (
    <>
      {/* Date Range Picker and AI Status */}
      <div className="mb-6 flex justify-between items-center">
        <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                     {data && Object.values(prefetchStatus).some(status => status === 'loading') && (
                       <>
                         <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                         <span>AI insights loading in background... (this may take up to {Math.max(60, days)} seconds for {days} days)</span>
                       </>
                     )}
          {data && Object.values(prefetchStatus).every(status => status === 'completed') && (
            <>
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>AI insights ready</span>
            </>
          )}
        </div>
        <DateRangePicker
          value={dateRange}
          onChange={handleDateRangeChange}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 sm:gap-6 xl:grid-cols-4 2xl:gap-7.5">
        <OverviewCard
          label="Pageviews"
          data={{
            value: compactFormat(pageviews),
            growthRate: growthRates?.pageviews || 0,
          }}
          Icon={icons.Views}
          metricType="pageviews"
          isSelected={selectedMetric === 'pageviews'}
          onClick={() => handleMetricSelect('pageviews')}
          onAIClick={() => handleAIClick('pageviews', 'Pageviews')}
          isLoading={isLoading || !data}
        />

        <OverviewCard
          label="Avg Engagement Time"
          data={{
            value: formatEngagementTime(averageEngagementTime),
            growthRate: growthRates?.averageEngagementTime || 0,
          }}
          Icon={icons.Profit}
          metricType="engagement"
          isSelected={selectedMetric === 'engagement'}
          onClick={() => handleMetricSelect('engagement')}
          onAIClick={() => handleAIClick('engagement', 'Avg Engagement Time')}
          isLoading={isLoading || !data}
        />

        <OverviewCard
          label="Sessions"
          data={{
            value: compactFormat(sessions),
            growthRate: growthRates?.sessions || 0,
          }}
          Icon={icons.Product}
          metricType="sessions"
          isSelected={selectedMetric === 'sessions'}
          onClick={() => handleMetricSelect('sessions')}
          onAIClick={() => handleAIClick('sessions', 'Sessions')}
          isLoading={isLoading || !data}
        />

        <OverviewCard
          label="Total Users"
          data={{
            value: compactFormat(totalUsers),
            growthRate: growthRates?.totalUsers || 0,
          }}
          Icon={icons.Users}
          metricType="users"
          isSelected={selectedMetric === 'users'}
          onClick={() => handleMetricSelect('users')}
          onAIClick={() => handleAIClick('users', 'Total Users')}
          isLoading={isLoading || !data}
        />
        
        {/* Connection status indicator */}
        <div className="col-span-4 flex justify-center items-center space-x-2 text-sm">
          <div className={`w-2 h-2 rounded-full ${isConnected && data ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
          <span className={isConnected && data ? 'text-green-600' : 'text-yellow-600'}>
            {isConnected && data ? 'Live data' : 'Loading data...'}
          </span>
          <span className="text-gray-500">
            {data ? `Last updated: ${new Date(data.timestamp).toLocaleTimeString()}` : 'Connecting to GA4...'}
          </span>
        </div>
      </div>

      <InsightsSidebar
        isOpen={insightsSidebar.isOpen}
        onClose={closeInsightsSidebar}
        metric={insightsSidebar.metric}
        metricLabel={insightsSidebar.metricLabel}
        dateRange={dateRange}
        granularity="DAY"
      />
    </>
  );
}
