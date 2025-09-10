export async function getOverviewData() {
  try {
    // For server-side rendering, we need to use the full URL
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://riksbyggen-dashboard.vercel.app';
    
    console.log('Fetching GA4 data from:', `${baseUrl}/api/ga4/metrics?days=28`);
    console.log('Environment check - NEXT_PUBLIC_BASE_URL:', process.env.NEXT_PUBLIC_BASE_URL);
    console.log('Environment check - window:', typeof window !== 'undefined' ? 'available' : 'not available');
    console.log('Running on server-side:', typeof window === 'undefined');
    
    const response = await fetch(`${baseUrl}/api/ga4/metrics?days=28&includeGrowthRates=true`, {
      cache: 'no-store', // No caching for live data
      headers: {
        'User-Agent': 'Next.js Server-Side Rendering'
      }
    });

    if (!response.ok) {
      console.warn(`GA4 API request failed: ${response.status}`);
      return getMockData();
    }

    const apiData = await response.json();
    
    console.log('GA4 API response:', apiData);
    
    if (apiData.error) {
      console.warn('GA4 API error:', apiData.error);
      // Fallback to mock data if GA4 fails
      return getMockData();
    }

    const { sessions, totalUsers, pageviews, averageEngagementTime, growthRates } = apiData.data;

    return {
      views: {
        value: pageviews,
        growthRate: growthRates?.pageviews || 0,
      },
      profit: {
        value: Math.round(averageEngagementTime), // Using engagement time as proxy
        growthRate: growthRates?.averageEngagementTime || 0,
      },
      products: {
        value: sessions,
        growthRate: growthRates?.sessions || 0,
      },
      users: {
        value: totalUsers,
        growthRate: growthRates?.totalUsers || 0,
      },
    };
  } catch (error) {
    console.error('Error fetching GA4 data:', error);
    // Fallback to mock data
    return getMockData();
  }
}

function getMockData() {
  return {
    views: {
      value: 3456,
      growthRate: 0.43,
    },
    profit: {
      value: 4220,
      growthRate: 4.35,
    },
    products: {
      value: 3456,
      growthRate: 2.59,
    },
    users: {
      value: 3456,
      growthRate: -0.95,
    },
  };
}

export async function getChatsData() {
  // Fake delay
  await new Promise((resolve) => setTimeout(resolve, 1000));

  return [
    {
      name: "Jacob Jones",
      profile: "/images/user/user-01.png",
      isActive: true,
      lastMessage: {
        content: "See you tomorrow at the meeting!",
        type: "text",
        timestamp: "2024-12-19T14:30:00Z",
        isRead: false,
      },
      unreadCount: 3,
    },
    {
      name: "Wilium Smith",
      profile: "/images/user/user-03.png",
      isActive: true,
      lastMessage: {
        content: "Thanks for the update",
        type: "text",
        timestamp: "2024-12-19T10:15:00Z",
        isRead: true,
      },
      unreadCount: 0,
    },
    {
      name: "Johurul Haque",
      profile: "/images/user/user-04.png",
      isActive: false,
      lastMessage: {
        content: "What's up?",
        type: "text",
        timestamp: "2024-12-19T10:15:00Z",
        isRead: true,
      },
      unreadCount: 0,
    },
    {
      name: "M. Chowdhury",
      profile: "/images/user/user-05.png",
      isActive: false,
      lastMessage: {
        content: "Where are you now?",
        type: "text",
        timestamp: "2024-12-19T10:15:00Z",
        isRead: true,
      },
      unreadCount: 2,
    },
    {
      name: "Akagami",
      profile: "/images/user/user-07.png",
      isActive: false,
      lastMessage: {
        content: "Hey, how are you?",
        type: "text",
        timestamp: "2024-12-19T10:15:00Z",
        isRead: true,
      },
      unreadCount: 0,
    },
  ];
}