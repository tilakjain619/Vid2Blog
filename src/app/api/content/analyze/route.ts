import { NextRequest, NextResponse } from 'next/server';
import { ContentAnalyzer, ContentAnalysisOptions } from '@/lib/content-analyzer';
import { Transcript } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { transcript, options }: { transcript: Transcript; options?: ContentAnalysisOptions } = body;

    // Validate input
    if (!transcript) {
      return NextResponse.json(
        { error: 'Transcript is required' },
        { status: 400 }
      );
    }

    if (!transcript.segments || !Array.isArray(transcript.segments)) {
      return NextResponse.json(
        { error: 'Transcript must contain segments array' },
        { status: 400 }
      );
    }

    // Perform content analysis
    const analysis = ContentAnalyzer.analyzeContent(transcript, options);

    return NextResponse.json({
      success: true,
      analysis
    });

  } catch (error) {
    console.error('Content analysis error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to analyze content',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Content Analysis API',
    endpoints: {
      'POST /api/content/analyze': 'Analyze transcript content and extract insights'
    },
    requiredFields: {
      transcript: 'Transcript object with segments array',
      options: 'Optional ContentAnalysisOptions object'
    }
  });
}