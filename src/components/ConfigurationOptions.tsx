import React, { useState } from 'react';
import { useUserPreferences } from '@/hooks/useUserPreferences';
import { ArticleGenerator } from '@/lib/article-generator';
import { TemplatePreview } from '@/types';
import { Button } from './ui/button';
import { cn } from '@/lib/utils';

interface ConfigurationOptionsProps {
  className?: string;
  onConfigurationChange?: (config: any) => void;
  showPreview?: boolean;
}

const ConfigurationOptions: React.FC<ConfigurationOptionsProps> = ({
  className,
  onConfigurationChange,
  showPreview = true
}) => {
  const { 
    preferences, 
    updatePreference, 
    resetPreferences, 
    getConfigurationOptions,
    hasCustomPreferences 
  } = useUserPreferences();
  
  const [selectedTemplatePreview, setSelectedTemplatePreview] = useState<TemplatePreview | null>(null);
  const [showTemplatePreview, setShowTemplatePreview] = useState(false);

  const availableTemplates = ArticleGenerator.getAvailableTemplates();

  // Notify parent component of configuration changes
  React.useEffect(() => {
    if (onConfigurationChange) {
      onConfigurationChange(getConfigurationOptions());
    }
  }, [preferences, onConfigurationChange, getConfigurationOptions]);

  const handleTemplateChange = (templateName: string) => {
    updatePreference('selectedTemplate', templateName);
    
    // Update preview
    const template = availableTemplates.find(t => t.name === templateName);
    if (template) {
      setSelectedTemplatePreview({
        name: template.name,
        type: template.type,
        description: `A ${template.estimatedLength} ${template.type} template with ${template.defaultTone} tone`,
        estimatedLength: template.estimatedLength,
        defaultTone: template.defaultTone,
        sampleOutput: generateSampleOutput(template)
      });
    }
  };

  const generateSampleOutput = (template: any) => {
    const sections = template.structure.map((section: any) => section.heading).join(', ');
    return `Sample structure: ${sections}`;
  };

  const handlePreviewTemplate = (templateName: string) => {
    const template = availableTemplates.find(t => t.name === templateName);
    if (template) {
      setSelectedTemplatePreview({
        name: template.name,
        type: template.type,
        description: `A ${template.estimatedLength} ${template.type} template with ${template.defaultTone} tone`,
        estimatedLength: template.estimatedLength,
        defaultTone: template.defaultTone,
        sampleOutput: generateSampleOutput(template)
      });
      setShowTemplatePreview(true);
    }
  };

  return (
    <div className={cn("p-6 bg-white border border-gray-200 rounded-lg shadow-sm", className)}>
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold">Configuration Options</h3>
        {hasCustomPreferences() && (
          <Button
            onClick={resetPreferences}
            variant="outline"
            size="sm"
          >
            Reset to Defaults
          </Button>
        )}
      </div>

      <div className="space-y-6">
        {/* Article Length */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Article Length
          </label>
          <div className="flex gap-2">
            {(['short', 'medium', 'long'] as const).map((length) => (
              <button
                key={length}
                onClick={() => updatePreference('articleLength', length)}
                className={cn(
                  "px-4 py-2 text-sm font-medium rounded-md border transition-colors",
                  preferences.articleLength === length
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                )}
              >
                {length.charAt(0).toUpperCase() + length.slice(1)}
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {preferences.articleLength === 'short' && 'Quick summary (300-600 words)'}
            {preferences.articleLength === 'medium' && 'Detailed analysis (600-1200 words)'}
            {preferences.articleLength === 'long' && 'Comprehensive guide (1200+ words)'}
          </p>
        </div>

        {/* Tone */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Writing Tone
          </label>
          <div className="flex gap-2">
            {(['professional', 'casual', 'technical'] as const).map((tone) => (
              <button
                key={tone}
                onClick={() => updatePreference('tone', tone)}
                className={cn(
                  "px-4 py-2 text-sm font-medium rounded-md border transition-colors",
                  preferences.tone === tone
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                )}
              >
                {tone.charAt(0).toUpperCase() + tone.slice(1)}
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {preferences.tone === 'professional' && 'Formal, business-appropriate language'}
            {preferences.tone === 'casual' && 'Conversational, friendly tone'}
            {preferences.tone === 'technical' && 'Precise, technical terminology'}
          </p>
        </div>

        {/* Output Format */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Output Format
          </label>
          <div className="flex gap-2">
            {(['markdown', 'html', 'plain'] as const).map((format) => (
              <button
                key={format}
                onClick={() => updatePreference('format', format)}
                className={cn(
                  "px-4 py-2 text-sm font-medium rounded-md border transition-colors",
                  preferences.format === format
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                )}
              >
                {format.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {/* Template Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Article Template
          </label>
          <div className="space-y-2">
            <select
              value={preferences.selectedTemplate}
              onChange={(e) => handleTemplateChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {availableTemplates.map((template) => (
                <option key={template.name} value={template.name}>
                  {template.name} ({template.type})
                </option>
              ))}
            </select>
            
            {showPreview && (
              <div className="flex gap-2">
                <Button
                  onClick={() => handlePreviewTemplate(preferences.selectedTemplate)}
                  variant="outline"
                  size="sm"
                  className="text-xs"
                >
                  Preview Template
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Additional Options */}
        <div className="space-y-3">
          <label className="block text-sm font-medium text-gray-700">
            Additional Options
          </label>
          
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={preferences.includeTimestamps}
              onChange={(e) => updatePreference('includeTimestamps', e.target.checked)}
              className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <span className="text-sm text-gray-700">Include timestamps in content</span>
          </label>

          <label className="flex items-center">
            <input
              type="checkbox"
              checked={preferences.autoSave}
              onChange={(e) => updatePreference('autoSave', e.target.checked)}
              className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <span className="text-sm text-gray-700">Auto-save preferences</span>
          </label>

          <label className="flex items-center">
            <input
              type="checkbox"
              checked={preferences.includeMetadata}
              onChange={(e) => updatePreference('includeMetadata', e.target.checked)}
              className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <span className="text-sm text-gray-700">Include metadata in exports</span>
          </label>
        </div>

        {/* Current Configuration Summary */}
        <div className="mt-6 p-4 bg-gray-50 rounded-md">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Current Configuration</h4>
          <div className="text-xs text-gray-600 space-y-1">
            <div>Length: <span className="font-medium">{preferences.articleLength}</span></div>
            <div>Tone: <span className="font-medium">{preferences.tone}</span></div>
            <div>Format: <span className="font-medium">{preferences.format.toUpperCase()}</span></div>
            <div>Template: <span className="font-medium">{preferences.selectedTemplate}</span></div>
            <div>Timestamps: <span className="font-medium">{preferences.includeTimestamps ? 'Yes' : 'No'}</span></div>
          </div>
        </div>
      </div>

      {/* Template Preview Modal */}
      {showTemplatePreview && selectedTemplatePreview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Template Preview</h3>
              <Button
                onClick={() => setShowTemplatePreview(false)}
                variant="ghost"
                size="sm"
              >
                ×
              </Button>
            </div>
            
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-gray-900">{selectedTemplatePreview.name}</h4>
                <p className="text-sm text-gray-600">{selectedTemplatePreview.description}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">Type:</span> {selectedTemplatePreview.type}
                </div>
                <div>
                  <span className="font-medium">Length:</span> {selectedTemplatePreview.estimatedLength}
                </div>
                <div>
                  <span className="font-medium">Default Tone:</span> {selectedTemplatePreview.defaultTone}
                </div>
              </div>
              
              <div>
                <h5 className="font-medium text-gray-900 mb-2">Sample Structure</h5>
                <div className="bg-gray-50 p-3 rounded text-sm text-gray-700">
                  {selectedTemplatePreview.sampleOutput}
                </div>
              </div>
              
              <div className="flex justify-end gap-2">
                <Button
                  onClick={() => {
                    handleTemplateChange(selectedTemplatePreview.name);
                    setShowTemplatePreview(false);
                  }}
                  size="sm"
                >
                  Use This Template
                </Button>
                <Button
                  onClick={() => setShowTemplatePreview(false)}
                  variant="outline"
                  size="sm"
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConfigurationOptions;