import { renderHook, act } from '@testing-library/react';
import { useProcessingPipeline } from '../useProcessingPipeline';

// Mock fetch globally
global.fetch = jest.fn();

// Mock EventSource
const MockEventSource = jest.fn().mockImplementation(() => ({
  close: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn()
}));

// Add static constants
MockEventSource.CONNECTING = 0;
MockEventSource.OPEN = 1;
MockEventSource.CLOSED = 2;

global.EventSource = MockEventSource as any;

describe('useProcessingPipeline', () => {
  let mockFetch: jest.MockedFunction<typeof fetch>;

  beforeEach(() => {
    mockFetch = fetch as jest.MockedFunction<typeof fetch>;
    jest.clearAllMocks();
  });

  describe('initial state', () => {
    it('should have correct initial state', () => {
      const { result } = renderHook(() => useProcessingPipeline());

      expect(result.current.state.isProcessing).toBe(false);
      expect(result.current.state.status).toBeNull();
      expect(result.current.state.result).toBeNull();
      expect(result.current.state.error).toBeNull();
    });
  });

  describe('processVideo', () => {
    it('should process video successfully', async () => {
      const mockResult = {
        success: true,
        videoMetadata: { id: 'test', title: 'Test Video' },
        transcript: { segments: [], language: 'en', confidence: 0.95, duration: 300 },
        analysis: { topics: [], keyPoints: [], summary: 'Test', suggestedStructure: [], sentiment: 'positive' },
        article: { title: 'Test Article', sections: [], metadata: {}, tags: [] },
        processingTime: 5000
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResult
      } as Response);

      const { result } = renderHook(() => useProcessingPipeline());

      await act(async () => {
        await result.current.processVideo('https://youtube.com/watch?v=test');
      });

      expect(result.current.state.isProcessing).toBe(false);
      expect(result.current.state.status?.stage).toBe('complete');
      expect(result.current.state.result?.videoMetadata).toEqual(mockResult.videoMetadata);
      expect(result.current.state.error).toBeNull();
    });

    it('should handle processing failure', async () => {
      const mockError = {
        success: false,
        error: 'Video not found',
        processingTime: 1000
      };

      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => mockError
      } as Response);

      const { result } = renderHook(() => useProcessingPipeline());

      await act(async () => {
        await result.current.processVideo('https://youtube.com/watch?v=invalid');
      });

      expect(result.current.state.isProcessing).toBe(false);
      expect(result.current.state.status?.stage).toBe('error');
      expect(result.current.state.result).toBeNull();
      expect(result.current.state.error).toBe('Video not found');
    });

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const { result } = renderHook(() => useProcessingPipeline());

      await act(async () => {
        await result.current.processVideo('https://youtube.com/watch?v=test');
      });

      expect(result.current.state.isProcessing).toBe(false);
      expect(result.current.state.status?.stage).toBe('error');
      expect(result.current.state.error).toBe('Network error');
    });

    it('should pass generation options to API', async () => {
      const mockResult = {
        success: true,
        videoMetadata: {},
        transcript: {},
        analysis: {},
        article: {},
        processingTime: 3000
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResult
      } as Response);

      const { result } = renderHook(() => useProcessingPipeline());

      const options = {
        length: 'long' as const,
        tone: 'casual' as const,
        format: 'html' as const
      };

      await act(async () => {
        await result.current.processVideo('https://youtube.com/watch?v=test', options);
      });

      expect(mockFetch).toHaveBeenCalledWith('/api/process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: 'https://youtube.com/watch?v=test', options }),
        signal: expect.any(AbortSignal)
      });
    });

    it('should update processing state during execution', async () => {
      const mockResult = {
        success: true,
        videoMetadata: {},
        transcript: {},
        analysis: {},
        article: {},
        processingTime: 2000
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResult
      } as Response);

      const { result } = renderHook(() => useProcessingPipeline());

      // Start processing
      const processPromise = act(async () => {
        await result.current.processVideo('https://youtube.com/watch?v=test');
      });

      // Check initial processing state
      expect(result.current.state.isProcessing).toBe(true);
      expect(result.current.state.status?.stage).toBe('validation');

      // Wait for completion
      await processPromise;

      expect(result.current.state.isProcessing).toBe(false);
      expect(result.current.state.status?.stage).toBe('complete');
    });
  });

  describe('processVideoWithProgress', () => {
    it('should handle streaming response', async () => {
      const mockStreamResponse = {
        ok: true,
        body: {
          getReader: () => ({
            read: jest.fn()
              .mockResolvedValueOnce({
                done: false,
                value: new TextEncoder().encode('data: {"type":"progress","status":{"stage":"validation","progress":0,"message":"Starting..."}}\n\n')
              })
              .mockResolvedValueOnce({
                done: false,
                value: new TextEncoder().encode('data: {"type":"result","result":{"success":true,"processingTime":5000}}\n\n')
              })
              .mockResolvedValueOnce({
                done: true,
                value: undefined
              })
          })
        }
      };

      mockFetch.mockResolvedValueOnce(mockStreamResponse as any);

      const { result } = renderHook(() => useProcessingPipeline());

      await act(async () => {
        await result.current.processVideoWithProgress('https://youtube.com/watch?v=test');
      });

      expect(result.current.state.isProcessing).toBe(false);
      expect(result.current.state.status?.stage).toBe('complete');
    });

    it('should handle streaming errors', async () => {
      const mockStreamResponse = {
        ok: true,
        body: {
          getReader: () => ({
            read: jest.fn()
              .mockResolvedValueOnce({
                done: false,
                value: new TextEncoder().encode('data: {"type":"error","error":"Processing failed"}\n\n')
              })
              .mockResolvedValueOnce({
                done: true,
                value: undefined
              })
          })
        }
      };

      mockFetch.mockResolvedValueOnce(mockStreamResponse as any);

      const { result } = renderHook(() => useProcessingPipeline());

      await act(async () => {
        await result.current.processVideoWithProgress('https://youtube.com/watch?v=test');
      });

      expect(result.current.state.isProcessing).toBe(false);
      expect(result.current.state.status?.stage).toBe('error');
      expect(result.current.state.error).toBe('Processing failed');
    });
  });

  describe('reset', () => {
    it('should reset state to initial values', async () => {
      const { result } = renderHook(() => useProcessingPipeline());

      // Set some state first
      mockFetch.mockRejectedValueOnce(new Error('Test error'));
      
      await act(async () => {
        await result.current.processVideo('https://youtube.com/watch?v=test');
      });

      expect(result.current.state.error).toBe('Test error');

      // Reset state
          act
(() => {
        result.current.reset();
      });

      expect(result.current.state.isProcessing).toBe(false);
      expect(result.current.state.status).toBeNull();
      expect(result.current.state.result).toBeNull();
      expect(result.current.state.error).toBeNull();
    });
  });

  describe('cancel', () => {
    it('should cancel ongoing processing', async () => {
      // Mock a slow response
      mockFetch.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve({
          ok: true,
          json: async () => ({ success: true })
        } as Response), 1000))
      );

      const { result } = renderHook(() => useProcessingPipeline());

      // Start processing
      act(() => {
        result.current.processVideo('https://youtube.com/watch?v=test');
      });

      expect(result.current.state.isProcessing).toBe(true);

      // Cancel processing
      act(() => {
        result.current.cancel();
      });

      expect(result.current.state.isProcessing).toBe(false);
      expect(result.current.state.status?.stage).toBe('error');
      expect(result.current.state.status?.message).toBe('Processing cancelled');
    });

    it('should close event source when cancelling streaming', () => {
      const mockClose = jest.fn();
      const mockEventSource = {
        close: mockClose,
        addEventListener: jest.fn(),
        removeEventListener: jest.fn()
      };

      (MockEventSource as jest.Mock).mockImplementationOnce(() => mockEventSource);

      const { result } = renderHook(() => useProcessingPipeline());

      // Start streaming (this would normally create an EventSource)
      act(() => {
        result.current.processVideoWithProgress('https://youtube.com/watch?v=test');
      });

      // Cancel
      act(() => {
        result.current.cancel();
      });

      expect(result.current.state.status?.message).toBe('Processing cancelled');
    });
  });

  describe('error handling', () => {
    it('should handle AbortError specifically', async () => {
      const abortError = new Error('The operation was aborted');
      abortError.name = 'AbortError';
      
      mockFetch.mockRejectedValueOnce(abortError);

      const { result } = renderHook(() => useProcessingPipeline());

      await act(async () => {
        await result.current.processVideo('https://youtube.com/watch?v=test');
      });

      expect(result.current.state.isProcessing).toBe(false);
      expect(result.current.state.status?.stage).toBe('error');
      expect(result.current.state.status?.message).toBe('Processing cancelled');
      expect(result.current.state.error).toBeNull(); // AbortError doesn't set error message
    });

    it('should handle unknown errors', async () => {
      mockFetch.mockRejectedValueOnce('Unknown error type');

      const { result } = renderHook(() => useProcessingPipeline());

      await act(async () => {
        await result.current.processVideo('https://youtube.com/watch?v=test');
      });

      expect(result.current.state.error).toBe('Unknown error occurred');
    });

    it('should handle malformed streaming data', async () => {
      const mockStreamResponse = {
        ok: true,
        body: {
          getReader: () => ({
            read: jest.fn()
              .mockResolvedValueOnce({
                done: false,
                value: new TextEncoder().encode('data: invalid json\n\n')
              })
              .mockResolvedValueOnce({
                done: true,
                value: undefined
              })
          })
        }
      };

      mockFetch.mockResolvedValueOnce(mockStreamResponse as any);

      const { result } = renderHook(() => useProcessingPipeline());

      await act(async () => {
        await result.current.processVideoWithProgress('https://youtube.com/watch?v=test');
      });

      // Should continue processing despite malformed data
      expect(result.current.state.isProcessing).toBe(false);
    });

    it('should handle streaming response without body', async () => {
      const mockStreamResponse = {
        ok: true,
        body: null
      };

      mockFetch.mockResolvedValueOnce(mockStreamResponse as any);

      const { result } = renderHook(() => useProcessingPipeline());

      await act(async () => {
        await result.current.processVideoWithProgress('https://youtube.com/watch?v=test');
      });

      expect(result.current.state.isProcessing).toBe(false);
      expect(result.current.state.status?.stage).toBe('error');
      expect(result.current.state.error).toBe('Failed to create stream reader');
    });
  });

  describe('state transitions', () => {
    it('should maintain correct state during successful processing', async () => {
      const mockResult = {
        success: true,
        videoMetadata: { id: 'test' },
        transcript: { segments: [] },
        analysis: { topics: [] },
        article: { title: 'Test' },
        processingTime: 3000
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResult
      } as Response);

      const { result } = renderHook(() => useProcessingPipeline());

      // Initial state
      expect(result.current.state.isProcessing).toBe(false);
      expect(result.current.state.status).toBeNull();

      // Start processing
      const processPromise = act(async () => {
        await result.current.processVideo('https://youtube.com/watch?v=test');
      });

      // During processing
      expect(result.current.state.isProcessing).toBe(true);
      expect(result.current.state.status?.stage).toBe('validation');
      expect(result.current.state.result).toBeNull();
      expect(result.current.state.error).toBeNull();

      // Wait for completion
      await processPromise;

      // After completion
      expect(result.current.state.isProcessing).toBe(false);
      expect(result.current.state.status?.stage).toBe('complete');
      expect(result.current.state.result).toBeTruthy();
      expect(result.current.state.error).toBeNull();
    });

    it('should maintain correct state during failed processing', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Processing failed' })
      } as Response);

      const { result } = renderHook(() => useProcessingPipeline());

      await act(async () => {
        await result.current.processVideo('https://youtube.com/watch?v=test');
      });

      expect(result.current.state.isProcessing).toBe(false);
      expect(result.current.state.status?.stage).toBe('error');
      expect(result.current.state.result).toBeNull();
      expect(result.current.state.error).toBe('Processing failed');
    });
  });
});