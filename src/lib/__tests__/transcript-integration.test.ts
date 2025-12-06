import { TranscriptService } from '../transcript-service';
import { TranscriptProcessor } from '../transcript-processor';
import { Transcript } from '@/types';

// Mock the youtube-transcript module
jest.mock('youtube-transcript', () => ({
  YoutubeTranscript: {
    fetchTranscript: jest.fn()
  }
}));

describe('Transcript Service Integration with Processor', () => {
  const mockTranscriptData = [
    {
      text: 'Um, hello everyone, uh, welcome to this video about JavaScript.',
      offset: 0,
      duration: 3000
    },
    {
      text: 'So, like, today we are going to talk about, you know, variables and functions.',
      offset: 3500,
      duration: 4000
    },
    {
      text: '[Music] Actually, let\'s start with the basics of programming.',
      offset: 8000,
      duration: 3500
    },
    {
      text: 'Variables are, well, basically containers for storing data values.',
      offset: 12000,
      duration: 4000
    }
  ];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should extract and process transcript end-to-end', async () => {
    // Mock the youtube-transcript response
    const { YoutubeTranscript } = require('youtube-transcript');
    YoutubeTranscript.fetchTranscript.mockResolvedValue(mockTranscriptData);

    // Extract transcript using TranscriptService
    const rawTranscript = await TranscriptService.extractTranscript('test-video-id');

    // Verify raw transcript structure
    expect(rawTranscript.segments).toHaveLength(4);
    expect(rawTranscript.language).toBe('en');
    expect(rawTranscript.duration).toBe(16); // Last segment ends at 16 seconds

    // Process the transcript
    const processedTranscript = TranscriptProcessor.processTranscript(rawTranscript, {
      removeFillerWords: true,
      cleanFormatting: true,
      mergeSimilarSegments: true,
      normalizeWhitespace: true
    });

    // Verify processing results
    expect(processedTranscript.originalSegmentCount).toBe(4);
    expect(processedTranscript.processedSegmentCount).toBeLessThanOrEqual(4);
    expect(processedTranscript.processingStats.fillerWordsRemoved).toBeGreaterThan(0);
    expect(processedTranscript.processingStats.formattingCleaned).toBeGreaterThan(0);

    // Verify content cleaning
    expect(processedTranscript.cleanedText).not.toContain('[Music]');
    expect(processedTranscript.cleanedText).not.toContain('Um,');
    expect(processedTranscript.cleanedText).not.toContain('you know');
    expect(processedTranscript.cleanedText).toContain('JavaScript');
    expect(processedTranscript.cleanedText).toContain('variables');
  });

  it('should handle transcript processing with custom options', async () => {
    const { YoutubeTranscript } = require('youtube-transcript');
    YoutubeTranscript.fetchTranscript.mockResolvedValue(mockTranscriptData);

    const rawTranscript = await TranscriptService.extractTranscript('test-video-id');

    // Process with minimal cleaning
    const minimalProcessing = TranscriptProcessor.processTranscript(rawTranscript, {
      removeFillerWords: false,
      cleanFormatting: false,
      mergeSimilarSegments: false,
      normalizeWhitespace: true
    });

    // Should preserve most original content
    expect(minimalProcessing.segments).toHaveLength(4);
    expect(minimalProcessing.processingStats.fillerWordsRemoved).toBe(0);
    expect(minimalProcessing.processingStats.formattingCleaned).toBe(0);

    // Process with aggressive cleaning
    const aggressiveProcessing = TranscriptProcessor.processTranscript(rawTranscript, {
      removeFillerWords: true,
      cleanFormatting: true,
      mergeSimilarSegments: true,
      minSegmentDuration: 2.0,
      maxSegmentDuration: 10.0,
      normalizeWhitespace: true
    });

    // Should have more processing applied
    expect(aggressiveProcessing.processingStats.fillerWordsRemoved).toBeGreaterThan(0);
    expect(aggressiveProcessing.processingStats.formattingCleaned).toBeGreaterThan(0);
    expect(aggressiveProcessing.processedSegmentCount).toBeLessThanOrEqual(rawTranscript.segments.length);
  });

  it('should preserve timing information during processing', async () => {
    const { YoutubeTranscript } = require('youtube-transcript');
    YoutubeTranscript.fetchTranscript.mockResolvedValue(mockTranscriptData);

    const rawTranscript = await TranscriptService.extractTranscript('test-video-id');
    const processedTranscript = TranscriptProcessor.processTranscript(rawTranscript);

    // Verify timing preservation
    expect(processedTranscript.segments[0].startTime).toBe(0);
    expect(processedTranscript.duration).toBe(rawTranscript.duration);

    // Segments should be in chronological order
    for (let i = 1; i < processedTranscript.segments.length; i++) {
      expect(processedTranscript.segments[i].startTime)
        .toBeGreaterThanOrEqual(processedTranscript.segments[i - 1].startTime);
    }
  });

  it('should handle segmentation of processed transcript', async () => {
    const { YoutubeTranscript } = require('youtube-transcript');
    YoutubeTranscript.fetchTranscript.mockResolvedValue(mockTranscriptData);

    const rawTranscript = await TranscriptService.extractTranscript('test-video-id');
    const processedTranscript = TranscriptProcessor.processTranscript(rawTranscript);

    // Apply additional segmentation
    const segmentedTranscript = TranscriptProcessor.segmentTranscript(
      processedTranscript,
      15, // Max 15 words per segment
      2.0 // 2 second pause threshold
    );

    // Verify segmentation
    expect(segmentedTranscript.length).toBeGreaterThan(0);
    
    // Check word count limits
    segmentedTranscript.forEach(segment => {
      const wordCount = segment.text.split(/\s+/).filter(word => word.length > 0).length;
      // Allow some tolerance for segments that can't be split reasonably
      expect(wordCount).toBeLessThanOrEqual(25);
    });

    // Verify timing continuity
    expect(segmentedTranscript[0].startTime).toBe(0);
    const lastSegment = segmentedTranscript[segmentedTranscript.length - 1];
    expect(lastSegment.endTime).toBe(processedTranscript.duration);
  });

  it('should handle error cases gracefully', async () => {
    const { YoutubeTranscript } = require('youtube-transcript');
    YoutubeTranscript.fetchTranscript.mockRejectedValue(new Error('Video not found'));

    // Should propagate transcript service errors
    await expect(TranscriptService.extractTranscript('invalid-video-id'))
      .rejects.toThrow('Failed to extract transcript');

    // Should handle empty transcript processing
    const emptyTranscript: Transcript = {
      segments: [],
      language: 'en',
      confidence: 1.0,
      duration: 0
    };

    const processedEmpty = TranscriptProcessor.processTranscript(emptyTranscript);
    expect(processedEmpty.segments).toHaveLength(0);
    expect(processedEmpty.cleanedText).toBe('');
    expect(processedEmpty.processingStats.fillerWordsRemoved).toBe(0);
  });
});