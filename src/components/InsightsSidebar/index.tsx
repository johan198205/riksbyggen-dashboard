'use client';

import { useState, useEffect } from 'react';
import { XIcon } from '@/assets/icons';
import { cn } from '@/lib/utils';

interface InsightData {
  summaryMarkdown: string;
  actions: string[];
  anomalies: string[];
  confidence: 'low' | 'medium' | 'high';
}

interface InsightsSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  metric: string;
  metricLabel: string;
  dateRange: { start: string; end: string };
  granularity: string;
}

export function InsightsSidebar({ 
  isOpen, 
  onClose, 
  metric, 
  metricLabel, 
  dateRange, 
  granularity 
}: InsightsSidebarProps) {
  const [insights, setInsights] = useState<InsightData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && metric) {
      fetchInsights();
    }
  }, [isOpen, metric, dateRange, granularity]);

  const fetchInsights = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/insights', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          metric,
          dateRange,
          granularity,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch insights: ${response.status}`);
      }

      const data = await response.json();
      setInsights(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch insights');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <>
      {/* Sidebar */}
      <div
        className={cn(
          "fixed right-0 top-0 h-full w-full max-w-md bg-white dark:bg-gray-dark shadow-xl z-50 transform transition-transform duration-300 ease-in-out",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
        role="dialog"
        aria-modal="true"
        aria-labelledby="insights-title"
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <div>
              <h2 id="insights-title" className="text-lg font-semibold text-dark dark:text-white">
                AI Insights
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {metricLabel} • {dateRange.start} to {dateRange.end}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200"
              aria-label="Close insights"
            >
              <XIcon className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {isLoading && (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                <span className="ml-2 text-gray-600 dark:text-gray-400">Loading insights...</span>
              </div>
            )}

            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <p className="text-red-600 dark:text-red-400 text-sm font-medium mb-2">
                  {error}
                </p>
                {error.includes('OpenAI API key not configured') && (
                  <div className="mb-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded">
                    <p className="text-yellow-800 dark:text-yellow-200 text-sm">
                      <strong>Setup Required:</strong> Please add your OpenAI API key to the environment variables:
                    </p>
                    <code className="block mt-1 text-xs bg-gray-100 dark:bg-gray-800 p-2 rounded">
                      OPENAI_API_KEY=your_api_key_here
                    </code>
                  </div>
                )}
                <button
                  onClick={fetchInsights}
                  className="text-sm text-red-600 dark:text-red-400 hover:underline"
                >
                  Try again
                </button>
              </div>
            )}

            {insights && !isLoading && !error && (
              <div className="space-y-6">
                {/* Summary */}
                <div>
                  <h3 className="text-md font-semibold text-dark dark:text-white mb-3">
                    Summary
                  </h3>
                  <div 
                    className="prose prose-sm max-w-none text-gray-700 dark:text-gray-300"
                    dangerouslySetInnerHTML={{ __html: insights.summaryMarkdown }}
                  />
                </div>

                {/* Anomalies */}
                {insights.anomalies && insights.anomalies.length > 0 && (
                  <div>
                    <h3 className="text-md font-semibold text-dark dark:text-white mb-3">
                      Detected Anomalies
                    </h3>
                    <ul className="space-y-2">
                      {insights.anomalies.map((anomaly, index) => (
                        <li key={index} className="flex items-start">
                          <span className="w-2 h-2 bg-yellow-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                          <span className="text-sm text-gray-700 dark:text-gray-300">
                            {anomaly}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Actions */}
                {insights.actions && insights.actions.length > 0 && (
                  <div>
                    <h3 className="text-md font-semibold text-dark dark:text-white mb-3">
                      Recommended Actions
                    </h3>
                    <ul className="space-y-2">
                      {insights.actions.map((action, index) => (
                        <li key={index} className="flex items-start">
                          <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                          <span className="text-sm text-gray-700 dark:text-gray-300">
                            {action}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Confidence */}
                <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Confidence Level
                    </span>
                    <span className={cn(
                      "text-sm font-medium px-2 py-1 rounded",
                      insights.confidence === 'high' && "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400",
                      insights.confidence === 'medium' && "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400",
                      insights.confidence === 'low' && "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400"
                    )}>
                      {insights.confidence.charAt(0).toUpperCase() + insights.confidence.slice(1)}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
