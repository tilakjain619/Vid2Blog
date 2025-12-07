# ArticlePreview Component

The `ArticlePreview` component provides a comprehensive interface for previewing and editing blog articles generated from YouTube videos. It supports inline editing, section management, and real-time preview updates.

## Features

### ✅ Inline Text Editing
- Click on any text element to edit it inline
- Support for both single-line (titles, headings) and multi-line (content) editing
- Real-time preview updates as you type
- Save/Cancel buttons for each edit session

### ✅ Section Management
- Add new sections with the "Add Section" button
- Remove sections with the "Remove Section" button
- Support for nested subsections with hierarchical editing
- Drag-and-drop reordering (future enhancement)

### ✅ Keyboard Shortcuts
- **Enter**: Save changes for single-line inputs
- **Escape**: Cancel editing and revert changes
- **Shift+Enter**: Add new line in multi-line inputs

### ✅ Tag Management
- Edit tags as comma-separated values
- Automatic parsing and validation
- Visual tag display with styled badges
- Support for adding/removing individual tags

### ✅ Metadata Display
- Word count and reading time calculation
- Source video information display
- SEO metadata preview
- Publication date and channel information

## Usage

```tsx
import React, { useState } from 'react';
import { ArticlePreview } from '@/components';
import { Article } from '@/types';

const MyComponent = () => {
  const [article, setArticle] = useState<Article>({
    title: "My Article Title",
    introduction: "Article introduction...",
    sections: [
      {
        heading: "Section 1",
        content: "Section content...",
        subsections: []
      }
    ],
    conclusion: "Article conclusion...",
    metadata: {
      wordCount: 150,
      readingTime: 1,
      seoTitle: "SEO Title",
      metaDescription: "Meta description",
      sourceVideo: {
        // VideoMetadata object
      }
    },
    tags: ["tag1", "tag2"]
  });

  const handleArticleChange = (updatedArticle: Article) => {
    setArticle(updatedArticle);
    // Optionally save to backend or local storage
  };

  return (
    <ArticlePreview 
      article={article}
      onArticleChange={handleArticleChange}
      className="custom-styling"
    />
  );
};
```

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `article` | `Article` | Yes | The article object to display and edit |
| `onArticleChange` | `(article: Article) => void` | Yes | Callback fired when article content changes |
| `className` | `string` | No | Additional CSS classes for styling |

## Article Data Structure

```typescript
interface Article {
  title: string;
  introduction: string;
  sections: ArticleSection[];
  conclusion: string;
  metadata: ArticleMetadata;
  tags: string[];
}

interface ArticleSection {
  heading: string;
  content: string;
  subsections?: ArticleSection[];
}

interface ArticleMetadata {
  wordCount: number;
  readingTime: number;
  seoTitle: string;
  metaDescription: string;
  sourceVideo: VideoMetadata;
}
```

## Styling

The component uses Tailwind CSS classes and can be customized through:

1. **Custom CSS Classes**: Pass additional classes via the `className` prop
2. **Tailwind Utilities**: Override default styles with Tailwind utilities
3. **CSS Variables**: Customize colors and spacing through CSS custom properties

### Default Styling Classes

- Container: `max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-sm`
- Editable Content: `cursor-pointer hover:bg-gray-50 p-2 rounded-md transition-colors`
- Input Fields: `w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500`
- Buttons: Uses the `Button` component with various variants

## Accessibility

The component follows accessibility best practices:

- **Keyboard Navigation**: Full keyboard support for editing and navigation
- **Focus Management**: Proper focus handling during edit mode
- **ARIA Labels**: Semantic HTML with appropriate ARIA attributes
- **Screen Reader Support**: Content is properly structured for screen readers

## Performance Considerations

- **Optimized Re-renders**: Uses `useCallback` to prevent unnecessary re-renders
- **Efficient State Updates**: Immutable state updates for better performance
- **Lazy Loading**: Large content is handled efficiently
- **Debounced Updates**: Input changes are debounced to prevent excessive API calls

## Testing

The component includes comprehensive tests covering:

- Rendering of article content
- Inline editing functionality
- Section management (add/remove)
- Keyboard shortcuts
- Tag editing
- Metadata display

Run tests with:
```bash
npm test -- --testPathPattern=ArticlePreview.test.tsx
```

## Examples

See `src/components/examples/ArticlePreviewExample.tsx` for a complete working example with sample data and usage patterns.

## Integration with Vid2Blog Pipeline

The ArticlePreview component integrates with the Vid2Blog processing pipeline:

1. **Input**: Receives `Article` objects from the content generation API
2. **Editing**: Allows users to refine and customize generated content
3. **Output**: Provides edited articles for export or further processing
4. **Persistence**: Can be connected to backend APIs for saving drafts

## Future Enhancements

- **Rich Text Editing**: Support for bold, italic, and other formatting
- **Image Integration**: Inline image upload and management
- **Version History**: Track and revert to previous versions
- **Collaborative Editing**: Real-time collaborative editing support
- **Export Options**: Direct export to various formats (PDF, Word, etc.)
- **Template System**: Pre-defined article templates and layouts