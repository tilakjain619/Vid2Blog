import { POST, GET } from '../route';
import { NextRequest } from 'next/server';
import { Transcript } from '@/types';

// Mock the ContentAnalyzer
jest.mock('@/lib/content-analyzer', () => ({
  ContentAnalyzer: {
    analyzeContent: jest.fn()
  }
}));

import { ContentAnalyzer } from '@/lib/content-analyzer';

describe('/api/content/analyze', () => {
  const mockAnalysis = {
    topics: [
      { name: 'Machine Learning', relevance: 0.8, timeRanges: [{ start: 0, end: 10 }] }
    ],
    keyPoints: [
      { text: 'Machine learning is important', importance: 0.9, timestamp: 5, category: 'Technical' }
    ],
    summary: 'This video discusses machine learning concepts.',
    suggestedStructure: [
      { heading: 'Introduction', content: 'Overview of machine learning' }
    ],
    sentiment: 'positive' as const
  };

  const mockTranscript: Transcript = {
    segments: [
      { text: 'Machine learning is a powerful technology', startTime: 0, endTime: 5, confidence: 0.9 },
      { text: 'It enables computers to learn from data', startTime: 5, endTime: 10, confidence: 0.9 }
    ],
    language: 'en',
    confidence: 0.9,
    duration: 10
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (ContentAnalyzer.analyzeContent as jest.Mock).mockReturnValue(mockAnalysis);
  });

  describe('POST', () => {
    it('should analyze transcript content successfully', async () => {
      const request = new NextRequest('http://localhost/api/content/analyze', {
        method: 'POST',
        body: JSON.stringify({ transcript: mockTranscript })
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.analysis).toEqual(mockAnalysis);
      expect(ContentAnalyzer.analyzeContent).toHaveBeenCalledWith(mockTranscript, undefined);
    });

    it('should analyze transcript with custom options', async () => {
      const options = {
        maxKeywords: 10,
        maxTopics: 5,
        summaryLength: 2
      };

      const request = new NextRequest('http://localhost/api/content/analyze', {
        method: 'POST',
        body: JSON.stringify({ transcript: mockTranscript, options })
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(ContentAnalyzer.analyzeContent).toHaveBeenCalledWith(mockTranscript, options);
    });

    it('should return 400 when transcript is missing', async () => {
      const request = new NextRequest('http://localhost/api/content/analyze', {
        method: 'POST',
        body: JSON.stringify({})
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Transcript is required');
    });

    it('should return 400 when transcript segments are invalid', async () => {
      const invalidTranscript = {
        ...mockTranscript,
        segments: 'invalid'
      };

      const request = new NextRequest('http://localhost/api/content/analyze', {
        method: 'POST',
        body: JSON.stringify({ transcript: invalidTranscript })
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Transcript must contain segments array');
    });

    it('should handle analysis errors gracefully', async () => {
      (ContentAnalyzer.analyzeContent as jest.Mock).mockImplementation(() => {
        throw new Error('Analysis failed');
      });

      const request = new NextRequest('http://localhost/api/content/analyze', {
        method: 'POST',
        body: JSON.stringify({ transcript: mockTranscript })
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to analyze content');
      expect(data.details).toBe('Analysis failed');
    });

    it('should handle invalid JSON gracefully', async () => {
      const request = new NextRequest('http://localhost/api/content/analyze', {
        method: 'POST',
        body: 'invalid json'
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to analyze content');
    });

    it('should handle empty transcript segments', async () => {
      const emptyTranscript: Transcript = {
        segments: [],
        language: 'en',
        confidence: 0,
        duration: 0
      };

      const request = new NextRequest('http://localhost/api/content/analyze', {
        method: 'POST',
        body: JSON.stringify({ transcript: emptyTranscript })
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(ContentAnalyzer.analyzeContent).toHaveBeenCalledWith(emptyTranscript, undefined);
    });
  });

  describe('GET', () => {
    it('should return API documentation', async () => {
      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.message).toBe('Content Analysis API');
      expect(data.endpoints).toBeDefined();
      expect(data.requiredFields).toBeDefined();
    });
  });
});