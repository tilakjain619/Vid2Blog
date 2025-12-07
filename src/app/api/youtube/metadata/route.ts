import { NextRequest, NextResponse } from 'next/server';
import { validateYouTubeUrl } from '@/lib/youtube-utils';
import { YouTubeApiService } from '@/lib/youtube-api';
import { createProcessingError, ErrorType } from '@/lib/error-handling';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url } = body;

    // Validate the YouTube URL
    const validation = validateYouTubeUrl(url);
    if (!validation.isValid) {
      const error = createProcessingError(ErrorType.INVALID_URL);
      return NextResponse.json(
        { 
          error: error.details.userMessage,
          type: error.type,
          suggestions: error.details.suggestions
        },
        { status: 400 }
      );
    }

    // Check if API key is configured
    const apiKey = process.env.YOUTUBE_API_KEY;
    if (!apiKey) {
      const error = createProcessingError(ErrorType.API_KEY_INVALID);
      return NextResponse.json(
        { 
          error: error.details.userMessage,
          type: error.type,
          suggestions: error.details.suggestions
        },
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
        const error = createProcessingError(ErrorType.VIDEO_TOO_LONG);
        return NextResponse.json(
          { 
            error: error.details.userMessage,
            type: error.type,
            suggestions: error.details.suggestions
          },
          { status: 400 }
        );
      }

      // Check minimum duration (1 minute as per requirements)
      const minDuration = 60; // 1 minute in seconds
      if (metadata.duration < minDuration) {
        const error = createProcessingError(ErrorType.VIDEO_TOO_SHORT);
        return NextResponse.json(
          { 
            error: error.details.userMessage,
            type: error.type,
            suggestions: error.details.suggestions
          },
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
        let errorType: ErrorType;
        
        // Map common errors to specific error types
        if (message.includes('not found') || message.includes('private') || message.includes('deleted')) {
          errorType = ErrorType.PRIVATE_VIDEO;
        } else if (message.includes('live')) {
          errorType = ErrorType.LIVE_STREAM;
        } else if (message.includes('quota') || message.includes('limit')) {
          errorType = ErrorType.API_QUOTA_EXCEEDED;
        } else {
          errorType = ErrorType.SERVICE_UNAVAILABLE;
        }

        const error = createProcessingError(errorType, apiError);
        const statusCode = errorType === ErrorType.API_QUOTA_EXCEEDED ? 429 : 
                          errorType === ErrorType.PRIVATE_VIDEO ? 404 : 400;

        return NextResponse.json(
          { 
            error: error.details.userMessage,
            type: error.type,
            suggestions: error.details.suggestions,
            retryable: error.details.retryable
          },
          { status: statusCode }
        );
      }

      const error = createProcessingError(ErrorType.SERVICE_UNAVAILABLE, apiError as Error);
      return NextResponse.json(
        { 
          error: error.details.userMessage,
          type: error.type,
          suggestions: error.details.suggestions
        },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('YouTube metadata API error:', error);
    const processingError = createProcessingError(ErrorType.UNKNOWN_ERROR, error as Error);
    return NextResponse.json(
      { 
        error: processingError.details.userMessage,
        type: processingError.type,
        suggestions: processingError.details.suggestions
      },
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