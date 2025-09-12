# AI Insights Prefetching - Verification Steps

## Implementation Summary

The AI insights prefetching system has been implemented with the following components:

### 1. Cache System (`src/lib/insights-cache.ts`)
- In-memory cache with TTL (5 minutes default)
- Stale-while-revalidate pattern
- Cache invalidation by metric, date range, or full clear
- Type-safe cache keys: `insight:{metric}:{start}:{end}:{granularity}`

### 2. Prefetcher Service (`src/lib/insights-prefetcher.ts`)
- Background prefetching for all metrics (pageviews, sessions, users, engagement)
- Parallel processing with progress callbacks
- Prevents duplicate prefetch requests
- Automatic cache population

### 3. Date Range Picker (`src/components/DateRangePicker/index.tsx`)
- Preset ranges (7, 14, 28, 30, 90 days)
- Custom date selection
- Swedish localization
- Accessible design with keyboard navigation

### 4. Updated Components
- **InsightsSidebar**: Now uses cached data with fallback to direct fetch
- **RealtimeOverviewCardsGroup**: Integrated prefetcher and date picker
- **OverviewCard**: AI icon triggers cached insights display

## Verification Steps

### 1. Initial Load Test
1. Start the development server: `npm run dev`
2. Navigate to the dashboard
3. **Expected**: Date range picker appears in top-right
4. **Expected**: Background prefetching starts for all 4 metrics
5. **Expected**: Console shows "Starting insights prefetch for date range: ..."

### 2. Cache Hit Test
1. Wait 2-3 seconds for prefetching to complete
2. Click AI icon on any metric card (Pageviews, Sessions, Users, Avg Engagement Time)
3. **Expected**: Sidebar opens immediately with insights (no loading spinner)
4. **Expected**: Console shows "Using cached insights for [metric]"

### 3. Cache Miss Test
1. Click AI icon immediately after page load (before prefetching completes)
2. **Expected**: Loading spinner appears briefly
3. **Expected**: Insights load when prefetching completes
4. **Expected**: Console shows "Prefetching in progress for [metric] - showing loading state"

### 4. Date Range Change Test
1. Change date range using the picker (e.g., from 28 days to 7 days)
2. **Expected**: New prefetching starts for all metrics
3. **Expected**: Console shows "Date range changed: ..." and "Starting insights prefetch..."
4. **Expected**: Previous cache is invalidated

### 5. Cache Persistence Test
1. Open insights for a metric
2. Close sidebar
3. Reopen insights for same metric within 5 minutes
4. **Expected**: Instant display (no API call)

### 6. Error Handling Test
1. If OpenAI API key is missing, insights should show fallback data
2. **Expected**: Error message with setup instructions
3. **Expected**: Fallback insights with basic statistics

## Technical Details

### Cache Key Format
```
insight:pageviews:2024-01-01:2024-01-28:DAY
insight:sessions:2024-01-01:2024-01-28:DAY
insight:users:2024-01-01:2024-01-28:DAY
insight:engagement:2024-01-01:2024-01-28:DAY
```

### Prefetching Flow
1. Dashboard mounts → Prefetch all metrics for current date range
2. Date range changes → Invalidate old cache → Prefetch new range
3. AI icon clicked → Check cache → Show immediately or loading state
4. Background revalidation → Update cache silently

### Performance Characteristics
- **Cache TTL**: 5 minutes
- **Prefetch Concurrency**: All 4 metrics in parallel
- **Polling Interval**: 500ms for prefetch completion
- **Timeout**: 10 seconds for prefetch polling

## Files Modified
- `src/lib/insights-cache.ts` (new)
- `src/lib/insights-prefetcher.ts` (new)
- `src/components/DateRangePicker/index.tsx` (new)
- `src/components/InsightsSidebar/index.tsx` (updated)
- `src/app/(home)/_components/overview-cards/realtime.tsx` (updated)
- `src/assets/icons.tsx` (updated - added CalendarIcon, ChevronDownIcon)

## Environment Requirements
- `OPENAI_API_KEY` environment variable must be set
- Existing GA4 service configuration
- Next.js development server running on port 3000
