import { renderHook, act } from '@testing-library/react';
import { useRetryMechanism, useApiRetry, useProcessingRetry } from '../useRetryMechanism';
import { createProcessingError, ErrorType } from '@/lib/error-handling';

// Mock timers
jest.useFakeTimers();

describe('useRetryMechanism', () => {
  beforeEach(() => {
    jest.clearAllTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
    jest.useFakeTimers();
  });

  describe('executeWithRetry', () => {
    it('should execute operation successfully on first try', async () => {
      const { result } = renderHook(() => useRetryMechanism());
      const mockOperation = jest.fn().mockResolvedValue('success');

      let operationResult: string;
      await act(async () => {
        operationResult = await result.current.executeWithRetry(mockOperation);
      });

      expect(operationResult!).toBe('success');
      expect(mockOperation).toHaveBeenCalledTimes(1);
      expect(result.current.retryState.retryCount).toBe(0);
      expect(result.current.retryState.isRetrying).toBe(false);
    });

    it('should retry on retryable errors', async () => {
      const { result } = renderHook(() => useRetryMechanism());
      const retryableError = createProcessingError(ErrorType.NETWORK_ERROR);
      const mockOperation = jest.fn()
        .mockRejectedValueOnce(retryableError)
        .mockRejectedValueOnce(retryableError)
        .mockResolvedValue('success');

      let operationResult: string;
      const executePromise = act(async () => {
        operationResult = await result.current.executeWithRetry(mockOperation, {
          maxRetries: 3,
          baseDelay: 1000,
          exponentialBackoff: false
        });
      });

      // Fast-forward through delays
      await act(async () => {
        jest.advanceTimersByTime(1000);
        await Promise.resolve();
        jest.advanceTimersByTime(1000);
        await Promise.resolve();
      });

      await executePromise;

      expect(operationResult!).toBe('success');
      expect(mockOperation).toHaveBeenCalledTimes(3);
    });

    it('should not retry on non-retryable errors', async () => {
      const { result } = renderHook(() => useRetryMechanism());
      const nonRetryableError = createProcessingError(ErrorType.INVALID_URL);
      const mockOperation = jest.fn().mockRejectedValue(nonRetryableError);

      await act(async () => {
        try {
          await result.current.executeWithRetry(mockOperation);
        } catch (error) {
          expect(error).toBe(nonRetryableError);
        }
      });

      expect(mockOperation).toHaveBeenCalledTimes(1);
      expect(result.current.retryState.canRetry).toBe(false);
    });

    it('should stop retrying after max attempts', async () => {
      const { result } = renderHook(() => useRetryMechanism());
      const retryableError = createProcessingError(ErrorType.NETWORK_ERROR);
      const mockOperation = jest.fn().mockRejectedValue(retryableError);

      const executePromise = act(async () => {
        try {
          await result.current.executeWithRetry(mockOperation, {
            maxRetries: 2,
            baseDelay: 100,
            exponentialBackoff: false
          });
        } catch (error) {
          expect(error).toBe(retryableError);
        }
      });

      // Fast-forward through delays
      await act(async () => {
        jest.advanceTimersByTime(100);
        await Promise.resolve();
        jest.advanceTimersByTime(100);
        await Promise.resolve();
      });

      await executePromise;

      expect(mockOperation).toHaveBeenCalledTimes(3); // Initial + 2 retries
      expect(result.current.retryState.canRetry).toBe(false);
    });

    it('should use exponential backoff when enabled', async () => {
      const { result } = renderHook(() => useRetryMechanism());
      const retryableError = createProcessingError(ErrorType.NETWORK_ERROR);
      const mockOperation = jest.fn()
        .mockRejectedValueOnce(retryableError)
        .mockRejectedValueOnce(retryableError)
        .mockResolvedValue('success');

      const executePromise = act(async () => {
        await result.current.executeWithRetry(mockOperation, {
          maxRetries: 2,
          baseDelay: 1000,
          exponentialBackoff: true
        });
      });

      // First retry should be ~1000ms, second should be ~2000ms (with jitter)
      await act(async () => {
        jest.advanceTimersByTime(1500); // Account for jitter
        await Promise.resolve();
        jest.advanceTimersByTime(2500); // Account for jitter
        await Promise.resolve();
      });

      await executePromise;

      expect(mockOperation).toHaveBeenCalledTimes(3);
    });

    it('should call retry callbacks', async () => {
      const { result } = renderHook(() => useRetryMechanism());
      const retryableError = createProcessingError(ErrorType.NETWORK_ERROR);
      const mockOperation = jest.fn()
        .mockRejectedValueOnce(retryableError)
        .mockResolvedValue('success');

      const onRetryAttempt = jest.fn();
      const onMaxRetriesReached = jest.fn();

      const executePromise = act(async () => {
        await result.current.executeWithRetry(mockOperation, {
          maxRetries: 1,
          baseDelay: 100,
          onRetryAttempt,
          onMaxRetriesReached
        });
      });

      await act(async () => {
        jest.advanceTimersByTime(100);
        await Promise.resolve();
      });

      await executePromise;

      expect(onRetryAttempt).toHaveBeenCalledWith(1, retryableError);
      expect(onMaxRetriesReached).not.toHaveBeenCalled();
    });
  });

  describe('manualRetry', () => {
    it('should retry the last operation', async () => {
      const { result } = renderHook(() => useRetryMechanism());
      const retryableError = createProcessingError(ErrorType.NETWORK_ERROR);
      const mockOperation = jest.fn()
        .mockRejectedValueOnce(retryableError)
        .mockResolvedValue('success');

      // First execution fails
      await act(async () => {
        try {
          await result.current.executeWithRetry(mockOperation, { maxRetries: 0 });
        } catch (error) {
          // Expected to fail
        }
      });

      expect(result.current.retryState.canRetry).toBe(true);

      // Manual retry should succeed
      await act(async () => {
        await result.current.manualRetry();
      });

      expect(mockOperation).toHaveBeenCalledTimes(2);
    });

    it('should not retry if no previous operation', async () => {
      const { result } = renderHook(() => useRetryMechanism());

      await act(async () => {
        await result.current.manualRetry();
      });

      // Should not throw or cause issues
      expect(result.current.retryState.retryCount).toBe(0);
    });
  });

  describe('resetRetry', () => {
    it('should reset retry state', async () => {
      const { result } = renderHook(() => useRetryMechanism());
      const retryableError = createProcessingError(ErrorType.NETWORK_ERROR);
      const mockOperation = jest.fn().mockRejectedValue(retryableError);

      // Execute and fail
      await act(async () => {
        try {
          await result.current.executeWithRetry(mockOperation, { maxRetries: 0 });
        } catch (error) {
          // Expected to fail
        }
      });

      expect(result.current.retryState.lastError).toBeTruthy();
      expect(result.current.retryState.canRetry).toBe(true);

      // Reset
      act(() => {
        result.current.resetRetry();
      });

      expect(result.current.retryState.lastError).toBeNull();
      expect(result.current.retryState.canRetry).toBe(false);
      expect(result.current.retryState.retryCount).toBe(0);
    });
  });
});

describe('useApiRetry', () => {
  beforeEach(() => {
    jest.clearAllTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
    jest.useFakeTimers();
  });

  it('should add timeout to API calls', async () => {
    const { result } = renderHook(() => useApiRetry());
    const mockApiCall = jest.fn().mockImplementation(() => 
      new Promise(resolve => setTimeout(() => resolve('success'), 5000))
    );

    const executePromise = act(async () => {
      try {
        await result.current.executeApiCall(mockApiCall, { timeout: 1000 });
      } catch (error) {
        expect(error.message).toContain('timed out');
      }
    });

    // Fast-forward past timeout
    await act(async () => {
      jest.advanceTimersByTime(1000);
      await Promise.resolve();
    });

    await executePromise;
  });

  it('should use API-specific retry configuration', async () => {
    const { result } = renderHook(() => useApiRetry());
    const retryableError = createProcessingError(ErrorType.NETWORK_ERROR);
    const mockApiCall = jest.fn()
      .mockRejectedValueOnce(retryableError)
      .mockResolvedValue('success');

    const executePromise = act(async () => {
      await result.current.executeApiCall(mockApiCall, { endpoint: '/test' });
    });

    // Fast-forward through retry delay
    await act(async () => {
      jest.advanceTimersByTime(2000);
      await Promise.resolve();
    });

    await executePromise;

    expect(mockApiCall).toHaveBeenCalledTimes(2);
  });
});

describe('useProcessingRetry', () => {
  beforeEach(() => {
    jest.clearAllTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
    jest.useFakeTimers();
  });

  it('should use processing-specific retry configuration', async () => {
    const { result } = renderHook(() => useProcessingRetry());
    const retryableError = createProcessingError(ErrorType.PROCESSING_FAILED);
    const mockStep = jest.fn()
      .mockRejectedValueOnce(retryableError)
      .mockResolvedValue('success');

    const executePromise = act(async () => {
      await result.current.executeProcessingStep(mockStep, 'test-step');
    });

    // Fast-forward through retry delay
    await act(async () => {
      jest.advanceTimersByTime(5000);
      await Promise.resolve();
    });

    await executePromise;

    expect(mockStep).toHaveBeenCalledTimes(2);
  });
});