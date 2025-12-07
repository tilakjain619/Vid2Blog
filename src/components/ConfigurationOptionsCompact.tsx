import React, { useState } from 'react';
import { useUserPreferences } from '@/hooks/useUserPreferences';
import { ArticleGenerator } from '@/lib/article-generator';
import { Button } from './ui/button';
import { cn } from '@/lib/utils';

interface ConfigurationOptionsCompactProps {
  className?: string;
  onConfigurationChange?: (config: any) => void;
  onStartProcessing?: () => void;
  disabled?: boolean;
}

const ConfigurationOptionsCompact: React.FC<ConfigurationOptionsCompactProps> = ({
  className,
  onConfigurationChange,
  onStartProcessing,
  disabled = false
}) => {
  const { 
    preferences, 
    updatePreference, 
    getConfigurationOptions 
  } = useUserPreferences();
  
  const [showAdvanced, setShowAdvanced] = useState(false);
  const availableTemplates = ArticleGenerator.getAvailableTemplates();

  // Notify parent component of configuration changes
  React.useEffect(() => {
    if (onConfigurationChange) {
      onConfigurationChange(getConfigurationOptions());
    }
  }, [preferences, onConfigurationChange, getConfigurationOptions]);

  return (
    <div className={cn("p-4 bg-gray-50 border border-gray-200 rounded-lg", className)}>
      <div className="flex justify-between items-center mb-3">
        <h4 className="text-sm font-medium text-gray-700">Generation Options</h4>
        <Button
          onClick={() => setShowAdvanced(!showAdvanced)}
          variant="ghost"
          size="sm"
          className="text-xs"
        >
          {showAdvanced ? 'Hide' : 'Show'} Advanced
        </Button>
      </div>

      {/* Quick Options */}
      <div className="grid grid-cols-3 gap-3 mb-3">
        {/* Length */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Length</label>
          <select
            value={preferences.articleLength}
            onChange={(e) => updatePreference('articleLength', e.target.value as any)}
            disabled={disabled}
            className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="short">Short</option>
            <option value="medium">Medium</option>
            <option value="long">Long</option>
          </select>
        </div>

        {/* Tone */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Tone</label>
          <select
            value={preferences.tone}
            onChange={(e) => updatePreference('tone', e.target.value as any)}
            disabled={disabled}
            className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="professional">Professional</option>
            <option value="casual">Casual</option>
            <option value="technical">Technical</option>
          </select>
        </div>

        {/* Format */}
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Format</label>
          <select
            value={preferences.format}
            onChange={(e) => updatePreference('format', e.target.value as any)}
            disabled={disabled}
            className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="markdown">Markdown</option>
            <option value="html">HTML</option>
            <option value="plain">Plain Text</option>
          </select>
        </div>
      </div>

      {/* Advanced Options */}
      {showAdvanced && (
        <div className="space-y-3 pt-3 border-t border-gray-200">
          {/* Template Selection */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Template</label>
            <select
              value={preferences.selectedTemplate}
              onChange={(e) => updatePreference('selectedTemplate', e.target.value)}
              disabled={disabled}
              className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              {availableTemplates.map((template) => (
                <option key={template.name} value={template.name}>
                  {template.name}
                </option>
              ))}
            </select>
          </div>

          {/* Checkboxes */}
          <div className="flex flex-wrap gap-3">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={preferences.includeTimestamps}
                onChange={(e) => updatePreference('includeTimestamps', e.target.checked)}
                disabled={disabled}
                className="mr-1 h-3 w-3 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="text-xs text-gray-700">Timestamps</span>
            </label>

            <label className="flex items-center">
              <input
                type="checkbox"
                checked={preferences.includeMetadata}
                onChange={(e) => updatePreference('includeMetadata', e.target.checked)}
                disabled={disabled}
                className="mr-1 h-3 w-3 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="text-xs text-gray-700">Metadata</span>
            </label>
          </div>
        </div>
      )}

      {/* Start Processing Button */}
      {onStartProcessing && (
        <div className="mt-4 pt-3 border-t border-gray-200">
          <Button
            onClick={onStartProcessing}
            disabled={disabled}
            className="w-full"
            size="sm"
          >
            Start Processing with These Settings
          </Button>
        </div>
      )}

      {/* Current Settings Summary */}
      <div className="mt-3 pt-2 border-t border-gray-200">
        <div className="text-xs text-gray-500">
          Current: {preferences.articleLength} {preferences.tone} {preferences.format.toUpperCase()} 
          {preferences.includeTimestamps && ' + timestamps'}
        </div>
      </div>
    </div>
  );
};

export default ConfigurationOptionsCompact;