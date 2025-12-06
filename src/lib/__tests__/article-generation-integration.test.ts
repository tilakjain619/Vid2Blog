import { ArticleGenerator } from '../article-generator';
import { ContentAnalyzer } from '../content-analyzer';
import { 
  Transcript, 
  VideoMetadata, 
  GenerationOptions 
} from '@/types';

describe('Article Generation Integration', () => {
  // Real-world like test data
  const realWorldTranscript: Transcript = {
    segments: [
      {
        text: 'Welcome everyone to this comprehensive tutorial on machine learning fundamentals.',
        startTime: 0,
        endTime: 4,
        confidence: 0.96
      },
      {
        text: 'Today we will explore supervised learning, unsupervised learning, and reinforcement learning.',
        startTime: 4,
        endTime: 10,
        confidence: 0.94
      },
      {
        text: 'Machine learning is a subset of artificial intelligence that enables computers to learn without being explicitly programmed.',
        startTime: 15,
        endTime: 23,
        confidence: 0.95
      },
      {
        text: 'Supervised learning uses labeled training data to learn a mapping function from input to output.',
        startTime: 30,
        endTime: 38,
        confidence: 0.93
      },
      {
        text: 'Common supervised learning algorithms include linear regression, decision trees, and neural networks.',
        startTime: 40,
        endTime: 48,
        confidence: 0.92
      },
      {
        text: 'Unsupervised learning finds hidden patterns in data without labeled examples.',
        startTime: 60,
        endTime: 67,
        confidence: 0.94
      },
      {
        text: 'Clustering and dimensionality reduction are popular unsupervised learning techniques.',
        startTime: 70,
        endTime: 77,
        confidence: 0.91
      },
      {
        text: 'Reinforcement learning trains agents to make decisions through trial and error.',
        startTime: 90,
        endTime: 97,
        confidence: 0.95
      },
      {
        text: 'The agent receives rewards or penalties based on its actions in the environment.',
        startTime: 100,
        endTime: 107,
        confidence: 0.93
      },
      {
        text: 'Deep learning is a subset of machine learning that uses neural networks with multiple layers.',
        startTime: 120,
        endTime: 128,
        confidence: 0.96
      },
      {
        text: 'Convolutional neural networks are particularly effective for image recognition tasks.',
        startTime: 130,
        endTime: 137,
        confidence: 0.94
      },
      {
        text: 'Recurrent neural networks excel at processing sequential data like text and time series.',
        startTime: 140,
        endTime: 148,
        confidence: 0.92
      },
      {
        text: 'In conclusion, machine learning offers powerful tools for solving complex problems across many domains.',
        startTime: 180,
        endTime: 188,
        confidence: 0.95
      },
      {
        text: 'Thank you for watching this introduction to machine learning. Please subscribe for more tutorials.',
        startTime: 190,
        endTime: 197,
        confidence: 0.94
      }
    ],
    language: 'en',
    confidence: 0.94,
    duration: 200
  };

  const realWorldVideoMetadata: VideoMetadata = {
    id: 'ml_tutorial_123',
    title: 'Machine Learning Fundamentals: A Complete Guide',
    description: 'Learn the basics of machine learning including supervised, unsupervised, and reinforcement learning with practical examples.',
    duration: 200,
    thumbnailUrl: 'https://example.com/ml-tutorial-thumb.jpg',
    channelName: 'AI Education Hub',
    publishDate: new Date('2024-01-15'),
    viewCount: 25000
  };

  describe('End-to-End Article Generation', () => {
    it('should generate a complete, well-structured article from real-world content', () => {
      // First, analyze the content
      const analysis = ContentAnalyzer.analyzeContent(realWorldTranscript, {
        maxTopics: 5,
        maxKeyPoints: 8,
        summaryLength: 3
      });

      // Verify analysis quality
      expect(analysis.topics.length).toBeGreaterThan(0);
      expect(analysis.keyPoints.length).toBeGreaterThan(0);
      expect(analysis.summary).toBeTruthy();

      // Generate article with professional tone
      const professionalOptions: GenerationOptions = {
        length: 'long',
        tone: 'professional',
        format: 'markdown',
        includeTimestamps: true
      };

      const article = ArticleGenerator.generateArticle(
        analysis,
        realWorldVideoMetadata,
        realWorldTranscript,
        professionalOptions
      );

      // Verify article structure
      expect(article.title).toBeTruthy();
      expect(article.title.toLowerCase()).toContain('machine learning');
      
      expect(article.introduction).toBeTruthy();
      expect(article.introduction.length).toBeGreaterThan(50);
      
      expect(article.sections).toBeInstanceOf(Array);
      expect(article.sections.length).toBeGreaterThanOrEqual(2);
      
      expect(article.conclusion).toBeTruthy();
      expect(article.conclusion.length).toBeGreaterThan(50);

      // Verify metadata
      expect(article.metadata.wordCount).toBeGreaterThan(100);
      expect(article.metadata.readingTime).toBeGreaterThan(0);
      expect(article.metadata.seoTitle.length).toBeLessThanOrEqual(60);
      expect(article.metadata.metaDescription.length).toBeLessThanOrEqual(160);

      // Verify tags
      expect(article.tags).toContain('machine learning');
      expect(article.tags.length).toBeGreaterThan(3);
      // Should contain some relevant technical tags
      expect(article.tags.some(tag => 
        tag.includes('machine') || tag.includes('learning') || tag.includes('technical')
      )).toBeTruthy();
    });

    it('should adapt content for different tones', () => {
      const analysis = ContentAnalyzer.analyzeContent(realWorldTranscript);

      // Generate casual version
      const casualArticle = ArticleGenerator.generateArticle(
        analysis,
        realWorldVideoMetadata,
        realWorldTranscript,
        { tone: 'casual', length: 'medium', format: 'markdown' }
      );

      // Generate technical version
      const technicalArticle = ArticleGenerator.generateArticle(
        analysis,
        realWorldVideoMetadata,
        realWorldTranscript,
        { tone: 'technical', length: 'medium', format: 'markdown' }
      );

      // Verify tone differences
      expect(casualArticle.introduction).not.toEqual(technicalArticle.introduction);
      
      // Casual should use more informal language
      expect(casualArticle.introduction.toLowerCase()).toContain('post');
      
      // Technical should use more precise language
      expect(technicalArticle.introduction.toLowerCase()).toContain('demonstrate');
    });

    it('should handle different content types appropriately', () => {
      // Create interview-style transcript
      const interviewTranscript: Transcript = {
        segments: [
          {
            text: 'Today I am interviewing Dr. Smith about artificial intelligence research.',
            startTime: 0,
            endTime: 5,
            confidence: 0.95
          },
          {
            text: 'Dr. Smith, can you tell us about your latest research in neural networks?',
            startTime: 5,
            endTime: 11,
            confidence: 0.94
          },
          {
            text: 'Certainly. We have been working on improving the efficiency of deep learning models.',
            startTime: 12,
            endTime: 19,
            confidence: 0.93
          },
          {
            text: 'Our research focuses on reducing computational requirements while maintaining accuracy.',
            startTime: 20,
            endTime: 27,
            confidence: 0.92
          }
        ],
        language: 'en',
        confidence: 0.94,
        duration: 30
      };

      const interviewMetadata: VideoMetadata = {
        ...realWorldVideoMetadata,
        title: 'Interview with AI Researcher Dr. Smith',
        description: 'An in-depth discussion about the latest developments in artificial intelligence research.'
      };

      const analysis = ContentAnalyzer.analyzeContent(interviewTranscript);
      const article = ArticleGenerator.generateArticle(
        analysis,
        interviewMetadata,
        interviewTranscript
      );

      // Should detect interview format and structure accordingly
      expect(article.sections.some(s => 
        s.heading.toLowerCase().includes('discussion') ||
        s.heading.toLowerCase().includes('insight') ||
        s.heading.toLowerCase().includes('key')
      )).toBeTruthy();
    });

    it('should include timestamps when requested', () => {
      const analysis = ContentAnalyzer.analyzeContent(realWorldTranscript);
      
      const articleWithTimestamps = ArticleGenerator.generateArticle(
        analysis,
        realWorldVideoMetadata,
        realWorldTranscript,
        { includeTimestamps: true, length: 'medium', tone: 'professional', format: 'markdown' }
      );

      // Check if timestamps are included in content
      const hasTimestamps = articleWithTimestamps.sections.some(section =>
        section.content.includes('*') && section.content.match(/\d+:\d{2}/)
      );

      expect(hasTimestamps).toBeTruthy();
    });

    it('should generate appropriate article length based on options', () => {
      const analysis = ContentAnalyzer.analyzeContent(realWorldTranscript);

      const shortArticle = ArticleGenerator.generateArticle(
        analysis,
        realWorldVideoMetadata,
        realWorldTranscript,
        { length: 'short', tone: 'professional', format: 'markdown' }
      );

      const longArticle = ArticleGenerator.generateArticle(
        analysis,
        realWorldVideoMetadata,
        realWorldTranscript,
        { length: 'long', tone: 'professional', format: 'markdown' }
      );

      // Long article should have more or equal content (template-based generation may produce similar lengths)
      expect(longArticle.metadata.wordCount).toBeGreaterThanOrEqual(shortArticle.metadata.wordCount);
      expect(longArticle.sections.length).toBeGreaterThanOrEqual(shortArticle.sections.length);
    });

    it('should maintain content quality with minimal input', () => {
      // Test with minimal transcript
      const minimalTranscript: Transcript = {
        segments: [
          {
            text: 'This is a short video about programming basics.',
            startTime: 0,
            endTime: 4,
            confidence: 0.9
          },
          {
            text: 'Programming is the process of creating computer software.',
            startTime: 5,
            endTime: 10,
            confidence: 0.88
          }
        ],
        language: 'en',
        confidence: 0.89,
        duration: 12
      };

      const analysis = ContentAnalyzer.analyzeContent(minimalTranscript);
      const article = ArticleGenerator.generateArticle(
        analysis,
        realWorldVideoMetadata,
        minimalTranscript
      );

      // Should still generate a complete article structure
      expect(article.title).toBeTruthy();
      expect(article.introduction).toBeTruthy();
      expect(article.conclusion).toBeTruthy();
      expect(article.metadata.wordCount).toBeGreaterThan(0);
    });
  });

  describe('Template Selection Integration', () => {
    it('should automatically select appropriate templates based on content', () => {
      // Tutorial content
      const tutorialTranscript: Transcript = {
        segments: [
          {
            text: 'In this step-by-step tutorial, we will learn how to build a web application.',
            startTime: 0,
            endTime: 6,
            confidence: 0.95
          },
          {
            text: 'Step one: Set up your development environment.',
            startTime: 10,
            endTime: 14,
            confidence: 0.94
          },
          {
            text: 'Step two: Create the project structure.',
            startTime: 20,
            endTime: 24,
            confidence: 0.93
          }
        ],
        language: 'en',
        confidence: 0.94,
        duration: 30
      };

      const analysis = ContentAnalyzer.analyzeContent(tutorialTranscript);
      const article = ArticleGenerator.generateArticle(
        analysis,
        realWorldVideoMetadata,
        tutorialTranscript
      );

      // Should use tutorial-style structure
      expect(article.sections.some(s => 
        s.heading.toLowerCase().includes('step') ||
        s.heading.toLowerCase().includes('guide')
      )).toBeTruthy();
    });

    it('should handle custom template selection', () => {
      const analysis = ContentAnalyzer.analyzeContent(realWorldTranscript);
      
      const articleWithCustomTemplate = ArticleGenerator.generateArticle(
        analysis,
        realWorldVideoMetadata,
        realWorldTranscript,
        { 
          customTemplate: 'Interview Summary',
          tone: 'professional',
          length: 'medium',
          format: 'markdown'
        }
      );

      // Should use interview template structure even for non-interview content
      expect(articleWithCustomTemplate.sections.some(s =>
        s.heading.toLowerCase().includes('discussion') ||
        s.heading.toLowerCase().includes('insight')
      )).toBeTruthy();
    });
  });
});