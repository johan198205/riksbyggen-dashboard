"use client";

import { compactFormat } from "@/lib/format-number";
import { getOverviewData } from "../../fetch";
import { OverviewCard } from "./card";
import * as icons from "./icons";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";

function formatEngagementTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  
  if (minutes === 0) {
    return `${remainingSeconds}s`;
  }
  
  return `${minutes}m ${remainingSeconds}s`;
}

export function OverviewCardsGroup() {
  const [overviewData, setOverviewData] = useState<any>(null);
  const [selectedMetric, setSelectedMetric] = useState<string>('pageviews');
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Get initial data
    getOverviewData().then(setOverviewData);
  }, []);

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

  if (!overviewData) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 sm:gap-6 xl:grid-cols-4 2xl:gap-7.5">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="rounded-[10px] bg-white p-6 shadow-1 dark:bg-gray-dark animate-pulse">
            <div className="h-8 w-8 bg-gray-200 rounded mb-6"></div>
            <div className="h-6 bg-gray-200 rounded mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </div>
        ))}
      </div>
    );
  }

  const { views, profit, products, users } = overviewData;

  return (
    <div className="grid gap-4 sm:grid-cols-2 sm:gap-6 xl:grid-cols-4 2xl:gap-7.5">
      <OverviewCard
        label="Pageviews"
        data={{
          ...views,
          value: compactFormat(views.value),
        }}
        Icon={icons.Views}
        metricType="pageviews"
        isSelected={selectedMetric === 'pageviews'}
        onClick={() => handleMetricSelect('pageviews')}
      />

      <OverviewCard
        label="Avg Engagement Time"
        data={{
          ...profit,
          value: formatEngagementTime(profit.value),
        }}
        Icon={icons.Profit}
        metricType="engagement"
        isSelected={selectedMetric === 'engagement'}
        onClick={() => handleMetricSelect('engagement')}
      />

      <OverviewCard
        label="Sessions"
        data={{
          ...products,
          value: compactFormat(products.value),
        }}
        Icon={icons.Product}
        metricType="sessions"
        isSelected={selectedMetric === 'sessions'}
        onClick={() => handleMetricSelect('sessions')}
      />

      <OverviewCard
        label="Total Users"
        data={{
          ...users,
          value: compactFormat(users.value),
        }}
        Icon={icons.Users}
        metricType="users"
        isSelected={selectedMetric === 'users'}
        onClick={() => handleMetricSelect('users')}
      />
    </div>
  );
}
