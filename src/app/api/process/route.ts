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
    customTemplate?: string;
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
    const { AIArticleGenerator } = await import('@/lib/ai-article-generator');
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

    // Stage 4: Generate article with AI (fallback to template-based)
    let article;
    let generationMethod = 'template';
    
    const generationOptions = {
      length: options.articleLength || 'medium',
      tone: options.tone || 'professional',
      format: options.format || 'markdown',
      customTemplate: options.customTemplate
    };

    try {
      console.log('Attempting AI article generation...');
      console.log('Analysis summary:', analysis.summary);
      console.log('Key points count:', analysis.keyPoints?.length || 0);
      console.log('Topics count:', analysis.topics?.length || 0);
      console.log('Generation options:', generationOptions);
      
      article = await AIArticleGenerator.generateArticle(
        analysis,
        metadata,
        transcript,
        generationOptions
      );
      generationMethod = 'ai';
      console.log('✅ AI generation successful');
    } catch (error) {
      console.error('❌ AI generation failed with error:', error);
      console.error('Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
      
      console.log('Falling back to template-based generation...');
      article = ArticleGenerator.generateArticle(
        analysis,
        metadata,
        transcript,
        generationOptions
      );
      generationMethod = 'template';
      console.log('✅ Template-based generation completed');
    }

    // Return complete result
    return NextResponse.json({
      success: true,
      data: {
        metadata,
        transcript,
        analysis,
        article,
        generationMethod
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