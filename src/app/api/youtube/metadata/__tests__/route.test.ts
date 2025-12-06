import { POST, GET } from '../route';
import { NextRequest } from 'next/server';

// Mock fetch globally
global.fetch = jest.fn();

describe('/api/youtube/metadata', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock environment variable
    process.env.YOUTUBE_API_KEY = 'test-api-key';
  });

  afterEach(() => {
    delete process.env.YOUTUBE_API_KEY;
  });

  describe('POST', () => {
    const createMockRequest = (body: any) => {
      return {
        json: async () => body
      } as NextRequest;
    };

    it('should return 400 for invalid YouTube URL', async () => {
      const request = createMockRequest({
        url: 'https://example.com/not-youtube'
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBeDefined();
    });

    it('should return 500 when API key is not configured', async () => {
      delete process.env.YOUTUBE_API_KEY;

      const request = createMockRequest({
        url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toContain('YouTube API key not configured');
    });

    it('should handle malformed request body', async () => {
      const request = {
        json: async () => { throw new Error('Invalid JSON'); }
      } as NextRequest;

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Internal server error. Please try again.');
    });

    it('should return 400 for videos longer than 3 hours', async () => {
      // Mock successful YouTube API response with long duration
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          items: [{
            snippet: {
              title: 'Long Video',
              description: 'Very long video',
              channelTitle: 'Test Channel',
              publishedAt: '2023-01-01T00:00:00Z',
              thumbnails: { high: { url: 'https://example.com/thumb.jpg' } },
              liveBroadcastContent: 'none'
            },
            statistics: { viewCount: '1000' },
            contentDetails: { duration: 'PT4H' } // 4 hours
          }]
        })
      });

      const request = createMockRequest({
        url: 'https://www.youtube.com/watch?v=long123'
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Video is too long');
    });

    it('should return 400 for videos shorter than 1 minute', async () => {
      // Mock successful YouTube API response with short duration
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          items: [{
            snippet: {
              title: 'Short Video',
              description: 'Very short video',
              channelTitle: 'Test Channel',
              publishedAt: '2023-01-01T00:00:00Z',
              thumbnails: { high: { url: 'https://example.com/thumb.jpg' } },
              liveBroadcastContent: 'none'
            },
            statistics: { viewCount: '1000' },
            contentDetails: { duration: 'PT30S' } // 30 seconds
          }]
        })
      });

      const request = createMockRequest({
        url: 'https://www.youtube.com/watch?v=short123'
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toContain('Video is too short');
    });

    it('should return 404 for videos not found', async () => {
      // Mock YouTube API response with no items
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ items: [] })
      });

      const request = createMockRequest({
        url: 'https://www.youtube.com/watch?v=notfound'
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toContain('Video not found');
    });

    it('should return success for valid video', async () => {
      // Mock successful YouTube API response
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          items: [{
            snippet: {
              title: 'Test Video',
              description: 'Test Description',
              channelTitle: 'Test Channel',
              publishedAt: '2023-01-01T00:00:00Z',
              thumbnails: { high: { url: 'https://example.com/thumb.jpg' } },
              liveBroadcastContent: 'none'
            },
            statistics: { viewCount: '1000' },
            contentDetails: { duration: 'PT4M13S' } // 4 minutes 13 seconds
          }]
        })
      });

      const request = createMockRequest({
        url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.metadata).toBeDefined();
      expect(data.metadata.title).toBe('Test Video');
    });
  });

  describe('GET', () => {
    it('should return API documentation', async () => {
      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.message).toBe('YouTube Metadata API');
      expect(data.usage).toBeDefined();
      expect(data.example).toBeDefined();
    });
  });
});