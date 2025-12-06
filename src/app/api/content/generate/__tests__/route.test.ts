import { POST, GET } from '../route';
import { NextRequest } from 'next/server';
import { 
  ContentAnalysis, 
  VideoMetadata, 
  Transcript, 
  GenerationOptions 
} from '@/types';

// Mock the ArticleGenerator
jest.mock('@/lib/article-generator', () => ({
  ArticleGenerator: {
    generateArticle: jest.fn(),
    getAvailableTemplates: jest.fn()
  }
}));

import { ArticleGenerator } from '@/lib/article-generator';

describe('/api/content/generate', () => {
  // Mock data
  const mockVideoMetadata: VideoMetadata = {
    id: 'test123',
    title: 'Test Video',
    description: 'A test video',
    duration: 600,
    thumbnailUrl: 'https://example.com/thumb.jpg',
    channelName: 'Test Channel',
    publishDate: new Date('2024-01-01'),
    viewCount: 1000
  };

  const mockTranscript: Transcript = {
    segments: [
      {
        text: 'This is a test transcript segment.',
        startTime: 0,
        endTime: 5,
        confidence: 0.95
      }
    ],
    language: 'en',
    confidence: 0.95,
    duration: 600
  };

  const mockAnalysis: ContentAnalysis = {
    topics: [
      {
        name: 'Test Topic',
        relevance: 0.8,
        timeRanges: [{ start: 0, end: 300 }]
      }
    ],
    keyPoints: [
      {
        text: 'This is a key point',
        importance: 0.9,
        timestamp: 60,
        category: 'Technical'
      }
    ],
    summary: 'This is a test summary',
    suggestedStructure: [
      {
        heading: 'Introduction',
        content: 'Test introduction'
      }
    ],
    sentiment: 'positive'
  };

  const mockArticle = {
    title: 'Generated Article Title',
    introduction: 'This is the introduction',
    sections: [
      {
        heading: 'Main Content',
        content: 'This is the main content'
      }
    ],
    conclusion: 'This is the conclusion',
    metadata: {
      wordCount: 50,
      readingTime: 1,
      seoTitle: 'Generated Article Title',
      metaDescription: 'This is the introduction',
      sourceVideo: mockVideoMetadata
    },
    tags: ['test', 'article']
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/content/generate', () => {
    it('should generate article successfully with valid input', async () => {
      (ArticleGenerator.generateArticle as jest.Mock).mockReturnValue(mockArticle);

      const requestBody = {
        analysis: mockAnalysis,
        videoMetadata: mockVideoMetadata,
        transcript: mockTranscript,
        options: {
          length: 'medium' as const,
          tone: 'professional' as const,
          format: 'markdown' as const
        }
      };

      const request = new NextRequest('http://localhost:3000/api/content/generate', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.article).toMatchObject({
        ...mockArticle,
        metadata: {
          ...mockArticle.metadata,
          sourceVideo: {
            ...mockArticle.metadata.sourceVideo,
            publishDate: expect.any(String)
          }
        }
      });
      expect(data.processingTime).toBeGreaterThan(0);
      expect(ArticleGenerator.generateArticle).toHaveBeenCalledWith(
        mockAnalysis,
        expect.objectContaining({
          ...mockVideoMetadata,
          publishDate: expect.any(String)
        }),
        mockTranscript,
        expect.objectContaining({
          length: 'medium',
          tone: 'professional',
          format: 'markdown'
        })
      );
    });

    it('should use default options when none provided', async () => {
      (ArticleGenerator.generateArticle as jest.Mock).mockReturnValue(mockArticle);

      const requestBody = {
        analysis: mockAnalysis,
        videoMetadata: mockVideoMetadata,
        transcript: mockTranscript
      };

      const request = new NextRequest('http://localhost:3000/api/content/generate', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(ArticleGenerator.generateArticle).toHaveBeenCalledWith(
        mockAnalysis,
        expect.objectContaining({
          ...mockVideoMetadata,
          publishDate: expect.any(String)
        }),
        mockTranscript,
        expect.objectContaining({
          length: 'medium',
          tone: 'professional',
          format: 'markdown',
          includeTimestamps: false
        })
      );
    });

    it('should return 400 when analysis is missing', async () => {
      const requestBody = {
        videoMetadata: mockVideoMetadata,
        transcript: mockTranscript
      };

      const request = new NextRequest('http://localhost:3000/api/content/generate', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Content analysis is required');
    });

    it('should return 400 when videoMetadata is missing', async () => {
      const requestBody = {
        analysis: mockAnalysis,
        transcript: mockTranscript
      };

      const request = new NextRequest('http://localhost:3000/api/content/generate', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Video metadata is required');
    });

    it('should return 400 when transcript is missing', async () => {
      const requestBody = {
        analysis: mockAnalysis,
        videoMetadata: mockVideoMetadata
      };

      const request = new NextRequest('http://localhost:3000/api/content/generate', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Transcript is required');
    });

    it('should return 400 when analysis has invalid structure', async () => {
      const invalidAnalysis = {
        ...mockAnalysis,
        topics: 'invalid' // Should be array
      };

      const requestBody = {
        analysis: invalidAnalysis,
        videoMetadata: mockVideoMetadata,
        transcript: mockTranscript
      };

      const request = new NextRequest('http://localhost:3000/api/content/generate', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Invalid analysis: topics array is required');
    });

    it('should return 400 when keyPoints is invalid', async () => {
      const invalidAnalysis = {
        ...mockAnalysis,
        keyPoints: 'invalid' // Should be array
      };

      const requestBody = {
        analysis: invalidAnalysis,
        videoMetadata: mockVideoMetadata,
        transcript: mockTranscript
      };

      const request = new NextRequest('http://localhost:3000/api/content/generate', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Invalid analysis: keyPoints array is required');
    });

    it('should return 500 when article generation fails', async () => {
      (ArticleGenerator.generateArticle as jest.Mock).mockImplementation(() => {
        throw new Error('Generation failed');
      });

      const requestBody = {
        analysis: mockAnalysis,
        videoMetadata: mockVideoMetadata,
        transcript: mockTranscript
      };

      const request = new NextRequest('http://localhost:3000/api/content/generate', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Generation failed');
      expect(data.processingTime).toBeGreaterThan(0);
    });

    it('should return 500 with generic error for unknown errors', async () => {
      (ArticleGenerator.generateArticle as jest.Mock).mockImplementation(() => {
        throw 'Unknown error';
      });

      const requestBody = {
        analysis: mockAnalysis,
        videoMetadata: mockVideoMetadata,
        transcript: mockTranscript
      };

      const request = new NextRequest('http://localhost:3000/api/content/generate', {
        method: 'POST',
        body: JSON.stringify(requestBody),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Failed to generate article');
    });

    it('should handle malformed JSON', async () => {
      const request = new NextRequest('http://localhost:3000/api/content/generate', {
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
      expect(data.error).toBeTruthy();
    });
  });

  describe('GET /api/content/generate/templates', () => {
    const mockTemplates = [
      {
        name: 'Tutorial Guide',
        type: 'tutorial',
        defaultTone: 'professional',
        estimatedLength: 'long',
        structure: [
          {
            heading: 'Introduction',
            contentType: 'introduction',
            includeTimestamps: false
          }
        ]
      },
      {
        name: 'Interview Summary',
        type: 'interview',
        defaultTone: 'professional',
        estimatedLength: 'medium',
        structure: [
          {
            heading: 'Key Points',
            contentType: 'key_points',
            includeTimestamps: true
          }
        ]
      }
    ];

    it('should return available templates successfully', async () => {
      (ArticleGenerator.getAvailableTemplates as jest.Mock).mockReturnValue(mockTemplates);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.templates).toHaveLength(2);
      expect(data.templates[0]).toEqual({
        name: 'Tutorial Guide',
        type: 'tutorial',
        defaultTone: 'professional',
        estimatedLength: 'long',
        sections: [
          {
            heading: 'Introduction',
            contentType: 'introduction',
            includeTimestamps: false
          }
        ]
      });
    });

    it('should return 500 when template retrieval fails', async () => {
      (ArticleGenerator.getAvailableTemplates as jest.Mock).mockImplementation(() => {
        throw new Error('Template retrieval failed');
      });

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.success).toBe(false);
      expect(data.error).toBe('Failed to retrieve templates');
    });

    it('should handle empty template list', async () => {
      (ArticleGenerator.getAvailableTemplates as jest.Mock).mockReturnValue([]);

      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.templates).toEqual([]);
    });
  });
});