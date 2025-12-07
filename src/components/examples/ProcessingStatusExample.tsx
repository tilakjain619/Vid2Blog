'use client';

import { useState } from 'react';
import { ProcessingStatus } from '../ProcessingStatus';
import { ProcessingStatusCompact } from '../ProcessingStatusCompact';
import { Button } from '../ui/button';
import { ProcessingError } from '@/lib/error-handling';

export function ProcessingStatusExample() {
  const [videoUrl, setVideoUrl] = useState('');
  const [showProcessing, setShowProcessing] = useState(false);
  const [showCompact, setShowCompact] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<ProcessingError | null>(null);

  const handleStartProcessing = () => {
    if (!videoUrl.trim()) return;
    setShowProcessing(true);
    setResult(null);
    setError(null);
  };

  const handleComplete = (processingResult: any) => {
    console.log('Processing completed:', processingResult);
    setResult(processingResult);
    setShowProcessing(false);
  };

  const handleError = (processingError: ProcessingError) => {
    console.error('Processing error:', processingError);
    setError(processingError);
    setShowProcessing(false);
  };

  const handleReset = () => {
    setShowProcessing(false);
    setResult(null);
    setError(null);
    setVideoUrl('');
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Processing Status Component Examples
        </h1>
        <p className="text-gray-600">
          Demonstration of the ProcessingStatus component with different configurations
        </p>
      </div>

      {/* Input Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Video URL Input</h2>
        <div className="space-y-4">
          <input
            type="url"
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
            placeholder="https://www.youtube.com/watch?v=..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <div className="flex gap-4">
            <Button
              onClick={handleStartProcessing}
              disabled={!videoUrl.trim() || showProcessing}
            >
              Start Full Processing
            </Button>
            <Button
              onClick={() => setShowCompact(!showCompact)}
              variant="outline"
            >
              {showCompact ? 'Hide' : 'Show'} Compact Version
            </Button>
            <Button
              onClick={handleReset}
              variant="outline"
            >
              Reset
            </Button>
          </div>
        </div>
      </div>

      {/* Compact Version */}
      {showCompact && (
        <div className="bg-gray-50 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Compact Processing Status</h2>
          <ProcessingStatusCompact
            videoUrl={videoUrl}
            onComplete={handleComplete}
            onError={handleError}
            showDetails={true}
          />
        </div>
      )}

      {/* Full Processing Status */}
      {showProcessing && (
        <ProcessingStatus
          videoUrl={videoUrl}
          onComplete={handleComplete}
          onError={handleError}
          autoStart={true}
        />
      )}

      {/* Results Section */}
      {result && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-green-800 mb-4">
            Processing Complete!
          </h2>
          <div className="space-y-2 text-sm text-green-700">
            <p><strong>Metadata:</strong> {result.metadata ? 'Available' : 'Not available'}</p>
            <p><strong>Transcript:</strong> {result.transcript ? 'Available' : 'Not available'}</p>
            <p><strong>Analysis:</strong> {result.analysis ? 'Available' : 'Not available'}</p>
            <p><strong>Article:</strong> {result.article ? 'Available' : 'Not available'}</p>
          </div>
        </div>
      )}

      {/* Error Section */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-red-800 mb-4">
            Processing Error
          </h2>
          <p className="text-red-700">{error?.details.userMessage || error?.message}</p>
        </div>
      )}

      {/* Usage Examples */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Usage Examples</h2>
        <div className="space-y-4 text-sm">
          <div>
            <h3 className="font-medium text-gray-900">Basic Usage:</h3>
            <pre className="bg-gray-100 p-3 rounded mt-2 overflow-x-auto">
{`<ProcessingStatus
  videoUrl="https://youtube.com/watch?v=example"
  onComplete={(result) => console.log(result)}
  onError={(error) => console.error(error)}
/>`}
            </pre>
          </div>
          
          <div>
            <h3 className="font-medium text-gray-900">Compact Version:</h3>
            <pre className="bg-gray-100 p-3 rounded mt-2 overflow-x-auto">
{`<ProcessingStatusCompact
  videoUrl="https://youtube.com/watch?v=example"
  showDetails={true}
  onComplete={(result) => console.log(result)}
/>`}
            </pre>
          </div>

          <div>
            <h3 className="font-medium text-gray-900">Manual Control:</h3>
            <pre className="bg-gray-100 p-3 rounded mt-2 overflow-x-auto">
{`<ProcessingStatus
  videoUrl="https://youtube.com/watch?v=example"
  autoStart={false}
  onComplete={handleComplete}
  onError={handleError}
/>`}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}