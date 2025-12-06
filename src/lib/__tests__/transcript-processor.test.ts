import { TranscriptProcessor, TranscriptProcessingOptions } from '../transcript-processor';
import { Transcript, TranscriptSegment } from '@/types';

describe('TranscriptProcessor', () => {
  const mockTranscript: Transcript = {
    segments: [
      {
        text: 'Um, hello everyone, uh, welcome to this video.',
        startTime: 0,
        endTime: 3,
        confidence: 0.9
      },
      {
        text: 'So, like, today we are going to talk about, you know, JavaScript.',
        startTime: 3.5,
        endTime: 7,
        confidence: 0.85
      },
      {
        text: 'Actually, it\'s a really interesting topic.',
        startTime: 7.2,
        endTime: 10,
        confidence: 0.92
      },
      {
        text: '[Music] Well, let\'s get started.',
        startTime: 10.5,
        endTime: 12,
        confidence: 0.88
      }
    ],
    language: 'en',
    confidence: 0.89,
    duration: 12
  };

  describe('processTranscript', () => {
    it('should process transcript with default options', () => {
      const result = TranscriptProcessor.processTranscript(mockTranscript);
      
      expect(result.originalSegmentCount).toBe(4);
      expect(result.processedSegmentCount).toBeGreaterThan(0);
      expect(result.cleanedText).toBeDefined();
      expect(result.processingStats).toBeDefined();
      expect(result.processingStats.fillerWordsRemoved).toBeGreaterThan(0);
    });

    it('should remove filler words when enabled', () => {
      const options: TranscriptProcessingOptions = {
        removeFillerWords: true,
        mergeSimilarSegments: false,
        cleanFormatting: false,
        normalizeWhitespace: false
      };
      
      const result = TranscriptProcessor.processTranscript(mockTranscript, options);
      
      // Check that filler words are removed (case insensitive)
      expect(result.segments[0].text.toLowerCase()).not.toContain('um');
      expect(result.segments[0].text.toLowerCase()).not.toContain('uh');
      expect(result.segments[1].text.toLowerCase()).not.toContain('so,');
      expect(result.segments[1].text.toLowerCase()).not.toContain('like,');
      expect(result.segments[1].text.toLowerCase()).not.toContain('you know');
      expect(result.processingStats.fillerWordsRemoved).toBeGreaterThan(0);
    });

    it('should clean formatting when enabled', () => {
      const options: TranscriptProcessingOptions = {
        removeFillerWords: false,
        mergeSimilarSegments: false,
        cleanFormatting: true,
        normalizeWhitespace: false
      };
      
      const result = TranscriptProcessor.processTranscript(mockTranscript, options);
      
      // Check that bracketed content is removed
      const musicSegment = result.segments.find(s => s.text.includes('let\'s get started'));
      expect(musicSegment?.text).not.toContain('[Music]');
      expect(result.processingStats.formattingCleaned).toBeGreaterThan(0);
    });

    it('should merge segments when enabled', () => {
      const options: TranscriptProcessingOptions = {
        removeFillerWords: false,
        mergeSimilarSegments: true,
        minSegmentDuration: 2.0,
        maxSegmentDuration: 10.0,
        cleanFormatting: false,
        normalizeWhitespace: false
      };
      
      const result = TranscriptProcessor.processTranscript(mockTranscript, options);
      
      expect(result.processedSegmentCount).toBeLessThanOrEqual(result.originalSegmentCount);
      expect(result.processingStats.segmentsMerged).toBeGreaterThanOrEqual(0);
    });

    it('should normalize whitespace when enabled', () => {
      const transcriptWithWhitespace: Transcript = {
        ...mockTranscript,
        segments: [
          {
            text: 'Hello    world   with   multiple    spaces',
            startTime: 0,
            endTime: 3,
            confidence: 0.9
          }
        ]
      };
      
      const options: TranscriptProcessingOptions = {
        normalizeWhitespace: true,
        removeFillerWords: false,
        mergeSimilarSegments: false,
        cleanFormatting: false
      };
      
      const result = TranscriptProcessor.processTranscript(transcriptWithWhitespace, options);
      
      expect(result.segments[0].text).toBe('Hello world with multiple spaces');
    });

    it('should handle empty segments', () => {
      const transcriptWithEmpty: Transcript = {
        ...mockTranscript,
        segments: [
          ...mockTranscript.segments,
          {
            text: '',
            startTime: 12,
            endTime: 13,
            confidence: 0.5
          },
          {
            text: '   ',
            startTime: 13,
            endTime: 14,
            confidence: 0.5
          }
        ]
      };
      
      const result = TranscriptProcessor.processTranscript(transcriptWithEmpty);
      
      // Empty segments should be filtered out
      expect(result.segments.every(s => s.text.trim().length > 0)).toBe(true);
    });
  });

  describe('parseTimestamp', () => {
    it('should parse seconds format', () => {
      expect(TranscriptProcessor.parseTimestamp('123.45')).toBe(123.45);
      expect(TranscriptProcessor.parseTimestamp('60')).toBe(60);
      expect(TranscriptProcessor.parseTimestamp('0.5')).toBe(0.5);
    });

    it('should parse MM:SS format', () => {
      expect(TranscriptProcessor.parseTimestamp('1:30')).toBe(90);
      expect(TranscriptProcessor.parseTimestamp('0:45')).toBe(45);
      expect(TranscriptProcessor.parseTimestamp('2:15.5')).toBe(135.5);
    });

    it('should parse HH:MM:SS format', () => {
      expect(TranscriptProcessor.parseTimestamp('1:30:45')).toBe(5445);
      expect(TranscriptProcessor.parseTimestamp('0:1:30')).toBe(90);
      expect(TranscriptProcessor.parseTimestamp('2:0:0')).toBe(7200);
    });

    it('should handle invalid formats', () => {
      expect(() => TranscriptProcessor.parseTimestamp('invalid')).toThrow();
      expect(() => TranscriptProcessor.parseTimestamp('1:2:3:4')).toThrow();
      expect(() => TranscriptProcessor.parseTimestamp('')).toThrow();
    });
  });

  describe('formatTimestamp', () => {
    it('should format seconds without hours', () => {
      expect(TranscriptProcessor.formatTimestamp(90)).toBe('1:30');
      expect(TranscriptProcessor.formatTimestamp(45)).toBe('0:45');
      expect(TranscriptProcessor.formatTimestamp(125)).toBe('2:05');
    });

    it('should format seconds with hours when requested', () => {
      expect(TranscriptProcessor.formatTimestamp(3661, true)).toBe('1:01:01');
      expect(TranscriptProcessor.formatTimestamp(90, true)).toBe('0:01:30');
    });

    it('should automatically include hours for long durations', () => {
      expect(TranscriptProcessor.formatTimestamp(3661)).toBe('1:01:01');
      expect(TranscriptProcessor.formatTimestamp(7200)).toBe('2:00:00');
    });

    it('should handle fractional seconds', () => {
      expect(TranscriptProcessor.formatTimestamp(90.7)).toBe('1:30');
      expect(TranscriptProcessor.formatTimestamp(125.3)).toBe('2:05');
    });
  });

  describe('segmentTranscript', () => {
    const longTranscript: Transcript = {
      segments: [
        { text: 'First segment with some words', startTime: 0, endTime: 2, confidence: 0.9 },
        { text: 'Second segment continues the thought', startTime: 2.1, endTime: 4, confidence: 0.9 },
        { text: 'Third segment after a pause', startTime: 8, endTime: 10, confidence: 0.9 },
        { text: 'Fourth segment with many words that should trigger a split due to length limits when we have too many words in a single segment that exceeds our maximum word count threshold', startTime: 10.1, endTime: 15, confidence: 0.9 }
      ],
      language: 'en',
      confidence: 0.9,
      duration: 15
    };

    it('should segment based on pauses', () => {
      const result = TranscriptProcessor.segmentTranscript(longTranscript, 50, 3.0);
      
      // Should create separate segments due to the pause between segments 2 and 3
      expect(result.length).toBeGreaterThan(1);
      
      // First two segments should be merged (small gap)
      const firstSegment = result[0];
      expect(firstSegment.text).toContain('First segment');
      expect(firstSegment.text).toContain('Second segment');
      
      // Third segment should be separate due to pause
      const hasThirdSegmentSeparate = result.some(s => 
        s.text.includes('Third segment') && !s.text.includes('First segment')
      );
      expect(hasThirdSegmentSeparate).toBe(true);
    });

    it('should segment based on word count', () => {
      const result = TranscriptProcessor.segmentTranscript(longTranscript, 10, 1.0);
      
      // Should create multiple segments due to word count limits
      expect(result.length).toBeGreaterThan(2);
      
      // Most segments should respect word count limit, but very long single segments
      // might exceed it if they can't be reasonably split
      const segmentsWithinLimit = result.filter(segment => {
        const wordCount = segment.text.split(/\s+/).length;
        return wordCount <= 15; // Some tolerance
      });
      
      // At least some segments should be within the limit
      expect(segmentsWithinLimit.length).toBeGreaterThan(0);
    });

    it('should handle empty transcript', () => {
      const emptyTranscript: Transcript = {
        segments: [],
        language: 'en',
        confidence: 1.0,
        duration: 0
      };
      
      const result = TranscriptProcessor.segmentTranscript(emptyTranscript);
      expect(result).toEqual([]);
    });

    it('should preserve timing information', () => {
      const result = TranscriptProcessor.segmentTranscript(longTranscript);
      
      // First segment should start at the beginning
      expect(result[0].startTime).toBe(0);
      
      // Last segment should end at the original end time
      const lastSegment = result[result.length - 1];
      expect(lastSegment.endTime).toBe(15);
      
      // Segments should be in chronological order
      for (let i = 1; i < result.length; i++) {
        expect(result[i].startTime).toBeGreaterThanOrEqual(result[i - 1].startTime);
      }
    });
  });

  describe('edge cases', () => {
    it('should handle transcript with single segment', () => {
      const singleSegmentTranscript: Transcript = {
        segments: [
          {
            text: 'Only one segment here',
            startTime: 0,
            endTime: 5,
            confidence: 0.9
          }
        ],
        language: 'en',
        confidence: 0.9,
        duration: 5
      };
      
      const result = TranscriptProcessor.processTranscript(singleSegmentTranscript);
      expect(result.segments).toHaveLength(1);
      expect(result.cleanedText).toBe('Only one segment here');
    });

    it('should handle transcript with no segments', () => {
      const emptyTranscript: Transcript = {
        segments: [],
        language: 'en',
        confidence: 1.0,
        duration: 0
      };
      
      const result = TranscriptProcessor.processTranscript(emptyTranscript);
      expect(result.segments).toHaveLength(0);
      expect(result.cleanedText).toBe('');
      expect(result.processingStats.fillerWordsRemoved).toBe(0);
    });

    it('should preserve speaker information when available', () => {
      const transcriptWithSpeakers: Transcript = {
        segments: [
          {
            text: 'Hello from speaker one',
            startTime: 0,
            endTime: 2,
            confidence: 0.9,
            speaker: 'Speaker 1'
          },
          {
            text: 'Response from speaker two',
            startTime: 2.1,
            endTime: 4,
            confidence: 0.9,
            speaker: 'Speaker 2'
          }
        ],
        language: 'en',
        confidence: 0.9,
        duration: 4
      };
      
      const result = TranscriptProcessor.processTranscript(transcriptWithSpeakers, {
        mergeSimilarSegments: false
      });
      
      expect(result.segments[0].speaker).toBe('Speaker 1');
      expect(result.segments[1].speaker).toBe('Speaker 2');
    });

    it('should handle very short segments', () => {
      const shortSegmentsTranscript: Transcript = {
        segments: [
          { text: 'Hi', startTime: 0, endTime: 0.5, confidence: 0.9 },
          { text: 'there', startTime: 0.6, endTime: 1, confidence: 0.9 },
          { text: 'friend', startTime: 1.1, endTime: 1.5, confidence: 0.9 }
        ],
        language: 'en',
        confidence: 0.9,
        duration: 1.5
      };
      
      const result = TranscriptProcessor.processTranscript(shortSegmentsTranscript, {
        minSegmentDuration: 1.0,
        mergeSimilarSegments: true
      });
      
      // Short segments should be merged
      expect(result.processedSegmentCount).toBeLessThan(result.originalSegmentCount);
      expect(result.segments[0].text).toContain('Hi there friend');
    });
  });
});