import { YouTubeApiService } from '../youtube-api';

// Mock fetch globally
global.fetch = jest.fn();

describe('YouTubeApiService', () => {
  let service: YouTubeApiService;
  const mockApiKey = 'test-api-key';

  beforeEach(() => {
    service = new YouTubeApiService(mockApiKey);
    jest.clearAllMocks();
  });

  describe('getVideoMetadata', () => {
    const mockVideoResponse = {
      items: [{
        snippet: {
          title: 'Test Video',
          description: 'Test Description',
          channelTitle: 'Test Channel',
          publishedAt: '2023-01-01T00:00:00Z',
          thumbnails: {
            high: {
              url: 'https://example.com/thumbnail.jpg'
            }
          },
          liveBroadcastContent: 'none'
        },
        statistics: {
          viewCount: '1000'
        },
        contentDetails: {
          duration: 'PT4M13S'
        }
      }]
    };

    it('should fetch and parse video metadata successfully', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => mockVideoResponse
      });

      const result = await service.getVideoMetadata('dQw4w9WgXcQ');

      expect(result).toEqual({
        id: 'dQw4w9WgXcQ',
        title: 'Test Video',
        description: 'Test Description',
        duration: 253, // 4*60 + 13
        thumbnailUrl: 'https://example.com/thumbnail.jpg',
        channelName: 'Test Channel',
        publishDate: new Date('2023-01-01T00:00:00Z'),
        viewCount: 1000
      });

      expect(fetch).toHaveBeenCalledWith(
        `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics,contentDetails&id=dQw4w9WgXcQ&key=${mockApiKey}`
      );
    });

    it('should handle video not found', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ items: [] })
      });

      await expect(service.getVideoMetadata('invalid')).rejects.toThrow(
        'Video not found. It may be private, deleted, or restricted.'
      );
    });

    it('should handle API errors', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        json: async () => ({
          error: {
            code: 403,
            message: 'Forbidden'
          }
        })
      });

      await expect(service.getVideoMetadata('dQw4w9WgXcQ')).rejects.toThrow();
    });

    it('should reject live streams', async () => {
      const liveVideoResponse = {
        ...mockVideoResponse,
        items: [{
          ...mockVideoResponse.items[0],
          snippet: {
            ...mockVideoResponse.items[0].snippet,
            liveBroadcastContent: 'live'
          }
        }]
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => liveVideoResponse
      });

      await expect(service.getVideoMetadata('live123')).rejects.toThrow(
        'Live streams are not supported. Please wait until the stream ends.'
      );
    });

    it('should handle missing optional fields', async () => {
      const minimalResponse = {
        items: [{
          snippet: {
            title: 'Minimal Video',
            channelTitle: 'Minimal Channel',
            publishedAt: '2023-01-01T00:00:00Z',
            thumbnails: {
              default: {
                url: 'https://example.com/default.jpg'
              }
            },
            liveBroadcastContent: 'none'
          },
          statistics: {},
          contentDetails: {
            duration: 'PT1M'
          }
        }]
      };

      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => minimalResponse
      });

      const result = await service.getVideoMetadata('minimal');

      expect(result.description).toBe('');
      expect(result.viewCount).toBe(0);
      expect(result.thumbnailUrl).toBe('https://example.com/default.jpg');
    });

    it('should handle network errors', async () => {
      (fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      await expect(service.getVideoMetadata('dQw4w9WgXcQ')).rejects.toThrow();
    });
  });

  describe('checkVideoAccessibility', () => {
    it('should return accessible true for valid videos', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          items: [{
            snippet: {
              title: 'Test Video',
              channelTitle: 'Test Channel',
              publishedAt: '2023-01-01T00:00:00Z',
              thumbnails: { default: { url: 'test.jpg' } },
              liveBroadcastContent: 'none'
            },
            statistics: { viewCount: '1000' },
            contentDetails: { duration: 'PT4M13S' }
          }]
        })
      });

      const result = await service.checkVideoAccessibility('dQw4w9WgXcQ');
      expect(result.accessible).toBe(true);
      expect(result.reason).toBeUndefined();
    });

    it('should return accessible false with reason for inaccessible videos', async () => {
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ items: [] })
      });

      const result = await service.checkVideoAccessibility('private123');
      expect(result.accessible).toBe(false);
      expect(result.reason).toBe('Video not found. It may be private, deleted, or restricted.');
    });

    it('should handle unknown errors gracefully', async () => {
      (fetch as jest.Mock).mockRejectedValueOnce('Unknown error');

      const result = await service.checkVideoAccessibility('error123');
      expect(result.accessible).toBe(false);
      expect(result.reason).toBeDefined();
    });
  });
});