import { ArticleGenerator } from '../article-generator';
import { 
  ContentAnalysis, 
  VideoMetadata, 
  Transcript, 
  GenerationOptions,
  Article 
} from '@/types';

describe('ArticleGenerator', () => {
  // Mock data for testing
  const mockVideoMetadata: VideoMetadata = {
    id: 'test123',
    title: 'How to Build a React App',
    description: 'A comprehensive tutorial on building React applications',
    duration: 1800, // 30 minutes
    thumbnailUrl: 'https://example.com/thumb.jpg',
    channelName: 'Tech Tutorials',
    publishDate: new Date('2024-01-01'),
    viewCount: 10000
  };

  const mockTranscript: Transcript = {
    segments: [
      {
        text: 'Welcome to this React tutorial. Today we will learn how to build a complete React application.',
        startTime: 0,
        endTime: 5,
        confidence: 0.95
      },
      {
        text: 'First, let us set up our development environment. We need Node.js and npm installed.',
        startTime: 5,
        endTime: 12,
        confidence: 0.92
      },
      {
        text: 'React components are the building blocks of any React application. They are reusable pieces of code.',
        startTime: 60,
        endTime: 68,
        confidence: 0.94
      },
      {
        text: 'State management is crucial in React. We can use useState hook for local state.',
        startTime: 120,
        endTime: 128,
        confidence: 0.93
      },
      {
        text: 'In conclusion, React is a powerful library for building user interfaces.',
        startTime: 1750,
        endTime: 1758,
        confidence: 0.96
      }
    ],
    language: 'en',
    confidence: 0.94,
    duration: 1800
  };

  const mockAnalysis: ContentAnalysis = {
    topics: [
      {
        name: 'React Development',
        relevance: 0.8,
        timeRanges: [{ start: 0, end: 300 }]
      },
      {
        name: 'Components',
        relevance: 0.6,
        timeRanges: [{ start: 60, end: 180 }]
      },
      {
        name: 'State Management',
        relevance: 0.5,
        timeRanges: [{ start: 120, end: 240 }]
      }
    ],
    keyPoints: [
      {
        text: 'React components are reusable pieces of code',
        importance: 0.9,
        timestamp: 64,
        category: 'Technical'
      },
      {
        text: 'State management is crucial in React applications',
        importance: 0.8,
        timestamp: 124,
        category: 'Technical'
      },
      {
        text: 'Development environment setup requires Node.js and npm',
        importance: 0.7,
        timestamp: 8,
        category: 'Setup'
      }
    ],
    summary: 'This tutorial covers React development fundamentals including components and state management.',
    suggestedStructure: [
      {
        heading: 'Introduction',
        content: 'Overview of React development'
      },
      {
        heading: 'Components',
        content: 'Understanding React components'
      }
    ],
    sentiment: 'positive'
  };

  describe('generateArticle', () => {
    it('should generate a complete article with all required sections', () => {
      const article = ArticleGenerator.generateArticle(
        mockAnalysis,
        mockVideoMetadata,
        mockTranscript
      );

      expect(article).toBeDefined();
      expect(article.title).toBeTruthy();
      expect(article.introduction).toBeTruthy();
      expect(article.sections).toBeInstanceOf(Array);
      expect(article.sections.length).toBeGreaterThan(0);
      expect(article.conclusion).toBeTruthy();
      expect(article.metadata).toBeDefined();
      expect(article.tags).toBeInstanceOf(Array);
    });

    it('should generate appropriate title from video metadata', () => {
      const article = ArticleGenerator.generateArticle(
        mockAnalysis,
        mockVideoMetadata,
        mockTranscript
      );

      expect(article.title).toContain('React');
      expect(article.title.length).toBeGreaterThan(10);
      expect(article.title.length).toBeLessThan(100);
    });

    it('should include video metadata in article metadata', () => {
      const article = ArticleGenerator.generateArticle(
        mockAnalysis,
        mockVideoMetadata,
        mockTranscript
      );

      expect(article.metadata.sourceVideo).toEqual(mockVideoMetadata);
      expect(article.metadata.wordCount).toBeGreaterThan(0);
      expect(article.metadata.readingTime).toBeGreaterThan(0);
      expect(article.metadata.seoTitle).toBeTruthy();
      expect(article.metadata.metaDescription).toBeTruthy();
    });

    it('should generate tags from topics and categories', () => {
      const article = ArticleGenerator.generateArticle(
        mockAnalysis,
        mockVideoMetadata,
        mockTranscript
      );

      expect(article.tags).toContain('react development');
      expect(article.tags).toContain('technical');
      expect(article.tags).toContain('video-summary');
      expect(article.tags.length).toBeLessThanOrEqual(10);
    });

    it('should respect generation options', () => {
      const options: GenerationOptions = {
        length: 'short',
        tone: 'casual',
        format: 'markdown',
        includeTimestamps: true
      };

      const article = ArticleGenerator.generateArticle(
        mockAnalysis,
        mockVideoMetadata,
        mockTranscript,
        options
      );

      expect(article).toBeDefined();
      // Casual tone should modify the language
      expect(article.introduction.toLowerCase()).not.toContain('furthermore');
    });

    it('should handle empty analysis gracefully', () => {
      const emptyAnalysis: ContentAnalysis = {
        topics: [],
        keyPoints: [],
        summary: 'No content found',
        suggestedStructure: [],
        sentiment: 'neutral'
      };

      const article = ArticleGenerator.generateArticle(
        emptyAnalysis,
        mockVideoMetadata,
        mockTranscript
      );

      expect(article).toBeDefined();
      expect(article.title).toBeTruthy();
      expect(article.introduction).toBeTruthy();
      expect(article.conclusion).toBeTruthy();
    });
  });

  describe('template selection', () => {
    it('should select tutorial template for tutorial content', () => {
      const tutorialAnalysis: ContentAnalysis = {
        ...mockAnalysis,
        topics: [
          {
            name: 'Step by Step Guide',
            relevance: 0.9,
            timeRanges: [{ start: 0, end: 300 }]
          }
        ],
        keyPoints: [
          {
            text: 'Follow these steps to complete the tutorial',
            importance: 0.9,
            timestamp: 60,
            category: 'Process'
          }
        ]
      };

      const article = ArticleGenerator.generateArticle(
        tutorialAnalysis,
        mockVideoMetadata,
        mockTranscript
      );

      // Check if tutorial-style sections are present (the template should be selected)
      // Tutorial template has sections like "Step-by-Step Guide" and "Key Takeaways"
      expect(article.sections.some(s => 
        s.heading.toLowerCase().includes('step') || 
        s.heading.toLowerCase().includes('guide') ||
        s.heading.toLowerCase().includes('takeaway') ||
        s.heading.toLowerCase().includes('overview')
      )).toBeTruthy();
    });

    it('should select interview template for interview content', () => {
      const interviewAnalysis: ContentAnalysis = {
        ...mockAnalysis,
        topics: [
          {
            name: 'Interview Discussion',
            relevance: 0.9,
            timeRanges: [{ start: 0, end: 300 }]
          }
        ],
        keyPoints: [
          {
            text: 'The interviewee discussed their experience',
            importance: 0.9,
            timestamp: 60,
            category: 'Discussion'
          }
        ]
      };

      const article = ArticleGenerator.generateArticle(
        interviewAnalysis,
        mockVideoMetadata,
        mockTranscript
      );

      expect(article.sections.some(s => 
        s.heading.toLowerCase().includes('discussion') || 
        s.heading.toLowerCase().includes('insight')
      )).toBeTruthy();
    });
  });

  describe('content formatting', () => {
    it('should format timestamps correctly', () => {
      const options: GenerationOptions = {
        includeTimestamps: true,
        length: 'medium',
        tone: 'professional',
        format: 'markdown'
      };

      const article = ArticleGenerator.generateArticle(
        mockAnalysis,
        mockVideoMetadata,
        mockTranscript,
        options
      );

      // Check if any section contains formatted timestamps
      const hasTimestamps = article.sections.some(section =>
        section.content.includes('*') && section.content.match(/\d+:\d{2}/)
      );

      expect(hasTimestamps).toBeTruthy();
    });

    it('should apply casual tone modifications', () => {
      const options: GenerationOptions = {
        tone: 'casual',
        length: 'medium',
        format: 'markdown'
      };

      const article = ArticleGenerator.generateArticle(
        mockAnalysis,
        mockVideoMetadata,
        mockTranscript,
        options
      );

      // Casual tone should use more informal language
      expect(article.introduction.toLowerCase()).toContain('post');
    });

    it('should apply technical tone modifications', () => {
      const options: GenerationOptions = {
        tone: 'technical',
        length: 'medium',
        format: 'markdown'
      };

      const article = ArticleGenerator.generateArticle(
        mockAnalysis,
        mockVideoMetadata,
        mockTranscript,
        options
      );

      // Technical tone should use more precise language
      expect(article.introduction.toLowerCase()).toContain('demonstrate');
    });
  });

  describe('getAvailableTemplates', () => {
    it('should return all predefined templates', () => {
      const templates = ArticleGenerator.getAvailableTemplates();

      expect(templates).toBeInstanceOf(Array);
      expect(templates.length).toBeGreaterThan(0);
      
      // Check for expected template types
      const templateTypes = templates.map(t => t.type);
      expect(templateTypes).toContain('tutorial');
      expect(templateTypes).toContain('interview');
      expect(templateTypes).toContain('presentation');
      expect(templateTypes).toContain('general');
    });

    it('should return templates with required properties', () => {
      const templates = ArticleGenerator.getAvailableTemplates();

      templates.forEach(template => {
        expect(template.name).toBeTruthy();
        expect(template.type).toBeTruthy();
        expect(template.structure).toBeInstanceOf(Array);
        expect(template.structure.length).toBeGreaterThan(0);
        expect(template.defaultTone).toBeTruthy();
        expect(template.estimatedLength).toBeTruthy();
      });
    });
  });

  describe('getTemplate', () => {
    it('should return template by name', () => {
      const template = ArticleGenerator.getTemplate('Tutorial Guide');

      expect(template).toBeDefined();
      expect(template?.name).toBe('Tutorial Guide');
      expect(template?.type).toBe('tutorial');
    });

    it('should return null for non-existent template', () => {
      const template = ArticleGenerator.getTemplate('Non-existent Template');

      expect(template).toBeNull();
    });

    it('should be case insensitive', () => {
      const template = ArticleGenerator.getTemplate('tutorial guide');

      expect(template).toBeDefined();
      expect(template?.name).toBe('Tutorial Guide');
    });
  });

  describe('edge cases', () => {
    it('should handle very short transcripts', () => {
      const shortTranscript: Transcript = {
        segments: [
          {
            text: 'Hello world.',
            startTime: 0,
            endTime: 2,
            confidence: 0.9
          }
        ],
        language: 'en',
        confidence: 0.9,
        duration: 2
      };

      const shortAnalysis: ContentAnalysis = {
        topics: [],
        keyPoints: [],
        summary: 'Very short content',
        suggestedStructure: [],
        sentiment: 'neutral'
      };

      const article = ArticleGenerator.generateArticle(
        shortAnalysis,
        mockVideoMetadata,
        shortTranscript
      );

      expect(article).toBeDefined();
      expect(article.title).toBeTruthy();
    });

    it('should handle very long video titles', () => {
      const longTitleMetadata: VideoMetadata = {
        ...mockVideoMetadata,
        title: 'This is a very long video title that exceeds the normal length limits and should be handled gracefully by the article generator'
      };

      const article = ArticleGenerator.generateArticle(
        mockAnalysis,
        longTitleMetadata,
        mockTranscript
      );

      expect(article.metadata.seoTitle.length).toBeLessThanOrEqual(60);
    });

    it('should handle missing video metadata fields', () => {
      const incompleteMetadata: VideoMetadata = {
        ...mockVideoMetadata,
        channelName: '',
        description: ''
      };

      const article = ArticleGenerator.generateArticle(
        mockAnalysis,
        incompleteMetadata,
        mockTranscript
      );

      expect(article).toBeDefined();
      expect(article.introduction).toBeTruthy();
    });
  });
});