import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json(
        { 
          error: 'OpenAI API key not found',
          hasApiKey: false,
          envVars: Object.keys(process.env).filter(key => key.includes('OPENAI'))
        },
        { status: 400 }
      );
    }

    // Test API key format
    const isValidFormat = apiKey.startsWith('sk-') && apiKey.length > 20;
    
    return NextResponse.json({
      hasApiKey: true,
      isValidFormat,
      keyLength: apiKey.length,
      keyPrefix: apiKey.substring(0, 10) + '...',
      message: 'OpenAI API key is configured'
    });

  } catch (error) {
    console.error('Test OpenAI error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
