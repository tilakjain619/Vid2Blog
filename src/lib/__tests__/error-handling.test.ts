import {
  ErrorType,
  createProcessingError,
  analyzeError,
  normalizeError,
  isRetryableError,
  getRetryConfig,
  ERROR_DEFINITIONS
} from '../error-handling';

describe('Error Handling System', () => {
  describe('createProcessingError', () => {
    it('should create a ProcessingError with correct properties', () => {
      const error = createProcessingError(ErrorType.INVALID_URL);
      
      expect(error.name).toBe('ProcessingError');
      expect(error.type).toBe(ErrorType.INVALID_URL);
      expect(error.details.type).toBe(ErrorType.INVALID_URL);
      expect(error.details.userMessage).toBe('Please enter a valid YouTube URL');
      expect(error.details.suggestions).toContain('Make sure the URL starts with https://www.youtube.com/watch?v= or https://youtu.be/');
      expect(error.details.retryable).toBe(false);
    });

    it('should include original error when provided', () => {
      const originalError = new Error('Original error message');
      const error = createProcessingError(ErrorType.NETWORK_ERROR, originalError);
      
      expect(error.originalError).toBe(originalError);
    });

    it('should use custom message when provided', () => {
      const customMessage = 'Custom error message';
      const error = createProcessingError(ErrorType.UNKNOWN_ERROR, undefined, customMessage);
      
      expect(error.details.message).toBe(customMessage);
    });
  });

  describe('analyzeError', () => {
    it('should correctly identify YouTube URL errors', () => {
      expect(analyzeError('Invalid YouTube URL format')).toBe(ErrorType.INVALID_URL);
      expect(analyzeError('Video not found or deleted')).toBe(ErrorType.VIDEO_NOT_FOUND);
      expect(analyzeError('This video is private')).toBe(ErrorType.PRIVATE_VIDEO);
      expect(analyzeError('Age restricted content')).toBe(ErrorType.AGE_RESTRICTED);
      expect(analyzeError('Live stream not supported')).toBe(ErrorType.LIVE_STREAM);
    });

    it('should correctly identify transcript errors', () => {
      expect(analyzeError('No transcript available')).toBe(ErrorType.NO_TRANSCRIPT);
      expect(analyzeError('Transcript is disabled')).toBe(ErrorType.TRANSCRIPT_DISABLED);
      expect(analyzeError('Language unavailable for transcript')).toBe(ErrorType.TRANSCRIPT_LANGUAGE_UNAVAILABLE);
    });

    it('should correctly identify API errors', () => {
      expect(analyzeError('API quota exceeded')).toBe(ErrorType.API_QUOTA_EXCEEDED);
      expect(analyzeError('Invalid API key')).toBe(ErrorType.API_KEY_INVALID);
      expect(analyzeError('Service unavailable')).toBe(ErrorType.SERVICE_UNAVAILABLE);
      expect(analyzeError('Network connection failed')).toBe(ErrorType.NETWORK_ERROR);
      expect(analyzeError('Request timed out')).toBe(ErrorType.TIMEOUT_ERROR);
    });

    it('should default to UNKNOWN_ERROR for unrecognized errors', () => {
      expect(analyzeError('Some random error message')).toBe(ErrorType.UNKNOWN_ERROR);
    });

    it('should handle Error objects', () => {
      const error = new Error('Invalid YouTube URL format');
      expect(analyzeError(error)).toBe(ErrorType.INVALID_URL);
    });
  });

  describe('normalizeError', () => {
    it('should return ProcessingError as-is', () => {
      const processingError = createProcessingError(ErrorType.INVALID_URL);
      const normalized = normalizeError(processingError);
      
      expect(normalized).toBe(processingError);
    });

    it('should convert regular Error to ProcessingError', () => {
      const regularError = new Error('Network connection failed');
      const normalized = normalizeError(regularError);
      
      expect(normalized.type).toBe(ErrorType.NETWORK_ERROR);
      expect(normalized.originalError).toBe(regularError);
    });

    it('should convert string to ProcessingError', () => {
      const errorString = 'API quota exceeded';
      const normalized = normalizeError(errorString);
      
      expect(normalized.type).toBe(ErrorType.API_QUOTA_EXCEEDED);
      expect(normalized.message).toBe('Service temporarily unavailable due to high demand');
    });

    it('should handle unknown types', () => {
      const normalized = normalizeError({ some: 'object' });
      
      expect(normalized.type).toBe(ErrorType.UNKNOWN_ERROR);
    });
  });

  describe('isRetryableError', () => {
    it('should return true for retryable errors', () => {
      const retryableError = createProcessingError(ErrorType.NETWORK_ERROR);
      expect(isRetryableError(retryableError)).toBe(true);
    });

    it('should return false for non-retryable errors', () => {
      const nonRetryableError = createProcessingError(ErrorType.INVALID_URL);
      expect(isRetryableError(nonRetryableError)).toBe(false);
    });
  });

  describe('getRetryConfig', () => {
    it('should return correct retry configuration', () => {
      const error = createProcessingError(ErrorType.API_QUOTA_EXCEEDED);
      const config = getRetryConfig(error);
      
      expect(config.delay).toBe(60000); // 1 minute
      expect(config.maxRetries).toBe(3);
    });

    it('should return default values when not specified', () => {
      const error = createProcessingError(ErrorType.UNKNOWN_ERROR);
      const config = getRetryConfig(error);
      
      expect(config.delay).toBe(5000); // Default 5 seconds
      expect(config.maxRetries).toBe(1); // Default 1 retry
    });
  });

  describe('ERROR_DEFINITIONS', () => {
    it('should have definitions for all error types', () => {
      const errorTypes = Object.values(ErrorType);
      
      errorTypes.forEach(errorType => {
        expect(ERROR_DEFINITIONS[errorType]).toBeDefined();
        expect(ERROR_DEFINITIONS[errorType].message).toBeTruthy();
        expect(ERROR_DEFINITIONS[errorType].userMessage).toBeTruthy();
        expect(ERROR_DEFINITIONS[errorType].suggestions).toBeInstanceOf(Array);
        expect(typeof ERROR_DEFINITIONS[errorType].retryable).toBe('boolean');
      });
    });

    it('should have appropriate retry configurations for retryable errors', () => {
      const retryableErrors = Object.entries(ERROR_DEFINITIONS)
        .filter(([, definition]) => definition.retryable)
        .map(([type]) => type as ErrorType);

      retryableErrors.forEach(errorType => {
        const definition = ERROR_DEFINITIONS[errorType];
        if (definition.retryDelay) {
          expect(definition.retryDelay).toBeGreaterThan(0);
        }
        if (definition.maxRetries) {
          expect(definition.maxRetries).toBeGreaterThan(0);
        }
      });
    });

    it('should have meaningful suggestions for all errors', () => {
      Object.entries(ERROR_DEFINITIONS).forEach(([errorType, definition]) => {
        expect(definition.suggestions.length).toBeGreaterThan(0);
        definition.suggestions.forEach(suggestion => {
          expect(suggestion).toBeTruthy();
          expect(typeof suggestion).toBe('string');
        });
      });
    });
  });

  describe('Error Type Coverage', () => {
    it('should cover all YouTube-related errors', () => {
      const youtubeErrors = [
        ErrorType.INVALID_URL,
        ErrorType.VIDEO_NOT_FOUND,
        ErrorType.PRIVATE_VIDEO,
        ErrorType.AGE_RESTRICTED,
        ErrorType.LIVE_STREAM,
        ErrorType.VIDEO_TOO_LONG,
        ErrorType.VIDEO_TOO_SHORT
      ];

      youtubeErrors.forEach(errorType => {
        expect(ERROR_DEFINITIONS[errorType]).toBeDefined();
        expect(ERROR_DEFINITIONS[errorType].retryable).toBe(false);
      });
    });

    it('should cover all transcript-related errors', () => {
      const transcriptErrors = [
        ErrorType.NO_TRANSCRIPT,
        ErrorType.TRANSCRIPT_DISABLED,
        ErrorType.TRANSCRIPT_LANGUAGE_UNAVAILABLE
      ];

      transcriptErrors.forEach(errorType => {
        expect(ERROR_DEFINITIONS[errorType]).toBeDefined();
        expect(ERROR_DEFINITIONS[errorType].retryable).toBe(false);
      });
    });

    it('should cover all API-related errors', () => {
      const apiErrors = [
        ErrorType.API_QUOTA_EXCEEDED,
        ErrorType.API_KEY_INVALID,
        ErrorType.SERVICE_UNAVAILABLE,
        ErrorType.NETWORK_ERROR,
        ErrorType.TIMEOUT_ERROR
      ];

      apiErrors.forEach(errorType => {
        expect(ERROR_DEFINITIONS[errorType]).toBeDefined();
      });

      // Most API errors should be retryable except API_KEY_INVALID
      expect(ERROR_DEFINITIONS[ErrorType.API_QUOTA_EXCEEDED].retryable).toBe(true);
      expect(ERROR_DEFINITIONS[ErrorType.SERVICE_UNAVAILABLE].retryable).toBe(true);
      expect(ERROR_DEFINITIONS[ErrorType.NETWORK_ERROR].retryable).toBe(true);
      expect(ERROR_DEFINITIONS[ErrorType.TIMEOUT_ERROR].retryable).toBe(true);
      expect(ERROR_DEFINITIONS[ErrorType.API_KEY_INVALID].retryable).toBe(false);
    });
  });
});