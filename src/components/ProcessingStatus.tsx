'use client';

import { useEffect, useState } from 'react';
import { ProcessingStatus as ProcessingStatusType } from '@/types';
import { useProcessingStatus } from '@/hooks/useProcessingStatus';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface ProcessingStatusProps {
  videoUrl?: string;
  onComplete?: (result: any) => void;
  onError?: (error: string) => void;
  className?: string;
  autoStart?: boolean;
}

interface ProcessingStage {
  id: ProcessingStatusType['stage'];
  label: string;
  description: string;
}

const PROCESSING_STAGES: ProcessingStage[] = [
  {
    id: 'validation',
    label: 'Validation',
    description: 'Validating YouTube URL and checking video accessibility'
  },
  {
    id: 'metadata',
    label: 'Metadata',
    description: 'Extracting video information and details'
  },
  {
    id: 'transcription',
    label: 'Transcription',
    description: 'Converting audio to text with timestamps'
  },
  {
    id: 'analysis',
    label: 'Analysis',
    description: 'Analyzing content and identifying key topics'
  },
  {
    id: 'generation',
    label: 'Generation',
    description: 'Generating structured blog article'
  }
];

export function ProcessingStatus({ 
  videoUrl, 
  onComplete, 
  onError, 
  className,
  autoStart = true
}: ProcessingStatusProps) {
  const [startTime, setStartTime] = useState<number | null>(null);
  
  const {
    status,
    isProcessing,
    result,
    startProcessing,
    cancelProcessing,
    resetProcessing,
    getOverallProgress
  } = useProcessingStatus({
    onComplete,
    onError,
    onStageChange: (stage) => {
      if (stage === 'validation') {
        setStartTime(Date.now());
      }
    }
  });

  // Auto-start processing when videoUrl is provided
  useEffect(() => {
    if (videoUrl && autoStart && !isProcessing && status.stage !== 'complete') {
      startProcessing(videoUrl);
    }
  }, [videoUrl, autoStart, isProcessing, status.stage, startProcessing]);

  // Format time remaining
  const formatTimeRemaining = (seconds: number): string => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  const currentStageIndex = PROCESSING_STAGES.findIndex(stage => stage.id === status.stage);
  const overallProgress = getOverallProgress();

  return (
    <div className={cn("w-full max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg", className)}>
      {/* Header */}
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Processing Video
        </h2>
        <p className="text-gray-600">
          Converting your YouTube video into a structured blog article
        </p>
      </div>

      {/* Overall Progress Bar */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700">Overall Progress</span>
          <span className="text-sm text-gray-500">{Math.round(overallProgress)}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div 
            className="bg-blue-600 h-3 rounded-full transition-all duration-300 ease-out"
            style={{ width: `${overallProgress}%` }}
          />
        </div>
      </div>

      {/* Stage Progress */}
      <div className="space-y-4 mb-6">
        {PROCESSING_STAGES.map((stage, index) => {
          const isActive = status.stage === stage.id;
          const isCompleted = currentStageIndex > index || 
            (currentStageIndex === index && status.progress === 100);
          const isError = status.stage === 'error' && currentStageIndex === index;

          return (
            <div key={stage.id} className="flex items-center space-x-4">
              {/* Stage Icon */}
              <div className={cn(
                "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium",
                {
                  "bg-blue-600 text-white": isActive && !isError,
                  "bg-green-600 text-white": isCompleted && !isError,
                  "bg-red-600 text-white": isError,
                  "bg-gray-200 text-gray-500": !isActive && !isCompleted && !isError
                }
              )}>
                {isCompleted && !isError ? (
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                ) : isError ? (
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                ) : (
                  index + 1
                )}
              </div>

              {/* Stage Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h3 className={cn(
                    "text-sm font-medium",
                    {
                      "text-blue-600": isActive && !isError,
                      "text-green-600": isCompleted && !isError,
                      "text-red-600": isError,
                      "text-gray-500": !isActive && !isCompleted && !isError
                    }
                  )}>
                    {stage.label}
                  </h3>
                  {isActive && status.progress > 0 && status.progress < 100 && (
                    <span className="text-xs text-gray-500">
                      {status.progress}%
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {isActive ? status.message : stage.description}
                </p>
                
                {/* Stage Progress Bar */}
                {isActive && (
                  <div className="mt-2">
                    <div className="w-full bg-gray-200 rounded-full h-1">
                      <div 
                        className={cn(
                          "h-1 rounded-full transition-all duration-300 ease-out",
                          isError ? "bg-red-600" : "bg-blue-600"
                        )}
                        style={{ width: `${status.progress}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Control Buttons */}
      {videoUrl && (
        <div className="flex gap-3 mb-4">
          {!isProcessing && status.stage !== 'complete' && (
            <Button
              onClick={() => startProcessing(videoUrl)}
              className="flex-1"
              disabled={!videoUrl}
            >
              Start Processing
            </Button>
          )}
          
          {isProcessing && (
            <Button
              onClick={cancelProcessing}
              variant="outline"
              className="flex-1"
            >
              Cancel Processing
            </Button>
          )}
          
          {(status.stage === 'complete' || status.stage === 'error') && (
            <Button
              onClick={resetProcessing}
              variant="outline"
              className="flex-1"
            >
              Reset
            </Button>
          )}
        </div>
      )}

      {/* Status Footer */}
      <div className="border-t pt-4">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center space-x-2">
            {isProcessing && status.stage !== 'error' && (
              <>
                <svg className="animate-spin h-4 w-4 text-blue-600" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span className="text-gray-600">Processing...</span>
              </>
            )}
            {status.stage === 'complete' && (
              <div className="flex items-center space-x-2 text-green-600">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span>Complete</span>
              </div>
            )}
            {status.stage === 'error' && (
              <div className="flex items-center space-x-2 text-red-600">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <span>Error</span>
              </div>
            )}
          </div>
          
          {status.estimatedTimeRemaining && status.estimatedTimeRemaining > 0 && (
            <span className="text-gray-500">
              ~{formatTimeRemaining(status.estimatedTimeRemaining)} remaining
            </span>
          )}
          
          {startTime && status.stage === 'complete' && (
            <span className="text-gray-500">
              Completed in {Math.round((Date.now() - startTime) / 1000)}s
            </span>
          )}
        </div>
      </div>
    </div>
  );
}