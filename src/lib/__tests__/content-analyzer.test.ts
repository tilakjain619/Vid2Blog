import { ContentAnalyzer } from '../content-analyzer';
import { Transcript, TranscriptSegment } from '@/types';

describe('ContentAnalyzer', () => {
  // Helper function to create test transcript
  const createTestTranscript = (segments: Array<{ text: string; startTime: number; endTime: number }>): Transcript => ({
    segments: segments.map(s => ({
      ...s,
      confidence: 0.9,
      speaker: undefined
    })),
    language: 'en',
    confidence: 0.9,
    duration: Math.max(...segments.map(s => s.endTime))
  });

  describe('analyzeContent', () => {
    it('should analyze basic content and return all required fields', () => {
      const transcript = createTestTranscript([
        { text: 'Welcome to this tutorial about machine learning algorithms', startTime: 0, endTime: 5 },
        { text: 'Machine learning is a powerful technology for data analysis', startTime: 5, endTime: 10 },
        { text: 'Today we will discuss neural networks and deep learning', startTime: 10, endTime: 15 },
        { text: 'Neural networks are fundamental to modern artificial intelligence', startTime: 15, endTime: 20 }
      ]);

      const analysis = ContentAnalyzer.analyzeContent(transcript);

      expect(analysis).toHaveProperty('topics');
      expect(analysis).toHaveProperty('keyPoints');
      expect(analysis).toHaveProperty('summary');
      expect(analysis).toHaveProperty('suggestedStructure');
      expect(analysis).toHaveProperty('sentiment');

      expect(Array.isArray(analysis.topics)).toBe(true);
      expect(Array.isArray(analysis.keyPoints)).toBe(true);
      expect(Array.isArray(analysis.suggestedStructure)).toBe(true);
      expect(typeof analysis.summary).toBe('string');
      expect(['positive', 'neutral', 'negative']).toContain(analysis.sentiment);
    });

    it('should identify relevant topics from technical content', () => {
      const transcript = createTestTranscript([
        { text: 'Machine learning algorithms are essential for data science', startTime: 0, endTime: 5 },
        { text: 'Deep learning neural networks process complex data patterns', startTime: 5, endTime: 10 },
        { text: 'Algorithms like regression and classification solve business problems', startTime: 10, endTime: 15 },
        { text: 'Data preprocessing is crucial for machine learning success', startTime: 15, endTime: 20 }
      ]);

      const analysis = ContentAnalyzer.analyzeContent(transcript, { maxTopics: 5 });

      expect(analysis.topics.length).toBeGreaterThan(0);
      expect(analysis.topics.length).toBeLessThanOrEqual(5);
      
      // Should identify machine learning as a major topic
      const topicNames = analysis.topics.map(t => t.name.toLowerCase());
      expect(topicNames.some(name => name.includes('machine') || name.includes('learning') || name.includes('data'))).toBe(true);
      
      // Topics should have relevance scores
      analysis.topics.forEach(topic => {
        expect(topic.relevance).toBeGreaterThan(0);
        expect(topic.timeRanges).toBeDefined();
        expect(Array.isArray(topic.timeRanges)).toBe(true);
      });
    });

    it('should extract meaningful key points', () => {
      const transcript = createTestTranscript([
        { text: 'The most important concept in programming is understanding algorithms', startTime: 0, endTime: 5 },
        { text: 'Data structures provide efficient ways to organize information', startTime: 5, endTime: 10 },
        { text: 'Object-oriented programming enables code reusability and maintainability', startTime: 10, endTime: 15 },
        { text: 'Testing ensures software quality and reduces bugs in production', startTime: 15, endTime: 20 }
      ]);

      const analysis = ContentAnalyzer.analyzeContent(transcript, { maxKeyPoints: 3 });

      expect(analysis.keyPoints.length).toBeGreaterThan(0);
      expect(analysis.keyPoints.length).toBeLessThanOrEqual(3);
      
      analysis.keyPoints.forEach(keyPoint => {
        expect(keyPoint.text).toBeDefined();
        expect(typeof keyPoint.text).toBe('string');
        expect(keyPoint.text.length).toBeGreaterThan(10);
        expect(keyPoint.importance).toBeGreaterThan(0);
        expect(keyPoint.timestamp).toBeGreaterThanOrEqual(0);
        expect(keyPoint.category).toBeDefined();
      });
    });

    it('should generate coherent summary', () => {
      const transcript = createTestTranscript([
        { text: 'Today we explore the fundamentals of web development', startTime: 0, endTime: 5 },
        { text: 'HTML provides the structure for web pages', startTime: 5, endTime: 10 },
        { text: 'CSS handles the styling and visual presentation', startTime: 10, endTime: 15 },
        { text: 'JavaScript adds interactivity and dynamic behavior', startTime: 15, endTime: 20 },
        { text: 'These three technologies form the foundation of modern web development', startTime: 20, endTime: 25 }
      ]);

      const analysis = ContentAnalyzer.analyzeContent(transcript, { summaryLength: 2 });

      expect(analysis.summary).toBeDefined();
      expect(typeof analysis.summary).toBe('string');
      expect(analysis.summary.length).toBeGreaterThan(20);
      
      // Summary should contain key concepts
      const summaryLower = analysis.summary.toLowerCase();
      expect(summaryLower.includes('web') || summaryLower.includes('html') || summaryLower.includes('development')).toBe(true);
    });

    it('should suggest logical article structure', () => {
      const transcript = createTestTranscript([
        { text: 'Introduction to artificial intelligence and its applications', startTime: 0, endTime: 5 },
        { text: 'Machine learning enables computers to learn from data', startTime: 5, endTime: 10 },
        { text: 'Deep learning uses neural networks for complex pattern recognition', startTime: 10, endTime: 15 },
        { text: 'Applications include image recognition and natural language processing', startTime: 15, endTime: 20 }
      ]);

      const analysis = ContentAnalyzer.analyzeContent(transcript);

      expect(analysis.suggestedStructure).toBeDefined();
      expect(Array.isArray(analysis.suggestedStructure)).toBe(true);
      expect(analysis.suggestedStructure.length).toBeGreaterThan(0);
      
      // Should have introduction and conclusion
      const headings = analysis.suggestedStructure.map(s => s.heading.toLowerCase());
      expect(headings.includes('introduction')).toBe(true);
      expect(headings.includes('conclusion')).toBe(true);
      
      analysis.suggestedStructure.forEach(section => {
        expect(section.heading).toBeDefined();
        expect(section.content).toBeDefined();
        expect(typeof section.heading).toBe('string');
        expect(typeof section.content).toBe('string');
      });
    });

    it('should handle empty transcript gracefully', () => {
      const emptyTranscript: Transcript = {
        segments: [],
        language: 'en',
        confidence: 0,
        duration: 0
      };

      const analysis = ContentAnalyzer.analyzeContent(emptyTranscript);

      expect(analysis.topics).toEqual([]);
      expect(analysis.keyPoints).toEqual([]);
      expect(analysis.summary).toBe('.');
      expect(analysis.suggestedStructure.length).toBeGreaterThan(0); // Should still have basic structure
      expect(analysis.sentiment).toBe('neutral');
    });

    it('should respect configuration options', () => {
      const transcript = createTestTranscript([
        { text: 'First topic about programming languages and software development', startTime: 0, endTime: 5 },
        { text: 'Second topic covers database design and data management', startTime: 5, endTime: 10 },
        { text: 'Third topic discusses web frameworks and user interfaces', startTime: 10, endTime: 15 },
        { text: 'Fourth topic explores testing methodologies and quality assurance', startTime: 15, endTime: 20 }
      ]);

      const analysis = ContentAnalyzer.analyzeContent(transcript, {
        maxTopics: 2,
        maxKeyPoints: 1,
        summaryLength: 1,
        maxKeywords: 5
      });

      expect(analysis.topics.length).toBeLessThanOrEqual(2);
      expect(analysis.keyPoints.length).toBeLessThanOrEqual(1);
    });
  });

  describe('extractKeywords', () => {
    it('should extract keywords with correct frequency', () => {
      const text = 'machine learning algorithms are powerful tools for data analysis and machine learning applications';
      
      const keywords = ContentAnalyzer.extractKeywords(text, 5, 1);
      
      expect(Array.isArray(keywords)).toBe(true);
      expect(keywords.length).toBeGreaterThan(0);
      expect(keywords.length).toBeLessThanOrEqual(5);
      
      // Should find 'machine' and 'learning' with frequency 2
      const machineKeyword = keywords.find(k => k.word === 'machine');
      const learningKeyword = keywords.find(k => k.word === 'learning');
      
      expect(machineKeyword).toBeDefined();
      expect(learningKeyword).toBeDefined();
      expect(machineKeyword?.frequency).toBe(2);
      expect(learningKeyword?.frequency).toBe(2);
      
      // Should be sorted by frequency
      for (let i = 1; i < keywords.length; i++) {
        expect(keywords[i-1].frequency).toBeGreaterThanOrEqual(keywords[i].frequency);
      }
    });

    it('should filter out stop words', () => {
      const text = 'the quick brown fox jumps over the lazy dog and the cat';
      
      const keywords = ContentAnalyzer.extractKeywords(text, 10, 1);
      
      // Should not contain stop words like 'the', 'and', 'over'
      const keywordWords = keywords.map(k => k.word);
      expect(keywordWords).not.toContain('the');
      expect(keywordWords).not.toContain('and');
      expect(keywordWords).not.toContain('over');
    });

    it('should respect minimum frequency threshold', () => {
      const text = 'apple banana apple cherry apple banana date';
      
      const keywords = ContentAnalyzer.extractKeywords(text, 10, 2);
      
      // Only 'apple' (3) and 'banana' (2) should meet the threshold
      expect(keywords.length).toBe(2);
      expect(keywords.find(k => k.word === 'apple')?.frequency).toBe(3);
      expect(keywords.find(k => k.word === 'banana')?.frequency).toBe(2);
      expect(keywords.find(k => k.word === 'cherry')).toBeUndefined();
      expect(keywords.find(k => k.word === 'date')).toBeUndefined();
    });

    it('should handle empty text', () => {
      const keywords = ContentAnalyzer.extractKeywords('', 10, 1);
      expect(keywords).toEqual([]);
    });
  });

  describe('content type specific analysis', () => {
    it('should analyze tutorial content effectively', () => {
      const tutorialTranscript = createTestTranscript([
        { text: 'Welcome to this step-by-step tutorial on React development', startTime: 0, endTime: 5 },
        { text: 'First, we will set up the development environment', startTime: 5, endTime: 10 },
        { text: 'Next, we create components and manage state', startTime: 10, endTime: 15 },
        { text: 'Finally, we will deploy the application to production', startTime: 15, endTime: 20 }
      ]);

      const analysis = ContentAnalyzer.analyzeContent(tutorialTranscript);

      // Should identify process-oriented content
      expect(analysis.keyPoints.some(kp => 
        kp.text.toLowerCase().includes('step') || 
        kp.text.toLowerCase().includes('first') || 
        kp.text.toLowerCase().includes('next')
      )).toBe(true);

      // Should have structured sections
      expect(analysis.suggestedStructure.length).toBeGreaterThan(2);
    });

    it('should analyze interview content effectively', () => {
      const interviewTranscript = createTestTranscript([
        { text: 'Today I am speaking with John about his experience in software engineering', startTime: 0, endTime: 5 },
        { text: 'John has worked at several major technology companies', startTime: 5, endTime: 10 },
        { text: 'His insights on team leadership and project management are valuable', startTime: 10, endTime: 15 },
        { text: 'We discuss the future of artificial intelligence in business', startTime: 15, endTime: 20 }
      ]);

      const analysis = ContentAnalyzer.analyzeContent(interviewTranscript);

      // Should identify key insights and experiences
      expect(analysis.keyPoints.some(kp => 
        kp.text.toLowerCase().includes('experience') || 
        kp.text.toLowerCase().includes('insights')
      )).toBe(true);

      // Should have topics - check that topics are generated
      expect(analysis.topics.length).toBeGreaterThan(0);
      
      // Should have meaningful content in the analysis
      expect(analysis.summary.length).toBeGreaterThan(10);
    });

    it('should analyze presentation content effectively', () => {
      const presentationTranscript = createTestTranscript([
        { text: 'Good morning everyone, today we will discuss quarterly business results', startTime: 0, endTime: 5 },
        { text: 'Our revenue has increased by twenty percent compared to last quarter', startTime: 5, endTime: 10 },
        { text: 'Customer satisfaction scores have improved significantly', startTime: 10, endTime: 15 },
        { text: 'Looking forward, we plan to expand into new markets', startTime: 15, endTime: 20 }
      ]);

      const analysis = ContentAnalyzer.analyzeContent(presentationTranscript);

      // Should identify business-oriented content
      expect(analysis.keyPoints.some(kp => 
        kp.text.toLowerCase().includes('revenue') || 
        kp.text.toLowerCase().includes('business') ||
        kp.text.toLowerCase().includes('customer')
      )).toBe(true);

      // Should have analysis results
      expect(analysis.keyPoints.length).toBeGreaterThan(0);
      expect(analysis.topics.length).toBeGreaterThan(0);
      expect(analysis.summary.length).toBeGreaterThan(10);
    });

    it('should handle technical discussion content', () => {
      const technicalTranscript = createTestTranscript([
        { text: 'The algorithm complexity is O(n log n) for this sorting implementation', startTime: 0, endTime: 5 },
        { text: 'Memory usage can be optimized using in-place operations', startTime: 5, endTime: 10 },
        { text: 'The data structure provides efficient insertion and deletion', startTime: 10, endTime: 15 },
        { text: 'Performance benchmarks show significant improvement over previous versions', startTime: 15, endTime: 20 }
      ]);

      const analysis = ContentAnalyzer.analyzeContent(technicalTranscript);

      // Should have meaningful analysis
      expect(analysis.keyPoints.length).toBeGreaterThan(0);
      expect(analysis.topics.length).toBeGreaterThan(0);
      expect(analysis.summary.length).toBeGreaterThan(10);
      
      // Should identify technical content in some form
      const fullText = analysis.keyPoints.map(kp => kp.text).join(' ') + ' ' + 
                      analysis.topics.map(t => t.name).join(' ') + ' ' + 
                      analysis.summary;
      const hasTechnicalTerms = fullText.toLowerCase().includes('algorithm') || 
                               fullText.toLowerCase().includes('data') || 
                               fullText.toLowerCase().includes('performance') ||
                               fullText.toLowerCase().includes('memory');
      expect(hasTechnicalTerms).toBe(true);
    });
  });

  describe('sentiment analysis', () => {
    it('should detect positive sentiment', () => {
      const positiveTranscript = createTestTranscript([
        { text: 'This is an amazing tutorial with excellent examples', startTime: 0, endTime: 5 },
        { text: 'I love how the concepts are explained clearly', startTime: 5, endTime: 10 },
        { text: 'The results are fantastic and very impressive', startTime: 10, endTime: 15 }
      ]);

      const analysis = ContentAnalyzer.analyzeContent(positiveTranscript);
      expect(analysis.sentiment).toBe('positive');
    });

    it('should detect negative sentiment', () => {
      const negativeTranscript = createTestTranscript([
        { text: 'This approach has terrible performance issues', startTime: 0, endTime: 5 },
        { text: 'The implementation is awful and difficult to understand', startTime: 5, endTime: 10 },
        { text: 'I hate how complicated this problem has become', startTime: 10, endTime: 15 }
      ]);

      const analysis = ContentAnalyzer.analyzeContent(negativeTranscript);
      expect(analysis.sentiment).toBe('negative');
    });

    it('should detect neutral sentiment', () => {
      const neutralTranscript = createTestTranscript([
        { text: 'The function takes two parameters and returns a value', startTime: 0, endTime: 5 },
        { text: 'Here is the implementation of the algorithm', startTime: 5, endTime: 10 },
        { text: 'The data structure contains several fields', startTime: 10, endTime: 15 }
      ]);

      const analysis = ContentAnalyzer.analyzeContent(neutralTranscript);
      expect(analysis.sentiment).toBe('neutral');
    });
  });
});