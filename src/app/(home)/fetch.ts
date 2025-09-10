export async function getOverviewData() {
  try {
    // Fetch GA4 data from our API endpoint
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 
      (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3004');
    
    console.log('Fetching GA4 data from:', `${baseUrl}/api/ga4/metrics?days=28`);
    
    const response = await fetch(`${baseUrl}/api/ga4/metrics?days=28`, {
      cache: 'no-store', // No caching for live data
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

    const { sessions, totalUsers, pageviews, averageEngagementTime } = apiData.data;

    return {
      views: {
        value: pageviews,
        growthRate: 0.43, // TODO: Calculate actual growth rate from historical data
      },
      profit: {
        value: Math.round(averageEngagementTime), // Using engagement time as proxy
        growthRate: 4.35, // TODO: Calculate actual growth rate
      },
      products: {
        value: sessions,
        growthRate: 2.59, // TODO: Calculate actual growth rate
      },
      users: {
        value: totalUsers,
        growthRate: -0.95, // TODO: Calculate actual growth rate
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