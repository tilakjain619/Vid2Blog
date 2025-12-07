import { 
  VideoMetadata, 
  Transcript, 
  ContentAnalysis, 
  Article, 
  ProcessingStatus,
  GenerationOptions,
  ValidationResult
} from '@/types';

export interface PipelineOptions {
  generationOptions?: GenerationOptions;
  onProgress?: (status: ProcessingStatus) => void;
}

export interface PipelineResult {
  success: boolean;
  videoMetadata?: VideoMetadata;
  transcript?: Transcript;
  analysis?: ContentAnalysis;
  article?: Article;
  error?: string;
  processingTime: number;
}

export interface PipelineStageResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  duration: number;
}

/**
 * Main processing pipeline that orchestrates all backend services
 * Coordinates: metadata → transcript → analysis → generation
 */
export class ProcessingPipeline {
  private baseUrl: string;
  private onProgress?: (status: ProcessingStatus) => void;

  constructor(baseUrl: string = '') {
    this.baseUrl = baseUrl;
  }

  /**
   * Process a YouTube video through the complete pipeline
   */
  async processVideo(url: string, options: PipelineOptions = {}): Promise<PipelineResult> {
    const startTime = Date.now();
    this.onProgress = options.onProgress;

    try {
      // Stage 1: Validate URL and extract metadata
      this.updateProgress('validation', 0, 'Validating YouTube URL...');
      const metadataResult = await this.extractMetadata(url);
      
      if (!metadataResult.success) {
        return {
          success: false,
          error: metadataResult.error,
          processingTime: Date.now() - startTime
        };
      }

      this.updateProgress('metadata', 20, 'Video metadata extracted successfully');

      // Stage 2: Extract transcript
      this.updateProgress('transcription', 25, 'Extracting video transcript...');
      const transcriptResult = await this.extractTranscript(url);
      
      if (!transcriptResult.success) {
        return {
          success: false,
          error: transcriptResult.error,
          processingTime: Date.now() - startTime,
          videoMetadata: metadataResult.data
        };
      }

      this.updateProgress('transcription', 50, 'Transcript extracted successfully');

      // Stage 3: Analyze content
      this.updateProgress('analysis', 55, 'Analyzing video content...');
      
      if (!transcriptResult.data) {
        return {
          success: false,
          error: 'No transcript data available for analysis',
          processingTime: Date.now() - startTime,
          videoMetadata: metadataResult.data
        };
      }
      
      const analysisResult = await this.analyzeContent(transcriptResult.data);
      
      if (!analysisResult.success) {
        return {
          success: false,
          error: analysisResult.error,
          processingTime: Date.now() - startTime,
          videoMetadata: metadataResult.data,
          transcript: transcriptResult.data
        };
      }

      this.updateProgress('analysis', 75, 'Content analysis completed');

      // Stage 4: Generate article
      this.updateProgress('generation', 80, 'Generating blog article...');
      
      if (!analysisResult.data || !metadataResult.data || !transcriptResult.data) {
        return {
          success: false,
          error: 'Missing required data for article generation',
          processingTime: Date.now() - startTime,
          videoMetadata: metadataResult.data,
          transcript: transcriptResult.data,
          analysis: analysisResult.data
        };
      }
      
      const articleResult = await this.generateArticle(
        analysisResult.data,
        metadataResult.data,
        transcriptResult.data,
        options.generationOptions
      );
      
      if (!articleResult.success) {
        return {
          success: false,
          error: articleResult.error,
          processingTime: Date.now() - startTime,
          videoMetadata: metadataResult.data,
          transcript: transcriptResult.data,
          analysis: analysisResult.data
        };
      }

      this.updateProgress('complete', 100, 'Article generated successfully!');

      return {
        success: true,
        videoMetadata: metadataResult.data,
        transcript: transcriptResult.data,
        analysis: analysisResult.data,
        article: articleResult.data,
        processingTime: Date.now() - startTime
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown pipeline error';
      
      this.updateProgress('error', 0, `Pipeline failed: ${errorMessage}`);
      
      return {
        success: false,
        error: errorMessage,
        processingTime: Date.now() - startTime
      };
    }
  }

  /**
   * Extract video metadata from YouTube URL
   */
  private async extractMetadata(url: string): Promise<PipelineStageResult<VideoMetadata>> {
    const startTime = Date.now();
    
    try {
      const response = await fetch(`${this.baseUrl}/api/youtube/metadata`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      });

      const result = await response.json();
      
      if (!response.ok) {
        return {
          success: false,
          error: result.error || 'Failed to extract metadata',
          duration: Date.now() - startTime
        };
      }

      return {
        success: true,
        data: result.metadata,
        duration: Date.now() - startTime
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error during metadata extraction',
        duration: Date.now() - startTime
      };
    }
  }

  /**
   * Extract transcript from YouTube video
   */
  private async extractTranscript(url: string): Promise<PipelineStageResult<Transcript>> {
    const startTime = Date.now();
    
    try {
      const response = await fetch(`${this.baseUrl}/api/youtube/transcript?url=${encodeURIComponent(url)}`);
      const result = await response.json();
      
      if (!response.ok) {
        return {
          success: false,
          error: result.error || 'Failed to extract transcript',
          duration: Date.now() - startTime
        };
      }

      return {
        success: true,
        data: result.data,
        duration: Date.now() - startTime
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error during transcript extraction',
        duration: Date.now() - startTime
      };
    }
  }

  /**
   * Analyze transcript content
   */
  private async analyzeContent(transcript: Transcript): Promise<PipelineStageResult<ContentAnalysis>> {
    const startTime = Date.now();
    
    try {
      const response = await fetch(`${this.baseUrl}/api/content/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ transcript }),
      });

      const result = await response.json();
      
      if (!response.ok) {
        return {
          success: false,
          error: result.error || 'Failed to analyze content',
          duration: Date.now() - startTime
        };
      }

      return {
        success: true,
        data: result.analysis,
        duration: Date.now() - startTime
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error during content analysis',
        duration: Date.now() - startTime
      };
    }
  }

  /**
   * Generate article from analysis
   */
  private async generateArticle(
    analysis: ContentAnalysis,
    videoMetadata: VideoMetadata,
    transcript: Transcript,
    options?: GenerationOptions
  ): Promise<PipelineStageResult<Article>> {
    const startTime = Date.now();
    
    try {
      const response = await fetch(`${this.baseUrl}/api/content/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          analysis,
          videoMetadata,
          transcript,
          options
        }),
      });

      const result = await response.json();
      
      if (!response.ok) {
        return {
          success: false,
          error: result.error || 'Failed to generate article',
          duration: Date.now() - startTime
        };
      }

      return {
        success: true,
        data: result.article,
        duration: Date.now() - startTime
      };

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error during article generation',
        duration: Date.now() - startTime
      };
    }
  }

  /**
   * Update progress and notify listeners
   */
  private updateProgress(
    stage: ProcessingStatus['stage'], 
    progress: number, 
    message: string,
    estimatedTimeRemaining?: number
  ): void {
    if (this.onProgress) {
      this.onProgress({
        stage,
        progress,
        message,
        estimatedTimeRemaining
      });
    }
  }

  /**
   * Estimate remaining time based on current progress and elapsed time
   */
  private estimateRemainingTime(progress: number, elapsedTime: number): number {
    if (progress <= 0) return 0;
    const totalEstimatedTime = (elapsedTime / progress) * 100;
    return Math.max(0, totalEstimatedTime - elapsedTime);
  }
}