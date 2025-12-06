import { GET } from '../route';
import { TranscriptService } from '@/lib/transcript-service';
import { extractVideoId } from '@/lib/youtube-utils';
import { NextRequest } from 'next/server';

// Mock dependencies
jest.mock('@/lib/transcript-service');
jest.mock('@/lib/youtube-utils');

const mockTranscriptService = TranscriptService as jest.Mocked<typeof TranscriptService>;
const mockExtractVideoId = extractVideoId as jest.MockedFunction<typeof extractVideoId>;

describe('/api/youtube/transcript', () => {
  const originalConsoleError = console.error;
  
  beforeAll(() => {
    console.error = jest.fn();
  });

  afterAll(() => {
    console.error = originalConsoleError;
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET', () => {
    it('should extract transcript using URL parameter', async () => {
      const mockTranscript = {
        segments: [
          {
            text: 'Hello world',
            startTime: 0,
            endTime: 2,
            confidence: 1.0
          }
        ],
        language: 'en',
        confidence: 1.0,
        duration: 2
      };

      mockExtractVideoId.mockReturnValue('test-video-id');
      mockTranscriptService.extractTranscript.mockResolvedValue(mockTranscript);

      const request = new NextRequest('http://localhost:3000/api/youtube/transcript?url=https://www.youtube.com/watch?v=test-video-id');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({
        success: true,
        data: mockTranscript
      });
      expect(mockExtractVideoId).toHaveBeenCalledWith('https://www.youtube.com/watch?v=test-video-id');
      expect(mockTranscriptService.extractTranscript).toHaveBeenCalledWith('test-video-id', {
        lang: 'en',
        country: 'US'
      });
    });

    it('should extract transcript using videoId parameter', async () => {
      const mockTranscript = {
        segments: [],
        language: 'en',
        confidence: 1.0,
        duration: 0
      };

      mockTranscriptService.extractTranscript.mockResolvedValue(mockTranscript);

      const request = new NextRequest('http://localhost:3000/api/youtube/transcript?videoId=direct-video-id');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({
        success: true,
        data: mockTranscript
      });
      expect(mockTranscriptService.extractTranscript).toHaveBeenCalledWith('direct-video-id', {
        lang: 'en',
        country: 'US'
      });
    });

    it('should use custom language and country parameters', async () => {
      const mockTranscript = {
        segments: [],
        language: 'es',
        confidence: 1.0,
        duration: 0
      };

      mockTranscriptService.extractTranscript.mockResolvedValue(mockTranscript);

      const request = new NextRequest('http://localhost:3000/api/youtube/transcript?videoId=test-id&lang=es&country=ES');
      const response = await GET(request);

      expect(response.status).toBe(200);
      expect(mockTranscriptService.extractTranscript).toHaveBeenCalledWith('test-id', {
        lang: 'es',
        country: 'ES'
      });
    });

    it('should return 400 when no URL or videoId provided', async () => {
      const request = new NextRequest('http://localhost:3000/api/youtube/transcript');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toEqual({
        error: 'Either url or videoId parameter is required'
      });
    });

    it('should return 400 when URL is invalid', async () => {
      mockExtractVideoId.mockReturnValue(null);

      const request = new NextRequest('http://localhost:3000/api/youtube/transcript?url=invalid-url');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toEqual({
        error: 'Invalid YouTube URL format'
      });
    });

    it('should return 404 when transcript is not available', async () => {
      mockExtractVideoId.mockReturnValue('test-video-id');
      mockTranscriptService.extractTranscript.mockRejectedValue(
        new Error('No transcript found')
      );

      const request = new NextRequest('http://localhost:3000/api/youtube/transcript?url=https://www.youtube.com/watch?v=test-video-id');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data).toEqual({
        error: 'No transcript available for this video',
        details: 'No transcript found'
      });
    });

    it('should return 403 when video is not accessible', async () => {
      mockExtractVideoId.mockReturnValue('test-video-id');
      mockTranscriptService.extractTranscript.mockRejectedValue(
        new Error('Private video')
      );

      const request = new NextRequest('http://localhost:3000/api/youtube/transcript?url=https://www.youtube.com/watch?v=test-video-id');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data).toEqual({
        error: 'Video is not accessible',
        details: 'Private video'
      });
    });

    it('should return 500 for other errors', async () => {
      mockExtractVideoId.mockReturnValue('test-video-id');
      mockTranscriptService.extractTranscript.mockRejectedValue(
        new Error('Network error')
      );

      const request = new NextRequest('http://localhost:3000/api/youtube/transcript?url=https://www.youtube.com/watch?v=test-video-id');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toEqual({
        error: 'Failed to extract transcript',
        details: 'Network error'
      });
    });

    it('should handle unknown error types', async () => {
      mockExtractVideoId.mockReturnValue('test-video-id');
      mockTranscriptService.extractTranscript.mockRejectedValue('Unknown error');

      const request = new NextRequest('http://localhost:3000/api/youtube/transcript?url=https://www.youtube.com/watch?v=test-video-id');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toEqual({
        error: 'Failed to extract transcript',
        details: 'Unknown error occurred'
      });
    });
  });
});