import { ArrowDownIcon, ArrowUpIcon, AIIcon } from "@/assets/icons";
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
  onAIClick?: () => void;
  isLoading?: boolean;
};

export function OverviewCard({ label, data, Icon, metricType, isSelected, onClick, onAIClick, isLoading = false }: PropsType) {
  const isDecreasing = data.growthRate < 0;

  const handleClick = () => {
    if (onClick && metricType) {
      onClick();
    }
  };

  const handleAIClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onAIClick) {
      onAIClick();
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
      <div className="flex items-center justify-between">
        <Icon />
        {onAIClick && (
          <button
            onClick={handleAIClick}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
            aria-label={`AI insights for ${label}`}
            title={`AI insights for ${label}`}
          >
            <AIIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
        )}
      </div>

      <div className="mt-6 flex items-end justify-between">
        <dl>
          <dt className="mb-1.5 text-heading-6 font-bold text-dark dark:text-white">
            {isLoading ? (
              <div className="h-8 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
            ) : (
              data.value
            )}
          </dt>

          <dd className="text-sm font-medium text-dark-6">{label}</dd>
        </dl>

        <dl
          className={cn(
            "text-sm font-medium",
            !isLoading && (isDecreasing ? "text-red" : "text-green"),
          )}
        >
          <dt className="flex items-center gap-1.5">
            {isLoading ? (
              <div className="h-4 w-12 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
            ) : (
              <>
                {data.growthRate}%
                {isDecreasing ? (
                  <ArrowDownIcon aria-hidden />
                ) : (
                  <ArrowUpIcon aria-hidden />
                )}
              </>
            )}
          </dt>

          <dd className="sr-only">
            {!isLoading && (
              <>
                {label} {isDecreasing ? "Decreased" : "Increased"} by{" "}
                {data.growthRate}%
              </>
            )}
          </dd>
        </dl>
      </div>
    </div>
  );
}
