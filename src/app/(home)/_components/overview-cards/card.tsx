import { ArrowDownIcon, ArrowUpIcon } from "@/assets/icons";
import { cn } from "@/lib/utils";
import type { JSX, SVGProps } from "react";

type PropsType = {
  label: string;
  data: {
    value: number | string;
    growthRate: number;
  };
  Icon: (props: SVGProps<SVGSVGElement>) => JSX.Element;
  metricType?: 'pageviews' | 'sessions' | 'users' | 'engagement';
  isSelected?: boolean;
  onClick?: () => void;
};

export function OverviewCard({ label, data, Icon, metricType, isSelected, onClick }: PropsType) {
  const isDecreasing = data.growthRate < 0;

  const handleClick = () => {
    if (onClick && metricType) {
      onClick();
    }
  };

  return (
    <div 
      className={cn(
        "rounded-[10px] bg-white p-6 shadow-1 dark:bg-gray-dark transition-all duration-200",
        onClick && metricType && "cursor-pointer hover:shadow-lg hover:scale-[1.02]",
        isSelected && "ring-2 ring-blue-500 shadow-lg"
      )}
      onClick={handleClick}
      role={onClick && metricType ? "button" : undefined}
      tabIndex={onClick && metricType ? 0 : undefined}
      aria-pressed={isSelected}
      aria-label={onClick && metricType ? `Select ${label} metric` : undefined}
      onKeyDown={(e) => {
        if (onClick && metricType && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onClick();
        }
      }}
    >
      <Icon />

      <div className="mt-6 flex items-end justify-between">
        <dl>
          <dt className="mb-1.5 text-heading-6 font-bold text-dark dark:text-white">
            {data.value}
          </dt>

          <dd className="text-sm font-medium text-dark-6">{label}</dd>
        </dl>

        <dl
          className={cn(
            "text-sm font-medium",
            isDecreasing ? "text-red" : "text-green",
          )}
        >
          <dt className="flex items-center gap-1.5">
            {data.growthRate}%
            {isDecreasing ? (
              <ArrowDownIcon aria-hidden />
            ) : (
              <ArrowUpIcon aria-hidden />
            )}
          </dt>

          <dd className="sr-only">
            {label} {isDecreasing ? "Decreased" : "Increased"} by{" "}
            {data.growthRate}%
          </dd>
        </dl>
      </div>
    </div>
  );
}
