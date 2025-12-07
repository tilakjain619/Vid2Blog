'use client';

import { useState, useCallback, useRef } from 'react';
import { ProcessingStatus } from '@/types';
import { ProcessingError, normalizeError } from '@/lib/error-handling';

interface ProcessingResult {
  metadata?: any;
  transcript?: any;
  analysis?: any;
  article?: any;
}

interface UseProcessingStatusOptions {
  onComplete?: (result: ProcessingResult) => void;
  onError?: (error: ProcessingError) => void;
  onStageChange?: (stage: ProcessingStatus['stage']) => void;
}

interface ProcessingStageConfig {
  id: ProcessingStatus['stage'];
  estimatedDuration: number;
  apiEndpoint?: string;
  method?: 'GET' | 'POST';
}

const PROCESSING_STAGES: ProcessingStageConfig[] = [
  { id: 'validation', estimatedDuration: 5 },
  { id: 'metadata', estimatedDuration: 10, apiEndpoint: '/api/youtube/metadata', method: 'POST' },
  { id: 'transcription', estimatedDuration: 120, apiEndpoint: '/api/youtube/transcript', method: 'POST' },
  { id: 'analysis', estimatedDuration: 30, apiEndpoint: '/api/content/analyze', method: 'POST' },
  { id: 'generation', estimatedDuration: 45, apiEndpoint: '/api/content/generate', method: 'POST' }
];

export function useProcessingStatus(options: UseProcessingStatusOptions = {}) {
  const { onComplete, onError, onStageChange } = options;
  
  const [status, setStatus] = useState<ProcessingStatus>({
    stage: 'validation',
    progress: 0,
    message: 'Ready to start processing'
  });
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<ProcessingResult>({});
  const abortControllerRef = useRef<AbortController | null>(null);

  // Calculate estimated time remaining
  const calculateEstimatedTime = useCallback((currentStage: ProcessingStatus['stage'], progress: number): number => {
    const currentStageIndex = PROCESSING_STAGES.findIndex(stage => stage.id === currentStage);
    if (currentStageIndex === -1) return 0;

    const currentStageRemaining = PROCESSING_STAGES[currentStageIndex].estimatedDuration * (1 - progress / 100);
    const remainingStagesTime = PROCESSING_STAGES
      .slice(currentStageIndex + 1)
      .reduce((total, stage) => total + stage.estimatedDuration, 0);

    return Math.ceil(currentStageRemaining + remainingStagesTime);
  }, []);

  // Update status with estimated time
  const updateStatus = useCallback((newStatus: Partial<ProcessingStatus>) => {
    setStatus(prev => {
      const updated = { ...prev, ...newStatus };
      if (updated.stage && updated.progress !== undefined) {
        updated.estimatedTimeRemaining = calculateEstimatedTime(updated.stage, updated.progress);
      }
      return updated;
    });
    
    if (newStatus.stage && newStatus.stage !== status.stage) {
      onStageChange?.(newStatus.stage);
    }
  }, [calculateEstimatedTime, onStageChange, status.stage]);

  // Simulate progress for a stage
  const simulateProgress = useCallback(async (
    stage: ProcessingStatus['stage'],
    message: string,
    duration: number = 2000,
    steps: number = 10
  ) => {
    const stepDuration = duration / steps;
    
    for (let i = 0; i <= steps; i++) {
      if (abortControllerRef.current?.signal.aborted) {
        throw new Error('Processing cancelled');
      }
      
      const progress = (i / steps) * 100;
      updateStatus({
        stage,
        progress,
        message: i === steps ? `${message} - Complete` : message
      });
      
      if (i < steps) {
        await new Promise(resolve => setTimeout(resolve, stepDuration));
      }
    }
  }, [updateStatus]);

  // Make API call with error handling
  const makeApiCall = useCallback(async (
    endpoint: string,
    method: 'GET' | 'POST',
    body?: any
  ) => {
    const response = await fetch(endpoint, {
      method,
      headers: method === 'POST' ? { 'Content-Type': 'application/json' } : {},
      body: method === 'POST' && body ? JSON.stringify(body) : undefined,
      signal: abortControllerRef.current?.signal
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }, []);

  // Start processing pipeline
  const startProcessing = useCallback(async (videoUrl: string) => {
    if (isProcessing) return;

    setIsProcessing(true);
    abortControllerRef.current = new AbortController();
    const processingResult: ProcessingResult = {};

    try {
      // Stage 1: Validation
      updateStatus({
        stage: 'validation',
        progress: 0,
        message: 'Validating YouTube URL...'
      });

      await simulateProgress('validation', 'Validating URL format and accessibility', 1000);

      // Stage 2: Metadata
      updateStatus({
        stage: 'metadata',
        progress: 0,
        message: 'Extracting video metadata...'
      });

      const metadataResponse = await makeApiCall('/api/youtube/metadata', 'POST', { url: videoUrl });
      processingResult.metadata = metadataResponse.metadata;

      updateStatus({
        stage: 'metadata',
        progress: 100,
        message: 'Metadata extraction complete'
      });

      // Stage 3: Transcription
      updateStatus({
        stage: 'transcription',
        progress: 0,
        message: 'Extracting video transcript...'
      });

      // Simulate transcription progress (longer process)
      await simulateProgress('transcription', 'Processing audio and generating transcript', 5000, 20);

      const transcriptResponse = await makeApiCall('/api/youtube/transcript', 'POST', { url: videoUrl });
      processingResult.transcript = transcriptResponse.transcript;

      // Stage 4: Analysis
      updateStatus({
        stage: 'analysis',
        progress: 0,
        message: 'Analyzing content structure...'
      });

      await simulateProgress('analysis', 'Identifying topics and key points', 3000, 15);

      const analysisResponse = await makeApiCall('/api/content/analyze', 'POST', { 
        transcript: processingResult.transcript 
      });
      processingResult.analysis = analysisResponse.analysis;

      // Stage 5: Generation
      updateStatus({
        stage: 'generation',
        progress: 0,
        message: 'Generating blog article...'
      });

      await simulateProgress('generation', 'Creating structured article content', 4000, 18);

      const generationResponse = await makeApiCall('/api/content/generate', 'POST', {
        analysis: processingResult.analysis,
        metadata: processingResult.metadata
      });
      processingResult.article = generationResponse.article;

      // Complete
      updateStatus({
        stage: 'complete',
        progress: 100,
        message: 'Processing complete! Your blog article is ready.'
      });

      setResult(processingResult);
      onComplete?.(processingResult);

    } catch (error) {
      const processingError = normalizeError(error);
      
      updateStatus({
        stage: 'error',
        progress: 0,
        message: processingError.details.userMessage
      });
      
      onError?.(processingError);
    } finally {
      setIsProcessing(false);
      abortControllerRef.current = null;
    }
  }, [isProcessing, updateStatus, simulateProgress, makeApiCall, onComplete, onError]);

  // Cancel processing
  const cancelProcessing = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setIsProcessing(false);
    updateStatus({
      stage: 'error',
      progress: 0,
      message: 'Processing cancelled by user'
    });
  }, [updateStatus]);

  // Reset processing state
  const resetProcessing = useCallback(() => {
    setStatus({
      stage: 'validation',
      progress: 0,
      message: 'Ready to start processing'
    });
    setResult({});
    setIsProcessing(false);
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  // Get overall progress percentage
  const getOverallProgress = useCallback(() => {
    const stageIndex = PROCESSING_STAGES.findIndex(stage => stage.id === status.stage);
    if (stageIndex === -1) return 0;
    
    const stageWeight = 100 / PROCESSING_STAGES.length;
    const completedStagesProgress = stageIndex * stageWeight;
    const currentStageProgress = (status.progress / 100) * stageWeight;
    
    return Math.min(100, completedStagesProgress + currentStageProgress);
  }, [status.stage, status.progress]);

  return {
    status,
    isProcessing,
    result,
    startProcessing,
    cancelProcessing,
    resetProcessing,
    getOverallProgress
  };
}