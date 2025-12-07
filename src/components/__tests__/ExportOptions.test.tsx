import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import ExportOptions from '../ExportOptions';
import { Article, VideoMetadata, ArticleMetadata } from '@/types';
import * as exportUtils from '@/lib/export-utils';

// Mock the export utilities
jest.mock('@/lib/export-utils', () => ({
  exportArticle: jest.fn(),
  downloadFile: jest.fn(),
  copyToClipboard: jest.fn(),
  getAvailableTemplates: jest.fn(),
}));

const mockExportUtils = exportUtils as jest.Mocked<typeof exportUtils>;

describe('ExportOptions', () => {
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
    introduction: 'This is a test introduction.',
    sections: [
      {
        heading: 'First Section',
        content: 'Content of the first section.'
      }
    ],
    conclusion: 'This is the conclusion.',
    metadata: mockArticleMetadata,
    tags: ['test', 'article']
  };

  const mockExportResult = {
    content: '# Test Article Title\n\nThis is a test introduction.',
    filename: 'test-article-title.md',
    mimeType: 'text/markdown'
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockExportUtils.getAvailableTemplates.mockImplementation((format) => {
      switch (format) {
        case 'markdown':
          return ['default', 'blog', 'minimal'];
        case 'html':
          return ['default', 'article'];
        case 'plain':
          return ['default'];
        default:
          return [];
      }
    });
    mockExportUtils.exportArticle.mockReturnValue(mockExportResult);
    mockExportUtils.copyToClipboard.mockResolvedValue(true);
  });

  it('should render export options with default settings', () => {
    render(<ExportOptions article={mockArticle} />);

    expect(screen.getByText('Export Article')).toBeInTheDocument();
    expect(screen.getByText('Export Format')).toBeInTheDocument();
    expect(screen.getByText('Markdown')).toBeInTheDocument();
    expect(screen.getByText('Html')).toBeInTheDocument();
    expect(screen.getByText('Plain')).toBeInTheDocument();
    expect(screen.getByText('Download')).toBeInTheDocument();
    expect(screen.getByText('Copy to Clipboard')).toBeInTheDocument();
    expect(screen.getByText('Preview')).toBeInTheDocument();
  });

  it('should show template selection for formats with multiple templates', () => {
    render(<ExportOptions article={mockArticle} />);

    // Markdown should show template selection (has multiple templates)
    expect(screen.getByText('Template')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Default')).toBeInTheDocument();
  });

  it('should hide template selection for plain text format', () => {
    render(<ExportOptions article={mockArticle} />);

    // Switch to plain text format
    fireEvent.click(screen.getByText('Plain'));

    // Template selection should not be visible for plain text
    expect(screen.queryByText('Template')).not.toBeInTheDocument();
  });

  it('should update template options when format changes', () => {
    render(<ExportOptions article={mockArticle} />);

    // Switch to HTML format
    fireEvent.click(screen.getByText('Html'));

    // Should call getAvailableTemplates for HTML
    expect(mockExportUtils.getAvailableTemplates).toHaveBeenCalledWith('html');
  });

  it('should handle download functionality', async () => {
    const onExportComplete = jest.fn();
    render(<ExportOptions article={mockArticle} onExportComplete={onExportComplete} />);

    fireEvent.click(screen.getByText('Download'));

    await waitFor(() => {
      expect(mockExportUtils.exportArticle).toHaveBeenCalledWith(mockArticle, {
        format: 'markdown',
        includeMetadata: true,
        template: 'default'
      });
      expect(mockExportUtils.downloadFile).toHaveBeenCalledWith(
        mockExportResult.content,
        mockExportResult.filename,
        mockExportResult.mimeType
      );
      expect(onExportComplete).toHaveBeenCalledWith('markdown');
    });
  });

  it('should handle copy to clipboard functionality', async () => {
    const onExportComplete = jest.fn();
    render(<ExportOptions article={mockArticle} onExportComplete={onExportComplete} />);

    fireEvent.click(screen.getByText('Copy to Clipboard'));

    await waitFor(() => {
      expect(mockExportUtils.exportArticle).toHaveBeenCalledWith(mockArticle, {
        format: 'markdown',
        includeMetadata: true,
        template: 'default'
      });
      expect(mockExportUtils.copyToClipboard).toHaveBeenCalledWith(mockExportResult.content);
      expect(onExportComplete).toHaveBeenCalledWith('markdown');
    });

    // Should show success message
    expect(screen.getByText('Copied!')).toBeInTheDocument();
  });

  it('should handle copy failure gracefully', async () => {
    mockExportUtils.copyToClipboard.mockResolvedValue(false);
    
    render(<ExportOptions article={mockArticle} />);

    fireEvent.click(screen.getByText('Copy to Clipboard'));

    await waitFor(() => {
      expect(mockExportUtils.copyToClipboard).toHaveBeenCalled();
    });

    // Should not show success message on failure
    expect(screen.queryByText('Copied!')).not.toBeInTheDocument();
  });

  it('should show preview when preview button is clicked', () => {
    render(<ExportOptions article={mockArticle} />);

    const previewButton = screen.getByRole('button', { name: 'Preview' });
    fireEvent.click(previewButton);

    expect(screen.getByText('Close')).toBeInTheDocument();
    expect(mockExportUtils.exportArticle).toHaveBeenCalled();
  });

  it('should close preview when close button is clicked', () => {
    render(<ExportOptions article={mockArticle} />);

    // Open preview
    const previewButton = screen.getByRole('button', { name: 'Preview' });
    fireEvent.click(previewButton);
    expect(screen.getByText('Close')).toBeInTheDocument();

    // Close preview
    fireEvent.click(screen.getByText('Close'));
    expect(screen.queryByText('Close')).not.toBeInTheDocument();
  });

  it('should show HTML preview in iframe for HTML format', () => {
    const htmlExportResult = {
      content: '<html><body><h1>Test</h1></body></html>',
      filename: 'test.html',
      mimeType: 'text/html'
    };
    mockExportUtils.exportArticle.mockReturnValue(htmlExportResult);

    render(<ExportOptions article={mockArticle} />);

    // Switch to HTML format
    fireEvent.click(screen.getByText('Html'));

    // Open preview
    const previewButton = screen.getByRole('button', { name: 'Preview' });
    fireEvent.click(previewButton);

    // Should show iframe for HTML preview
    expect(screen.getByTitle('HTML Preview')).toBeInTheDocument();
  });

  it('should toggle metadata inclusion', () => {
    render(<ExportOptions article={mockArticle} />);

    const metadataCheckbox = screen.getByRole('checkbox');
    expect(metadataCheckbox).toBeChecked();

    fireEvent.click(metadataCheckbox);
    expect(metadataCheckbox).not.toBeChecked();

    fireEvent.click(screen.getByText('Download'));

    expect(mockExportUtils.exportArticle).toHaveBeenCalledWith(mockArticle, {
      format: 'markdown',
      includeMetadata: false,
      template: 'default'
    });
  });

  it('should change template selection', () => {
    render(<ExportOptions article={mockArticle} />);

    const templateSelect = screen.getByDisplayValue('Default');
    fireEvent.change(templateSelect, { target: { value: 'blog' } });

    fireEvent.click(screen.getByText('Download'));

    expect(mockExportUtils.exportArticle).toHaveBeenCalledWith(mockArticle, {
      format: 'markdown',
      includeMetadata: true,
      template: 'blog'
    });
  });

  it('should show export information', () => {
    render(<ExportOptions article={mockArticle} />);

    expect(screen.getByText('Format:')).toBeInTheDocument();
    expect(screen.getByText('MARKDOWN')).toBeInTheDocument();
    expect(screen.getByText('Template:')).toBeInTheDocument();
    expect(screen.getByText('default')).toBeInTheDocument();
    expect(screen.getByText('Estimated file size:')).toBeInTheDocument();
  });

  it('should disable buttons during export operations', async () => {
    // Make the copy operation take some time to test the loading state
    mockExportUtils.copyToClipboard.mockImplementation(() => 
      new Promise(resolve => setTimeout(() => resolve(true), 100))
    );

    render(<ExportOptions article={mockArticle} />);

    const copyButton = screen.getByText('Copy to Clipboard');
    fireEvent.click(copyButton);

    // Button should show loading state
    expect(screen.getByText('Copying...')).toBeInTheDocument();

    // Wait for the operation to complete
    await waitFor(() => {
      expect(screen.getByText('Copied!')).toBeInTheDocument();
    });
  });

  it('should apply custom className', () => {
    const { container } = render(
      <ExportOptions article={mockArticle} className="custom-class" />
    );

    expect(container.firstChild).toHaveClass('custom-class');
  });
});