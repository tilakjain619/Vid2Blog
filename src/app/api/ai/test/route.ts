import { NextRequest, NextResponse } from 'next/server';
import { AIArticleGenerator } from '@/lib/ai-article-generator';

/**
 * Test OpenRouter AI connection
 */
export async function GET() {
  try {
    const isConnected = await AIArticleGenerator.testConnection();
    
    return NextResponse.json({
      success: true,
      connected: isConnected,
      message: isConnected ? 'OpenRouter API is working' : 'OpenRouter API connection failed'
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      connected: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Failed to test OpenRouter connection'
    }, { status: 500 });
  }
}

/**
 * Test AI article generation with sample data
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { testPrompt } = body;

    if (!testPrompt) {
      return NextResponse.json({
        success: false,
        error: 'Test prompt is required'
      }, { status: 400 });
    }

    // Create sample data for testing
    const sampleAnalysis = {
      topics: [
        { name: 'Test Topic', relevance: 0.9, timeRanges: [{ start: 0, end: 60 }] }
      ],
      keyPoints: [
        { text: 'This is a test key point', importance: 0.8, timestamp: 30, category: 'Test' }
      ],
      summary: 'This is a test summary for AI article generation.',
      suggestedStructure: [],
      sentiment: 'positive' as const
    };

    const sampleMetadata = {
      id: 'test123',
      title: 'Test Video Title',
      description: 'Test video description',
      duration: 300,
      thumbnailUrl: 'https://example.com/thumb.jpg',
      channelName: 'Test Channel',
      publishDate: new Date(),
      viewCount: 1000
    };

    const sampleTranscript = {
      segments: [
        { text: testPrompt, startTime: 0, endTime: 30, confidence: 0.9 }
      ],
      language: 'en',
      confidence: 0.9,
      duration: 300
    };

    const article = await AIArticleGenerator.generateArticle(
      sampleAnalysis,
      sampleMetadata,
      sampleTranscript,
      { length: 'short', tone: 'professional', format: 'markdown' }
    );

    return NextResponse.json({
      success: true,
      article,
      message: 'AI article generation test successful'
    });

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'AI article generation test failed'
    }, { status: 500 });
  }
}