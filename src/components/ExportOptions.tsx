import React, { useState } from 'react';
import { Article } from '@/types';
import { Button } from './ui/button';
import { 
  exportArticle, 
  downloadFile, 
  copyToClipboard, 
  getAvailableTemplates,
  ExportFormat,
  ExportOptions as ExportOptionsType 
} from '@/lib/export-utils';
import { cn } from '@/lib/utils';

interface ExportOptionsProps {
  article: Article;
  className?: string;
  onExportComplete?: (format: ExportFormat) => void;
}

const ExportOptions: React.FC<ExportOptionsProps> = ({
  article,
  className,
  onExportComplete
}) => {
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('markdown');
  const [selectedTemplate, setSelectedTemplate] = useState<string>('default');
  const [includeMetadata, setIncludeMetadata] = useState<boolean>(true);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [copySuccess, setCopySuccess] = useState<boolean>(false);
  const [exportPreview, setExportPreview] = useState<string>('');
  const [showPreview, setShowPreview] = useState<boolean>(false);

  const availableTemplates = getAvailableTemplates(selectedFormat);

  // Update template when format changes
  React.useEffect(() => {
    const templates = getAvailableTemplates(selectedFormat);
    if (!templates.includes(selectedTemplate)) {
      setSelectedTemplate(templates[0] || 'default');
    }
  }, [selectedFormat, selectedTemplate]);

  const handleFormatChange = (format: ExportFormat) => {
    setSelectedFormat(format);
    setShowPreview(false);
    setExportPreview('');
  };

  const generateExport = () => {
    const options: ExportOptionsType = {
      format: selectedFormat,
      includeMetadata,
      template: selectedTemplate
    };

    return exportArticle(article, options);
  };

  const handleDownload = async () => {
    setIsExporting(true);
    try {
      const result = generateExport();
      downloadFile(result.content, result.filename, result.mimeType);
      onExportComplete?.(selectedFormat);
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const handleCopy = async () => {
    setIsExporting(true);
    setCopySuccess(false);
    
    try {
      const result = generateExport();
      const success = await copyToClipboard(result.content);
      setCopySuccess(success);
      
      if (success) {
        setTimeout(() => setCopySuccess(false), 2000);
        onExportComplete?.(selectedFormat);
      }
    } catch (error) {
      console.error('Copy failed:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const handlePreview = () => {
    try {
      const result = generateExport();
      setExportPreview(result.content);
      setShowPreview(true);
    } catch (error) {
      console.error('Preview failed:', error);
    }
  };

  return (
    <div className={cn("p-6 bg-white border border-gray-200 rounded-lg shadow-sm", className)}>
      <h3 className="text-lg font-semibold mb-4">Export Article</h3>
      
      {/* Format Selection */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Export Format
        </label>
        <div className="flex gap-2">
          {(['markdown', 'html', 'plain'] as ExportFormat[]).map((format) => (
            <button
              key={format}
              onClick={() => handleFormatChange(format)}
              className={cn(
                "px-4 py-2 text-sm font-medium rounded-md border transition-colors",
                selectedFormat === format
                  ? "bg-blue-600 text-white border-blue-600"
                  : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
              )}
            >
              {format.charAt(0).toUpperCase() + format.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Template Selection */}
      {availableTemplates.length > 1 && (
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Template
          </label>
          <select
            value={selectedTemplate}
            onChange={(e) => setSelectedTemplate(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {availableTemplates.map((template) => (
              <option key={template} value={template}>
                {template.charAt(0).toUpperCase() + template.slice(1)}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Options */}
      <div className="mb-6">
        <label className="flex items-center">
          <input
            type="checkbox"
            checked={includeMetadata}
            onChange={(e) => setIncludeMetadata(e.target.checked)}
            className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <span className="text-sm text-gray-700">Include metadata and source information</span>
        </label>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3 mb-4">
        <Button
          onClick={handleDownload}
          disabled={isExporting}
          className="flex-1 min-w-[120px]"
        >
          {isExporting ? 'Exporting...' : 'Download'}
        </Button>
        
        <Button
          onClick={handleCopy}
          disabled={isExporting}
          variant="outline"
          className="flex-1 min-w-[120px]"
        >
          {copySuccess ? 'Copied!' : isExporting ? 'Copying...' : 'Copy to Clipboard'}
        </Button>
        
        <Button
          onClick={handlePreview}
          variant="outline"
          className="flex-1 min-w-[120px]"
        >
          Preview
        </Button>
      </div>

      {/* Export Preview */}
      {showPreview && exportPreview && (
        <div className="mt-6">
          <div className="flex justify-between items-center mb-2">
            <h4 className="text-md font-medium text-gray-700">Preview</h4>
            <Button
              onClick={() => setShowPreview(false)}
              variant="ghost"
              size="sm"
            >
              Close
            </Button>
          </div>
          <div className="max-h-96 overflow-y-auto border border-gray-300 rounded-md">
            {selectedFormat === 'html' ? (
              <iframe
                srcDoc={exportPreview}
                className="w-full h-96 border-0"
                title="HTML Preview"
              />
            ) : (
              <pre className="p-4 text-sm text-gray-800 whitespace-pre-wrap font-mono bg-gray-50">
                {exportPreview}
              </pre>
            )}
          </div>
        </div>
      )}

      {/* Export Info */}
      <div className="mt-4 p-3 bg-gray-50 rounded-md">
        <div className="text-xs text-gray-600">
          <div>Format: <span className="font-medium">{selectedFormat.toUpperCase()}</span></div>
          <div>Template: <span className="font-medium">{selectedTemplate}</span></div>
          <div>Estimated file size: <span className="font-medium">
            {Math.round(new Blob([generateExport().content]).size / 1024)} KB
          </span></div>
        </div>
      </div>
    </div>
  );
};

export default ExportOptions;