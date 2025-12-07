import { NextRequest, NextResponse } from 'next/server';
import { validateYouTubeUrl } from '@/lib/youtube-utils';
import { ProcessingError, createProcessingError, ErrorType } from '@/lib/error-handling';
import { ProcessingPipeline } from '@/lib/processing-pipeline';

interface ProcessingRequest {
  url: string;
  options?: {
    articleLength?: 'short' | 'medium' | 'long';
    tone?: 'professional' | 'casual' | 'technical';
    format?: 'markdown' | 'html' | 'plain';
  };
}

interface ProcessingResponse {
  success: boolean;
  data?: {
    metadata: any;
    transcript: any;
    analysis: any;
    article: any;
  };
  error?: string;
  stage?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: ProcessingRequest = await request.json();
    const { url, options = {} } = body;

    // Validate input
    if (!url) {
      return NextResponse.json({
        success: false,
        error: 'YouTube URL is required'
      }, { status: 400 });
    }

    const validation = validateYouTubeUrl(url);
    if (!validation.isValid) {
      return NextResponse.json({
        success: false,
        error: validation.error || 'Invalid YouTube URL'
      }, { status: 400 });
    }

    // Import service functions directly for server-side processing
    const { YouTubeApiService } = await import('@/lib/youtube-api');
    const { TranscriptService } = await import('@/lib/transcript-service');
    const { ContentAnalyzer } = await import('@/lib/content-analyzer');
    const { ArticleGenerator } = await import('@/lib/article-generator');
    const { extractVideoId } = await import('@/lib/youtube-utils');

    // Stage 1: Extract metadata
    const videoId = extractVideoId(url);
    if (!videoId) {
      return NextResponse.json({
        success: false,
        error: 'Invalid YouTube URL - could not extract video ID',
        stage: 'metadata'
      }, { status: 400 });
    }

    const apiKey = process.env.YOUTUBE_API_KEY;
    if (!apiKey) {
      return NextResponse.json({
        success: false,
        error: 'YouTube API key not configured',
        stage: 'metadata'
      }, { status: 500 });
    }

    const youtubeService = new YouTubeApiService(apiKey);
    const metadata = await youtubeService.getVideoMetadata(videoId);

    // Stage 2: Extract transcript
    const transcript = await TranscriptService.extractTranscript(videoId);

    // Stage 3: Analyze content
    const analysis = ContentAnalyzer.analyzeContent(transcript);

    // Stage 4: Generate article
    const article = ArticleGenerator.generateArticle(
      analysis,
      metadata,
      transcript,
      {
        length: options.articleLength || 'medium',
        tone: options.tone || 'professional',
        format: options.format || 'markdown'
      }
    );

    // Return complete result
    return NextResponse.json({
      success: true,
      data: {
        metadata,
        transcript,
        analysis,
        article
      }
    });

  } catch (error) {
    console.error('Processing pipeline error:', error);
    
    const processingError = createProcessingError(
      ErrorType.PROCESSING_FAILED,
      error instanceof Error ? error : new Error('Unknown processing error')
    );

    return NextResponse.json({
      success: false,
      error: processingError.message
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Video Processing Pipeline API',
    description: 'Process YouTube videos and generate blog articles',
    usage: {
      method: 'POST',
      contentType: 'application/json',
      body: {
        url: 'YouTube video URL',
        options: 'Optional processing options'
      }
    },
    response: {
      success: 'Boolean indicating success/failure',
      data: {
        metadata: 'Video metadata object',
        transcript: 'Extracted transcript',
        analysis: 'Content analysis results',
        article: 'Generated article'
      },
      error: 'Error message if failed'
    }
  });
}