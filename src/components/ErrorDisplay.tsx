'use client';

import React, { useState, useEffect } from 'react';
import { ProcessingError, isRetryableError, getRetryConfig } from '@/lib/error-handling';
import { Button } from './ui/button';
import { cn } from '@/lib/utils';

interface ErrorDisplayProps {
  error: ProcessingError | Error | string | null;
  onRetry?: () => void;
  onDismiss?: () => void;
  className?: string;
  showDetails?: boolean;
  autoRetry?: boolean;
}

export function ErrorDisplay({
  error,
  onRetry,
  onDismiss,
  className,
  showDetails = false,
  autoRetry = false
}: ErrorDisplayProps) {
  const [retryCount, setRetryCount] = useState(0);
  const [isAutoRetrying, setIsAutoRetrying] = useState(false);
  const [countdown, setCountdown] = useState(0);

  // Normalize error to ProcessingError
  const processingError = React.useMemo(() => {
    if (!error) return null;
    
    if (typeof error === 'string') {
      return {
        name: 'Error',
        message: error,
        type: 'UNKNOWN_ERROR',
        details: {
          type: 'UNKNOWN_ERROR' as const,
          message: error,
          userMessage: error,
          suggestions: ['Please try again', 'If the problem persists, contact support'],
          retryable: true
        }
      } as ProcessingError;
    }

    if (error instanceof Error && 'type' in error && 'details' in error) {
      return error as ProcessingError;
    }

    return {
      name: 'Error',
      message: error.message,
      type: 'UNKNOWN_ERROR',
      details: {
        type: 'UNKNOWN_ERROR' as const,
        message: error.message,
        userMessage: error.message,
        suggestions: ['Please try again', 'If the problem persists, contact support'],
        retryable: true
      }
    } as ProcessingError;
  }, [error]);

  // Auto-retry logic
  useEffect(() => {
    if (!processingError || !autoRetry || !onRetry) return;
    if (!isRetryableError(processingError)) return;

    const retryConfig = getRetryConfig(processingError);
    if (retryCount >= retryConfig.maxRetries) return;

    setIsAutoRetrying(true);
    setCountdown(Math.ceil(retryConfig.delay / 1000));

    const countdownInterval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(countdownInterval);
          setIsAutoRetrying(false);
          setRetryCount(prev => prev + 1);
          onRetry();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(countdownInterval);
  }, [processingError, autoRetry, onRetry, retryCount]);

  const handleManualRetry = () => {
    if (!processingError || !onRetry) return;
    
    setRetryCount(prev => prev + 1);
    onRetry();
  };

  if (!processingError) return null;

  const isRetryable = isRetryableError(processingError);
  const retryConfig = getRetryConfig(processingError);
  const canRetry = isRetryable && retryCount < retryConfig.maxRetries;

  return (
    <div className={cn(
      "bg-red-50 border border-red-200 rounded-lg p-4",
      className
    )}>
      {/* Error Header */}
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <svg className="w-5 h-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
        </div>
        
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium text-red-800">
            {processingError.details.userMessage}
          </h3>
          
          {/* Error Suggestions */}
          {processingError.details.suggestions.length > 0 && (
            <div className="mt-2">
              <p className="text-sm text-red-700 mb-2">Here's what you can try:</p>
              <ul className="list-disc list-inside text-sm text-red-700 space-y-1">
                {processingError.details.suggestions.map((suggestion, index) => (
                  <li key={index}>{suggestion}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Retry Information */}
          {isRetryable && (
            <div className="mt-3 text-sm text-red-700">
              {canRetry ? (
                <p>
                  {isAutoRetrying ? (
                    <>Retrying automatically in {countdown} seconds... (Attempt {retryCount + 1} of {retryConfig.maxRetries})</>
                  ) : (
                    <>You can retry this operation. (Attempt {retryCount} of {retryConfig.maxRetries})</>
                  )}
                </p>
              ) : (
                <p>Maximum retry attempts reached. Please try a different approach.</p>
              )}
            </div>
          )}

          {/* Error Details (Development) */}
          {showDetails && processingError.details.message !== processingError.details.userMessage && (
            <details className="mt-3">
              <summary className="text-sm text-red-600 cursor-pointer">
                Technical Details
              </summary>
              <div className="mt-2 text-xs text-red-600 bg-red-100 p-2 rounded">
                <p><strong>Error Type:</strong> {processingError.details.type}</p>
                <p><strong>Message:</strong> {processingError.details.message}</p>
                {processingError.originalError && (
                  <p><strong>Original Error:</strong> {processingError.originalError.message}</p>
                )}
              </div>
            </details>
          )}
        </div>

        {/* Dismiss Button */}
        {onDismiss && (
          <div className="ml-auto pl-3">
            <div className="-mx-1.5 -my-1.5">
              <button
                onClick={onDismiss}
                className="inline-flex bg-red-50 rounded-md p-1.5 text-red-500 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-red-50 focus:ring-red-600"
                aria-label="Dismiss error"
              >
                <span className="sr-only">Dismiss</span>
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      {(canRetry || (onDismiss && !isAutoRetrying)) && (
        <div className="mt-4 flex gap-2">
          {canRetry && onRetry && !isAutoRetrying && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleManualRetry}
              className="bg-white text-red-700 border-red-300 hover:bg-red-50"
            >
              Try Again
            </Button>
          )}
          
          {isAutoRetrying && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setIsAutoRetrying(false);
                setCountdown(0);
              }}
              className="bg-white text-red-700 border-red-300 hover:bg-red-50"
            >
              Cancel Auto-Retry
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

// Compact version for inline error display
export function ErrorDisplayCompact({
  error,
  onRetry,
  className
}: {
  error: ProcessingError | Error | string | null;
  onRetry?: () => void;
  className?: string;
}) {
  if (!error) return null;

  const errorMessage = typeof error === 'string' 
    ? error 
    : error instanceof Error && 'details' in error 
      ? (error as ProcessingError).details.userMessage
      : error.message;

  return (
    <div className={cn(
      "flex items-center gap-2 text-sm text-red-600 bg-red-50 px-3 py-2 rounded",
      className
    )}>
      <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
      </svg>
      <span className="flex-1">{errorMessage}</span>
      {onRetry && (
        <Button size="sm" variant="ghost" onClick={onRetry} className="text-red-600 hover:bg-red-100">
          Retry
        </Button>
      )}
    </div>
  );
}