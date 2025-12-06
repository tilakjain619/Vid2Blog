import { NextRequest, NextResponse } from 'next/server';
import { TranscriptService } from '@/lib/transcript-service';
import { extractVideoId } from '@/lib/youtube-utils';

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
        return NextResponse.json(
          { error: 'Invalid YouTube URL format' },
          { status: 400 }
        );
      }
      extractedVideoId = id;
    } else if (videoId) {
      extractedVideoId = videoId;
    } else {
      return NextResponse.json(
        { error: 'Either url or videoId parameter is required' },
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
    
    // Handle specific error cases
    if (errorMessage.includes('Transcript is disabled') || 
        errorMessage.includes('No transcript found')) {
      return NextResponse.json(
        { 
          error: 'No transcript available for this video',
          details: errorMessage
        },
        { status: 404 }
      );
    }

    if (errorMessage.includes('Video unavailable') || 
        errorMessage.includes('Private video')) {
      return NextResponse.json(
        { 
          error: 'Video is not accessible',
          details: errorMessage
        },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { 
        error: 'Failed to extract transcript',
        details: errorMessage
      },
      { status: 500 }
    );
  }
}