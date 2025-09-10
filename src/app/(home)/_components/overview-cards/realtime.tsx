'use client';

import { compactFormat } from "@/lib/format-number";
import { useGa4Stream } from "@/hooks/use-ga4-stream";
import { OverviewCard } from "./card";
import * as icons from "./icons";

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
    return (
      <div className="grid gap-4 sm:grid-cols-2 sm:gap-6 xl:grid-cols-4 2xl:gap-7.5">
        <div className="col-span-4 rounded-lg border border-red-200 bg-red-50 p-4 text-center dark:border-red-800 dark:bg-red-900/20">
          <p className="text-red-600 dark:text-red-400">
            {error || 'Failed to load GA4 data'}
          </p>
          <p className="text-sm text-red-500 dark:text-red-500 mt-1">
            Connection status: {isConnected ? 'Connected' : 'Disconnected'}
          </p>
        </div>
      </div>
    );
  }

  const { sessions, totalUsers, pageviews, averageEngagementTime, growthRates } = data.data;

  return (
    <div className="grid gap-4 sm:grid-cols-2 sm:gap-6 xl:grid-cols-4 2xl:gap-7.5">
      <OverviewCard
        label="Pageviews"
        data={{
          value: compactFormat(pageviews),
          growthRate: growthRates?.pageviews || 0,
        }}
        Icon={icons.Views}
      />

      <OverviewCard
        label="Avg Engagement Time"
        data={{
          value: formatEngagementTime(averageEngagementTime),
          growthRate: growthRates?.averageEngagementTime || 0,
        }}
        Icon={icons.Profit}
      />

      <OverviewCard
        label="Sessions"
        data={{
          value: compactFormat(sessions),
          growthRate: growthRates?.sessions || 0,
        }}
        Icon={icons.Product}
      />

      <OverviewCard
        label="Total Users"
        data={{
          value: compactFormat(totalUsers),
          growthRate: growthRates?.totalUsers || 0,
        }}
        Icon={icons.Users}
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
  );
}
