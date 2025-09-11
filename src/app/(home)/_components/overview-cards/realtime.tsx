'use client';

import { compactFormat } from "@/lib/format-number";
import { useGa4Stream } from "@/hooks/use-ga4-stream";
import { OverviewCard } from "./card";
import * as icons from "./icons";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { InsightsSidebar } from "@/components/InsightsSidebar";

function formatEngagementTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  
  if (minutes === 0) {
    return `${remainingSeconds}s`;
  }
  
  return `${minutes}m ${remainingSeconds}s`;
}

export function RealtimeOverviewCardsGroup() {
  const { data, isConnected, error, isLoading } = useGa4Stream(28, true);
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
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Get selected metric from URL params
    const metricParam = searchParams.get('selected_metric');
    if (metricParam && ['pageviews', 'sessions', 'users', 'engagement'].includes(metricParam)) {
      setSelectedMetric(metricParam);
    }
  }, [searchParams]);

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

  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 sm:gap-6 xl:grid-cols-4 2xl:gap-7.5">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="animate-pulse">
            <div className="rounded-lg border border-stroke bg-white p-6 shadow-default dark:border-strokedark dark:bg-boxdark">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/4"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error || !data) {
    // Show fallback data when GA4 is not available
    const fallbackData = {
      sessions: 1250,
      totalUsers: 980,
      pageviews: 3450,
      averageEngagementTime: 180,
      growthRates: {
        sessions: 12.5,
        totalUsers: 8.3,
        pageviews: 15.2,
        averageEngagementTime: 5.7
      }
    };

    return (
      <>
        <div className="grid gap-4 sm:grid-cols-2 sm:gap-6 xl:grid-cols-4 2xl:gap-7.5">
          <OverviewCard
            label="Pageviews"
            data={{
              value: compactFormat(fallbackData.pageviews),
              growthRate: fallbackData.growthRates.pageviews,
            }}
            Icon={icons.Views}
            metricType="pageviews"
            isSelected={selectedMetric === 'pageviews'}
            onClick={() => handleMetricSelect('pageviews')}
            onAIClick={() => handleAIClick('pageviews', 'Pageviews')}
          />

          <OverviewCard
            label="Avg Engagement Time"
            data={{
              value: formatEngagementTime(fallbackData.averageEngagementTime),
              growthRate: fallbackData.growthRates.averageEngagementTime,
            }}
            Icon={icons.Profit}
            metricType="engagement"
            isSelected={selectedMetric === 'engagement'}
            onClick={() => handleMetricSelect('engagement')}
            onAIClick={() => handleAIClick('engagement', 'Avg Engagement Time')}
          />

          <OverviewCard
            label="Sessions"
            data={{
              value: compactFormat(fallbackData.sessions),
              growthRate: fallbackData.growthRates.sessions,
            }}
            Icon={icons.Product}
            metricType="sessions"
            isSelected={selectedMetric === 'sessions'}
            onClick={() => handleMetricSelect('sessions')}
            onAIClick={() => handleAIClick('sessions', 'Sessions')}
          />

          <OverviewCard
            label="Total Users"
            data={{
              value: compactFormat(fallbackData.totalUsers),
              growthRate: fallbackData.growthRates.totalUsers,
            }}
            Icon={icons.Users}
            metricType="users"
            isSelected={selectedMetric === 'users'}
            onClick={() => handleMetricSelect('users')}
            onAIClick={() => handleAIClick('users', 'Total Users')}
          />
        </div>

        {/* Error notification */}
        <div className="mt-4 rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-center dark:border-yellow-800 dark:bg-yellow-900/20">
          <p className="text-yellow-600 dark:text-yellow-400">
            {error || 'GA4 client not initialized'}
          </p>
          <p className="text-sm text-yellow-500 dark:text-yellow-500 mt-1">
            Connection status: {isConnected ? 'Connected' : 'Disconnected'} • Showing demo data
          </p>
        </div>
      </>
    );
  }

  const { sessions, totalUsers, pageviews, averageEngagementTime, growthRates } = data.data;

  // Get current date range (last 28 days)
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(endDate.getDate() - 28);
  const dateRange = {
    start: startDate.toISOString().split('T')[0],
    end: endDate.toISOString().split('T')[0]
  };

  return (
    <>
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
        />
        
        {/* Connection status indicator */}
        <div className="col-span-4 flex justify-center items-center space-x-2 text-sm">
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
          <span className={isConnected ? 'text-green-600' : 'text-red-600'}>
            {isConnected ? 'Live data' : 'Disconnected'}
          </span>
          <span className="text-gray-500">
            Last updated: {new Date(data.timestamp).toLocaleTimeString()}
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
