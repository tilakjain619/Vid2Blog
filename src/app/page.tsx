'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { isValidYouTubeUrl, formatDuration } from "@/lib/utils";
import { VideoMetadata } from "@/types";

interface ValidationState {
  isValid: boolean;
  message: string;
  showValidation: boolean;
}

interface ApiResponse {
  success?: boolean;
  metadata?: VideoMetadata;
  error?: string;
}

export default function Home() {
  const [url, setUrl] = useState('');
  const [validation, setValidation] = useState<ValidationState>({
    isValid: false,
    message: '',
    showValidation: false
  });
  const [isLoading, setIsLoading] = useState(false);
  const [metadata, setMetadata] = useState<VideoMetadata | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Real-time URL validation
  useEffect(() => {
    if (url.trim() === '') {
      setValidation({
        isValid: false,
        message: '',
        showValidation: false
      });
      return;
    }

    const isValid = isValidYouTubeUrl(url);
    setValidation({
      isValid,
      message: isValid ? 'Valid YouTube URL' : 'Please enter a valid YouTube URL',
      showValidation: true
    });
  }, [url]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validation.isValid) {
      return;
    }

    setIsLoading(true);
    setError(null);
    setMetadata(null);

    try {
      const response = await fetch('/api/youtube/metadata', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      });

      const data: ApiResponse = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch video metadata');
      }

      if (data.success && data.metadata) {
        setMetadata(data.metadata);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setUrl('');
    setMetadata(null);
    setError(null);
    setValidation({
      isValid: false,
      message: '',
      showValidation: false
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-8">
      <main className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Vid2Blog
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Transform YouTube videos into well-structured blog articles with AI-powered transcription and content analysis.
          </p>
        </div>
        
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="youtube-url" className="block text-sm font-medium text-gray-700 mb-2">
                YouTube Video URL
              </label>
              <div className="relative">
                <input
                  id="youtube-url"
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=..."
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                    validation.showValidation
                      ? validation.isValid
                        ? 'border-green-300 bg-green-50'
                        : 'border-red-300 bg-red-50'
                      : 'border-gray-300'
                  }`}
                  disabled={isLoading}
                />
                {validation.showValidation && (
                  <div className={`absolute right-3 top-1/2 transform -translate-y-1/2 ${
                    validation.isValid ? 'text-green-500' : 'text-red-500'
                  }`}>
                    {validation.isValid ? (
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                )}
              </div>
              {validation.showValidation && (
                <p className={`mt-2 text-sm ${
                  validation.isValid ? 'text-green-600' : 'text-red-600'
                }`}>
                  {validation.message}
                </p>
              )}
            </div>

            <div className="flex gap-4">
              <Button
                type="submit"
                disabled={!validation.isValid || isLoading}
                className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </div>
                ) : (
                  'Extract Video Information'
                )}
              </Button>
              
              {(metadata || error) && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleReset}
                  disabled={isLoading}
                >
                  Reset
                </Button>
              )}
            </div>
          </form>

          {/* Error Display */}
          {error && (
            <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <div>
                  <h3 className="text-sm font-medium text-red-800">Error</h3>
                  <p className="text-sm text-red-700 mt-1">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Video Metadata Display */}
          {metadata && (
            <div className="mt-6 p-6 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-start gap-4">
                <img
                  src={metadata.thumbnailUrl}
                  alt={metadata.title}
                  className="w-32 h-24 object-cover rounded-lg flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                    {metadata.title}
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-gray-600">
                    <div>
                      <span className="font-medium">Channel:</span> {metadata.channelName}
                    </div>
                    <div>
                      <span className="font-medium">Duration:</span> {formatDuration(metadata.duration)}
                    </div>
                    <div>
                      <span className="font-medium">Views:</span> {metadata.viewCount.toLocaleString()}
                    </div>
                    <div>
                      <span className="font-medium">Published:</span> {new Date(metadata.publishDate).toLocaleDateString()}
                    </div>
                  </div>
                  {metadata.description && (
                    <div className="mt-3">
                      <p className="text-sm text-gray-600 line-clamp-3">
                        {metadata.description}
                      </p>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="mt-4 pt-4 border-t border-green-200">
                <div className="flex items-center gap-2 text-green-700">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm font-medium">Video information extracted successfully!</span>
                </div>
                <p className="text-sm text-green-600 mt-1">
                  Ready to proceed with transcript extraction and article generation.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="text-center">
          <p className="text-sm text-gray-500">
            Enter a YouTube URL above to get started. The system will validate the URL and extract video information.
          </p>
        </div>
      </main>
    </div>
  );
}
