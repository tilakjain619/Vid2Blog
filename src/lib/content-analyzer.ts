import { Transcript, ContentAnalysis, Topic, KeyPoint, ArticleSection } from '@/types';

/**
 * Configuration options for content analysis
 */
export interface ContentAnalysisOptions {
  maxKeywords?: number;
  maxTopics?: number;
  maxKeyPoints?: number;
  minKeywordFrequency?: number;
  minTopicRelevance?: number;
  summaryLength?: number; // number of sentences
  includeTimestamps?: boolean;
}

/**
 * Word frequency data structure
 */
interface WordFrequency {
  word: string;
  frequency: number;
  positions: number[]; // timestamps where word appears
}

/**
 * Sentence scoring data structure
 */
interface SentenceScore {
  sentence: string;
  score: number;
  timestamp: number;
  keywords: string[];
}

/**
 * Service for analyzing transcript content and extracting insights
 */
export class ContentAnalyzer {
  private static readonly STOP_WORDS = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with',
    'by', 'from', 'up', 'about', 'into', 'through', 'during', 'before', 'after',
    'above', 'below', 'between', 'among', 'over', 'under', 'is', 'are', 'was', 'were', 'be', 'been',
    'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
    'should', 'may', 'might', 'must', 'can', 'this', 'that', 'these', 'those',
    'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them',
    'my', 'your', 'his', 'her', 'its', 'our', 'their', 'myself', 'yourself',
    'himself', 'herself', 'itself', 'ourselves', 'yourselves', 'themselves',
    'what', 'which', 'who', 'whom', 'whose', 'where', 'when', 'why', 'how',
    'all', 'any', 'both', 'each', 'few', 'more', 'most', 'other', 'some', 'such',
    'no', 'nor', 'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very'
  ]);

  /**
   * Analyze transcript content and generate comprehensive analysis
   */
  static analyzeContent(
    transcript: Transcript,
    options: ContentAnalysisOptions = {}
  ): ContentAnalysis {
    const defaultOptions: Required<ContentAnalysisOptions> = {
      maxKeywords: 20,
      maxTopics: 8,
      maxKeyPoints: 10,
      minKeywordFrequency: 1, // Lowered to be more inclusive
      minTopicRelevance: 0.05, // Lowered to be more inclusive
      summaryLength: 3,
      includeTimestamps: true,
      ...options
    };

    // Extract full text from transcript
    const fullText = transcript.segments.map(s => s.text).join(' ');
    
    // Perform analysis
    const wordFrequencies = this.extractWordFrequencies(transcript, defaultOptions);
    const topics = this.identifyTopics(wordFrequencies, defaultOptions);
    const keyPoints = this.extractKeyPoints(transcript, wordFrequencies, defaultOptions);
    const summary = this.generateSummary(transcript, wordFrequencies, defaultOptions);
    const suggestedStructure = this.suggestArticleStructure(topics, keyPoints);
    const sentiment = this.analyzeSentiment(fullText);

    return {
      topics,
      keyPoints,
      summary,
      suggestedStructure,
      sentiment
    };
  }

  /**
   * Extract word frequencies from transcript with position tracking
   */
  private static extractWordFrequencies(
    transcript: Transcript,
    options: Required<ContentAnalysisOptions>
  ): WordFrequency[] {
    const wordMap = new Map<string, { count: number; positions: number[] }>();

    // Process each segment
    transcript.segments.forEach(segment => {
      const words = this.tokenizeText(segment.text);
      
      words.forEach(word => {
        const normalizedWord = word.toLowerCase();
        
        // Skip stop words and short words
        if (this.STOP_WORDS.has(normalizedWord) || normalizedWord.length < 3) {
          return;
        }

        if (!wordMap.has(normalizedWord)) {
          wordMap.set(normalizedWord, { count: 0, positions: [] });
        }

        const entry = wordMap.get(normalizedWord)!;
        entry.count++;
        entry.positions.push(segment.startTime);
      });
    });

    // Convert to array and filter by minimum frequency
    return Array.from(wordMap.entries())
      .filter(([_, data]) => data.count >= options.minKeywordFrequency)
      .map(([word, data]) => ({
        word,
        frequency: data.count,
        positions: data.positions
      }))
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, options.maxKeywords);
  }

  /**
   * Identify main topics using word frequency analysis and clustering
   */
  private static identifyTopics(
    wordFrequencies: WordFrequency[],
    options: Required<ContentAnalysisOptions>
  ): Topic[] {
    if (wordFrequencies.length === 0) {
      return [];
    }

    // Group related words into topics using simple clustering
    const topics: Topic[] = [];
    const usedWords = new Set<string>();

    // Start with highest frequency words as topic seeds
    for (const wordFreq of wordFrequencies) {
      if (usedWords.has(wordFreq.word) || topics.length >= options.maxTopics) {
        continue;
      }

      // Find related words (simple approach: words that appear in similar time ranges)
      const relatedWords = this.findRelatedWords(wordFreq, wordFrequencies, usedWords);
      
      if (relatedWords.length > 0) {
        // Calculate topic relevance based on combined frequency
        const totalFrequency = relatedWords.reduce((sum, w) => sum + w.frequency, 0);
        const totalWords = wordFrequencies.reduce((sum, w) => sum + w.frequency, 0);
        const relevance = totalWords > 0 ? totalFrequency / totalWords : 0;

        if (relevance >= options.minTopicRelevance) {
          // Calculate time ranges where this topic is discussed
          const allPositions = relatedWords.flatMap(w => w.positions).sort((a, b) => a - b);
          const timeRanges = this.calculateTimeRanges(allPositions);

          topics.push({
            name: this.generateTopicName(relatedWords),
            relevance,
            timeRanges
          });

          // Mark words as used
          relatedWords.forEach(w => usedWords.add(w.word));
        }
      }
    }

    // If no topics found with clustering, create topics from individual high-frequency words
    if (topics.length === 0 && wordFrequencies.length > 0) {
      const topWords = wordFrequencies.slice(0, Math.min(3, options.maxTopics));
      for (const word of topWords) {
        const timeRanges = this.calculateTimeRanges(word.positions);
        topics.push({
          name: word.word.charAt(0).toUpperCase() + word.word.slice(1),
          relevance: word.frequency / wordFrequencies[0].frequency,
          timeRanges
        });
      }
    }

    return topics.sort((a, b) => b.relevance - a.relevance);
  }

  /**
   * Find words related to a seed word based on temporal proximity
   */
  private static findRelatedWords(
    seedWord: WordFrequency,
    allWords: WordFrequency[],
    usedWords: Set<string>
  ): WordFrequency[] {
    const related = [seedWord];
    const timeWindow = 30; // seconds

    for (const word of allWords) {
      if (usedWords.has(word.word) || word.word === seedWord.word) {
        continue;
      }

      // Check if words appear in similar time ranges
      const hasOverlap = seedWord.positions.some(pos1 =>
        word.positions.some(pos2 => Math.abs(pos1 - pos2) <= timeWindow)
      );

      if (hasOverlap && related.length < 5) { // Limit topic size
        related.push(word);
      }
    }

    return related;
  }

  /**
   * Calculate time ranges from position array
   */
  private static calculateTimeRanges(positions: number[]): Array<{ start: number; end: number }> {
    if (positions.length === 0) return [];

    const ranges: Array<{ start: number; end: number }> = [];
    let currentStart = positions[0];
    let currentEnd = positions[0];
    const gapThreshold = 60; // seconds

    for (let i = 1; i < positions.length; i++) {
      if (positions[i] - currentEnd <= gapThreshold) {
        currentEnd = positions[i];
      } else {
        ranges.push({ start: currentStart, end: currentEnd });
        currentStart = positions[i];
        currentEnd = positions[i];
      }
    }

    ranges.push({ start: currentStart, end: currentEnd });
    return ranges;
  }

  /**
   * Generate a topic name from related words
   */
  private static generateTopicName(words: WordFrequency[]): string {
    // Use the most frequent word as the primary topic name
    const primaryWord = words[0].word;
    
    // If we have related words, try to create a more descriptive name
    if (words.length > 1) {
      const relatedWord = words[1].word;
      // Check if words are commonly paired
      const commonPairs = [
        ['machine', 'learning'], ['artificial', 'intelligence'], ['data', 'science'],
        ['web', 'development'], ['software', 'engineering'], ['project', 'management']
      ];
      
      for (const [first, second] of commonPairs) {
        if ((primaryWord === first && relatedWord === second) || 
            (primaryWord === second && relatedWord === first)) {
          return `${first.charAt(0).toUpperCase() + first.slice(1)} ${second}`;
        }
      }
    }
    
    // Capitalize first letter
    return primaryWord.charAt(0).toUpperCase() + primaryWord.slice(1);
  }

  /**
   * Extract key points from transcript using sentence ranking
   */
  private static extractKeyPoints(
    transcript: Transcript,
    wordFrequencies: WordFrequency[],
    options: Required<ContentAnalysisOptions>
  ): KeyPoint[] {
    const sentences = this.extractSentences(transcript);
    const scoredSentences = this.scoreSentences(sentences, wordFrequencies);
    
    return scoredSentences
      .sort((a, b) => b.score - a.score)
      .slice(0, options.maxKeyPoints)
      .map((sentence, index) => ({
        text: sentence.sentence,
        importance: sentence.score,
        timestamp: sentence.timestamp,
        category: this.categorizeKeyPoint(sentence.keywords)
      }));
  }

  /**
   * Extract sentences from transcript segments
   */
  private static extractSentences(transcript: Transcript): Array<{ text: string; timestamp: number }> {
    const sentences: Array<{ text: string; timestamp: number }> = [];

    transcript.segments.forEach(segment => {
      // Split segment text into sentences
      const segmentSentences = segment.text
        .split(/[.!?]+/)
        .map(s => s.trim())
        .filter(s => s.length > 10); // Filter out very short fragments

      segmentSentences.forEach(sentence => {
        sentences.push({
          text: sentence,
          timestamp: segment.startTime
        });
      });
    });

    return sentences;
  }

  /**
   * Score sentences based on keyword frequency and other factors
   */
  private static scoreSentences(
    sentences: Array<{ text: string; timestamp: number }>,
    wordFrequencies: WordFrequency[]
  ): SentenceScore[] {
    const keywordMap = new Map(wordFrequencies.map(w => [w.word, w.frequency]));
    const maxFrequency = Math.max(...wordFrequencies.map(w => w.frequency));

    return sentences.map(sentence => {
      const words = this.tokenizeText(sentence.text);
      const keywords: string[] = [];
      let score = 0;

      // Score based on keyword presence
      words.forEach(word => {
        const normalizedWord = word.toLowerCase();
        if (keywordMap.has(normalizedWord)) {
          keywords.push(normalizedWord);
          score += keywordMap.get(normalizedWord)! / maxFrequency;
        }
      });

      // Bonus for sentence length (not too short, not too long)
      const wordCount = words.length;
      if (wordCount >= 8 && wordCount <= 25) {
        score += 0.2;
      }

      // Bonus for sentences with multiple keywords
      if (keywords.length > 1) {
        score += keywords.length * 0.1;
      }

      return {
        sentence: sentence.text,
        score,
        timestamp: sentence.timestamp,
        keywords
      };
    });
  }

  /**
   * Categorize key points based on their keywords
   */
  private static categorizeKeyPoint(keywords: string[]): string {
    // Simple categorization based on common patterns
    const techWords = ['system', 'technology', 'software', 'code', 'data', 'algorithm', 'implementation', 'performance', 'memory', 'complexity', 'structure'];
    const businessWords = ['market', 'business', 'strategy', 'customer', 'revenue', 'growth', 'quarterly', 'satisfaction', 'results'];
    const processWords = ['process', 'method', 'approach', 'step', 'procedure', 'workflow'];

    if (keywords.some(k => techWords.includes(k))) return 'Technical';
    if (keywords.some(k => businessWords.includes(k))) return 'Business';
    if (keywords.some(k => processWords.includes(k))) return 'Process';
    
    return 'General';
  }

  /**
   * Generate summary using sentence ranking algorithm
   */
  private static generateSummary(
    transcript: Transcript,
    wordFrequencies: WordFrequency[],
    options: Required<ContentAnalysisOptions>
  ): string {
    const sentences = this.extractSentences(transcript);
    const scoredSentences = this.scoreSentences(sentences, wordFrequencies);
    
    // Select top sentences for summary, ensuring temporal diversity
    const selectedSentences = this.selectDiverseSentences(
      scoredSentences,
      options.summaryLength
    );

    return selectedSentences
      .sort((a, b) => a.timestamp - b.timestamp) // Sort by original order
      .map(s => s.sentence)
      .join('. ') + '.';
  }

  /**
   * Select sentences for summary ensuring temporal diversity
   */
  private static selectDiverseSentences(
    scoredSentences: SentenceScore[],
    count: number
  ): SentenceScore[] {
    if (scoredSentences.length <= count) {
      return scoredSentences;
    }

    const selected: SentenceScore[] = [];
    const sorted = [...scoredSentences].sort((a, b) => b.score - a.score);
    const minGap = 30; // Minimum 30 seconds between selected sentences

    for (const sentence of sorted) {
      if (selected.length >= count) break;

      // Check if this sentence is too close to already selected ones
      const tooClose = selected.some(s => 
        Math.abs(s.timestamp - sentence.timestamp) < minGap
      );

      if (!tooClose) {
        selected.push(sentence);
      }
    }

    // If we don't have enough diverse sentences, fill with highest scoring ones
    while (selected.length < count && selected.length < sorted.length) {
      const remaining = sorted.filter(s => !selected.includes(s));
      if (remaining.length > 0) {
        selected.push(remaining[0]);
      } else {
        break;
      }
    }

    return selected;
  }

  /**
   * Suggest article structure based on topics and key points
   */
  private static suggestArticleStructure(
    topics: Topic[],
    keyPoints: KeyPoint[]
  ): ArticleSection[] {
    const sections: ArticleSection[] = [];

    // Introduction section
    sections.push({
      heading: 'Introduction',
      content: 'Overview of the main topics and key insights from the video content.'
    });

    // Create sections based on topics
    topics.forEach((topic, index) => {
      const relatedKeyPoints = keyPoints.filter(kp => 
        kp.text.toLowerCase().includes(topic.name.toLowerCase()) ||
        topic.timeRanges.some(range => 
          kp.timestamp >= range.start && kp.timestamp <= range.end
        )
      );

      sections.push({
        heading: topic.name,
        content: relatedKeyPoints.length > 0 
          ? relatedKeyPoints.map(kp => kp.text).join(' ')
          : `Discussion of ${topic.name.toLowerCase()} and related concepts.`
      });
    });

    // Conclusion section
    sections.push({
      heading: 'Conclusion',
      content: 'Summary of key takeaways and final thoughts.'
    });

    return sections;
  }

  /**
   * Analyze sentiment of the text (basic implementation)
   */
  private static analyzeSentiment(text: string): 'positive' | 'neutral' | 'negative' {
    const positiveWords = [
      'good', 'great', 'excellent', 'amazing', 'wonderful', 'fantastic', 'awesome',
      'love', 'like', 'enjoy', 'happy', 'pleased', 'satisfied', 'success', 'win',
      'benefit', 'advantage', 'improve', 'better', 'best', 'perfect', 'outstanding'
    ];

    const negativeWords = [
      'bad', 'terrible', 'awful', 'horrible', 'hate', 'dislike', 'sad', 'angry',
      'frustrated', 'disappointed', 'fail', 'failure', 'problem', 'issue', 'wrong',
      'difficult', 'hard', 'challenge', 'struggle', 'worst', 'poor', 'negative'
    ];

    const words = this.tokenizeText(text.toLowerCase());
    let positiveCount = 0;
    let negativeCount = 0;

    words.forEach(word => {
      if (positiveWords.includes(word)) positiveCount++;
      if (negativeWords.includes(word)) negativeCount++;
    });

    const total = positiveCount + negativeCount;
    if (total === 0) return 'neutral';

    const positiveRatio = positiveCount / total;
    if (positiveRatio > 0.6) return 'positive';
    if (positiveRatio < 0.4) return 'negative';
    return 'neutral';
  }

  /**
   * Tokenize text into words, removing punctuation
   */
  private static tokenizeText(text: string): string[] {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ') // Replace punctuation with spaces
      .split(/\s+/)
      .filter(word => word.length > 0);
  }

  /**
   * Extract keywords from text (simple frequency-based approach)
   */
  static extractKeywords(
    text: string,
    maxKeywords = 10,
    minFrequency = 2
  ): Array<{ word: string; frequency: number }> {
    const words = this.tokenizeText(text);
    const wordCounts = new Map<string, number>();

    words.forEach(word => {
      if (!this.STOP_WORDS.has(word) && word.length >= 3) {
        wordCounts.set(word, (wordCounts.get(word) || 0) + 1);
      }
    });

    return Array.from(wordCounts.entries())
      .filter(([_, count]) => count >= minFrequency)
      .map(([word, frequency]) => ({ word, frequency }))
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, maxKeywords);
  }
}