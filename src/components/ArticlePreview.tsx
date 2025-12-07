import React, { useState, useCallback } from 'react';
import { Article, ArticleSection } from '@/types';
import { Button } from './ui/button';
import { cn } from '@/lib/utils';
import ExportOptions from './ExportOptions';

interface ArticlePreviewProps {
    article: Article;
    onArticleChange: (updatedArticle: Article) => void;
    className?: string;
}

interface EditableContentProps {
    content: string;
    onChange: (content: string) => void;
    placeholder?: string;
    className?: string;
    multiline?: boolean;
    isHeading?: boolean;
}

const EditableContent: React.FC<EditableContentProps> = ({
    content,
    onChange,
    placeholder = "Enter content...",
    className = "",
    multiline = false,
    isHeading = false
}) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editValue, setEditValue] = useState(content);

    const handleStartEdit = () => {
        setIsEditing(true);
        setEditValue(content);
    };

    const handleSave = () => {
        onChange(editValue);
        setIsEditing(false);
    };

    const handleCancel = () => {
        setEditValue(content);
        setIsEditing(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !multiline && !e.shiftKey) {
            e.preventDefault();
            handleSave();
        } else if (e.key === 'Escape') {
            handleCancel();
        }
    };

    if (isEditing) {
        return (
            <div className={cn("relative", className)}>
                {multiline ? (
                    <textarea
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={placeholder}
                        className={cn(
                            "w-full p-2 border border-gray-300 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-blue-500",
                            isHeading ? "text-lg font-semibold" : "text-base",
                            className
                        )}
                        rows={isHeading ? 1 : 6}
                        autoFocus
                    />
                ) : (
                    <input
                        type="text"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={placeholder}
                        className={cn(
                            "w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500",
                            isHeading ? "text-lg font-semibold" : "text-base",
                            className
                        )}
                        autoFocus
                    />
                )}
                <div className="flex gap-2 mt-2">
                    <Button size="sm" onClick={handleSave}>
                        Save
                    </Button>
                    <Button size="sm" variant="outline" onClick={handleCancel}>
                        Cancel
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div
            onClick={handleStartEdit}
            className={cn(
                "cursor-pointer hover:bg-gray-50 p-2 rounded-md transition-colors",
                isHeading ? "text-lg font-semibold" : "text-base",
                content ? "" : "text-gray-400 italic",
                className
            )}
        >
            {content || placeholder}
        </div>
    );
};
interface EditableSectionProps {
    section: ArticleSection;
    onSectionChange: (updatedSection: ArticleSection) => void;
    level?: number;
}

const EditableSection: React.FC<EditableSectionProps> = ({
    section,
    onSectionChange,
    level = 1
}) => {
    const handleHeadingChange = useCallback((newHeading: string) => {
        onSectionChange({
            ...section,
            heading: newHeading
        });
    }, [section, onSectionChange]);

    const handleContentChange = useCallback((newContent: string) => {
        onSectionChange({
            ...section,
            content: newContent
        });
    }, [section, onSectionChange]);

    const handleSubsectionChange = useCallback((index: number, updatedSubsection: ArticleSection) => {
        const newSubsections = [...(section.subsections || [])];
        newSubsections[index] = updatedSubsection;
        onSectionChange({
            ...section,
            subsections: newSubsections
        });
    }, [section, onSectionChange]);

    const addSubsection = useCallback(() => {
        const newSubsection: ArticleSection = {
            heading: "New Subsection",
            content: ""
        };
        onSectionChange({
            ...section,
            subsections: [...(section.subsections || []), newSubsection]
        });
    }, [section, onSectionChange]);

    const removeSubsection = useCallback((index: number) => {
        const newSubsections = [...(section.subsections || [])];
        newSubsections.splice(index, 1);
        onSectionChange({
            ...section,
            subsections: newSubsections
        });
    }, [section, onSectionChange]);

    const headingLevel = Math.min(level + 1, 6);
    const HeadingTag = `h${headingLevel}` as keyof React.JSX.IntrinsicElements;

    return (
        <div className="mb-6">
            {React.createElement(
                HeadingTag,
                { className: "mb-3" },
                <EditableContent
                    content={section.heading}
                    onChange={handleHeadingChange}
                    placeholder="Enter section heading..."
                    isHeading={true}
                    className="font-semibold"
                />
            )}

            <div className="mb-4">
                <EditableContent
                    content={section.content}
                    onChange={handleContentChange}
                    placeholder="Enter section content..."
                    multiline={true}
                    className="min-h-[100px]"
                />
            </div>

            {section.subsections && section.subsections.length > 0 && (
                <div className="ml-4 border-l-2 border-gray-200 pl-4">
                    {section.subsections.map((subsection, index) => (
                        <div key={index} className="relative mb-4">
                            <EditableSection
                                section={subsection}
                                onSectionChange={(updatedSubsection) => handleSubsectionChange(index, updatedSubsection)}
                                level={level + 1}
                            />
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => removeSubsection(index)}
                                className="absolute top-0 right-0 opacity-50 hover:opacity-100 border-red-300 text-red-700 hover:bg-red-50"
                            >
                                Remove
                            </Button>
                        </div>
                    ))}
                </div>
            )}

            <div className="flex gap-2 mt-2">
                <Button size="sm" variant="outline" onClick={addSubsection}>
                    Add Subsection
                </Button>
            </div>
        </div>
    );
};
const ArticlePreview: React.FC<ArticlePreviewProps> = ({
    article,
    onArticleChange,
    className
}) => {
    const [showExportOptions, setShowExportOptions] = useState(false);
    const handleTitleChange = useCallback((newTitle: string) => {
        onArticleChange({
            ...article,
            title: newTitle
        });
    }, [article, onArticleChange]);

    const handleIntroductionChange = useCallback((newIntroduction: string) => {
        onArticleChange({
            ...article,
            introduction: newIntroduction
        });
    }, [article, onArticleChange]);

    const handleConclusionChange = useCallback((newConclusion: string) => {
        onArticleChange({
            ...article,
            conclusion: newConclusion
        });
    }, [article, onArticleChange]);

    const handleSectionChange = useCallback((index: number, updatedSection: ArticleSection) => {
        const newSections = [...article.sections];
        newSections[index] = updatedSection;
        onArticleChange({
            ...article,
            sections: newSections
        });
    }, [article, onArticleChange]);

    const addSection = useCallback(() => {
        const newSection: ArticleSection = {
            heading: "New Section",
            content: ""
        };
        onArticleChange({
            ...article,
            sections: [...article.sections, newSection]
        });
    }, [article, onArticleChange]);

    const removeSection = useCallback((index: number) => {
        const newSections = [...article.sections];
        newSections.splice(index, 1);
        onArticleChange({
            ...article,
            sections: newSections
        });
    }, [article, onArticleChange]);

    const handleTagsChange = useCallback((newTagsString: string) => {
        const newTags = newTagsString.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0);
        onArticleChange({
            ...article,
            tags: newTags
        });
    }, [article, onArticleChange]);

    return (
        <div className={cn("max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-sm", className)}>
            {/* Article Title */}
            <div className="mb-6">
                <h1 className="text-3xl font-bold mb-2">
                    <EditableContent
                        content={article.title}
                        onChange={handleTitleChange}
                        placeholder="Enter article title..."
                        isHeading={true}
                        className="text-3xl font-bold"
                    />
                </h1>
            </div>

            {/* Article Metadata */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                    <div>Word Count: {article.metadata.wordCount}</div>
                    <div>Reading Time: {article.metadata.readingTime} min</div>
                    <div>Source: {article.metadata.sourceVideo.title}</div>
                    <div>Channel: {article.metadata.sourceVideo.channelName}</div>
                </div>
            </div>

            {/* Article Introduction */}
            <div className="mb-8">
                <h2 className="text-xl font-semibold mb-3">Introduction</h2>
                <EditableContent
                    content={article.introduction}
                    onChange={handleIntroductionChange}
                    placeholder="Enter article introduction..."
                    multiline={true}
                    className="min-h-[120px]"
                />
            </div>

            {/* Article Sections */}
            <div className="mb-8">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold">Content Sections</h2>
                    <Button onClick={addSection} variant="outline">
                        Add Section
                    </Button>
                </div>

                {article.sections.map((section, index) => (
                    <div key={index} className="relative mb-6 p-4 border border-gray-200 rounded-lg">
                        <EditableSection
                            section={section}
                            onSectionChange={(updatedSection) => handleSectionChange(index, updatedSection)}
                        />
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={() => removeSection(index)}
                            className="absolute top-2 right-2 opacity-50 hover:opacity-100 border-red-300 text-red-700 hover:bg-red-50"
                        >
                            Remove Section
                        </Button>
                    </div>
                ))}
            </div>

            {/* Article Conclusion */}
            <div className="mb-8">
                <h2 className="text-xl font-semibold mb-3">Conclusion</h2>
                <EditableContent
                    content={article.conclusion}
                    onChange={handleConclusionChange}
                    placeholder="Enter article conclusion..."
                    multiline={true}
                    className="min-h-[120px]"
                />
            </div>

            {/* Article Tags */}
            <div className="mb-6">
                <h2 className="text-xl font-semibold mb-3">Tags</h2>
                <EditableContent
                    content={article.tags.join(', ')}
                    onChange={handleTagsChange}
                    placeholder="Enter tags separated by commas..."
                    className="text-sm"
                />
                <div className="mt-2 flex flex-wrap gap-2">
                    {article.tags.map((tag, index) => (
                        <span
                            key={index}
                            className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                        >
                            {tag}
                        </span>
                    ))}
                </div>
            </div>

            {/* Preview Actions */}
            <div className="flex gap-4 pt-6 border-t border-gray-200">
                <Button 
                    variant="outline"
                    onClick={() => setShowExportOptions(!showExportOptions)}
                >
                    {showExportOptions ? 'Hide Export Options' : 'Export Article'}
                </Button>
                <Button variant="outline">
                    Save Draft
                </Button>
                <Button>
                    Regenerate Content
                </Button>
            </div>

            {/* Export Options */}
            {showExportOptions && (
                <div className="mt-6">
                    <ExportOptions 
                        article={article}
                        onExportComplete={(format) => {
                            console.log(`Article exported as ${format}`);
                            // Optionally close export options after successful export
                            // setShowExportOptions(false);
                        }}
                    />
                </div>
            )}
        </div>
    );
};

export default ArticlePreview;