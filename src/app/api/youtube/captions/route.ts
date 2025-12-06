import { NextRequest, NextResponse } from 'next/server';
import { TranscriptService } from '@/lib/transcript-service';
import { extractVideoId } from '@/lib/youtube-utils';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const url = searchParams.get('url');
    const videoId = searchParams.get('videoId');

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

    const availableCaptions = await TranscriptService.getAvailableCaptions(extractedVideoId);

    return NextResponse.json({
      success: true,
      data: {
        videoId: extractedVideoId,
        availableCaptions
      }
    });

  } catch (error) {
    console.error('Caption availability check error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    return NextResponse.json(
      { 
        error: 'Failed to check available captions',
        details: errorMessage
      },
      { status: 500 }
    );
  }
}