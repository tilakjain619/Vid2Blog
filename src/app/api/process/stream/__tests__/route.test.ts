import { POST, GET } from '../route';
import { NextRequest } from 'next/server';
import { ProcessingPipeline } from '@/lib/processing-pipeline';

// Mock the ProcessingPipeline
jest.mock('@/lib/processing-pipeline');

// Mock ReadableStream for Node.js environment
global.ReadableStream = class MockReadableStream {
  constructor(private underlyingSource: any) {}
  
  getReader() {
    return {
      read: jest.fn().mockResolvedValue({ done: true, value: undefined })
    };
  }
} as any;

describe('/api/process/stream', () => {
  let mockProcessVideo: jest.MockedFunction<any>;

  beforeEach(() => {
    mockProcessVideo = jest.fn();
    (ProcessingPipeline as jest.MockedClass<typeof ProcessingPipeline>).mockImplementation(() => ({
      processVideo: mockProcessVideo
    } as any));
    jest.clearAllMocks();
  });

  describe('POST', () => {
    it('should return 400 for missing URL', async () => {
      const request = new NextRequest('http://localhost/api/process/stream', {
        method: 'POST',
        body: JSON.stringify({}),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('YouTube URL is required');
      expect(mockProcessVideo).not.toHaveBeenCalled();
    });

    it('should handle invalid JSON', async () => {
      const request = new NextRequest('http://localhost/api/process/stream', {
        method: 'POST',
        body: 'invalid json',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toContain('Unexpected token');
    });

    it('should return streaming response with correct headers', async () => {
      // Mock successful processing
      mockProcessVideo.mockImplementation(async (url, options) => {
        // Simulate progress updates
        if (options.onProgress) {
          options.onProgress({ stage: 'validation', progress: 0, message: 'Starting...' });
          options.onProgress({ stage: 'complete', progress: 100, message: 'Done!' });
        }
        
        return {
          success: true,
          videoMetadata: { id: 'test' },
          transcript: { segments: [] },
          analysis: { topics: [] },
          article: { title: 'Test' },
          processingTime: 5000
        };
      });

      const request = new NextRequest('http://localhost/api/process/stream', {
        method: 'POST',
        body: JSON.stringify({
          url: 'https://youtube.com/watch?v=test',
          options: { length: 'medium' }
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const response = await POST(request);

      expect(response.headers.get('Content-Type')).toBe('text/event-stream');
      expect(response.headers.get('Cache-Control')).toBe('no-cache');
      expect(response.headers.get('Connection')).toBe('keep-alive');
      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
    });

    it('should call pipeline with correct parameters', async () => {
      mockProcessVideo.mockResolvedValue({
        success: true,
        processingTime: 1000
      });

      const request = new NextRequest('http://localhost/api/process/stream', {
        method: 'POST',
        body: JSON.stringify({
          url: 'https://youtube.com/watch?v=test',
          options: { length: 'long', tone: 'casual' }
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      await POST(request);

      expect(mockProcessVideo).toHaveBeenCalledWith(
        'https://youtube.com/watch?v=test',
        expect.objectContaining({
          generationOptions: { length: 'long', tone: 'casual' },
          onProgress: expect.any(Function)
        })
      );
    });

    it('should handle processing errors in stream', async () => {
      mockProcessVideo.mockRejectedValue(new Error('Processing failed'));

      const request = new NextRequest('http://localhost/api/process/stream', {
        method: 'POST',
        body: JSON.stringify({
          url: 'https://youtube.com/watch?v=test'
        }),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const response = await POST(request);

      // Should still return streaming response
      expect(response.headers.get('Content-Type')).toBe('text/event-stream');
    });
  });

  describe('GET', () => {
    it('should return streaming API documentation', async () => {
      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.message).toBe('Streaming Video Processing Pipeline API');
      expect(data.description).toContain('Server-Sent Events');
      expect(data.usage.method).toBe('POST');
      expect(data.response.type).toBe('text/event-stream');
      expect(data.response.events).toHaveLength(3);
      expect(data.example.javascript).toContain('fetch(\'/api/process/stream\'');
    });

    it('should document all event types', async () => {
      const response = await GET();
      const data = await response.json();

      const eventTypes = data.response.events.map((event: any) => event.type);
      expect(eventTypes).toContain('progress');
      expect(eventTypes).toContain('result');
      expect(eventTypes).toContain('error');
    });
  });
});