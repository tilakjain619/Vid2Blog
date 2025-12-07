'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { validateYouTubeUrl, formatDuration } from "@/lib/youtube-utils";
import { VideoMetadata } from "@/types";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { ErrorDisplay } from "@/components/ErrorDisplay";
import { ProcessingError, normalizeError } from "@/lib/error-handling";

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

function HomePage() {
  const [url, setUrl] = useState('');
  const [validation, setValidation] = useState<ValidationState>({
    isValid: false,
    message: '',
    showValidation: false
  });
  const [isLoading, setIsLoading] = useState(false);
  const [metadata, setMetadata] = useState<VideoMetadata | null>(null);
  const [error, setError] = useState<ProcessingError | null>(null);
  const [processingResult, setProcessingResult] = useState<any>(null);
  const [copyNotification, setCopyNotification] = useState<string | null>(null);

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

    const validation = validateYouTubeUrl(url);
    setValidation({
      isValid: validation.isValid,
      message: validation.isValid ? 'Valid YouTube URL' : validation.error || 'Please enter a valid YouTube URL',
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
      // Get form values
      const articleLength = (document.getElementById('article-length') as HTMLSelectElement)?.value || 'medium';
      const tone = (document.getElementById('writing-tone') as HTMLSelectElement)?.value || 'professional';
      const format = (document.getElementById('output-format') as HTMLSelectElement)?.value || 'markdown';
      const template = (document.getElementById('article-template') as HTMLSelectElement)?.value || 'auto';

      // Use the full processing pipeline
      const response = await fetch('/api/process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          url,
          options: {
            articleLength: articleLength as 'short' | 'medium' | 'long',
            tone: tone as 'professional' | 'casual' | 'technical',
            format: format as 'markdown' | 'html' | 'plain',
            customTemplate: template === 'auto' ? undefined : template
          }
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to process video');
      }

      if (data.success && data.data) {
        setMetadata(data.data.metadata);
        setProcessingResult(data.data);
        console.log('Full processing result:', data.data);
        
        // Show generation method if available
        if (data.data.generationMethod) {
          console.log('Article generation method:', data.data.generationMethod);
        }
      }
    } catch (err) {
      const processingError = normalizeError(err);
      setError(processingError);
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setUrl('');
    setMetadata(null);
    setError(null);
    setProcessingResult(null);
    setCopyNotification(null);
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
          <p className="text-xl text-gray-600 mb-4 max-w-2xl mx-auto">
            Transform YouTube videos into well-structured blog articles with AI-powered transcription and content analysis.
          </p>
          <div className="flex items-center justify-center gap-2 text-sm text-blue-600 mb-8">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
            </svg>
            <span>Powered by AI for intelligent article generation</span>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Configuration Options */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Article Length
                </label>
                <select
                  className="w-full text-zinc-700 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  defaultValue="medium"
                  id="article-length"
                >
                  <option value="short">Short (300-500 words)</option>
                  <option value="medium">Medium (600-1000 words)</option>
                  <option value="long">Long (1000-1500 words)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Writing Tone
                </label>
                <select
                  className="w-full text-zinc-700 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  defaultValue="professional"
                  id="writing-tone"
                >
                  <option value="professional">Professional</option>
                  <option value="casual">Casual</option>
                  <option value="technical">Technical</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Article Template
                </label>
                <select
                  className="w-full px-3 text-zinc-700 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  defaultValue="auto"
                  id="article-template"
                >
                  <option value="auto">Auto-detect (AI)</option>
                  <option value="Tutorial Guide">Tutorial Guide</option>
                  <option value="Interview Summary">Interview Summary</option>
                  <option value="Presentation Notes">Presentation Notes</option>
                  <option value="Discussion Summary">Discussion Summary</option>
                  <option value="General Article">General Article</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Output Format
                </label>
                <select
                  className="w-full text-zinc-700 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  defaultValue="markdown"
                  id="output-format"
                >
                  <option value="markdown">Markdown</option>
                  <option value="html">HTML</option>
                  <option value="plain">Plain Text</option>
                </select>
              </div>
            </div>

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
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${validation.showValidation
                    ? validation.isValid
                      ? 'border-green-300 bg-green-50'
                      : 'border-red-300 bg-red-50'
                    : 'border-gray-300'
                    }`}
                  disabled={isLoading}
                />
                {validation.showValidation && (
                  <div className={`absolute right-3 top-1/2 transform -translate-y-1/2 ${validation.isValid ? 'text-green-500' : 'text-red-500'
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
                <p className={`mt-2 text-sm ${validation.isValid ? 'text-green-600' : 'text-red-600'
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
                  'Generate Blog Article'
                )}
              </Button>

              {(processingResult || error) && (
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

          {/* Copy Notification */}
          {copyNotification && (
            <div className="mt-6 p-4 bg-green-100 border border-green-300 rounded-lg">
              <div className="flex items-center gap-2 text-green-700">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span className="text-sm font-medium">{copyNotification}</span>
              </div>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="mt-6">
              <ErrorDisplay
                error={error}
                onRetry={() => handleSubmit({ preventDefault: () => { } } as React.FormEvent)}
                onDismiss={() => setError(null)}
                showDetails={process.env.NODE_ENV === 'development'}
              />
            </div>
          )}

          {/* Processing Results Display */}
          {processingResult && (
            <div className="mt-6 space-y-6">
              {/* Video Metadata */}
              <div className="p-6 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-start gap-4">
                  <img
                    src={metadata?.thumbnailUrl}
                    alt={metadata?.title}
                    className="w-32 h-24 object-cover rounded-lg flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                      {metadata?.title}
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-gray-600">
                      <div>
                        <span className="font-medium">Channel:</span> {metadata?.channelName}
                      </div>
                      <div>
                        <span className="font-medium">Duration:</span> {metadata ? formatDuration(metadata.duration) : ''}
                      </div>
                      <div>
                        <span className="font-medium">Views:</span> {metadata?.viewCount.toLocaleString()}
                      </div>
                      <div>
                        <span className="font-medium">Published:</span> {metadata ? new Date(metadata.publishDate).toLocaleDateString() : ''}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-green-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-green-700">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      <span className="text-sm font-medium">Blog article generated successfully!</span>
                    </div>
                    {processingResult.generationMethod && (
                      <div className="flex items-center gap-1 text-xs text-gray-600">
                        {processingResult.generationMethod === 'ai' ? (
                          <>
                            <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                            </svg>
                            <span className="text-blue-600 font-medium">AI Generated</span>
                          </>
                        ) : (
                          <>
                            <svg className="w-4 h-4 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 0v12h8V4H6z" clipRule="evenodd" />
                            </svg>
                            <span className="text-gray-600">Template Based</span>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Generated Article Preview */}
              {processingResult.article && (
                <div className="p-6 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-lg font-semibold text-gray-900">Generated Article</h4>
                    {processingResult.generationMethod && (
                      <div className="flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium">
                        {processingResult.generationMethod === 'ai' ? (
                          <div className="flex items-center gap-1 bg-blue-100 text-blue-800 px-3 py-1 rounded-full">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                            </svg>
                            <span>AI Generated</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1 bg-gray-100 text-gray-700 px-3 py-1 rounded-full">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 0v12h8V4H6z" clipRule="evenodd" />
                            </svg>
                            <span>Template Based</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="bg-white p-4 rounded border max-h-96 overflow-y-auto">
                    <h1 className="text-2xl font-bold mb-4">{processingResult.article.title}</h1>

                    <div className="prose prose-sm max-w-none">
                      <div className="mb-4">
                        <h2 className="text-lg font-semibold mb-2">Introduction</h2>
                        <p className="text-gray-700">{processingResult.article.introduction}</p>
                      </div>

                      {processingResult.article.sections?.map((section: any, index: number) => (
                        <div key={index} className="mb-4">
                          <h2 className="text-lg font-semibold mb-2">{section.heading}</h2>
                          <p className="text-gray-700">{section.content}</p>
                        </div>
                      ))}

                      <div className="mb-4">
                        <h2 className="text-lg font-semibold mb-2">Conclusion</h2>
                        <p className="text-gray-700">{processingResult.article.conclusion}</p>
                      </div>

                      {processingResult.article.tags && (
                        <div className="mt-4 pt-4 border-t">
                          <div className="flex flex-wrap gap-2">
                            {processingResult.article.tags.map((tag: string, index: number) => (
                              <span key={index} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 flex gap-2">
                    <Button
                      onClick={async () => {
                        try {
                          const article = processingResult.article;
                          const markdownContent = `# ${article.title}\n\n${article.introduction}\n\n${article.sections.map((section: any) => `## ${section.heading}\n\n${section.content}`).join('\n\n')}\n\n## Conclusion\n\n${article.conclusion}\n\n---\n\n**Tags:** ${article.tags?.join(', ') || 'No tags'}`;
                          await navigator.clipboard.writeText(markdownContent);
                          setCopyNotification('Article copied as Markdown!');
                          setTimeout(() => setCopyNotification(null), 3000);
                        } catch (err) {
                          setCopyNotification('Failed to copy article');
                          setTimeout(() => setCopyNotification(null), 3000);
                        }
                      }}
                      variant="outline"
                      className="text-sm"
                    >
                      Copy as Markdown
                    </Button>
                    <Button
                      onClick={async () => {
                        try {
                          const article = processingResult.article;
                          const plainText = `${article.title}\n\n${article.introduction}\n\n${article.sections.map((section: any) => `${section.heading}\n\n${section.content}`).join('\n\n')}\n\nConclusion\n\n${article.conclusion}`;
                          await navigator.clipboard.writeText(plainText);
                          setCopyNotification('Article copied as plain text!');
                          setTimeout(() => setCopyNotification(null), 3000);
                        } catch (err) {
                          setCopyNotification('Failed to copy article');
                          setTimeout(() => setCopyNotification(null), 3000);
                        }
                      }}
                      variant="outline"
                      className="text-sm"
                    >
                      Copy as Text
                    </Button>
                  </div>
                </div>
              )}

              {/* Processing Stats */}
              <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                <h4 className="text-sm font-semibold text-gray-900 mb-2">Processing Summary</h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                  <div className='text-gray-600'>
                    <span className="text-gray-600">Transcript segments:</span>
                    <div className="font-medium">{processingResult.transcript?.segments?.length || 0}</div>
                  </div>
                  <div className='text-gray-600'>
                    <span className="text-gray-600">Key points:</span>
                    <div className="font-medium">{processingResult.analysis?.keyPoints?.length || 0}</div>
                  </div>
                  <div className='text-gray-600'>
                    <span className="text-gray-600">Topics identified:</span>
                    <div className="font-medium">{processingResult.analysis?.topics?.length || 0}</div>
                  </div>
                  <div className='text-gray-600'>
                    <span className="text-gray-600">Word count:</span>
                    <div className="font-medium">{processingResult.article?.metadata?.wordCount || 0}</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="text-center space-y-4">
          <p className="text-sm text-gray-500">
            Enter a YouTube URL above to get started. The system will validate the URL and extract video information.
          </p>

        </div>
      </main>
    </div>
  );
}

export default function Home() {
  return (
    <ErrorBoundary>
      <HomePage />
    </ErrorBoundary>
  );
}
