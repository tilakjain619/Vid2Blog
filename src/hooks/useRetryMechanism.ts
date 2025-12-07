'use client';

import { useState, useCallback, useRef } from 'react';
import { ProcessingError, isRetryableError, getRetryConfig, normalizeError } from '@/lib/error-handling';

interface RetryState {
  isRetrying: boolean;
  retryCount: number;
  lastError: ProcessingError | null;
  canRetry: boolean;
}

interface RetryOptions {
  maxRetries?: number;
  baseDelay?: number;
  exponentialBackoff?: boolean;
  onRetryAttempt?: (attempt: number, error: ProcessingError) => void;
  onMaxRetriesReached?: (error: ProcessingError) => void;
}

interface UseRetryMechanismReturn {
  retryState: RetryState;
  executeWithRetry: <T>(
    operation: () => Promise<T>,
    options?: RetryOptions
  ) => Promise<T>;
  manualRetry: () => Promise<void>;
  resetRetry: () => void;
}

export function useRetryMechanism(): UseRetryMechanismReturn {
  const [retryState, setRetryState] = useState<RetryState>({
    isRetrying: false,
    retryCount: 0,
    lastError: null,
    canRetry: false
  });

  const lastOperationRef = useRef<{
    operation: () => Promise<any>;
    options: RetryOptions;
  } | null>(null);

  const resetRetry = useCallback(() => {
    setRetryState({
      isRetrying: false,
      retryCount: 0,
      lastError: null,
      canRetry: false
    });
    lastOperationRef.current = null;
  }, []);

  const sleep = (ms: number): Promise<void> => {
    return new Promise(resolve => setTimeout(resolve, ms));
  };

  const calculateDelay = (
    attempt: number,
    baseDelay: number,
    exponentialBackoff: boolean
  ): number => {
    if (!exponentialBackoff) {
      return baseDelay;
    }
    
    // Exponential backoff with jitter
    const exponentialDelay = baseDelay * Math.pow(2, attempt - 1);
    const jitter = Math.random() * 0.1 * exponentialDelay; // 10% jitter
    return Math.min(exponentialDelay + jitter, 60000); // Max 60 seconds
  };

  const executeWithRetry = useCallback(async <T>(
    operation: () => Promise<T>,
    options: RetryOptions = {}
  ): Promise<T> => {
    const {
      maxRetries = 3,
      baseDelay = 1000,
      exponentialBackoff = true,
      onRetryAttempt,
      onMaxRetriesReached
    } = options;

    // Store the operation for manual retry
    lastOperationRef.current = { operation, options };

    let lastError: ProcessingError | null = null;
    
    for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
      try {
        setRetryState(prev => ({
          ...prev,
          isRetrying: attempt > 1,
          retryCount: attempt - 1
        }));

        const result = await operation();
        
        // Success - reset state
        setRetryState({
          isRetrying: false,
          retryCount: 0,
          lastError: null,
          canRetry: false
        });
        
        return result;
        
      } catch (error) {
        const processingError = normalizeError(error);
        lastError = processingError;
        
        setRetryState(prev => ({
          ...prev,
          lastError: processingError,
          canRetry: isRetryableError(processingError) && attempt <= maxRetries
        }));

        // If this is the last attempt or error is not retryable, throw
        if (attempt > maxRetries || !isRetryableError(processingError)) {
          setRetryState(prev => ({
            ...prev,
            isRetrying: false,
            canRetry: false
          }));
          
          if (onMaxRetriesReached && attempt > maxRetries) {
            onMaxRetriesReached(processingError);
          }
          
          throw processingError;
        }

        // Calculate delay for next attempt
        const retryConfig = getRetryConfig(processingError);
        const delay = calculateDelay(
          attempt,
          retryConfig.delay || baseDelay,
          exponentialBackoff
        );

        if (onRetryAttempt) {
          onRetryAttempt(attempt, processingError);
        }

        // Wait before retrying
        await sleep(delay);
      }
    }

    // This should never be reached, but TypeScript requires it
    throw lastError || new Error('Unknown error in retry mechanism');
  }, []);

  const manualRetry = useCallback(async (): Promise<void> => {
    if (!lastOperationRef.current || !retryState.canRetry) {
      return;
    }

    const { operation, options } = lastOperationRef.current;
    
    try {
      await executeWithRetry(operation, {
        ...options,
        maxRetries: 1 // Only try once for manual retry
      });
    } catch (error) {
      // Error is already handled by executeWithRetry
      console.warn('Manual retry failed:', error);
    }
  }, [retryState.canRetry, executeWithRetry]);

  return {
    retryState,
    executeWithRetry,
    manualRetry,
    resetRetry
  };
}

// Specialized hook for API calls with common retry patterns
export function useApiRetry() {
  const { retryState, executeWithRetry, manualRetry, resetRetry } = useRetryMechanism();

  const executeApiCall = useCallback(async <T>(
    apiCall: () => Promise<T>,
    options: {
      endpoint?: string;
      timeout?: number;
    } = {}
  ): Promise<T> => {
    const { timeout = 30000 } = options;

    return executeWithRetry(
      async () => {
        // Add timeout to the API call
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error('Request timed out')), timeout);
        });

        return Promise.race([apiCall(), timeoutPromise]);
      },
      {
        maxRetries: 3,
        baseDelay: 2000,
        exponentialBackoff: true,
        onRetryAttempt: (attempt, error) => {
          console.warn(`API retry attempt ${attempt} for ${options.endpoint || 'unknown endpoint'}:`, error.message);
        },
        onMaxRetriesReached: (error) => {
          console.error(`Max retries reached for ${options.endpoint || 'unknown endpoint'}:`, error);
        }
      }
    );
  }, [executeWithRetry]);

  return {
    retryState,
    executeApiCall,
    manualRetry,
    resetRetry
  };
}

// Hook for processing pipeline with specific retry logic
export function useProcessingRetry() {
  const { retryState, executeWithRetry, manualRetry, resetRetry } = useRetryMechanism();

  const executeProcessingStep = useCallback(async <T>(
    step: () => Promise<T>,
    stepName: string
  ): Promise<T> => {
    return executeWithRetry(
      step,
      {
        maxRetries: 2,
        baseDelay: 5000,
        exponentialBackoff: true,
        onRetryAttempt: (attempt, error) => {
          console.warn(`Processing step "${stepName}" retry attempt ${attempt}:`, error.message);
        },
        onMaxRetriesReached: (error) => {
          console.error(`Processing step "${stepName}" failed after all retries:`, error);
        }
      }
    );
  }, [executeWithRetry]);

  return {
    retryState,
    executeProcessingStep,
    manualRetry,
    resetRetry
  };
}