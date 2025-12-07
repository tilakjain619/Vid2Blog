import React, { useState } from 'react';
import ConfigurationOptions from '../ConfigurationOptions';
import ConfigurationOptionsCompact from '../ConfigurationOptionsCompact';
import TemplatePreview from '../TemplatePreview';
import { ConfigurationOptions as ConfigType } from '@/types';

const ConfigurationOptionsExample: React.FC = () => {
  const [currentConfig, setCurrentConfig] = useState<ConfigType | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('General Article');
  const [showCompact, setShowCompact] = useState(false);
  const [showTemplatePreview, setShowTemplatePreview] = useState(false);

  const handleConfigurationChange = (config: ConfigType) => {
    setCurrentConfig(config);
    console.log('Configuration changed:', config);
  };

  const handleStartProcessing = () => {
    console.log('Starting processing with configuration:', currentConfig);
    alert('Processing would start with current configuration!');
  };

  const handleTemplateSelect = (templateName: string) => {
    setSelectedTemplate(templateName);
    console.log('Template selected:', templateName);
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      <div>
        <h1 className="text-2xl font-bold mb-4">Configuration Options Examples</h1>
        <p className="text-gray-600 mb-6">
          This page demonstrates the configuration and customization components for Vid2Blog.
        </p>
      </div>

      {/* Toggle Controls */}
      <div className="flex gap-4 mb-6">
        <button
          onClick={() => setShowCompact(!showCompact)}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          {showCompact ? 'Show Full' : 'Show Compact'} Configuration
        </button>
        
        <button
          onClick={() => setShowTemplatePreview(!showTemplatePreview)}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
        >
          {showTemplatePreview ? 'Hide' : 'Show'} Template Preview
        </button>
      </div>

      {/* Configuration Components */}
      <div className="grid gap-8 lg:grid-cols-2">
        <div>
          <h2 className="text-xl font-semibold mb-4">
            {showCompact ? 'Compact Configuration' : 'Full Configuration'}
          </h2>
          
          {showCompact ? (
            <ConfigurationOptionsCompact
              onConfigurationChange={handleConfigurationChange}
              onStartProcessing={handleStartProcessing}
            />
          ) : (
            <ConfigurationOptions
              onConfigurationChange={handleConfigurationChange}
              showPreview={true}
            />
          )}
        </div>

        {/* Current Configuration Display */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Current Configuration</h2>
          <div className="p-4 bg-gray-50 border rounded-lg">
            {currentConfig ? (
              <div className="space-y-2">
                <div><strong>Length:</strong> {currentConfig.articleLength}</div>
                <div><strong>Tone:</strong> {currentConfig.tone}</div>
                <div><strong>Format:</strong> {currentConfig.format}</div>
                <div><strong>Template:</strong> {currentConfig.template}</div>
                <div><strong>Include Timestamps:</strong> {currentConfig.includeTimestamps ? 'Yes' : 'No'}</div>
                {currentConfig.customPrompt && (
                  <div><strong>Custom Prompt:</strong> {currentConfig.customPrompt}</div>
                )}
              </div>
            ) : (
              <div className="text-gray-500">No configuration set yet</div>
            )}
          </div>

          {/* Usage Example */}
          <div className="mt-6">
            <h3 className="text-lg font-medium mb-2">Usage Example</h3>
            <div className="p-3 bg-gray-100 rounded text-sm font-mono">
              <pre>{`const config = {
  articleLength: '${currentConfig?.articleLength || 'medium'}',
  tone: '${currentConfig?.tone || 'professional'}',
  format: '${currentConfig?.format || 'markdown'}',
  template: '${currentConfig?.template || 'General Article'}',
  includeTimestamps: ${currentConfig?.includeTimestamps || false}
};`}</pre>
            </div>
          </div>
        </div>
      </div>

      {/* Template Preview Section */}
      {showTemplatePreview && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Template Preview</h2>
          <TemplatePreview
            selectedTemplate={selectedTemplate}
            onTemplateSelect={handleTemplateSelect}
            showFullPreview={true}
          />
        </div>
      )}

      {/* Integration Examples */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Integration Examples</h2>
        
        <div className="grid gap-6 md:grid-cols-2">
          {/* Example 1: Pre-processing Configuration */}
          <div className="p-4 border rounded-lg">
            <h3 className="font-medium mb-2">Pre-processing Configuration</h3>
            <p className="text-sm text-gray-600 mb-3">
              Show configuration options before starting video processing
            </p>
            <ConfigurationOptionsCompact
              onStartProcessing={() => alert('Would start processing!')}
              disabled={false}
            />
          </div>

          {/* Example 2: Disabled State */}
          <div className="p-4 border rounded-lg">
            <h3 className="font-medium mb-2">During Processing (Disabled)</h3>
            <p className="text-sm text-gray-600 mb-3">
              Configuration locked while processing is in progress
            </p>
            <ConfigurationOptionsCompact
              disabled={true}
            />
          </div>
        </div>
      </div>

      {/* Feature Highlights */}
      <div className="bg-blue-50 p-6 rounded-lg">
        <h2 className="text-xl font-semibold mb-4">Key Features</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <h3 className="font-medium mb-2">🔧 Customization Options</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Article length (short, medium, long)</li>
              <li>• Writing tone (professional, casual, technical)</li>
              <li>• Output format (Markdown, HTML, Plain text)</li>
              <li>• Template selection with preview</li>
              <li>• Timestamp inclusion toggle</li>
            </ul>
          </div>
          <div>
            <h3 className="font-medium mb-2">💾 Persistence & UX</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• localStorage persistence</li>
              <li>• Auto-save preferences</li>
              <li>• Reset to defaults</li>
              <li>• Real-time configuration updates</li>
              <li>• Compact and full view modes</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfigurationOptionsExample;