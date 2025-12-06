'use client';

import { ProcessingStatus as ProcessingStatusType } from '@/types';
import { useProcessingStatus } from '@/hooks/useProcessingStatus';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';

interface ProcessingStatusCompactProps {
  videoUrl?: string;
  onComplete?: (result: any) => void;
  onError?: (error: string) => void;
  className?: string;
  showDetails?: boolean;
}

const STAGE_LABELS: Record<ProcessingStatusType['stage'], string> = {
  validation: 'Validating',
  metadata: 'Extracting metadata',
  transcription: 'Transcribing audio',
  analysis: 'Analyzing content',
  generation: 'Generating article',
  complete: 'Complete',
  error: 'Error'
};

export function ProcessingStatusCompact({ 
  videoUrl, 
  onComplete, 
  onError, 
  className,
  showDetails = false
}: ProcessingStatusCompactProps) {
  const {
    status,
    isProcessing,
    startProcessing,
    getOverallProgress
  } = useProcessingStatus({
    onComplete,
    onError
  });

  const overallProgress = getOverallProgress();
  const stageLabel = STAGE_LABELS[status.stage] || 'Processing';

  // Format time remaining
  const formatTimeRemaining = (seconds: number): string => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    return `${minutes}m`;
  };

  return (
    <div className={cn("w-full p-4 bg-white rounded-lg border", className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          {isProcessing && status.stage !== 'error' && (
            <svg className="animate-spin h-4 w-4 text-blue-600" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          )}
          {status.stage === 'complete' && (
            <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          )}
          {status.stage === 'error' && (
            <svg className="w-4 h-4 text-red-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          )}
          <span className={cn(
            "text-sm font-medium",
            {
              "text-blue-600": isProcessing && status.stage !== 'error',
              "text-green-600": status.stage === 'complete',
              "text-red-600": status.stage === 'error',
              "text-gray-600": !isProcessing && status.stage !== 'complete' && status.stage !== 'error'
            }
          )}>
            {stageLabel}
          </span>
        </div>
        
        <div className="flex items-center space-x-2 text-xs text-gray-500">
          <span>{Math.round(overallProgress)}%</span>
          {status.estimatedTimeRemaining && status.estimatedTimeRemaining > 0 && (
            <span>• {formatTimeRemaining(status.estimatedTimeRemaining)}</span>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      <Progress 
        value={overallProgress} 
        className={cn(
          "h-2",
          status.stage === 'error' && "bg-red-100 [&>div]:bg-red-600"
        )}
      />

      {/* Details */}
      {showDetails && status.message && (
        <p className="text-xs text-gray-500 mt-2">
          {status.message}
        </p>
      )}

      {/* Action Button */}
      {videoUrl && !isProcessing && status.stage !== 'complete' && status.stage !== 'error' && (
        <button
          onClick={() => startProcessing(videoUrl)}
          className="mt-3 w-full px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
        >
          Start Processing
        </button>
      )}
    </div>
  );
}