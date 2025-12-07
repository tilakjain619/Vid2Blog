import { NextRequest, NextResponse } from 'next/server';

/**
 * Simple test endpoint for OpenRouter API
 */
export async function GET() {
  try {
    const apiKey = process.env.OPENROUTER_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json({
        success: false,
        error: 'OpenRouter API key not configured'
      }, { status: 500 });
    }

    console.log('Testing OpenRouter API...');

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000',
        'X-Title': 'Vid2Blog Test'
      },
      body: JSON.stringify({
        model: 'openai/gpt-oss-20b:free',
        messages: [
          {
            role: 'user',
            content: 'Please respond with a simple JSON object: {"test": "success", "message": "OpenRouter is working"}'
          }
        ],
        max_tokens: 100,
        temperature: 0.1
      })
    });

    console.log('OpenRouter response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenRouter error:', errorText);
      
      return NextResponse.json({
        success: false,
        error: `OpenRouter API error: ${response.status}`,
        details: errorText
      }, { status: response.status });
    }

    const data = await response.json();
    console.log('OpenRouter response:', data);

    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      return NextResponse.json({
        success: false,
        error: 'Invalid response structure from OpenRouter',
        response: data
      }, { status: 500 });
    }

    const content = data.choices[0].message.content;

    return NextResponse.json({
      success: true,
      message: 'OpenRouter API is working',
      aiResponse: content,
      fullResponse: data
    });

  } catch (error) {
    console.error('Test failed:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}