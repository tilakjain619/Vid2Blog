import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ErrorDisplay, ErrorDisplayCompact } from '../ErrorDisplay';
import { createProcessingError, ErrorType } from '@/lib/error-handling';

// Mock timers for auto-retry testing
jest.useFakeTimers();

describe('ErrorDisplay', () => {
  afterEach(() => {
    jest.clearAllTimers();
    jest.runOnlyPendingTimers();
  });

  it('should render null when no error is provided', () => {
    const { container } = render(<ErrorDisplay error={null} />);
    expect(container.firstChild).toBeNull();
  });

  it('should display error message and suggestions', () => {
    const error = createProcessingError(ErrorType.INVALID_URL);
    
    render(<ErrorDisplay error={error} />);
    
    expect(screen.getByText(error.details.userMessage)).toBeInTheDocument();
    expect(screen.getByText('Here\'s what you can try:')).toBeInTheDocument();
    
    error.details.suggestions.forEach(suggestion => {
      expect(screen.getByText(suggestion)).toBeInTheDocument();
    });
  });

  it('should handle string errors', () => {
    const errorMessage = 'Something went wrong';
    
    render(<ErrorDisplay error={errorMessage} />);
    
    expect(screen.getByText(errorMessage)).toBeInTheDocument();
  });

  it('should handle regular Error objects', () => {
    const error = new Error('Regular error message');
    
    render(<ErrorDisplay error={error} />);
    
    expect(screen.getByText(error.message)).toBeInTheDocument();
  });

  it('should show retry button for retryable errors', () => {
    const error = createProcessingError(ErrorType.NETWORK_ERROR);
    const onRetry = jest.fn();
    
    render(<ErrorDisplay error={error} onRetry={onRetry} />);
    
    const retryButton = screen.getByText('Try Again');
    expect(retryButton).toBeInTheDocument();
    
    fireEvent.click(retryButton);
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('should not show retry button for non-retryable errors', () => {
    const error = createProcessingError(ErrorType.INVALID_URL);
    const onRetry = jest.fn();
    
    render(<ErrorDisplay error={error} onRetry={onRetry} />);
    
    expect(screen.queryByText('Try Again')).not.toBeInTheDocument();
  });

  it('should show dismiss button when onDismiss is provided', () => {
    const error = createProcessingError(ErrorType.NETWORK_ERROR);
    const onDismiss = jest.fn();
    
    render(<ErrorDisplay error={error} onDismiss={onDismiss} />);
    
    const dismissButton = screen.getByLabelText('Dismiss error');
    expect(dismissButton).toBeInTheDocument();
    
    fireEvent.click(dismissButton);
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('should show technical details when showDetails is true', () => {
    const error = createProcessingError(ErrorType.NETWORK_ERROR);
    
    render(<ErrorDisplay error={error} showDetails={true} />);
    
    expect(screen.getByText('Technical Details')).toBeInTheDocument();
    expect(screen.getByText('Error Type:')).toBeInTheDocument();
    expect(screen.getByText(error.type)).toBeInTheDocument();
  });

  it('should handle auto-retry for retryable errors', async () => {
    const error = createProcessingError(ErrorType.NETWORK_ERROR);
    const onRetry = jest.fn();
    
    render(<ErrorDisplay error={error} onRetry={onRetry} autoRetry={true} />);
    
    // Should show countdown
    expect(screen.getByText(/Retrying automatically in \d+ seconds/)).toBeInTheDocument();
    
    // Fast-forward through countdown
    act(() => {
      jest.advanceTimersByTime(5000);
    });
    
    await waitFor(() => {
      expect(onRetry).toHaveBeenCalledTimes(1);
    });
  });

  it('should allow canceling auto-retry', () => {
    const error = createProcessingError(ErrorType.NETWORK_ERROR);
    const onRetry = jest.fn();
    
    render(<ErrorDisplay error={error} onRetry={onRetry} autoRetry={true} />);
    
    const cancelButton = screen.getByText('Cancel Auto-Retry');
    fireEvent.click(cancelButton);
    
    // Fast-forward past retry time
    act(() => {
      jest.advanceTimersByTime(10000);
    });
    
    expect(onRetry).not.toHaveBeenCalled();
  });

  it('should respect max retry attempts', () => {
    const error = createProcessingError(ErrorType.API_QUOTA_EXCEEDED);
    const onRetry = jest.fn();
    
    // Simulate multiple retry attempts by re-rendering with updated retry count
    const { rerender } = render(<ErrorDisplay error={error} onRetry={onRetry} />);
    
    // Click retry multiple times to exceed max retries
    const maxRetries = error.details.maxRetries || 1;
    for (let i = 0; i < maxRetries + 1; i++) {
      const retryButton = screen.queryByText('Try Again');
      if (retryButton) {
        fireEvent.click(retryButton);
      }
    }
    
    // Should eventually show max retries reached message
    expect(screen.getByText(/Maximum retry attempts reached/)).toBeInTheDocument();
  });

  it('should apply custom className', () => {
    const error = createProcessingError(ErrorType.NETWORK_ERROR);
    const customClass = 'custom-error-class';
    
    const { container } = render(<ErrorDisplay error={error} className={customClass} />);
    
    expect(container.firstChild).toHaveClass(customClass);
  });
});

describe('ErrorDisplayCompact', () => {
  it('should render null when no error is provided', () => {
    const { container } = render(<ErrorDisplayCompact error={null} />);
    expect(container.firstChild).toBeNull();
  });

  it('should display error message in compact format', () => {
    const error = createProcessingError(ErrorType.INVALID_URL);
    
    render(<ErrorDisplayCompact error={error} />);
    
    expect(screen.getByText(error.details.userMessage)).toBeInTheDocument();
  });

  it('should show retry button when onRetry is provided', () => {
    const error = createProcessingError(ErrorType.NETWORK_ERROR);
    const onRetry = jest.fn();
    
    render(<ErrorDisplayCompact error={error} onRetry={onRetry} />);
    
    const retryButton = screen.getByText('Retry');
    expect(retryButton).toBeInTheDocument();
    
    fireEvent.click(retryButton);
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('should handle string errors in compact format', () => {
    const errorMessage = 'Network error occurred';
    
    render(<ErrorDisplayCompact error={errorMessage} />);
    
    expect(screen.getByText(errorMessage)).toBeInTheDocument();
  });

  it('should handle regular Error objects in compact format', () => {
    const error = new Error('Processing failed');
    
    render(<ErrorDisplayCompact error={error} />);
    
    expect(screen.getByText(error.message)).toBeInTheDocument();
  });

  it('should apply custom className', () => {
    const error = createProcessingError(ErrorType.NETWORK_ERROR);
    const customClass = 'custom-compact-class';
    
    const { container } = render(<ErrorDisplayCompact error={error} className={customClass} />);
    
    expect(container.firstChild).toHaveClass(customClass);
  });
});

// Helper function for act
function act(callback: () => void) {
  callback();
}