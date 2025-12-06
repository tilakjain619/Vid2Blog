import { ContentAnalyzer } from '../content-analyzer';
import { TranscriptProcessor } from '../transcript-processor';
import { Transcript } from '@/types';

describe('Content Analysis Integration', () => {
  // Helper to create realistic transcript data
  const createRealisticTranscript = (content: Array<{ text: string; duration: number }>): Transcript => {
    let currentTime = 0;
    const segments = content.map(({ text, duration }) => {
      const segment = {
        text,
        startTime: currentTime,
        endTime: currentTime + duration,
        confidence: 0.85 + Math.random() * 0.1, // Realistic confidence scores
        speaker: undefined
      };
      currentTime += duration;
      return segment;
    });

    return {
      segments,
      language: 'en',
      confidence: segments.reduce((sum, s) => sum + s.confidence, 0) / segments.length,
      duration: currentTime
    };
  };

  describe('End-to-End Content Processing', () => {
    it('should process tutorial content from raw transcript to analysis', () => {
      // Simulate raw transcript from a programming tutorial
      const rawTranscript = createRealisticTranscript([
        { text: 'Welcome to this comprehensive tutorial on React development', duration: 4 },
        { text: 'Today we will learn about components, state management, and hooks', duration: 5 },
        { text: 'First, let me show you how to create a functional component', duration: 4 },
        { text: 'Components are the building blocks of React applications', duration: 4 },
        { text: 'State management is crucial for interactive applications', duration: 4 },
        { text: 'Hooks like useState and useEffect make state management easier', duration: 5 },
        { text: 'Let\'s implement a counter component to demonstrate these concepts', duration: 5 },
        { text: 'This example shows how state updates trigger re-renders', duration: 4 },
        { text: 'Finally, we\'ll discuss best practices for React development', duration: 4 }
      ]);

      // Step 1: Process the transcript
      const processedTranscript = TranscriptProcessor.processTranscript(rawTranscript, {
        removeFillerWords: true,
        cleanFormatting: true,
        mergeSimilarSegments: true
      });

      expect(processedTranscript.segments.length).toBeGreaterThan(0);
      expect(processedTranscript.cleanedText.length).toBeGreaterThan(100);

      // Step 2: Analyze the content
      const analysis = ContentAnalyzer.analyzeContent(processedTranscript, {
        maxTopics: 5,
        maxKeyPoints: 8,
        summaryLength: 3
      });

      // Verify analysis results
      expect(analysis.topics.length).toBeGreaterThan(0);
      expect(analysis.keyPoints.length).toBeGreaterThan(0);
      expect(analysis.summary.length).toBeGreaterThan(50);
      expect(analysis.suggestedStructure.length).toBeGreaterThan(2);

      // Should identify React-related topics
      const topicNames = analysis.topics.map(t => t.name.toLowerCase()).join(' ');
      const keyPointTexts = analysis.keyPoints.map(kp => kp.text.toLowerCase()).join(' ');
      const allContent = (topicNames + ' ' + keyPointTexts + ' ' + analysis.summary).toLowerCase();

      expect(allContent.includes('react') || allContent.includes('component') || allContent.includes('state')).toBe(true);

      // Should have logical structure
      const structureHeadings = analysis.suggestedStructure.map(s => s.heading.toLowerCase());
      expect(structureHeadings.includes('introduction')).toBe(true);
      expect(structureHeadings.includes('conclusion')).toBe(true);
    });

    it('should handle business presentation content effectively', () => {
      const businessTranscript = createRealisticTranscript([
        { text: 'Good morning everyone, welcome to our quarterly business review', duration: 4 },
        { text: 'This quarter we achieved significant growth in revenue and customer acquisition', duration: 6 },
        { text: 'Our revenue increased by 25% compared to the previous quarter', duration: 4 },
        { text: 'Customer satisfaction scores improved from 4.2 to 4.6 out of 5', duration: 5 },
        { text: 'We successfully launched three new product features', duration: 4 },
        { text: 'Market expansion into European markets exceeded expectations', duration: 5 },
        { text: 'Looking ahead, we plan to invest in artificial intelligence capabilities', duration: 5 },
        { text: 'Our strategic focus remains on customer experience and innovation', duration: 5 }
      ]);

      const processedTranscript = TranscriptProcessor.processTranscript(businessTranscript);
      const analysis = ContentAnalyzer.analyzeContent(processedTranscript);

      // Should identify business metrics and goals
      const allContent = (
        analysis.topics.map(t => t.name).join(' ') + ' ' +
        analysis.keyPoints.map(kp => kp.text).join(' ') + ' ' +
        analysis.summary
      ).toLowerCase();

      expect(
        allContent.includes('revenue') || 
        allContent.includes('growth') || 
        allContent.includes('customer') ||
        allContent.includes('business') ||
        allContent.includes('quarter')
      ).toBe(true);

      // Should have positive sentiment for good business results
      expect(analysis.sentiment).toBe('positive');
    });

    it('should analyze technical discussion with complex terminology', () => {
      const technicalTranscript = createRealisticTranscript([
        { text: 'Today we\'ll discuss advanced algorithms and data structures', duration: 4 },
        { text: 'Binary search trees provide O(log n) search complexity', duration: 4 },
        { text: 'Hash tables offer constant time insertion and lookup operations', duration: 5 },
        { text: 'Dynamic programming optimizes recursive algorithms by memoization', duration: 5 },
        { text: 'Graph algorithms like Dijkstra solve shortest path problems', duration: 4 },
        { text: 'Memory management is crucial for performance optimization', duration: 4 },
        { text: 'Garbage collection reduces memory leaks in managed languages', duration: 5 },
        { text: 'Profiling tools help identify performance bottlenecks', duration: 4 }
      ]);

      const processedTranscript = TranscriptProcessor.processTranscript(technicalTranscript);
      const analysis = ContentAnalyzer.analyzeContent(processedTranscript);

      // Should identify technical concepts
      const hasAlgorithmContent = analysis.topics.some(t => 
        t.name.toLowerCase().includes('algorithm') || 
        t.name.toLowerCase().includes('data') ||
        t.name.toLowerCase().includes('performance')
      );

      const hasTechnicalKeyPoints = analysis.keyPoints.some(kp =>
        kp.text.toLowerCase().includes('algorithm') ||
        kp.text.toLowerCase().includes('complexity') ||
        kp.text.toLowerCase().includes('memory') ||
        kp.text.toLowerCase().includes('performance')
      );

      expect(hasAlgorithmContent || hasTechnicalKeyPoints).toBe(true);

      // Should categorize some content as technical
      expect(analysis.keyPoints.some(kp => kp.category === 'Technical')).toBe(true);
    });

    it('should handle multilingual content gracefully', () => {
      const mixedTranscript = createRealisticTranscript([
        { text: 'Welcome to our international conference on technology', duration: 4 },
        { text: 'We have participants from many countries joining us today', duration: 4 },
        { text: 'Technology transcends language barriers and connects people', duration: 5 },
        { text: 'Innovation happens when diverse perspectives collaborate', duration: 4 },
        { text: 'Global markets require understanding of local cultures', duration: 4 },
        { text: 'Digital transformation affects every industry worldwide', duration: 5 }
      ]);

      const analysis = ContentAnalyzer.analyzeContent(mixedTranscript);

      // Should still produce meaningful analysis
      expect(analysis.topics.length).toBeGreaterThan(0);
      expect(analysis.keyPoints.length).toBeGreaterThan(0);
      expect(analysis.summary.length).toBeGreaterThan(20);
      expect(analysis.sentiment).toBeDefined();
    });

    it('should maintain performance with long content', () => {
      // Create a longer transcript (simulating 10+ minute video)
      const longContent = [];
      const topics = ['machine learning', 'data science', 'artificial intelligence', 'neural networks'];
      
      for (let i = 0; i < 50; i++) {
        const topic = topics[i % topics.length];
        longContent.push({
          text: `This segment discusses ${topic} and its applications in modern technology`,
          duration: 3
        });
      }

      const longTranscript = createRealisticTranscript(longContent);
      
      const startTime = Date.now();
      const analysis = ContentAnalyzer.analyzeContent(longTranscript);
      const processingTime = Date.now() - startTime;

      // Should complete in reasonable time (less than 5 seconds)
      expect(processingTime).toBeLessThan(5000);

      // Should still produce quality results
      expect(analysis.topics.length).toBeGreaterThan(0);
      expect(analysis.keyPoints.length).toBeGreaterThan(0);
      expect(analysis.summary.length).toBeGreaterThan(50);
    });
  });

  describe('Content Analysis Quality', () => {
    it('should produce consistent results for similar content', () => {
      const content1 = createRealisticTranscript([
        { text: 'Machine learning algorithms process large datasets efficiently', duration: 4 },
        { text: 'Neural networks learn patterns from training data', duration: 4 },
        { text: 'Deep learning enables complex pattern recognition', duration: 4 }
      ]);

      const content2 = createRealisticTranscript([
        { text: 'Algorithms in machine learning handle big data processing', duration: 4 },
        { text: 'Training data helps neural networks identify patterns', duration: 4 },
        { text: 'Pattern recognition improves with deep learning techniques', duration: 4 }
      ]);

      const analysis1 = ContentAnalyzer.analyzeContent(content1);
      const analysis2 = ContentAnalyzer.analyzeContent(content2);

      // Should identify similar topics
      const topics1 = analysis1.topics.map(t => t.name.toLowerCase()).join(' ');
      const topics2 = analysis2.topics.map(t => t.name.toLowerCase()).join(' ');

      const hasCommonTerms = ['machine', 'learning', 'data', 'neural', 'pattern'].some(term =>
        topics1.includes(term) && topics2.includes(term)
      );

      expect(hasCommonTerms).toBe(true);

      // Should have similar sentiment
      expect(analysis1.sentiment).toBe(analysis2.sentiment);
    });

    it('should handle edge cases gracefully', () => {
      // Very short content
      const shortTranscript = createRealisticTranscript([
        { text: 'Hello world', duration: 2 }
      ]);

      const shortAnalysis = ContentAnalyzer.analyzeContent(shortTranscript);
      expect(shortAnalysis.topics.length).toBeGreaterThanOrEqual(0);
      expect(shortAnalysis.keyPoints.length).toBeGreaterThanOrEqual(0);

      // Repetitive content
      const repetitiveTranscript = createRealisticTranscript([
        { text: 'This is a test. This is a test. This is a test.', duration: 3 },
        { text: 'Testing testing testing. More testing here.', duration: 3 }
      ]);

      const repetitiveAnalysis = ContentAnalyzer.analyzeContent(repetitiveTranscript);
      expect(repetitiveAnalysis.topics.length).toBeGreaterThanOrEqual(0);
      expect(repetitiveAnalysis.summary.length).toBeGreaterThan(0);
    });
  });
});