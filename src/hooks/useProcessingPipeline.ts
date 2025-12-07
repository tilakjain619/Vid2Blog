import { useState, useCallback, useRef } from 'react';
import { 
  ProcessingStatus, 
  GenerationOptions,
  VideoMetadata,
  Transcript,
  ContentAnalysis,
  Article
} from '@/types';
import { ProcessingError, normalizeError } from '@/lib/error-handling';
import { useRetryMechanism } from './useRetryMechanism';

export interface ProcessingPipelineState {
  isProcessing: boolean;
  status: ProcessingStatus | null;
  result: ProcessingPipelineResult | null;
  error: ProcessingError | null;
}

export interface ProcessingPipelineResult {
  videoMetadata: VideoMetadata;
  transcript: Transcript;
  analysis: ContentAnalysis;
  article: Article;
  processingTime: number;
}

export interface UseProcessingPipelineReturn {
  state: ProcessingPipelineState;
  processVideo: (url: string, options?: GenerationOptions) => Promise<void>;
  processVideoWithProgress: (url: string, options?: GenerationOptions) => Promise<void>;
  retry: () => Promise<void>;
  reset: () => void;
  cancel: () => void;
}

/**
 * Hook for managing video processing pipeline state and operations
 */
export function useProcessingPipeline(): UseProcessingPipelineReturn {
  const [state, setState] = useState<ProcessingPipelineState>({
    isProcessing: false,
    status: null,
    result: null,
    error: null
  });

  const abortControllerRef = useRef<AbortController | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const lastRequestRef = useRef<{ url: string; options?: GenerationOptions } | null>(null);
  
  const { retryState, executeWithRetry, manualRetry } = useRetryMechanism();

  /**
   * Process video using the standard API endpoint (no progress updates)
   */
  const processVideo = useCallback(async (url: string, options?: GenerationOptions) => {
    // Store request for retry
    lastRequestRef.current = { url, options };

    // Reset state
    setState({
      isProcessing: true,
      status: { stage: 'validation', progress: 0, message: 'Starting processing...' },
      result: null,
      error: null
    });

    try {
      await executeWithRetry(async () => {
        // Create abort controller for cancellation
        abortControllerRef.current = new AbortController();

        const response = await fetch('/api/process', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ url, options }),
          signal: abortControllerRef.current.signal
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || 'Processing failed');
        }

        if (result.success) {
          setState({
            isProcessing: false,
            status: { stage: 'complete', progress: 100, message: 'Processing completed successfully!' },
            result: {
              videoMetadata: result.videoMetadata,
              transcript: result.transcript,
              analysis: result.analysis,
              article: result.article,
              processingTime: result.processingTime
            },
            error: null
          });
        } else {
          throw new Error(result.error || 'Processing failed');
        }
      }, {
        maxRetries: 2,
        baseDelay: 5000,
        exponentialBackoff: true
      });

    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        setState(prev => ({
          ...prev,
          isProcessing: false,
          status: { stage: 'error', progress: 0, message: 'Processing cancelled' }
        }));
      } else {
        const processingError = normalizeError(error);
        setState({
          isProcessing: false,
          status: { stage: 'error', progress: 0, message: processingError.details.userMessage },
          result: null,
          error: processingError
        });
      }
    }
  }, [executeWithRetry]);

  /**
   * Process video using the streaming API endpoint (with real-time progress updates)
   */
  const processVideoWithProgress = useCallback(async (url: string, options?: GenerationOptions) => {
    // Reset state
    setState({
      isProcessing: true,
      status: { stage: 'validation', progress: 0, message: 'Starting processing...' },
      result: null,
      error: null
    });

    try {
      // Create EventSource for Server-Sent Events
      const eventSource = new EventSource('/api/process/stream');
      eventSourceRef.current = eventSource;

      // Send the processing request
      const response = await fetch('/api/process/stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url, options })
      });

      if (!response.ok) {
        throw new Error('Failed to start processing stream');
      }

      // Set up event listeners
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('Failed to create stream reader');
      }

      // Read the stream
      while (true) {
        const { done, value } = await reader.read();
        
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              
              if (data.type === 'progress') {
                setState(prev => ({
                  ...prev,
                  status: data.status
                }));
              } else if (data.type === 'result') {
                const result = data.result;
                
                if (result.success) {
                  setState({
                    isProcessing: false,
                    status: { stage: 'complete', progress: 100, message: 'Processing completed successfully!' },
                    result: {
                      videoMetadata: result.videoMetadata,
                      transcript: result.transcript,
                      analysis: result.analysis,
                      article: result.article,
                      processingTime: result.processingTime
                    },
                    error: null
                  });
                } else {
                  throw new Error(result.error || 'Processing failed');
                }
                break;
              } else if (data.type === 'error') {
                throw new Error(data.error);
              }
            } catch (parseError) {
              console.warn('Failed to parse SSE data:', parseError);
            }
          }
        }
      }

    } catch (error) {
      const processingError = normalizeError(error);
      setState({
        isProcessing: false,
        status: { stage: 'error', progress: 0, message: processingError.details.userMessage },
        result: null,
        error: processingError
      });
    } finally {
      // Clean up event source
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    }
  }, []);

  /**
   * Retry the last processing request
   */
  const retry = useCallback(async () => {
    if (!lastRequestRef.current) {
      console.warn('No previous request to retry');
      return;
    }

    const { url, options } = lastRequestRef.current;
    await processVideo(url, options);
  }, [processVideo]);

  /**
   * Reset the processing state
   */
  const reset = useCallback(() => {
    setState({
      isProcessing: false,
      status: null,
      result: null,
      error: null
    });
    lastRequestRef.current = null;
  }, []);

  /**
   * Cancel ongoing processing
   */
  const cancel = useCallback(() => {
    // Cancel fetch request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    // Close event source
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    setState(prev => ({
      ...prev,
      isProcessing: false,
      status: { stage: 'error', progress: 0, message: 'Processing cancelled' }
    }));
  }, []);

  return {
    state,
    processVideo,
    processVideoWithProgress,
    retry,
    reset,
    cancel
  };
}