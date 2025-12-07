/**
 * Comprehensive error handling system for Vid2Blog
 * Handles specific error cases with user-friendly messages and recovery suggestions
 */

export enum ErrorType {
  // YouTube URL and Video Errors
  INVALID_URL = 'INVALID_URL',
  VIDEO_NOT_FOUND = 'VIDEO_NOT_FOUND',
  PRIVATE_VIDEO = 'PRIVATE_VIDEO',
  AGE_RESTRICTED = 'AGE_RESTRICTED',
  LIVE_STREAM = 'LIVE_STREAM',
  VIDEO_TOO_LONG = 'VIDEO_TOO_LONG',
  VIDEO_TOO_SHORT = 'VIDEO_TOO_SHORT',
  
  // Transcript Errors
  NO_TRANSCRIPT = 'NO_TRANSCRIPT',
  TRANSCRIPT_DISABLED = 'TRANSCRIPT_DISABLED',
  TRANSCRIPT_LANGUAGE_UNAVAILABLE = 'TRANSCRIPT_LANGUAGE_UNAVAILABLE',
  
  // API and Service Errors
  API_QUOTA_EXCEEDED = 'API_QUOTA_EXCEEDED',
  API_KEY_INVALID = 'API_KEY_INVALID',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  NETWORK_ERROR = 'NETWORK_ERROR',
  TIMEOUT_ERROR = 'TIMEOUT_ERROR',
  
  // Processing Errors
  PROCESSING_FAILED = 'PROCESSING_FAILED',
  CONTENT_ANALYSIS_FAILED = 'CONTENT_ANALYSIS_FAILED',
  ARTICLE_GENERATION_FAILED = 'ARTICLE_GENERATION_FAILED',
  
  // General Errors
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR'
}

export interface ErrorDetails {
  type: ErrorType;
  message: string;
  userMessage: string;
  suggestions: string[];
  retryable: boolean;
  retryDelay?: number; // in milliseconds
  maxRetries?: number;
}

export interface ProcessingError extends Error {
  type: ErrorType;
  details: ErrorDetails;
  originalError?: Error;
}

/**
 * Error definitions with user-friendly messages and recovery suggestions
 */
export const ERROR_DEFINITIONS: Record<ErrorType, Omit<ErrorDetails, 'type'>> = {
  [ErrorType.INVALID_URL]: {
    message: 'Invalid YouTube URL format',
    userMessage: 'Please enter a valid YouTube URL',
    suggestions: [
      'Make sure the URL starts with https://www.youtube.com/watch?v= or https://youtu.be/',
      'Copy the URL directly from your browser\'s address bar',
      'Check that the URL is complete and not truncated'
    ],
    retryable: false
  },

  [ErrorType.VIDEO_NOT_FOUND]: {
    message: 'Video not found or unavailable',
    userMessage: 'This video could not be found',
    suggestions: [
      'Check that the URL is correct',
      'The video may have been deleted or made private',
      'Try a different video URL'
    ],
    retryable: false
  },

  [ErrorType.PRIVATE_VIDEO]: {
    message: 'Video is private or restricted',
    userMessage: 'This video is private and cannot be processed',
    suggestions: [
      'Only public videos can be processed',
      'Ask the video owner to make it public',
      'Try a different public video'
    ],
    retryable: false
  },

  [ErrorType.AGE_RESTRICTED]: {
    message: 'Video is age-restricted',
    userMessage: 'Age-restricted videos cannot be processed',
    suggestions: [
      'Age-restricted content requires authentication',
      'Try a different video that is not age-restricted',
      'Contact support if you need to process this type of content'
    ],
    retryable: false
  },

  [ErrorType.LIVE_STREAM]: {
    message: 'Live streams are not supported',
    userMessage: 'Live streams cannot be processed',
    suggestions: [
      'Wait until the live stream ends',
      'Live streams need to be completed before processing',
      'Try again once the stream has finished'
    ],
    retryable: false
  },

  [ErrorType.VIDEO_TOO_LONG]: {
    message: 'Video exceeds maximum duration limit',
    userMessage: 'This video is too long to process',
    suggestions: [
      'Videos must be 3 hours or shorter',
      'Try a shorter video',
      'Consider breaking longer content into segments'
    ],
    retryable: false
  },

  [ErrorType.VIDEO_TOO_SHORT]: {
    message: 'Video is too short for processing',
    userMessage: 'This video is too short to generate meaningful content',
    suggestions: [
      'Videos must be at least 1 minute long',
      'Try a longer video with more content',
      'Combine with other short videos if possible'
    ],
    retryable: false
  },

  [ErrorType.NO_TRANSCRIPT]: {
    message: 'No transcript available for this video',
    userMessage: 'This video doesn\'t have captions or transcripts',
    suggestions: [
      'The video needs to have captions or auto-generated subtitles',
      'Ask the creator to add captions',
      'Try a video that has captions enabled'
    ],
    retryable: false
  },

  [ErrorType.TRANSCRIPT_DISABLED]: {
    message: 'Transcripts are disabled for this video',
    userMessage: 'Captions are disabled for this video',
    suggestions: [
      'The video owner has disabled captions',
      'Try a different video with captions enabled',
      'Contact the video owner to enable captions'
    ],
    retryable: false
  },

  [ErrorType.TRANSCRIPT_LANGUAGE_UNAVAILABLE]: {
    message: 'Transcript not available in requested language',
    userMessage: 'Captions are not available in the requested language',
    suggestions: [
      'Try selecting a different language',
      'Check if auto-generated captions are available',
      'Use the original video language if available'
    ],
    retryable: false
  },

  [ErrorType.API_QUOTA_EXCEEDED]: {
    message: 'API quota exceeded',
    userMessage: 'Service temporarily unavailable due to high demand',
    suggestions: [
      'Please try again in a few minutes',
      'The service will be available again soon',
      'Consider trying during off-peak hours'
    ],
    retryable: true,
    retryDelay: 60000, // 1 minute
    maxRetries: 3
  },

  [ErrorType.API_KEY_INVALID]: {
    message: 'Invalid API key configuration',
    userMessage: 'Service configuration error',
    suggestions: [
      'Please contact support',
      'This appears to be a configuration issue',
      'Try again later or contact the administrator'
    ],
    retryable: false
  },

  [ErrorType.SERVICE_UNAVAILABLE]: {
    message: 'Service temporarily unavailable',
    userMessage: 'The service is temporarily unavailable',
    suggestions: [
      'Please try again in a few minutes',
      'Check your internet connection',
      'The service may be undergoing maintenance'
    ],
    retryable: true,
    retryDelay: 30000, // 30 seconds
    maxRetries: 5
  },

  [ErrorType.NETWORK_ERROR]: {
    message: 'Network connection error',
    userMessage: 'Unable to connect to the service',
    suggestions: [
      'Check your internet connection',
      'Try refreshing the page',
      'Disable any VPN or proxy if you\'re using one'
    ],
    retryable: true,
    retryDelay: 5000, // 5 seconds
    maxRetries: 3
  },

  [ErrorType.TIMEOUT_ERROR]: {
    message: 'Request timed out',
    userMessage: 'The request took too long to complete',
    suggestions: [
      'Try again with a shorter video',
      'Check your internet connection',
      'The service may be experiencing high load'
    ],
    retryable: true,
    retryDelay: 10000, // 10 seconds
    maxRetries: 2
  },

  [ErrorType.PROCESSING_FAILED]: {
    message: 'Processing pipeline failed',
    userMessage: 'Failed to process the video',
    suggestions: [
      'Try again in a few minutes',
      'Check that the video is accessible',
      'Try a different video to see if the issue persists'
    ],
    retryable: true,
    retryDelay: 15000, // 15 seconds
    maxRetries: 2
  },

  [ErrorType.CONTENT_ANALYSIS_FAILED]: {
    message: 'Content analysis failed',
    userMessage: 'Unable to analyze the video content',
    suggestions: [
      'The video content may be too complex to analyze',
      'Try a video with clearer speech',
      'Ensure the video has good audio quality'
    ],
    retryable: true,
    retryDelay: 10000, // 10 seconds
    maxRetries: 2
  },

  [ErrorType.ARTICLE_GENERATION_FAILED]: {
    message: 'Article generation failed',
    userMessage: 'Unable to generate the blog article',
    suggestions: [
      'Try again with different generation options',
      'The content may need manual review',
      'Try a video with more structured content'
    ],
    retryable: true,
    retryDelay: 10000, // 10 seconds
    maxRetries: 2
  },

  [ErrorType.UNKNOWN_ERROR]: {
    message: 'An unknown error occurred',
    userMessage: 'Something unexpected happened',
    suggestions: [
      'Please try again',
      'If the problem persists, contact support',
      'Try refreshing the page'
    ],
    retryable: true,
    retryDelay: 5000, // 5 seconds
    maxRetries: 1
  },

  [ErrorType.VALIDATION_ERROR]: {
    message: 'Validation error',
    userMessage: 'The provided information is invalid',
    suggestions: [
      'Please check your input and try again',
      'Make sure all required fields are filled',
      'Verify the format of the information provided'
    ],
    retryable: false
  }
};

/**
 * Creates a ProcessingError with detailed information
 */
export function createProcessingError(
  type: ErrorType,
  originalError?: Error,
  customMessage?: string
): ProcessingError {
  const definition = ERROR_DEFINITIONS[type];
  const details: ErrorDetails = {
    type,
    ...definition,
    message: customMessage || definition.message
  };

  const error = new Error(details.userMessage) as ProcessingError;
  error.name = 'ProcessingError';
  error.type = type;
  error.details = details;
  error.originalError = originalError;

  return error;
}

/**
 * Analyzes an error and returns the appropriate ErrorType
 */
export function analyzeError(error: Error | string): ErrorType {
  const message = typeof error === 'string' ? error : error.message;
  const lowerMessage = message.toLowerCase();

  // YouTube URL and Video Errors
  if (lowerMessage.includes('invalid') && lowerMessage.includes('url')) {
    return ErrorType.INVALID_URL;
  }
  if (lowerMessage.includes('not found') || lowerMessage.includes('deleted')) {
    return ErrorType.VIDEO_NOT_FOUND;
  }
  if (lowerMessage.includes('private') || lowerMessage.includes('restricted access')) {
    return ErrorType.PRIVATE_VIDEO;
  }
  if (lowerMessage.includes('age') && lowerMessage.includes('restricted')) {
    return ErrorType.AGE_RESTRICTED;
  }
  if (lowerMessage.includes('live') && lowerMessage.includes('stream')) {
    return ErrorType.LIVE_STREAM;
  }
  if (lowerMessage.includes('too long') || lowerMessage.includes('duration')) {
    return ErrorType.VIDEO_TOO_LONG;
  }
  if (lowerMessage.includes('too short')) {
    return ErrorType.VIDEO_TOO_SHORT;
  }

  // Transcript Errors
  if (lowerMessage.includes('no transcript') || lowerMessage.includes('transcript not found')) {
    return ErrorType.NO_TRANSCRIPT;
  }
  if (lowerMessage.includes('transcript') && lowerMessage.includes('disabled')) {
    return ErrorType.TRANSCRIPT_DISABLED;
  }
  if (lowerMessage.includes('language') && lowerMessage.includes('unavailable')) {
    return ErrorType.TRANSCRIPT_LANGUAGE_UNAVAILABLE;
  }

  // API and Service Errors
  if (lowerMessage.includes('quota') || lowerMessage.includes('limit')) {
    return ErrorType.API_QUOTA_EXCEEDED;
  }
  if (lowerMessage.includes('api key') || lowerMessage.includes('unauthorized')) {
    return ErrorType.API_KEY_INVALID;
  }
  if (lowerMessage.includes('service unavailable') || lowerMessage.includes('503')) {
    return ErrorType.SERVICE_UNAVAILABLE;
  }
  if (lowerMessage.includes('network') || lowerMessage.includes('connection')) {
    return ErrorType.NETWORK_ERROR;
  }
  if (lowerMessage.includes('timeout') || lowerMessage.includes('timed out')) {
    return ErrorType.TIMEOUT_ERROR;
  }

  // Processing Errors
  if (lowerMessage.includes('processing') && lowerMessage.includes('failed')) {
    return ErrorType.PROCESSING_FAILED;
  }
  if (lowerMessage.includes('analysis') && lowerMessage.includes('failed')) {
    return ErrorType.CONTENT_ANALYSIS_FAILED;
  }
  if (lowerMessage.includes('generation') && lowerMessage.includes('failed')) {
    return ErrorType.ARTICLE_GENERATION_FAILED;
  }
  if (lowerMessage.includes('validation')) {
    return ErrorType.VALIDATION_ERROR;
  }

  return ErrorType.UNKNOWN_ERROR;
}

/**
 * Converts any error to a ProcessingError
 */
export function normalizeError(error: unknown): ProcessingError {
  if (error instanceof Error && 'type' in error && 'details' in error) {
    return error as ProcessingError;
  }

  const errorMessage = error instanceof Error ? error.message : String(error);
  const errorType = analyzeError(errorMessage);
  
  return createProcessingError(
    errorType,
    error instanceof Error ? error : undefined,
    errorMessage
  );
}

/**
 * Checks if an error is retryable
 */
export function isRetryableError(error: ProcessingError): boolean {
  return error.details.retryable;
}

/**
 * Gets retry configuration for an error
 */
export function getRetryConfig(error: ProcessingError): {
  delay: number;
  maxRetries: number;
} {
  return {
    delay: error.details.retryDelay || 5000,
    maxRetries: error.details.maxRetries || 1
  };
}