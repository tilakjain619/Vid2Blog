import { POST, GET } from '../route';
import { NextRequest } from 'next/server';
import { ProcessingPipeline } from '@/lib/processing-pipeline';

// Mock the ProcessingPipeline
jest.mock('@/lib/processing-pipeline');

describe('/api/process', () => {
  let mockProcessVideo: jest.MockedFunction<any>;

  beforeEach(() => {
    mockProcessVideo = jest.fn();
    (ProcessingPipeline as jest.MockedClass<typeof ProcessingPipeline>).mockImplementation(() => ({
      processVideo: mockProcessVideo
    } as any));
    jest.clearAllMocks();
  });

  describe('POST', () => {
    it('should process a video successfully', async () => {
      const mockResult = {
        success: true,
        videoMetadata: { id: 'test', title: 'Test Video' },
        transcript: { segments: [], language: 'en', confidence: 0.95, duration: 300 },
        analysis: { topics: [], keyPoints: [], summary: 'Test', suggestedStructure: [], sentiment: 'positive' },
        article: { title: 'Test Article', introduction: 'Intro', sections: [], conclusion: 'Conclusion', metadata: {}, tags: [] },
        processingTime: 5000
      };

      mockProcessVideo.mockResolvedValue(mockResult);

      const request = new NextRequest('http://localhost/api/process', {
        method: 'POST',
        body: JSON.stringify({
          url: 'https://youtube.com/watch?v=test',
          options: { length: 'medium', tone: 'professional' }
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.videoMetadata).toEqual(mockResult.videoMetadata);
      expect(data.processingTime).toBe(5000);

      // Verify pipeline was called with correct parameters
      expect(mockProcessVideo).toHaveBeenCalledWith(
        'https://youtube.com/watch?v=test',
        {
          generationOptions: { length: 'medium', tone: 'professional' }
        }
      );
    });

    it('should handle processing failure', async () => {
      const mockResult = {
        success: false,
        error: 'Video not found',
        processingTime: 1000
      };

      mockProcessVideo.mockResolvedValue(mockResult);

      const request = new NextRequest('http://localhost/api/process', {
        method: 'POST',
        body: JSON.stringify({
          url: 'https://youtube.com/watch?v=invalid'
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Video not found');
      expect(data.processingTime).toBe(1000);
    });

    it('should return 400 for missing URL', async () => {
      const request = new NextRequest('http://localhost/api/process', {
        method: 'POST',
        body: JSON.stringify({}),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('YouTube URL is required');
      expect(mockProcessVideo).not.toHaveBeenCalled();
    });

    it('should handle invalid JSON', async () => {
      const request = new NextRequest('http://localhost/api/process', {
        method: 'POST',
        body: 'invalid json',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toContain('Unexpected token');
    });

    it('should handle pipeline errors', async () => {
      mockProcessVideo.mockRejectedValue(new Error('Pipeline crashed'));

      const request = new NextRequest('http://localhost/api/process', {
        method: 'POST',
        body: JSON.stringify({
          url: 'https://youtube.com/watch?v=test'
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Pipeline crashed');
    });

    it('should pass generation options to pipeline', async () => {
      const mockResult = {
        success: true,
        videoMetadata: {},
        transcript: {},
        analysis: {},
        article: {},
        processingTime: 3000
      };

      mockProcessVideo.mockResolvedValue(mockResult);

      const generationOptions = {
        length: 'long' as const,
        tone: 'casual' as const,
        format: 'html' as const,
        includeTimestamps: true
      };

      const request = new NextRequest('http://localhost/api/process', {
        method: 'POST',
        body: JSON.stringify({
          url: 'https://youtube.com/watch?v=test',
          options: generationOptions
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      await POST(request);

      expect(mockProcessVideo).toHaveBeenCalledWith(
        'https://youtube.com/watch?v=test',
        {
          generationOptions
        }
      );
    });
  });

  describe('GET', () => {
    it('should return API documentation', async () => {
      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.message).toBe('Video Processing Pipeline API');
      expect(data.description).toContain('metadata → transcript → analysis → generation');
      expect(data.endpoints).toHaveProperty('POST /api/process');
      expect(data.requiredFields).toHaveProperty('url');
      expect(data.pipeline.stages).toHaveLength(5);
    });
  });
});