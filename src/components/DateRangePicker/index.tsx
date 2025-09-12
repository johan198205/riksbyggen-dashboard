'use client';

import { useState, useEffect } from 'react';
import { CalendarIcon, ChevronDownIcon } from '@/assets/icons';
import { cn } from '@/lib/utils';

interface DateRange {
  start: string;
  end: string;
}

interface DateRangePickerProps {
  value: DateRange;
  onChange: (dateRange: DateRange) => void;
  className?: string;
}

const PRESET_RANGES = [
  { label: 'Last 7 days', days: 7 },
  { label: 'Last 14 days', days: 14 },
  { label: 'Last 28 days', days: 28 },
  { label: 'Last 30 days', days: 30 },
  { label: 'Last 90 days', days: 90 },
];

export function DateRangePicker({ value, onChange, className }: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);

  useEffect(() => {
    // Check if current value matches any preset
    const daysDiff = Math.ceil(
      (new Date(value.end).getTime() - new Date(value.start).getTime()) / (1000 * 60 * 60 * 24)
    );
    const matchingPreset = PRESET_RANGES.find(preset => preset.days === daysDiff);
    setSelectedPreset(matchingPreset?.label || null);
  }, [value]);

  const handlePresetSelect = (days: number) => {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - days);
    
    const dateRange = {
      start: startDate.toISOString().split('T')[0],
      end: endDate.toISOString().split('T')[0]
    };
    
    onChange(dateRange);
    setIsOpen(false);
  };

  const handleCustomDateChange = (field: 'start' | 'end', date: string) => {
    const newValue = { ...value, [field]: date };
    onChange(newValue);
    setSelectedPreset(null); // Clear preset selection when manually changing dates
  };

  const formatDateRange = (dateRange: DateRange) => {
    const start = new Date(dateRange.start);
    const end = new Date(dateRange.end);
    return `${start.toLocaleDateString('sv-SE')} - ${end.toLocaleDateString('sv-SE')}`;
  };

  return (
    <div className={cn("relative", className)}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center gap-2 px-3 py-2 text-sm border border-gray-300 rounded-lg",
          "bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500",
          "dark:bg-gray-800 dark:border-gray-600 dark:hover:bg-gray-700",
          "dark:text-white"
        )}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <CalendarIcon className="w-4 h-4" />
        <span className="text-sm">
          {selectedPreset || formatDateRange(value)}
        </span>
        <ChevronDownIcon className={cn("w-4 h-4 transition-transform", isOpen && "rotate-180")} />
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />
          
          {/* Dropdown */}
          <div className="absolute top-full left-0 mt-1 w-64 bg-white border border-gray-200 rounded-lg shadow-lg z-20 dark:bg-gray-800 dark:border-gray-600">
            <div className="p-4">
              <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
                Select Date Range
              </h3>
              
              {/* Preset options */}
              <div className="space-y-1 mb-4">
                {PRESET_RANGES.map((preset) => (
                  <button
                    key={preset.days}
                    onClick={() => handlePresetSelect(preset.days)}
                    className={cn(
                      "w-full text-left px-3 py-2 text-sm rounded-md transition-colors",
                      "hover:bg-gray-100 dark:hover:bg-gray-700",
                      selectedPreset === preset.label && "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400"
                    )}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>

              {/* Custom date inputs */}
              <div className="border-t border-gray-200 dark:border-gray-600 pt-4">
                <h4 className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Custom Range
                </h4>
                <div className="space-y-2">
                  <div>
                    <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={value.start}
                      onChange={(e) => handleCustomDateChange('start', e.target.value)}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">
                      End Date
                    </label>
                    <input
                      type="date"
                      value={value.end}
                      onChange={(e) => handleCustomDateChange('end', e.target.value)}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
