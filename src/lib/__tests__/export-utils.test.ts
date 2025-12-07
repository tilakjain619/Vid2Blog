import { 
  exportArticle, 
  copyToClipboard, 
  getAvailableTemplates,
  ExportFormat 
} from '../export-utils';
import { Article, VideoMetadata, ArticleMetadata } from '@/types';

// Mock clipboard API
Object.assign(navigator, {
  clipboard: {
    writeText: jest.fn(() => Promise.resolve()),
  },
});

// Mock document.execCommand for fallback
Object.assign(document, {
  execCommand: jest.fn(() => true),
});

describe('Export Utils', () => {
  const mockVideoMetadata: VideoMetadata = {
    id: 'test-video-id',
    title: 'Test Video Title',
    description: 'Test video description',
    duration: 600,
    thumbnailUrl: 'https://example.com/thumb.jpg',
    channelName: 'Test Channel',
    publishDate: new Date('2023-01-01'),
    viewCount: 1000
  };

  const mockArticleMetadata: ArticleMetadata = {
    wordCount: 500,
    readingTime: 3,
    seoTitle: 'Test Article SEO Title',
    metaDescription: 'Test article meta description',
    sourceVideo: mockVideoMetadata
  };

  const mockArticle: Article = {
    title: 'Test Article Title',
    introduction: 'This is a test introduction for the article.',
    sections: [
      {
        heading: 'First Section',
        content: 'Content of the first section.',
        subsections: [
          {
            heading: 'Subsection 1.1',
            content: 'Content of subsection 1.1'
          }
        ]
      },
      {
        heading: 'Second Section',
        content: 'Content of the second section.'
      }
    ],
    conclusion: 'This is the conclusion of the test article.',
    metadata: mockArticleMetadata,
    tags: ['test', 'article', 'export']
  };

  describe('exportArticle', () => {
    it('should export article in markdown format', () => {
      const result = exportArticle(mockArticle, { format: 'markdown' });
      
      expect(result.content).toContain('# Test Article Title');
      expect(result.content).toContain('## Introduction');
      expect(result.content).toContain('## First Section');
      expect(result.content).toContain('### Subsection 1.1');
      expect(result.content).toContain('## Conclusion');
      expect(result.content).toContain('**Source:** Test Video Title');
      expect(result.filename).toBe('test-article-title.md');
      expect(result.mimeType).toBe('text/markdown');
    });

    it('should export article in HTML format', () => {
      const result = exportArticle(mockArticle, { format: 'html' });
      
      expect(result.content).toContain('<!DOCTYPE html>');
      expect(result.content).toContain('<h1>Test Article Title</h1>');
      expect(result.content).toContain('<h2>Introduction</h2>');
      expect(result.content).toContain('<h2>First Section</h2>');
      expect(result.content).toContain('<h3>Subsection 1.1</h3>');
      expect(result.content).toContain('<strong>Source:</strong> Test Video Title');
      expect(result.filename).toBe('test-article-title.html');
      expect(result.mimeType).toBe('text/html');
    });

    it('should export article in plain text format', () => {
      const result = exportArticle(mockArticle, { format: 'plain' });
      
      expect(result.content).toContain('Test Article Title');
      expect(result.content).toContain('Source: Test Video Title');
      expect(result.content).toContain('# First Section');
      expect(result.content).toContain('## Subsection 1.1');
      expect(result.content).toContain('This is the conclusion');
      expect(result.filename).toBe('test-article-title.txt');
      expect(result.mimeType).toBe('text/plain');
    });

    it('should exclude metadata when includeMetadata is false', () => {
      const result = exportArticle(mockArticle, { 
        format: 'markdown', 
        includeMetadata: false 
      });
      
      expect(result.content).not.toContain('**Source:**');
      expect(result.content).not.toContain('**Channel:**');
      expect(result.content).not.toContain('**Word Count:**');
    });

    it('should use different templates', () => {
      const blogResult = exportArticle(mockArticle, { 
        format: 'markdown', 
        template: 'blog' 
      });
      
      const minimalResult = exportArticle(mockArticle, { 
        format: 'markdown', 
        template: 'minimal' 
      });
      
      expect(blogResult.content).toContain('*This article was generated from');
      expect(minimalResult.content).not.toContain('**Source:**');
      expect(minimalResult.content).not.toContain('*This article was generated from');
    });

    it('should handle articles with no subsections', () => {
      const simpleArticle: Article = {
        ...mockArticle,
        sections: [
          {
            heading: 'Simple Section',
            content: 'Simple content without subsections.'
          }
        ]
      };

      const result = exportArticle(simpleArticle, { format: 'markdown' });
      
      expect(result.content).toContain('## Simple Section');
      expect(result.content).toContain('Simple content without subsections.');
    });

    it('should sanitize filename properly', () => {
      const articleWithSpecialChars: Article = {
        ...mockArticle,
        title: 'Test Article: With Special Characters! & Symbols?'
      };

      const result = exportArticle(articleWithSpecialChars, { format: 'markdown' });
      
      expect(result.filename).toBe('test-article-with-special-characters-symbols.md');
    });

    it('should throw error for unsupported format', () => {
      expect(() => {
        exportArticle(mockArticle, { format: 'pdf' as ExportFormat });
      }).toThrow('Unsupported export format: pdf');
    });
  });

  describe('copyToClipboard', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should copy text using modern clipboard API', async () => {
      const mockWriteText = jest.fn(() => Promise.resolve());
      Object.assign(navigator, {
        clipboard: { writeText: mockWriteText }
      });
      Object.assign(window, { isSecureContext: true });

      const result = await copyToClipboard('test content');

      expect(mockWriteText).toHaveBeenCalledWith('test content');
      expect(result).toBe(true);
    });

    it('should fallback to execCommand when clipboard API is not available', async () => {
      Object.assign(navigator, { clipboard: undefined });
      const mockExecCommand = jest.fn(() => true);
      const mockTextArea = document.createElement('textarea');
      const mockCreateElement = jest.fn(() => mockTextArea);
      const mockAppendChild = jest.fn();
      const mockRemoveChild = jest.fn();

      jest.spyOn(document, 'createElement').mockImplementation(mockCreateElement);
      jest.spyOn(document.body, 'appendChild').mockImplementation(mockAppendChild);
      jest.spyOn(document.body, 'removeChild').mockImplementation(mockRemoveChild);
      jest.spyOn(document, 'execCommand').mockImplementation(mockExecCommand);

      const result = await copyToClipboard('test content');

      expect(mockCreateElement).toHaveBeenCalledWith('textarea');
      expect(mockTextArea.value).toBe('test content');
      expect(mockAppendChild).toHaveBeenCalledWith(mockTextArea);
      expect(mockExecCommand).toHaveBeenCalledWith('copy');
      expect(mockRemoveChild).toHaveBeenCalledWith(mockTextArea);
      expect(result).toBe(true);
    });

    it('should handle clipboard API errors', async () => {
      const mockWriteText = jest.fn(() => Promise.reject(new Error('Clipboard error')));
      Object.assign(navigator, {
        clipboard: { writeText: mockWriteText }
      });
      Object.assign(window, { isSecureContext: true });

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const result = await copyToClipboard('test content');

      expect(result).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith('Failed to copy to clipboard:', expect.any(Error));
      
      consoleSpy.mockRestore();
    });
  });

  describe('getAvailableTemplates', () => {
    it('should return markdown templates', () => {
      const templates = getAvailableTemplates('markdown');
      expect(templates).toContain('default');
      expect(templates).toContain('blog');
      expect(templates).toContain('minimal');
    });

    it('should return HTML templates', () => {
      const templates = getAvailableTemplates('html');
      expect(templates).toContain('default');
      expect(templates).toContain('article');
    });

    it('should return plain text templates', () => {
      const templates = getAvailableTemplates('plain');
      expect(templates).toEqual(['default']);
    });

    it('should return empty array for unsupported format', () => {
      const templates = getAvailableTemplates('pdf' as ExportFormat);
      expect(templates).toEqual([]);
    });
  });
});