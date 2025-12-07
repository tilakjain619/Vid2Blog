import { NextRequest, NextResponse } from 'next/server';
import { ProcessingPipeline, PipelineOptions } from '@/lib/processing-pipeline';
import { GenerationOptions, ProcessingStatus } from '@/types';

/**
 * POST /api/process/stream
 * Process a YouTube video with streaming progress updates
 * Uses Server-Sent Events (SSE) for real-time progress tracking
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url, options }: { url: string; options?: GenerationOptions } = body;
    
    // Validate required fields
    if (!url) {
      return NextResponse.json({
        error: 'YouTube URL is required'
      }, { status: 400 });
    }

    // Create a readable stream for Server-Sent Events
    const stream = new ReadableStream({
      start(controller) {
        const encoder = new TextEncoder();
        
        // Function to send progress updates
        const sendProgress = (status: ProcessingStatus) => {
          const data = `data: ${JSON.stringify({
            type: 'progress',
            status
          })}\n\n`;
          controller.enqueue(encoder.encode(data));
        };

        // Function to send final result
        const sendResult = (result: any) => {
          const data = `data: ${JSON.stringify({
            type: 'result',
            result
          })}\n\n`;
          controller.enqueue(encoder.encode(data));
        };

        // Function to send error
        const sendError = (error: string) => {
          const data = `data: ${JSON.stringify({
            type: 'error',
            error
          })}\n\n`;
          controller.enqueue(encoder.encode(data));
        };

        // Create pipeline instance with progress callback
        const pipeline = new ProcessingPipeline();
        
        const pipelineOptions: PipelineOptions = {
          generationOptions: options,
          onProgress: sendProgress
        };

        // Start processing
        pipeline.processVideo(url, pipelineOptions)
          .then((result) => {
            sendResult(result);
            controller.close();
          })
          .catch((error) => {
            sendError(error instanceof Error ? error.message : 'Processing failed');
            controller.close();
          });
      }
    });

    // Return SSE response
    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    });

  } catch (error) {
    console.error('Streaming pipeline error:', error);
    
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Failed to start processing stream'
    }, { status: 500 });
  }
}

/**
 * GET /api/process/stream
 * Get streaming API documentation
 */
export async function GET(): Promise<NextResponse> {
  return NextResponse.json({
    message: 'Streaming Video Processing Pipeline API',
    description: 'Process YouTube videos with real-time progress updates using Server-Sent Events',
    usage: {
      method: 'POST',
      contentType: 'application/json',
      body: {
        url: 'YouTube video URL',
        options: 'Optional generation options'
      }
    },
    response: {
      type: 'text/event-stream',
      events: [
        {
          type: 'progress',
          description: 'Progress updates during processing',
          data: {
            stage: 'Current processing stage',
            progress: 'Progress percentage (0-100)',
            message: 'Human-readable status message',
            estimatedTimeRemaining: 'Estimated seconds remaining (optional)'
          }
        },
        {
          type: 'result',
          description: 'Final processing result',
          data: {
            success: 'Boolean indicating success/failure',
            videoMetadata: 'Video metadata object',
            transcript: 'Extracted transcript',
            analysis: 'Content analysis results',
            article: 'Generated article',
            error: 'Error message if failed',
            processingTime: 'Total processing time in milliseconds'
          }
        },
        {
          type: 'error',
          description: 'Error during processing',
          data: {
            error: 'Error message'
          }
        }
      ]
    },
    example: {
      javascript: `
const response = await fetch('/api/process/stream', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ 
    url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    options: { length: 'medium', tone: 'professional' }
  })
});

const reader = response.body.getReader();
const decoder = new TextDecoder();

while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  
  const chunk = decoder.decode(value);
  const lines = chunk.split('\\n');
  
  for (const line of lines) {
    if (line.startsWith('data: ')) {
      const data = JSON.parse(line.slice(6));
      console.log(data.type, data);
    }
  }
}
      `
    }
  });
}