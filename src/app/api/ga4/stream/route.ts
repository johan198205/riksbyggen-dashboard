import { NextRequest } from 'next/server';
import { ga4ClientEmailService } from '@/services/ga4-client-email.service';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const days = parseInt(searchParams.get('days') || '28');
  const includeGrowthRates = searchParams.get('includeGrowthRates') === 'true';

  // Create a ReadableStream for Server-Sent Events
  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();
      
      // Send initial data
      const sendData = async () => {
        try {
          const dateRange = ga4ClientEmailService.getDateRange(days);
          const result = await ga4ClientEmailService.getMetrics(dateRange, includeGrowthRates);
          
          const data = {
            data: result.data,
            dateRange,
            timestamp: new Date().toISOString(),
            error: result.error
          };
          
          const message = `data: ${JSON.stringify(data)}\n\n`;
          controller.enqueue(encoder.encode(message));
          
        } catch (error) {
          const errorData = {
            error: 'Failed to fetch GA4 data',
            data: { sessions: 0, totalUsers: 0, pageviews: 0, averageEngagementTime: 0 },
            timestamp: new Date().toISOString()
          };
          
          const message = `data: ${JSON.stringify(errorData)}\n\n`;
          controller.enqueue(encoder.encode(message));
        }
      };
      
      // Send initial data immediately
      sendData();
      
      // Set up interval to send updates every 5 minutes
      const interval = setInterval(sendData, 5 * 60 * 1000);
      
      // Clean up on close
      request.signal.addEventListener('abort', () => {
        clearInterval(interval);
        controller.close();
      });
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET',
      'Access-Control-Allow-Headers': 'Cache-Control'
    }
  });
}
