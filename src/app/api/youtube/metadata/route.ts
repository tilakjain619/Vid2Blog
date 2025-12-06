import { NextRequest, NextResponse } from 'next/server';
import { validateYouTubeUrl } from '@/lib/youtube-utils';
import { YouTubeApiService } from '@/lib/youtube-api';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url } = body;

    // Validate the YouTube URL
    const validation = validateYouTubeUrl(url);
    if (!validation.isValid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      );
    }

    // Check if API key is configured
    const apiKey = process.env.YOUTUBE_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'YouTube API key not configured. Please set YOUTUBE_API_KEY environment variable.' },
        { status: 500 }
      );
    }

    // Extract metadata using YouTube API
    const youtubeApi = new YouTubeApiService(apiKey);
    
    try {
      const metadata = await youtubeApi.getVideoMetadata(validation.videoId!);
      
      // Check video duration limits (max 3 hours as per requirements)
      const maxDuration = 3 * 60 * 60; // 3 hours in seconds
      if (metadata.duration > maxDuration) {
        return NextResponse.json(
          { error: `Video is too long (${Math.round(metadata.duration / 60)} minutes). Maximum supported duration is 3 hours.` },
          { status: 400 }
        );
      }

      // Check minimum duration (1 minute as per requirements)
      const minDuration = 60; // 1 minute in seconds
      if (metadata.duration < minDuration) {
        return NextResponse.json(
          { error: 'Video is too short. Minimum supported duration is 1 minute.' },
          { status: 400 }
        );
      }

      return NextResponse.json({ 
        success: true, 
        metadata 
      });

    } catch (apiError) {
      // Handle specific YouTube API errors
      if (apiError instanceof Error) {
        const message = apiError.message;
        
        // Map common errors to user-friendly messages
        if (message.includes('not found') || message.includes('private') || message.includes('deleted')) {
          return NextResponse.json(
            { error: 'Video not found. It may be private, deleted, or restricted.' },
            { status: 404 }
          );
        }
        
        if (message.includes('live')) {
          return NextResponse.json(
            { error: 'Live streams are not supported. Please wait until the stream ends.' },
            { status: 400 }
          );
        }

        if (message.includes('quota') || message.includes('limit')) {
          return NextResponse.json(
            { error: 'Service temporarily unavailable due to API limits. Please try again later.' },
            { status: 429 }
          );
        }

        return NextResponse.json(
          { error: `Failed to fetch video information: ${message}` },
          { status: 400 }
        );
      }

      return NextResponse.json(
        { error: 'Failed to fetch video information from YouTube.' },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('YouTube metadata API error:', error);
    return NextResponse.json(
      { error: 'Internal server error. Please try again.' },
      { status: 500 }
    );
  }
}

// Handle GET requests for API documentation
export async function GET() {
  return NextResponse.json({
    message: 'YouTube Metadata API',
    usage: 'POST with { "url": "youtube_url" }',
    example: {
      url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
    }
  });
}