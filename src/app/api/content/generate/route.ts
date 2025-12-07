import { NextRequest, NextResponse } from 'next/server';
import { ArticleGenerator } from '@/lib/article-generator';
import { AIArticleGenerator } from '@/lib/ai-article-generator';
import { 
  ContentAnalysis, 
  VideoMetadata, 
  Transcript, 
  GenerationOptions,
  Article 
} from '@/types';

export interface GenerateArticleRequest {
  analysis: ContentAnalysis;
  videoMetadata: VideoMetadata;
  transcript: Transcript;
  options?: GenerationOptions;
}

export interface GenerateArticleResponse {
  success: boolean;
  article?: Article;
  error?: string;
  processingTime?: number;
}

/**
 * POST /api/content/generate
 * Generate a blog article from content analysis
 */
export async function POST(request: NextRequest): Promise<NextResponse<GenerateArticleResponse>> {
  const startTime = Date.now();

  try {
    const body: GenerateArticleRequest = await request.json();
    
    // Validate required fields
    if (!body.analysis) {
      return NextResponse.json({
        success: false,
        error: 'Content analysis is required'
      }, { status: 400 });
    }

    if (!body.videoMetadata) {
      return NextResponse.json({
        success: false,
        error: 'Video metadata is required'
      }, { status: 400 });
    }

    if (!body.transcript) {
      return NextResponse.json({
        success: false,
        error: 'Transcript is required'
      }, { status: 400 });
    }

    // Validate analysis structure
    if (!body.analysis.topics || !Array.isArray(body.analysis.topics)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid analysis: topics array is required'
      }, { status: 400 });
    }

    if (!body.analysis.keyPoints || !Array.isArray(body.analysis.keyPoints)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid analysis: keyPoints array is required'
      }, { status: 400 });
    }

    // Set default options
    const options: GenerationOptions = {
      length: 'medium',
      tone: 'professional',
      format: 'markdown',
      includeTimestamps: false,
      ...body.options
    };

    // Generate the article using AI (with fallback to template-based)
    let article;
    let generationMethod = 'template';
    
    try {
      console.log('Attempting AI article generation...');
      // Try AI generation first
      article = await AIArticleGenerator.generateArticle(
        body.analysis,
        body.videoMetadata,
        body.transcript,
        options
      );
      generationMethod = 'ai';
      console.log('AI generation successful');
    } catch (error) {
      console.warn('AI generation failed, falling back to template-based generation:', error);
      // Fallback to template-based generation
      article = ArticleGenerator.generateArticle(
        body.analysis,
        body.videoMetadata,
        body.transcript,
        options
      );
      console.log('Template-based generation used as fallback');
    }

    const processingTime = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      article,
      processingTime,
      generationMethod
    });

  } catch (error) {
    console.error('Article generation error:', error);
    
    const processingTime = Date.now() - startTime;
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate article',
      processingTime
    }, { status: 500 });
  }
}

/**
 * GET /api/content/generate/templates
 * Get available article templates
 */
export async function GET(): Promise<NextResponse> {
  try {
    const templates = ArticleGenerator.getAvailableTemplates();
    
    return NextResponse.json({
      success: true,
      templates: templates.map(template => ({
        name: template.name,
        type: template.type,
        defaultTone: template.defaultTone,
        estimatedLength: template.estimatedLength,
        sections: template.structure.map(section => ({
          heading: section.heading,
          contentType: section.contentType,
          includeTimestamps: section.includeTimestamps
        }))
      }))
    });

  } catch (error) {
    console.error('Template retrieval error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Failed to retrieve templates'
    }, { status: 500 });
  }
}