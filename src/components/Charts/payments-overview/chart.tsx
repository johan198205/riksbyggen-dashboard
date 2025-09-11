"use client";

import { useIsMobile } from "@/hooks/use-mobile";
import type { ApexOptions } from "apexcharts";
import dynamic from "next/dynamic";

type PropsType = {
  data: {
    current: { x: string; y: number }[];
    previousYear: { x: string; y: number }[];
  };
  metricType?: string;
  isLoading?: boolean;
  error?: string;
};

const Chart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
});

export function PaymentsOverviewChart({ data, metricType, isLoading, error }: PropsType) {
  const isMobile = useIsMobile();

  const options: ApexOptions = {
    legend: {
      show: true,
      position: 'top',
      horizontalAlign: 'right',
    },
    colors: ["#5750F1", "#0ABEF9"],
    chart: {
      height: 310,
      type: "area",
      toolbar: {
        show: false,
      },
      fontFamily: "inherit",
    },
    fill: {
      gradient: {
        opacityFrom: 0.55,
        opacityTo: 0,
      },
    },
    responsive: [
      {
        breakpoint: 1024,
        options: {
          chart: {
            height: 300,
          },
        },
      },
      {
        breakpoint: 1366,
        options: {
          chart: {
            height: 320,
          },
        },
      },
    ],
    stroke: {
      curve: "smooth",
      width: isMobile ? 2 : 3,
    },
    grid: {
      strokeDashArray: 5,
      yaxis: {
        lines: {
          show: true,
        },
      },
    },
    dataLabels: {
      enabled: false,
    },
    tooltip: {
      marker: {
        show: true,
      },
    },
    xaxis: {
      axisBorder: {
        show: false,
      },
      axisTicks: {
        show: false,
      },
    },
  };

  if (isLoading) {
    return (
      <div className="-ml-4 -mr-5 h-[310px] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
          <p className="text-sm text-gray-500">Loading chart data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="-ml-4 -mr-5 h-[310px] flex items-center justify-center">
        <div className="text-center">
          <p className="text-sm text-red-500">Error loading chart data: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="-ml-4 -mr-5 h-[310px]">
      <Chart
        options={options}
        series={[
          {
            name: "Current Year",
            data: data.current,
          },
          {
            name: "Previous Year",
            data: data.previousYear,
          },
        ]}
        type="area"
        height={310}
      />
    </div>
  );
}
