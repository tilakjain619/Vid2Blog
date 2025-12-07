import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ErrorBoundary, useErrorBoundary } from '../ErrorBoundary';

// Mock console.error to avoid noise in tests
const originalConsoleError = console.error;
beforeAll(() => {
  console.error = jest.fn();
});

afterAll(() => {
  console.error = originalConsoleError;
});

// Test component that throws an error
const ThrowError: React.FC<{ shouldThrow?: boolean; error?: Error }> = ({ 
  shouldThrow = false, 
  error = new Error('Test error') 
}) => {
  if (shouldThrow) {
    throw error;
  }
  return <div>No error</div>;
};

// Test component using useErrorBoundary hook
const UseErrorBoundaryComponent: React.FC<{ shouldThrow?: boolean }> = ({ shouldThrow = false }) => {
  const { captureError, resetError } = useErrorBoundary();
  
  const handleThrow = () => {
    captureError(new Error('Hook error'));
  };
  
  if (shouldThrow) {
    handleThrow();
  }
  
  return (
    <div>
      <span>Hook component</span>
      <button onClick={handleThrow}>Throw Error</button>
      <button onClick={resetError}>Reset Error</button>
    </div>
  );
};

describe('ErrorBoundary', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render children when there is no error', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={false} />
      </ErrorBoundary>
    );
    
    expect(screen.getByText('No error')).toBeInTheDocument();
  });

  it('should render default error UI when child throws error', () => {
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );
    
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByText(/An unexpected error occurred/)).toBeInTheDocument();
    expect(screen.getByText('Try Again')).toBeInTheDocument();
    expect(screen.getByText('Reload Page')).toBeInTheDocument();
  });

  it('should render custom fallback when provided', () => {
    const customFallback = <div>Custom error message</div>;
    
    render(
      <ErrorBoundary fallback={customFallback}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );
    
    expect(screen.getByText('Custom error message')).toBeInTheDocument();
    expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument();
  });

  it('should call onError callback when error occurs', () => {
    const onError = jest.fn();
    
    render(
      <ErrorBoundary onError={onError}>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );
    
    expect(onError).toHaveBeenCalledTimes(1);
    expect(onError).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({
        componentStack: expect.any(String)
      })
    );
  });

  it('should reset error state when Try Again is clicked', () => {
    const { rerender } = render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );
    
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    
    fireEvent.click(screen.getByText('Try Again'));
    
    // Re-render with no error
    rerender(
      <ErrorBoundary>
        <ThrowError shouldThrow={false} />
      </ErrorBoundary>
    );
    
    expect(screen.getByText('No error')).toBeInTheDocument();
  });

  it('should reload page when Reload Page is clicked', () => {
    // Mock window.location.reload
    const mockReload = jest.fn();
    Object.defineProperty(window, 'location', {
      value: { reload: mockReload },
      writable: true
    });
    
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );
    
    fireEvent.click(screen.getByText('Reload Page'));
    
    expect(mockReload).toHaveBeenCalledTimes(1);
  });

  it('should show error details in development mode', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';
    
    const testError = new Error('Detailed test error');
    
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} error={testError} />
      </ErrorBoundary>
    );
    
    expect(screen.getByText('Error Details (Development)')).toBeInTheDocument();
    
    // Click to expand details
    fireEvent.click(screen.getByText('Error Details (Development)'));
    
    expect(screen.getByText(/Detailed test error/)).toBeInTheDocument();
    
    process.env.NODE_ENV = originalEnv;
  });

  it('should not show error details in production mode', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    
    render(
      <ErrorBoundary>
        <ThrowError shouldThrow={true} />
      </ErrorBoundary>
    );
    
    expect(screen.queryByText('Error Details (Development)')).not.toBeInTheDocument();
    
    process.env.NODE_ENV = originalEnv;
  });
});

describe('useErrorBoundary', () => {
  it('should throw error when captureError is called', () => {
    const TestComponent = () => {
      const { captureError } = useErrorBoundary();
      
      return (
        <button onClick={() => captureError(new Error('Hook error'))}>
          Throw Error
        </button>
      );
    };
    
    render(
      <ErrorBoundary>
        <TestComponent />
      </ErrorBoundary>
    );
    
    fireEvent.click(screen.getByText('Throw Error'));
    
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });

  it('should reset error when resetError is called', () => {
    const TestComponent = () => {
      const { captureError, resetError } = useErrorBoundary();
      
      return (
        <div>
          <span>Test component</span>
          <button onClick={() => captureError(new Error('Hook error'))}>
            Throw Error
          </button>
          <button onClick={resetError}>Reset</button>
        </div>
      );
    };
    
    const { rerender } = render(
      <ErrorBoundary>
        <TestComponent />
      </ErrorBoundary>
    );
    
    // Throw error
    fireEvent.click(screen.getByText('Throw Error'));
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    
    // Reset error
    fireEvent.click(screen.getByText('Try Again'));
    
    // Re-render component
    rerender(
      <ErrorBoundary>
        <TestComponent />
      </ErrorBoundary>
    );
    
    expect(screen.getByText('Test component')).toBeInTheDocument();
  });

  it('should handle multiple errors', () => {
    const TestComponent = () => {
      const { captureError } = useErrorBoundary();
      
      return (
        <div>
          <button onClick={() => captureError(new Error('First error'))}>
            First Error
          </button>
          <button onClick={() => captureError(new Error('Second error'))}>
            Second Error
          </button>
        </div>
      );
    };
    
    render(
      <ErrorBoundary>
        <TestComponent />
      </ErrorBoundary>
    );
    
    // First error
    fireEvent.click(screen.getByText('First Error'));
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });
});