import { Transcript, TranscriptSegment } from '@/types';

/**
 * Configuration options for transcript processing
 */
export interface TranscriptProcessingOptions {
  removeFillerWords?: boolean;
  mergeSimilarSegments?: boolean;
  minSegmentDuration?: number; // seconds
  maxSegmentDuration?: number; // seconds
  cleanFormatting?: boolean;
  normalizeWhitespace?: boolean;
}

/**
 * Processed transcript with cleaned and formatted content
 */
export interface ProcessedTranscript extends Transcript {
  originalSegmentCount: number;
  processedSegmentCount: number;
  cleanedText: string;
  processingStats: {
    fillerWordsRemoved: number;
    segmentsMerged: number;
    formattingCleaned: number;
  };
}

/**
 * Common filler words and phrases to remove from transcripts
 */
const FILLER_WORDS = new Set([
  'um', 'uh', 'ah', 'er', 'hmm', 'like', 'basically', 'actually', 'literally', 
  'obviously', 'right', 'okay', 'so', 'well', 'yeah', 'yes', 'no', 'sure', 'definitely'
]);

const FILLER_PHRASES = [
  'you know', 'sort of', 'kind of', 'i mean'
];

/**
 * Service for processing and cleaning transcript data
 */
export class TranscriptProcessor {
  /**
   * Process and clean a transcript with various cleaning options
   */
  static processTranscript(
    transcript: Transcript,
    options: TranscriptProcessingOptions = {}
  ): ProcessedTranscript {
    const defaultOptions: Required<TranscriptProcessingOptions> = {
      removeFillerWords: true,
      mergeSimilarSegments: true,
      minSegmentDuration: 1.0,
      maxSegmentDuration: 30.0,
      cleanFormatting: true,
      normalizeWhitespace: true,
      ...options
    };

    let processedSegments = [...transcript.segments];
    const stats = {
      fillerWordsRemoved: 0,
      segmentsMerged: 0,
      formattingCleaned: 0
    };

    // Step 1: Clean individual segment text
    if (defaultOptions.cleanFormatting || defaultOptions.removeFillerWords || defaultOptions.normalizeWhitespace) {
      processedSegments = processedSegments.map(segment => {
        let cleanedText = segment.text;
        
        if (defaultOptions.cleanFormatting) {
          const originalLength = cleanedText.length;
          cleanedText = this.cleanFormatting(cleanedText);
          if (cleanedText.length !== originalLength) {
            stats.formattingCleaned++;
          }
        }

        if (defaultOptions.normalizeWhitespace) {
          cleanedText = this.normalizeWhitespace(cleanedText);
        }

        if (defaultOptions.removeFillerWords) {
          const originalWords = cleanedText.split(/\s+/).length;
          cleanedText = this.removeFillerWords(cleanedText);
          const newWords = cleanedText.split(/\s+/).length;
          stats.fillerWordsRemoved += originalWords - newWords;
        }

        return {
          ...segment,
          text: cleanedText
        };
      }).filter(segment => segment.text.trim().length > 0); // Remove empty segments
    }

    // Step 2: Merge similar or short segments
    if (defaultOptions.mergeSimilarSegments) {
      const mergeResult = this.mergeSegments(processedSegments, defaultOptions);
      processedSegments = mergeResult.segments;
      stats.segmentsMerged = mergeResult.mergedCount;
    }

    // Step 3: Generate cleaned full text
    const cleanedText = processedSegments
      .map(segment => segment.text)
      .join(' ')
      .trim();

    return {
      ...transcript,
      segments: processedSegments,
      originalSegmentCount: transcript.segments.length,
      processedSegmentCount: processedSegments.length,
      cleanedText,
      processingStats: stats
    };
  }

  /**
   * Clean formatting issues from text
   */
  private static cleanFormatting(text: string): string {
    return text
      // Remove HTML tags if any
      .replace(/<[^>]*>/g, '')
      // Remove excessive punctuation
      .replace(/[.]{3,}/g, '...')
      .replace(/[!]{2,}/g, '!')
      .replace(/[?]{2,}/g, '?')
      // Fix common transcription artifacts
      .replace(/\[.*?\]/g, '') // Remove bracketed content like [Music], [Applause]
      .replace(/\(.*?\)/g, '') // Remove parenthetical content
      // Clean up dashes and hyphens
      .replace(/--+/g, ' ')
      .replace(/\s*-\s*/g, ' ')
      // Remove timestamps if they leaked through
      .replace(/\d{1,2}:\d{2}(?::\d{2})?/g, '')
      .trim();
  }

  /**
   * Normalize whitespace in text
   */
  private static normalizeWhitespace(text: string): string {
    return text
      .replace(/\s+/g, ' ') // Multiple spaces to single space
      .replace(/\n\s*\n/g, '\n') // Multiple newlines to single newline
      .trim();
  }

  /**
   * Remove filler words from text
   */
  private static removeFillerWords(text: string): string {
    let cleanedText = text;
    
    // First remove multi-word filler phrases
    for (const phrase of FILLER_PHRASES) {
      const regex = new RegExp(`\\b${phrase}\\b`, 'gi');
      cleanedText = cleanedText.replace(regex, '');
    }
    
    // Then remove single filler words
    const words = cleanedText.split(/\s+/);
    const filteredWords = words.filter(word => {
      if (!word.trim()) return false;
      // Remove punctuation for comparison
      const cleanWord = word.toLowerCase().replace(/[^\w]/g, '');
      return !FILLER_WORDS.has(cleanWord);
    });
    
    return filteredWords.join(' ').replace(/\s+/g, ' ').trim();
  }

  /**
   * Merge segments based on duration and content similarity
   */
  private static mergeSegments(
    segments: TranscriptSegment[],
    options: Required<TranscriptProcessingOptions>
  ): { segments: TranscriptSegment[]; mergedCount: number } {
    if (segments.length === 0) {
      return { segments: [], mergedCount: 0 };
    }

    const mergedSegments: TranscriptSegment[] = [];
    let currentSegment = { ...segments[0] };
    let mergedCount = 0;

    for (let i = 1; i < segments.length; i++) {
      const nextSegment = segments[i];
      const currentDuration = currentSegment.endTime - currentSegment.startTime;
      const gap = nextSegment.startTime - currentSegment.endTime;
      
      // Merge if current segment is too short, gap is small, or would create better duration
      const shouldMerge = 
        currentDuration < options.minSegmentDuration ||
        gap < 1.0 || // Less than 1 second gap
        (currentDuration + (nextSegment.endTime - nextSegment.startTime)) <= options.maxSegmentDuration;

      if (shouldMerge) {
        // Merge segments
        currentSegment = {
          text: `${currentSegment.text} ${nextSegment.text}`.trim(),
          startTime: currentSegment.startTime,
          endTime: nextSegment.endTime,
          confidence: Math.min(currentSegment.confidence, nextSegment.confidence),
          speaker: currentSegment.speaker === nextSegment.speaker ? currentSegment.speaker : undefined
        };
        mergedCount++;
      } else {
        // Save current segment and start new one
        mergedSegments.push(currentSegment);
        currentSegment = { ...nextSegment };
      }
    }

    // Add the last segment
    mergedSegments.push(currentSegment);

    return { segments: mergedSegments, mergedCount };
  }

  /**
   * Parse timestamp from various formats
   */
  static parseTimestamp(timestamp: string): number {
    // Handle formats like "1:23", "1:23:45", "123.45", etc.
    const timeRegex = /^(?:(\d+):)?(\d+):(\d+(?:\.\d+)?)$|^(\d+(?:\.\d+)?)$/;
    const match = timestamp.trim().match(timeRegex);
    
    if (!match) {
      throw new Error(`Invalid timestamp format: ${timestamp}`);
    }

    if (match[4]) {
      // Simple seconds format
      return parseFloat(match[4]);
    } else {
      // HH:MM:SS or MM:SS format
      const hours = match[1] ? parseInt(match[1], 10) : 0;
      const minutes = parseInt(match[2], 10);
      const seconds = parseFloat(match[3]);
      
      return hours * 3600 + minutes * 60 + seconds;
    }
  }

  /**
   * Format timestamp as readable string
   */
  static formatTimestamp(seconds: number, includeHours = false): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    const milliseconds = Math.floor((seconds % 1) * 1000);

    if (includeHours || hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    } else {
      return `${minutes}:${secs.toString().padStart(2, '0')}`;
    }
  }

  /**
   * Segment transcript into logical chunks based on pauses and content
   */
  static segmentTranscript(
    transcript: Transcript,
    maxSegmentLength = 300, // words
    pauseThreshold = 3.0 // seconds
  ): TranscriptSegment[] {
    const segments: TranscriptSegment[] = [];
    let currentSegment: TranscriptSegment | null = null;
    let currentWordCount = 0;

    for (const segment of transcript.segments) {
      const words = segment.text.split(/\s+/).filter(word => word.length > 0);
      const gap = currentSegment ? segment.startTime - currentSegment.endTime : 0;

      // Start new segment if:
      // 1. No current segment
      // 2. Large pause detected
      // 3. Word count would exceed limit
      if (!currentSegment || gap > pauseThreshold || currentWordCount + words.length > maxSegmentLength) {
        if (currentSegment) {
          segments.push(currentSegment);
        }
        
        // If this single segment exceeds the limit, we still need to include it
        // but we'll split it if it's extremely long
        if (words.length > maxSegmentLength) {
          // Split very long segments into smaller chunks
          const chunks = this.splitLongSegment(segment, maxSegmentLength);
          segments.push(...chunks);
          currentSegment = null;
          currentWordCount = 0;
        } else {
          currentSegment = { ...segment };
          currentWordCount = words.length;
        }
      } else {
        // Merge with current segment
        currentSegment = {
          text: `${currentSegment.text} ${segment.text}`.trim(),
          startTime: currentSegment.startTime,
          endTime: segment.endTime,
          confidence: Math.min(currentSegment.confidence, segment.confidence),
          speaker: currentSegment.speaker === segment.speaker ? currentSegment.speaker : undefined
        };
        currentWordCount += words.length;
      }
    }

    // Add the last segment
    if (currentSegment) {
      segments.push(currentSegment);
    }

    return segments;
  }

  /**
   * Split a very long segment into smaller chunks
   */
  private static splitLongSegment(segment: TranscriptSegment, maxWords: number): TranscriptSegment[] {
    const words = segment.text.split(/\s+/);
    if (words.length <= maxWords) {
      return [segment];
    }

    const chunks: TranscriptSegment[] = [];
    const duration = segment.endTime - segment.startTime;
    const wordsPerSecond = words.length / duration;

    for (let i = 0; i < words.length; i += maxWords) {
      const chunkWords = words.slice(i, i + maxWords);
      const chunkDuration = chunkWords.length / wordsPerSecond;
      const chunkStart = segment.startTime + (i / wordsPerSecond);
      const chunkEnd = Math.min(chunkStart + chunkDuration, segment.endTime);

      chunks.push({
        text: chunkWords.join(' '),
        startTime: chunkStart,
        endTime: chunkEnd,
        confidence: segment.confidence,
        speaker: segment.speaker
      });
    }

    return chunks;
  }
}