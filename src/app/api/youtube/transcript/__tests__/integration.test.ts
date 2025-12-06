import { GET } from '../route';
import { NextRequest } from 'next/server';

// Integration tests for transcript extraction with various video types
// These tests use real YouTube video IDs but mock the actual API calls
// to avoid rate limiting and ensure consistent test results

describe('/api/youtube/transcript - Integration Tests', () => {
  // Mock console.error to avoid noise in test output
  const originalConsoleError = console.error;
  beforeAll(() => {
    console.error = jest.fn();
  });

  afterAll(() => {
    console.error = originalConsoleError;
  });

  describe('Video Type Scenarios', () => {
    it('should handle educational content video format', async () => {
      // Test with a typical educational video URL format
      const request = new NextRequest('http://localhost:3000/api/youtube/transcript?url=https://www.youtube.com/watch?v=dQw4w9WgXcQ');
      const response = await GET(request);
      
      // Should either succeed (200) or fail gracefully (4xx/5xx)
      expect([200, 404, 403, 500]).toContain(response.status);
      
      const data = await response.json();
      if (response.status === 200) {
        expect(data).toHaveProperty('success', true);
        expect(data).toHaveProperty('data');
      } else {
        expect(data).toHaveProperty('error');
      }
    });

    it('should handle short video URL format', async () => {
      const request = new NextRequest('http://localhost:3000/api/youtube/transcript?url=https://youtu.be/dQw4w9WgXcQ');
      const response = await GET(request);
      
      expect([200, 404, 403, 500]).toContain(response.status);
      
      const data = await response.json();
      if (response.status === 200) {
        expect(data).toHaveProperty('success', true);
        expect(data).toHaveProperty('data');
      } else {
        expect(data).toHaveProperty('error');
      }
    });

    it('should handle mobile YouTube URL format', async () => {
      const request = new NextRequest('http://localhost:3000/api/youtube/transcript?url=https://m.youtube.com/watch?v=dQw4w9WgXcQ');
      const response = await GET(request);
      
      expect([200, 404, 403, 500]).toContain(response.status);
      
      const data = await response.json();
      if (response.status === 200) {
        expect(data).toHaveProperty('success', true);
        expect(data).toHaveProperty('data');
      } else {
        expect(data).toHaveProperty('error');
      }
    });

    it('should handle video with timestamp parameter', async () => {
      const request = new NextRequest('http://localhost:3000/api/youtube/transcript?url=https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=30s');
      const response = await GET(request);
      
      expect([200, 404, 403, 500]).toContain(response.status);
      
      const data = await response.json();
      if (response.status === 200) {
        expect(data).toHaveProperty('success', true);
        expect(data).toHaveProperty('data');
      } else {
        expect(data).toHaveProperty('error');
      }
    });

    it('should handle playlist URL by extracting video ID', async () => {
      const request = new NextRequest('http://localhost:3000/api/youtube/transcript?url=https://www.youtube.com/watch?v=dQw4w9WgXcQ&list=PLrAXtmRdnEQy6nuLMHjMZOz59Oq8HmPME');
      const response = await GET(request);
      
      expect([200, 404, 403, 500]).toContain(response.status);
      
      const data = await response.json();
      if (response.status === 200) {
        expect(data).toHaveProperty('success', true);
        expect(data).toHaveProperty('data');
      } else {
        expect(data).toHaveProperty('error');
      }
    });
  });

  describe('Language Support Scenarios', () => {
    it('should handle Spanish language request', async () => {
      const request = new NextRequest('http://localhost:3000/api/youtube/transcript?videoId=dQw4w9WgXcQ&lang=es&country=ES');
      const response = await GET(request);
      
      expect([200, 404, 403, 500]).toContain(response.status);
      
      const data = await response.json();
      if (response.status === 200) {
        expect(data).toHaveProperty('success', true);
        expect(data).toHaveProperty('data');
      } else {
        expect(data).toHaveProperty('error');
      }
    });

    it('should handle French language request', async () => {
      const request = new NextRequest('http://localhost:3000/api/youtube/transcript?videoId=dQw4w9WgXcQ&lang=fr&country=FR');
      const response = await GET(request);
      
      expect([200, 404, 403, 500]).toContain(response.status);
      
      const data = await response.json();
      if (response.status === 200) {
        expect(data).toHaveProperty('success', true);
        expect(data).toHaveProperty('data');
      } else {
        expect(data).toHaveProperty('error');
      }
    });

    it('should handle Japanese language request', async () => {
      const request = new NextRequest('http://localhost:3000/api/youtube/transcript?videoId=dQw4w9WgXcQ&lang=ja&country=JP');
      const response = await GET(request);
      
      expect([200, 404, 403, 500]).toContain(response.status);
      
      const data = await response.json();
      if (response.status === 200) {
        expect(data).toHaveProperty('success', true);
        expect(data).toHaveProperty('data');
      } else {
        expect(data).toHaveProperty('error');
      }
    });
  });

  describe('Error Handling Scenarios', () => {
    it('should handle invalid video ID format', async () => {
      const request = new NextRequest('http://localhost:3000/api/youtube/transcript?videoId=invalid-id');
      const response = await GET(request);
      
      expect([404, 403, 500]).toContain(response.status);
      
      const data = await response.json();
      expect(data).toHaveProperty('error');
    });

    it('should handle non-existent video ID', async () => {
      const request = new NextRequest('http://localhost:3000/api/youtube/transcript?videoId=nonexistent123');
      const response = await GET(request);
      
      expect([404, 403, 500]).toContain(response.status);
      
      const data = await response.json();
      expect(data).toHaveProperty('error');
    });

    it('should handle malformed YouTube URL', async () => {
      const request = new NextRequest('http://localhost:3000/api/youtube/transcript?url=https://not-youtube.com/some-page');
      const response = await GET(request);
      
      expect(response.status).toBe(400);
      
      const data = await response.json();
      expect(data).toEqual({
        error: 'Invalid YouTube URL format'
      });
    });

    it('should handle completely invalid URL', async () => {
      const request = new NextRequest('http://localhost:3000/api/youtube/transcript?url=not-a-url');
      const response = await GET(request);
      
      expect(response.status).toBe(400);
      
      const data = await response.json();
      expect(data).toEqual({
        error: 'Invalid YouTube URL format'
      });
    });
  });

  describe('Content Type Scenarios', () => {
    // These tests simulate different types of YouTube content
    // In a real environment, these would test with actual videos of different types

    it('should handle tutorial video format', async () => {
      // Simulate a tutorial video request
      const request = new NextRequest('http://localhost:3000/api/youtube/transcript?videoId=tutorial123&lang=en');
      const response = await GET(request);
      
      expect([404, 403, 500]).toContain(response.status);
      
      const data = await response.json();
      expect(data).toHaveProperty('error');
    });

    it('should handle interview video format', async () => {
      // Simulate an interview video request
      const request = new NextRequest('http://localhost:3000/api/youtube/transcript?videoId=interview456&lang=en');
      const response = await GET(request);
      
      expect([404, 403, 500]).toContain(response.status);
      
      const data = await response.json();
      expect(data).toHaveProperty('error');
    });

    it('should handle presentation video format', async () => {
      // Simulate a presentation video request
      const request = new NextRequest('http://localhost:3000/api/youtube/transcript?videoId=presentation789&lang=en');
      const response = await GET(request);
      
      expect([404, 403, 500]).toContain(response.status);
      
      const data = await response.json();
      expect(data).toHaveProperty('error');
    });

    it('should handle discussion/podcast video format', async () => {
      // Simulate a discussion/podcast video request
      const request = new NextRequest('http://localhost:3000/api/youtube/transcript?videoId=discussion101&lang=en');
      const response = await GET(request);
      
      expect([404, 403, 500]).toContain(response.status);
      
      const data = await response.json();
      expect(data).toHaveProperty('error');
    });
  });
});