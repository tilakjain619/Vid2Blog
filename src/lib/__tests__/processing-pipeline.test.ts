import { ProcessingPipeline } from '../processing-pipeline';
import { VideoMetadata, Transcript, ContentAnalysis, Article, ProcessingStatus } from '@/types';

// Mock fetch globally
global.fetch = jest.fn();

describe('ProcessingPipeline', () => {
  let pipeline: ProcessingPipeline;
  let mockFetch: jest.MockedFunction<typeof fetch>;
  let progressUpdates: ProcessingStatus[];

  beforeEach(() => {
    pipeline = new ProcessingPipeline();
    mockFetch = fetch as jest.MockedFunction<typeof fetch>;
    progressUpdates = [];
    jest.clearAllMocks();
  });

  const mockVideoMetadata: VideoMetadata = {
    id: 'test-video-id',
    title: 'Test Video',
    description: 'Test Description',
    duration: 300,
    thumbnailUrl: 'https://example.com/thumb.jpg',
    channelName: 'Test Channel',
    publishDate: new Date('2023-01-01'),
    viewCount: 1000
  };

  const mockTranscript: Transcript = {
    segments: [
      {
        text: 'Hello world',
        startTime: 0,
        endTime: 2,
        confidence: 0.95
      }
    ],
    language: 'en',
    confidence: 0.95,
    duration: 300
  };

  const mockAnalysis: ContentAnalysis = {
    topics: [
      {
        name: 'Technology',
        relevance: 0.8,
        timeRanges: [{ start: 0, end: 300 }]
      }
    ],
    keyPoints: [
      {
        text: 'Key insight about technology',
        importance: 0.9,
        timestamp: 150,
        category: 'main'
      }
    ],
    summary: 'This video discusses technology topics',
    suggestedStructure: [
      {
        heading: 'Introduction',
        content: 'Introduction content'
      }
    ],
    sentiment: 'positive'
  };

  const mockArticle: Article = {
    title: 'Generated Article Title',
    introduction: 'Article introduction',
    sections: [
      {
        heading: 'Main Section',
        content: 'Section content'
      }
    ],
    conclusion: 'Article conclusion',
    metadata: {
      wordCount: 100,
      readingTime: 1,
      seoTitle: 'SEO Title',
      metaDescription: 'SEO Description',
      sourceVideo: mockVideoMetadata
    },
    tags: ['technology', 'tutorial']
  };

  describe('processVideo', () => {
    it('should successfully process a video through all stages', async () => {
      // Mock successful API responses
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, metadata: mockVideoMetadata })
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, data: mockTranscript })
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, analysis: mockAnalysis })
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, article: mockArticle })
        } as Response);

      const result = await pipeline.processVideo('https://youtube.com/watch?v=test', {
        onProgress: (status) => progressUpdates.push(status)
      });

      expect(result.success).toBe(true);
      expect(result.videoMetadata).toEqual(mockVideoMetadata);
      expect(result.transcript).toEqual(mockTranscript);
      expect(result.analysis).toEqual(mockAnalysis);
      expect(result.article).toEqual(mockArticle);
      expect(result.processingTime).toBeGreaterThan(0);

      // Verify progress updates
      expect(progressUpdates.length).toBeGreaterThan(0);
      expect(progressUpdates[0].stage).toBe('validation');
      expect(progressUpdates[progressUpdates.length - 1].stage).toBe('complete');
    });

    it('should handle metadata extraction failure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Invalid YouTube URL' })
      } as Response);

      const result = await pipeline.processVideo('https://invalid-url', {
        onProgress: (status) => progressUpdates.push(status)
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid YouTube URL');
      expect(result.videoMetadata).toBeUndefined();
    });

    it('should handle transcript extraction failure', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, metadata: mockVideoMetadata })
        } as Response)
        .mockResolvedValueOnce({
          ok: false,
          json: async () => ({ error: 'No transcript available' })
        } as Response);

      const result = await pipeline.processVideo('https://youtube.com/watch?v=test');

      expect(result.success).toBe(false);
      expect(result.error).toBe('No transcript available');
      expect(result.videoMetadata).toEqual(mockVideoMetadata);
      expect(result.transcript).toBeUndefined();
    });

    it('should handle content analysis failure', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, metadata: mockVideoMetadata })
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, data: mockTranscript })
        } as Response)
        .mockResolvedValueOnce({
          ok: false,
          json: async () => ({ error: 'Analysis failed' })
        } as Response);

      const result = await pipeline.processVideo('https://youtube.com/watch?v=test');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Analysis failed');
      expect(result.videoMetadata).toEqual(mockVideoMetadata);
      expect(result.transcript).toEqual(mockTranscript);
      expect(result.analysis).toBeUndefined();
    });

    it('should handle article generation failure', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, metadata: mockVideoMetadata })
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, data: mockTranscript })
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, analysis: mockAnalysis })
        } as Response)
        .mockResolvedValueOnce({
          ok: false,
          json: async () => ({ error: 'Generation failed' })
        } as Response);

      const result = await pipeline.processVideo('https://youtube.com/watch?v=test');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Generation failed');
      expect(result.videoMetadata).toEqual(mockVideoMetadata);
      expect(result.transcript).toEqual(mockTranscript);
      expect(result.analysis).toEqual(mockAnalysis);
      expect(result.article).toBeUndefined();
    });

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const result = await pipeline.processVideo('https://youtube.com/watch?v=test');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Network error during metadata extraction');
    });

    it('should pass generation options to the article generation API', async () => {
      const generationOptions = {
        length: 'long' as const,
        tone: 'casual' as const,
        format: 'html' as const,
        includeTimestamps: true
      };

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, metadata: mockVideoMetadata })
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, data: mockTranscript })
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, analysis: mockAnalysis })
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, article: mockArticle })
        } as Response);

      await pipeline.processVideo('https://youtube.com/watch?v=test', {
        generationOptions
      });

      // Verify the generation API was called with the correct options
      const generateCall = mockFetch.mock.calls[3];
      expect(generateCall[0]).toBe('/api/content/generate');
      
      const requestBody = JSON.parse(generateCall[1]?.body as string);
      expect(requestBody.options).toEqual(generationOptions);
    });

    it('should track progress through all stages', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, metadata: mockVideoMetadata })
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, data: mockTranscript })
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, analysis: mockAnalysis })
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({ success: true, article: mockArticle })
        } as Response);

      await pipeline.processVideo('https://youtube.com/watch?v=test', {
        onProgress: (status) => progressUpdates.push(status)
      });

      // Verify all expected stages are tracked
      const stages = progressUpdates.map(update => update.stage);
      expect(stages).toContain('validation');
      expect(stages).toContain('metadata');
      expect(stages).toContain('transcription');
      expect(stages).toContain('analysis');
      expect(stages).toContain('generation');
      expect(stages).toContain('complete');

      // Verify progress increases
      const progressValues = progressUpdates.map(update => update.progress);
      for (let i = 1; i < progressValues.length; i++) {
        expect(progressValues[i]).toBeGreaterThanOrEqual(progressValues[i - 1]);
      }
    });
  });

  describe('error handling', () => {
    it('should handle malformed JSON responses', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => { throw new Error('Invalid JSON'); }
      } as Response);

      const result = await pipeline.processVideo('https://youtube.com/watch?v=test');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid JSON');
    });

    it('should handle unexpected errors during processing', async () => {
      // Mock a successful metadata call but then throw an unexpected error
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, metadata: mockVideoMetadata })
      } as Response);

      // Override the private method to throw an error
      const originalExtractTranscript = (pipeline as any).extractTranscript;
      (pipeline as any).extractTranscript = jest.fn().mockRejectedValue(new Error('Unexpected error'));

      const result = await pipeline.processVideo('https://youtube.com/watch?v=test');

      expect(result.success).toBe(false);
      expect(result.error).toBe('Unexpected error');

      // Restore original method
      (pipeline as any).extractTranscript = originalExtractTranscript;
    });
  });
});