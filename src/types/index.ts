// Core data models for Vid2Blog application

export interface VideoMetadata {
  id: string;
  title: string;
  description: string;
  duration: number; // seconds
  thumbnailUrl: string;
  channelName: string;
  publishDate: Date;
  viewCount: number;
}

export interface TranscriptSegment {
  text: string;
  startTime: number;
  endTime: number;
  speaker?: string;
  confidence: number;
}

export interface Transcript {
  segments: TranscriptSegment[];
  language: string;
  confidence: number;
  duration: number;
}

export interface TimeRange {
  start: number;
  end: number;
}

export interface Topic {
  name: string;
  relevance: number;
  timeRanges: TimeRange[];
}

export interface KeyPoint {
  text: string;
  importance: number;
  timestamp: number;
  category: string;
}

export interface ArticleSection {
  heading: string;
  content: string;
  subsections?: ArticleSection[];
}

export interface ContentAnalysis {
  topics: Topic[];
  keyPoints: KeyPoint[];
  summary: string;
  suggestedStructure: ArticleSection[];
  sentiment: 'positive' | 'neutral' | 'negative';
}

export interface ArticleMetadata {
  wordCount: number;
  readingTime: number;
  seoTitle: string;
  metaDescription: string;
  sourceVideo: VideoMetadata;
}

export interface Article {
  title: string;
  introduction: string;
  sections: ArticleSection[];
  conclusion: string;
  metadata: ArticleMetadata;
  tags: string[];
}

// Additional utility types for the application

export interface ValidationResult {
  isValid: boolean;
  error?: string;
  videoId?: string;
}

export interface ProcessingStatus {
  stage: 'validation' | 'metadata' | 'transcription' | 'analysis' | 'generation' | 'complete' | 'error';
  progress: number; // 0-100
  message: string;
  estimatedTimeRemaining?: number; // seconds
}

export interface GenerationOptions {
  length: 'short' | 'medium' | 'long';
  tone: 'professional' | 'casual' | 'technical';
  format: 'markdown' | 'html' | 'plain';
  includeTimestamps?: boolean;
  customTemplate?: string;
}

export interface ExportOptions {
  format: 'markdown' | 'html' | 'pdf';
  template?: string;
  includeMetadata?: boolean;
  filename?: string;
}