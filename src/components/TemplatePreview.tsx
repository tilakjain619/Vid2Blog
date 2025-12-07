import React, { useState } from 'react';
import { ArticleGenerator, ArticleTemplate } from '@/lib/article-generator';
import { Button } from './ui/button';
import { cn } from '@/lib/utils';

interface TemplatePreviewProps {
    className?: string;
    selectedTemplate?: string;
    onTemplateSelect?: (templateName: string) => void;
    showFullPreview?: boolean;
}

const TemplatePreview: React.FC<TemplatePreviewProps> = ({
    className,
    selectedTemplate,
    onTemplateSelect,
    showFullPreview = false
}) => {
    const [previewTemplate, setPreviewTemplate] = useState<ArticleTemplate | null>(null);
    const [showModal, setShowModal] = useState(false);

    const availableTemplates = ArticleGenerator.getAvailableTemplates();

    const handlePreviewClick = (template: ArticleTemplate) => {
        setPreviewTemplate(template);
        setShowModal(true);
    };

    const handleSelectTemplate = (templateName: string) => {
        if (onTemplateSelect) {
            onTemplateSelect(templateName);
        }
        setShowModal(false);
    };

    const generateStructurePreview = (template: ArticleTemplate): string => {
        return template.structure
            .map((section, index) => `${index + 1}. ${section.heading}`)
            .join('\n');
    };

    const getTemplateDescription = (template: ArticleTemplate): string => {
        const sectionCount = template.structure.length;
        const hasTimestamps = template.structure.some(s => s.includeTimestamps);

        return `${template.estimatedLength.charAt(0).toUpperCase() + template.estimatedLength.slice(1)} ${template.type} with ${sectionCount} sections, ${template.defaultTone} tone${hasTimestamps ? ', includes timestamps' : ''}`;
    };

    if (showFullPreview) {
        return (
            <div className={cn("space-y-4", className)}>
                <h3 className="text-lg font-semibold">Available Templates</h3>

                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {availableTemplates.map((template) => (
                        <div
                            key={template.name}
                            className={cn(
                                "p-4 border rounded-lg cursor-pointer transition-all hover:shadow-md",
                                selectedTemplate === template.name
                                    ? "border-blue-500 bg-blue-50"
                                    : "border-gray-200 hover:border-gray-300"
                            )}
                            onClick={() => handleSelectTemplate(template.name)}
                        >
                            <div className="flex justify-between items-start mb-2">
                                <h4 className="font-medium text-gray-900">{template.name}</h4>
                                <span className="text-xs px-2 py-1 bg-gray-100 rounded text-gray-600">
                                    {template.type}
                                </span>
                            </div>

                            <p className="text-sm text-gray-600 mb-3">
                                {getTemplateDescription(template)}
                            </p>

                            <div className="space-y-2">
                                <div className="text-xs font-medium text-gray-700">Structure:</div>
                                <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
                                    {generateStructurePreview(template)}
                                </div>
                            </div>

                            <div className="flex justify-between items-center mt-3">
                                <Button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handlePreviewClick(template);
                                    }}
                                    variant="outline"
                                    size="sm"
                                    className="text-xs"
                                >
                                    Preview
                                </Button>

                                {selectedTemplate === template.name && (
                                    <span className="text-xs text-blue-600 font-medium">Selected</span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className={cn("", className)}>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {availableTemplates.map((template) => (
                    <button
                        key={template.name}
                        onClick={() => handleSelectTemplate(template.name)}
                        className={cn(
                            "p-3 text-left border rounded-lg transition-all hover:shadow-sm",
                            selectedTemplate === template.name
                                ? "border-blue-500 bg-blue-50"
                                : "border-gray-200 hover:border-gray-300"
                        )}
                    >
                        <div className="flex justify-between items-center mb-1">
                            <span className="text-sm font-medium">{template.name}</span>
                            <span className="text-xs px-1 py-0.5 bg-gray-100 rounded">
                                {template.type}
                            </span>
                        </div>
                        <div className="text-xs text-gray-600">
                            {template.estimatedLength} • {template.defaultTone}
                        </div>
                    </button>
                ))}
            </div>

            {/* Preview Modal */}
            {showModal && previewTemplate && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold">Template Preview: {previewTemplate.name}</h3>
                            <Button
                                onClick={() => setShowModal(false)}
                                variant="ghost"
                                size="sm"
                            >
                                ×
                            </Button>
                        </div>

                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <span className="font-medium">Type:</span> {previewTemplate.type}
                                </div>
                                <div>
                                    <span className="font-medium">Length:</span> {previewTemplate.estimatedLength}
                                </div>
                                <div>
                                    <span className="font-medium">Default Tone:</span> {previewTemplate.defaultTone}
                                </div>
                                <div>
                                    <span className="font-medium">Sections:</span> {previewTemplate.structure.length}
                                </div>
                            </div>

                            <div>
                                <h4 className="font-medium text-gray-900 mb-2">Article Structure</h4>
                                <div className="space-y-2">
                                    {previewTemplate.structure.map((section, index) => (
                                        <div key={index} className="bg-gray-50 p-3 rounded">
                                            <div className="font-medium text-sm">{index + 1}. {section.heading}</div>
                                            <div className="text-xs text-gray-600 mt-1">
                                                Type: {section.contentType}
                                                {section.minLength && ` • Min: ${section.minLength} words`}
                                                {section.maxLength && ` • Max: ${section.maxLength} words`}
                                                {section.includeTimestamps && ' • Includes timestamps'}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <h4 className="font-medium text-gray-900 mb-2">Description</h4>
                                <p className="text-sm text-gray-600">
                                    {getTemplateDescription(previewTemplate)}
                                </p>
                            </div>

                            <div className="flex justify-end gap-2 pt-4 border-t">
                                <Button
                                    onClick={() => handleSelectTemplate(previewTemplate.name)}
                                    size="sm"
                                >
                                    Use This Template
                                </Button>
                                <Button
                                    onClick={() => setShowModal(false)}
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

export default TemplatePreview;