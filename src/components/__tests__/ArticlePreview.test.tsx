import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import ArticlePreview from '../ArticlePreview';
import { Article } from '@/types';

const mockArticle: Article = {
  title: "Test Article Title",
  introduction: "This is a test introduction for the article.",
  sections: [
    {
      heading: "First Section",
      content: "This is the content of the first section.",
      subsections: [
        {
          heading: "Subsection 1.1",
          content: "Content of subsection 1.1"
        }
      ]
    },
    {
      heading: "Second Section", 
      content: "This is the content of the second section."
    }
  ],
  conclusion: "This is the test conclusion.",
  metadata: {
    wordCount: 150,
    readingTime: 1,
    seoTitle: "Test SEO Title",
    metaDescription: "Test meta description",
    sourceVideo: {
      id: "test123",
      title: "Test Video",
      description: "Test video description",
      duration: 300,
      thumbnailUrl: "https://example.com/thumb.jpg",
      channelName: "Test Channel",
      publishDate: new Date('2024-01-01'),
      viewCount: 1000
    }
  },
  tags: ["test", "article", "preview"]
};

describe('ArticlePreview', () => {
  const mockOnArticleChange = jest.fn();

  beforeEach(() => {
    mockOnArticleChange.mockClear();
  });

  it('renders article content correctly', () => {
    render(
      <ArticlePreview 
        article={mockArticle} 
        onArticleChange={mockOnArticleChange} 
      />
    );

    expect(screen.getByText('Test Article Title')).toBeInTheDocument();
    expect(screen.getByText('This is a test introduction for the article.')).toBeInTheDocument();
    expect(screen.getByText('First Section')).toBeInTheDocument();
    expect(screen.getByText('Second Section')).toBeInTheDocument();
    expect(screen.getByText('This is the test conclusion.')).toBeInTheDocument();
  });

  it('displays article metadata', () => {
    render(
      <ArticlePreview 
        article={mockArticle} 
        onArticleChange={mockOnArticleChange} 
      />
    );

    expect(screen.getByText('Word Count: 150')).toBeInTheDocument();
    expect(screen.getByText('Reading Time: 1 min')).toBeInTheDocument();
    expect(screen.getByText('Source: Test Video')).toBeInTheDocument();
    expect(screen.getByText('Channel: Test Channel')).toBeInTheDocument();
  });

  it('displays tags correctly', () => {
    render(
      <ArticlePreview 
        article={mockArticle} 
        onArticleChange={mockOnArticleChange} 
      />
    );

    expect(screen.getByText('test')).toBeInTheDocument();
    expect(screen.getByText('article')).toBeInTheDocument();
    expect(screen.getByText('preview')).toBeInTheDocument();
  });

  it('allows editing the title', async () => {
    render(
      <ArticlePreview 
        article={mockArticle} 
        onArticleChange={mockOnArticleChange} 
      />
    );

    const titleElement = screen.getByText('Test Article Title');
    fireEvent.click(titleElement);

    const input = screen.getByDisplayValue('Test Article Title');
    fireEvent.change(input, { target: { value: 'Updated Title' } });
    
    const saveButton = screen.getByText('Save');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(mockOnArticleChange).toHaveBeenCalledWith({
        ...mockArticle,
        title: 'Updated Title'
      });
    });
  });

  it('allows editing section content', async () => {
    render(
      <ArticlePreview 
        article={mockArticle} 
        onArticleChange={mockOnArticleChange} 
      />
    );

    const sectionContent = screen.getByText('This is the content of the first section.');
    fireEvent.click(sectionContent);

    const textarea = screen.getByDisplayValue('This is the content of the first section.');
    fireEvent.change(textarea, { target: { value: 'Updated section content' } });
    
    const saveButton = screen.getByText('Save');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(mockOnArticleChange).toHaveBeenCalledWith({
        ...mockArticle,
        sections: [
          {
            ...mockArticle.sections[0],
            content: 'Updated section content'
          },
          mockArticle.sections[1]
        ]
      });
    });
  });

  it('allows adding new sections', async () => {
    render(
      <ArticlePreview 
        article={mockArticle} 
        onArticleChange={mockOnArticleChange} 
      />
    );

    const addSectionButton = screen.getByText('Add Section');
    fireEvent.click(addSectionButton);

    await waitFor(() => {
      expect(mockOnArticleChange).toHaveBeenCalledWith({
        ...mockArticle,
        sections: [
          ...mockArticle.sections,
          {
            heading: 'New Section',
            content: ''
          }
        ]
      });
    });
  });

  it('allows removing sections', async () => {
    render(
      <ArticlePreview 
        article={mockArticle} 
        onArticleChange={mockOnArticleChange} 
      />
    );

    const removeSectionButtons = screen.getAllByText('Remove Section');
    fireEvent.click(removeSectionButtons[0]);

    await waitFor(() => {
      expect(mockOnArticleChange).toHaveBeenCalledWith({
        ...mockArticle,
        sections: [mockArticle.sections[1]]
      });
    });
  });

  it('handles subsections correctly', () => {
    render(
      <ArticlePreview 
        article={mockArticle} 
        onArticleChange={mockOnArticleChange} 
      />
    );

    expect(screen.getByText('Subsection 1.1')).toBeInTheDocument();
    expect(screen.getByText('Content of subsection 1.1')).toBeInTheDocument();
  });

  it('allows editing tags', async () => {
    render(
      <ArticlePreview 
        article={mockArticle} 
        onArticleChange={mockOnArticleChange} 
      />
    );

    const tagsElement = screen.getByText('test, article, preview');
    fireEvent.click(tagsElement);

    const input = screen.getByDisplayValue('test, article, preview');
    fireEvent.change(input, { target: { value: 'new, updated, tags' } });
    
    const saveButton = screen.getByText('Save');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(mockOnArticleChange).toHaveBeenCalledWith({
        ...mockArticle,
        tags: ['new', 'updated', 'tags']
      });
    });
  });

  it('cancels editing when escape is pressed', async () => {
    render(
      <ArticlePreview 
        article={mockArticle} 
        onArticleChange={mockOnArticleChange} 
      />
    );

    const titleElement = screen.getByText('Test Article Title');
    fireEvent.click(titleElement);

    const input = screen.getByDisplayValue('Test Article Title');
    fireEvent.change(input, { target: { value: 'Changed Title' } });
    fireEvent.keyDown(input, { key: 'Escape' });

    await waitFor(() => {
      expect(screen.getByText('Test Article Title')).toBeInTheDocument();
      expect(mockOnArticleChange).not.toHaveBeenCalled();
    });
  });

  it('saves editing when enter is pressed for single-line inputs', async () => {
    render(
      <ArticlePreview 
        article={mockArticle} 
        onArticleChange={mockOnArticleChange} 
      />
    );

    const titleElement = screen.getByText('Test Article Title');
    fireEvent.click(titleElement);

    const input = screen.getByDisplayValue('Test Article Title');
    fireEvent.change(input, { target: { value: 'New Title' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    await waitFor(() => {
      expect(mockOnArticleChange).toHaveBeenCalledWith({
        ...mockArticle,
        title: 'New Title'
      });
    });
  });
});