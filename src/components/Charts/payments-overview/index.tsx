"use client";

import { PeriodPicker } from "@/components/period-picker";
import { standardFormat } from "@/lib/format-number";
import { cn } from "@/lib/utils";
import { getPaymentsOverviewData } from "@/services/charts.services";
import { PaymentsOverviewChart } from "./chart";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

type PropsType = {
  timeFrame?: string;
  className?: string;
};

export function PaymentsOverview({
  timeFrame = "monthly",
  className,
}: PropsType) {
  const [chartData, setChartData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedMetric, setSelectedMetric] = useState<string>('pageviews');
  const searchParams = useSearchParams();

  useEffect(() => {
    // Get selected metric from URL params
    const metricParam = searchParams.get('selected_metric');
    if (metricParam && ['pageviews', 'sessions', 'users', 'engagement'].includes(metricParam)) {
      setSelectedMetric(metricParam);
    }
  }, [searchParams]);

  useEffect(() => {
    const fetchChartData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Get date range based on timeFrame
        let startDateStr: string;
        let endDateStr: string;
        
        if (timeFrame === 'selected_date_range') {
          // Get date range from URL params or use default
          const dateRangeParam = searchParams.get('date_range');
          if (dateRangeParam) {
            const [start, end] = dateRangeParam.split(',');
            startDateStr = start;
            endDateStr = end;
          } else {
            // Default to 28 days if no date range specified
            const endDate = new Date();
            const startDate = new Date();
            startDate.setDate(endDate.getDate() - 28);
            startDateStr = startDate.toISOString().split('T')[0];
            endDateStr = endDate.toISOString().split('T')[0];
          }
        } else {
          const days = timeFrame === 'yearly' ? 365 : 30;
          const endDate = new Date();
          const startDate = new Date();
          startDate.setDate(endDate.getDate() - days);
          startDateStr = startDate.toISOString().split('T')[0];
          endDateStr = endDate.toISOString().split('T')[0];
        }

        // Fetch GA4 time series data
        const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3001';
        
        const response = await fetch(
          `${baseUrl}/api/ga4/timeseries?metric=${selectedMetric}&startDate=${startDateStr}&endDate=${endDateStr}&granularity=DAY`
        );

        if (!response.ok) {
          throw new Error(`API request failed: ${response.status}`);
        }

        const apiData = await response.json();
        
        if (apiData.error) {
          throw new Error(apiData.error);
        }

        // Transform data for chart
        const currentData = apiData.current.map((item: any) => {
          // Parse YYYYMMDD format
          const year = item.date.substring(0, 4);
          const month = item.date.substring(4, 6);
          const day = item.date.substring(6, 8);
          const date = new Date(`${year}-${month}-${day}`);
          
          return {
            x: date.toLocaleDateString('sv-SE', { 
              month: 'short', 
              day: 'numeric' 
            }),
            y: item.value
          };
        });

        const previousYearData = apiData.previousYear.map((item: any) => {
          // Parse YYYYMMDD format
          const year = item.date.substring(0, 4);
          const month = item.date.substring(4, 6);
          const day = item.date.substring(6, 8);
          const date = new Date(`${year}-${month}-${day}`);
          
          return {
            x: date.toLocaleDateString('sv-SE', { 
              month: 'short', 
              day: 'numeric' 
            }),
            y: item.value
          };
        });

        console.log('Chart data loaded:', { currentData, previousYearData });

        setChartData({
          current: currentData,
          previousYear: previousYearData
        });

      } catch (err) {
        console.error('Error fetching chart data:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
        
        // Fallback to mock data
        const mockData = await getPaymentsOverviewData(timeFrame);
        setChartData({
          current: mockData.received,
          previousYear: mockData.due
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchChartData();
  }, [selectedMetric, timeFrame, searchParams]);

  const getMetricTitle = () => {
    const titles: Record<string, string> = {
      pageviews: 'Pageviews Overview',
      sessions: 'Sessions Overview', 
      users: 'Users Overview',
      engagement: 'Engagement Overview'
    };
    return titles[selectedMetric] || 'Analytics Overview';
  };

  const getMetricLabel = () => {
    const labels: Record<string, string> = {
      pageviews: 'Pageviews',
      sessions: 'Sessions',
      users: 'Users', 
      engagement: 'Avg Engagement Time'
    };
    return labels[selectedMetric] || 'Metric';
  };

  if (!chartData) {
    return (
      <div
        className={cn(
          "grid gap-2 rounded-[10px] bg-white px-7.5 pb-6 pt-7.5 shadow-1 dark:bg-gray-dark dark:shadow-card",
          className,
        )}
      >
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2 className="text-body-2xlg font-bold text-dark dark:text-white">
            {getMetricTitle()}
          </h2>
          <PeriodPicker 
            defaultValue={timeFrame} 
            sectionKey="payments_overview" 
            items={["monthly", "yearly", "selected_date_range"]}
          />
        </div>
        <div className="h-[310px] flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "grid gap-2 rounded-[10px] bg-white px-7.5 pb-6 pt-7.5 shadow-1 dark:bg-gray-dark dark:shadow-card",
        className,
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-body-2xlg font-bold text-dark dark:text-white">
          {getMetricTitle()}
        </h2>

        <PeriodPicker 
          defaultValue={timeFrame} 
          sectionKey="payments_overview" 
          items={["monthly", "yearly", "selected_date_range"]}
        />
      </div>

      <PaymentsOverviewChart 
        data={chartData} 
        metricType={selectedMetric}
        isLoading={isLoading}
        error={error || undefined}
      />

      <dl className="grid divide-stroke text-center dark:divide-dark-3 sm:grid-cols-2 sm:divide-x [&>div]:flex [&>div]:flex-col-reverse [&>div]:gap-1">
        <div className="dark:border-dark-3 max-sm:mb-3 max-sm:border-b max-sm:pb-3">
          <dt className="text-xl font-bold text-dark dark:text-white">
            {standardFormat(chartData.current.reduce((acc: number, { y }: any) => acc + y, 0))}
          </dt>
          <dd className="font-medium dark:text-dark-6">Current Year {getMetricLabel()}</dd>
        </div>

        <div>
          <dt className="text-xl font-bold text-dark dark:text-white">
            {standardFormat(chartData.previousYear.reduce((acc: number, { y }: any) => acc + y, 0))}
          </dt>
          <dd className="font-medium dark:text-dark-6">Previous Year {getMetricLabel()}</dd>
        </div>
      </dl>
    </div>
  );
}
