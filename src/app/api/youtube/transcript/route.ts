import { NextRequest, NextResponse } from 'next/server';
import { TranscriptService } from '@/lib/transcript-service';
import { extractVideoId } from '@/lib/youtube-utils';
import { createProcessingError, ErrorType } from '@/lib/error-handling';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const url = searchParams.get('url');
    const videoId = searchParams.get('videoId');
    const lang = searchParams.get('lang') || 'en';
    const country = searchParams.get('country') || 'US';

    // Extract video ID from URL if provided, otherwise use direct videoId
    let extractedVideoId: string;
    
    if (url) {
      const id = extractVideoId(url);
      if (!id) {
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
      extractedVideoId = id;
    } else if (videoId) {
      extractedVideoId = videoId;
    } else {
      const error = createProcessingError(ErrorType.VALIDATION_ERROR, undefined, 'Either url or videoId parameter is required');
      return NextResponse.json(
        { 
          error: error.details.userMessage,
          type: error.type,
          suggestions: error.details.suggestions
        },
        { status: 400 }
      );
    }

    const transcript = await TranscriptService.extractTranscript(extractedVideoId, {
      lang,
      country
    });

    return NextResponse.json({
      success: true,
      data: transcript
    });

  } catch (error) {
    console.error('Transcript extraction error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    let errorType: ErrorType;
    let statusCode = 500;
    
    // Handle specific error cases
    if (errorMessage.includes('Transcript is disabled') || 
        errorMessage.includes('No transcript found')) {
      errorType = ErrorType.NO_TRANSCRIPT;
      statusCode = 404;
    } else if (errorMessage.includes('Video unavailable') || 
               errorMessage.includes('Private video')) {
      errorType = ErrorType.PRIVATE_VIDEO;
      statusCode = 403;
    } else if (errorMessage.includes('language') && errorMessage.includes('unavailable')) {
      errorType = ErrorType.TRANSCRIPT_LANGUAGE_UNAVAILABLE;
      statusCode = 400;
    } else {
      errorType = ErrorType.PROCESSING_FAILED;
    }

    const processingError = createProcessingError(errorType, error as Error);
    
    return NextResponse.json(
      { 
        error: processingError.details.userMessage,
        type: processingError.type,
        suggestions: processingError.details.suggestions,
        retryable: processingError.details.retryable
      },
      { status: statusCode }
    );
  }
}