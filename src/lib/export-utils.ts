import { Article, ArticleSection } from '@/types';

export type ExportFormat = 'markdown' | 'html' | 'plain';

export interface ExportOptions {
  format: ExportFormat;
  includeMetadata?: boolean;
  includeTimestamps?: boolean;
  template?: string;
}

export interface ExportResult {
  content: string;
  filename: string;
  mimeType: string;
}

// Template system for different export formats
export const templates = {
  markdown: {
    default: `# {{title}}

{{#if includeMetadata}}
**Source:** {{metadata.sourceVideo.title}}  
**Channel:** {{metadata.sourceVideo.channelName}}  
**Word Count:** {{metadata.wordCount}}  
**Reading Time:** {{metadata.readingTime}} minutes  
**Tags:** {{tags}}

---
{{/if}}

## Introduction

{{introduction}}

{{#each sections}}
## {{heading}}

{{content}}

{{#each subsections}}
### {{heading}}

{{content}}

{{/each}}

{{/each}}

## Conclusion

{{conclusion}}
`,
    blog: `# {{title}}

{{introduction}}

{{#each sections}}
## {{heading}}

{{content}}

{{#each subsections}}
### {{heading}}

{{content}}

{{/each}}
{{/each}}

## Conclusion

{{conclusion}}

{{#if includeMetadata}}
---

*This article was generated from the YouTube video "[{{metadata.sourceVideo.title}}](https://youtube.com/watch?v={{metadata.sourceVideo.id}})" by {{metadata.sourceVideo.channelName}}.*

**Tags:** {{tags}}
{{/if}}
`,
    minimal: `# {{title}}

{{introduction}}

{{#each sections}}
## {{heading}}

{{content}}
{{/each}}

{{conclusion}}
`
  },
  html: {
    default: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{title}}</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; max-width: 800px; margin: 0 auto; padding: 20px; }
        h1 { color: #333; border-bottom: 2px solid #eee; padding-bottom: 10px; }
        h2 { color: #555; margin-top: 30px; }
        h3 { color: #666; }
        .metadata { background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0; }
        .tags { margin-top: 10px; }
        .tag { background: #e3f2fd; color: #1976d2; padding: 2px 8px; border-radius: 12px; font-size: 0.8em; margin-right: 5px; }
    </style>
</head>
<body>
    <h1>{{title}}</h1>
    
    {{#if includeMetadata}}
    <div class="metadata">
        <strong>Source:</strong> {{metadata.sourceVideo.title}}<br>
        <strong>Channel:</strong> {{metadata.sourceVideo.channelName}}<br>
        <strong>Word Count:</strong> {{metadata.wordCount}}<br>
        <strong>Reading Time:</strong> {{metadata.readingTime}} minutes
        <div class="tags">
            <strong>Tags:</strong>
            {{#each tagsArray}}
            <span class="tag">{{this}}</span>
            {{/each}}
        </div>
    </div>
    {{/if}}
    
    <h2>Introduction</h2>
    <p>{{introduction}}</p>
    
    {{#each sections}}
    <h2>{{heading}}</h2>
    <p>{{content}}</p>
    
    {{#each subsections}}
    <h3>{{heading}}</h3>
    <p>{{content}}</p>
    {{/each}}
    
    {{/each}}
    
    <h2>Conclusion</h2>
    <p>{{conclusion}}</p>
</body>
</html>`,
    article: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{title}}</title>
    <meta name="description" content="{{metadata.metaDescription}}">
    <style>
        body { font-family: Georgia, serif; line-height: 1.8; max-width: 700px; margin: 0 auto; padding: 40px 20px; color: #333; }
        h1 { font-size: 2.5em; margin-bottom: 0.5em; text-align: center; }
        h2 { font-size: 1.8em; margin-top: 2em; margin-bottom: 0.8em; }
        h3 { font-size: 1.4em; margin-top: 1.5em; margin-bottom: 0.6em; }
        p { margin-bottom: 1.2em; }
        .intro { font-size: 1.1em; font-style: italic; text-align: center; margin: 2em 0; }
        .metadata { text-align: center; color: #666; font-size: 0.9em; margin: 2em 0; }
        .tags { text-align: center; margin: 2em 0; }
        .tag { background: #f0f0f0; padding: 4px 12px; border-radius: 20px; margin: 0 3px; font-size: 0.8em; }
    </style>
</head>
<body>
    <h1>{{title}}</h1>
    
    {{#if includeMetadata}}
    <div class="metadata">
        Based on "{{metadata.sourceVideo.title}}" by {{metadata.sourceVideo.channelName}}
    </div>
    {{/if}}
    
    <div class="intro">{{introduction}}</div>
    
    {{#each sections}}
    <h2>{{heading}}</h2>
    <p>{{content}}</p>
    
    {{#each subsections}}
    <h3>{{heading}}</h3>
    <p>{{content}}</p>
    {{/each}}
    {{/each}}
    
    <h2>Conclusion</h2>
    <p>{{conclusion}}</p>
    
    {{#if includeMetadata}}
    <div class="tags">
        {{#each tagsArray}}
        <span class="tag">{{this}}</span>
        {{/each}}
    </div>
    {{/if}}
</body>
</html>`
  }
};

// Simple template engine for string interpolation
function processTemplate(template: string, data: any): string {
  let result = template;
  let iterations = 0;
  const maxIterations = 10; // Prevent infinite loops
  
  // Keep processing until no more template expressions are found
  while (iterations < maxIterations) {
    const originalResult = result;
    
    // Handle conditional blocks {{#if condition}}...{{/if}}
    result = result.replace(/\{\{#if\s+([^}]+)\}\}([\s\S]*?)\{\{\/if\}\}/g, (match, condition, content) => {
      const value = getNestedValue(data, condition.trim());
      return value ? content : '';
    });
    
    // Handle each loops {{#each array}}...{{/each}}
    result = result.replace(/\{\{#each\s+([^}]+)\}\}([\s\S]*?)\{\{\/each\}\}/g, (match, arrayPath, content) => {
      const array = getNestedValue(data, arrayPath.trim());
      if (!Array.isArray(array)) return '';
      
      return array.map(item => {
        let itemContent = content;
        // Replace {{this}} with the current item
        itemContent = itemContent.replace(/\{\{this\}\}/g, String(item));
        // Replace other properties if item is an object
        if (typeof item === 'object' && item !== null) {
          // Create a new context with the item's properties taking precedence
          const itemContext = { ...data, ...item };
          itemContent = processTemplate(itemContent, itemContext);
        }
        return itemContent;
      }).join('\n');
    });
    
    // Handle simple variable substitution {{variable}}
    result = result.replace(/\{\{([^}#\/][^}]*)\}\}/g, (match, path) => {
      const value = getNestedValue(data, path.trim());
      return value !== undefined ? String(value) : '';
    });
    
    // If no changes were made, we're done
    if (result === originalResult) {
      break;
    }
    
    iterations++;
  }
  
  return result;
}

// Helper function to get nested object values
function getNestedValue(obj: any, path: string): any {
  return path.split('.').reduce((current, key) => {
    return current && current[key] !== undefined ? current[key] : undefined;
  }, obj);
}

// Convert article sections to markdown text
function sectionsToMarkdown(sections: ArticleSection[], level: number = 2): string {
  return sections.map(section => {
    let text = `${'#'.repeat(level)} ${section.heading}\n\n${section.content}\n\n`;
    
    if (section.subsections && section.subsections.length > 0) {
      text += sectionsToMarkdown(section.subsections, level + 1);
    }
    
    return text;
  }).join('');
}

// Convert article sections to HTML
function sectionsToHtml(sections: ArticleSection[], level: number = 2): string {
  return sections.map(section => {
    const headingTag = `h${level}`;
    let html = `    <${headingTag}>${section.heading}</${headingTag}>\n    <p>${section.content}</p>\n`;
    
    if (section.subsections && section.subsections.length > 0) {
      html += '\n' + sectionsToHtml(section.subsections, level + 1);
    }
    
    return html;
  }).join('\n');
}

// Convert article sections to plain text
function sectionsToPlainText(sections: ArticleSection[], level: number = 1): string {
  return sections.map(section => {
    let text = `${'#'.repeat(level)} ${section.heading}\n\n${section.content}\n\n`;
    
    if (section.subsections && section.subsections.length > 0) {
      text += sectionsToPlainText(section.subsections, level + 1);
    }
    
    return text;
  }).join('');
}

// Export article to different formats
export function exportArticle(article: Article, options: ExportOptions): ExportResult {
  const { format, includeMetadata = true, template = 'default' } = options;
  
  // Prepare data for template processing
  const templateData = {
    ...article,
    tags: article.tags.join(', '),
    tagsArray: article.tags,
    includeMetadata
  };
  
  let content: string;
  let mimeType: string;
  let extension: string;
  
  switch (format) {
    case 'markdown':
      content = `# ${article.title}\n\n`;
      if (includeMetadata) {
        content += `**Source:** ${article.metadata.sourceVideo.title}  \n`;
        content += `**Channel:** ${article.metadata.sourceVideo.channelName}  \n`;
        content += `**Word Count:** ${article.metadata.wordCount}  \n`;
        content += `**Reading Time:** ${article.metadata.readingTime} minutes  \n`;
        content += `**Tags:** ${article.tags.join(', ')}\n\n`;
        content += '---\n\n';
      }
      content += `## Introduction\n\n${article.introduction}\n\n`;
      content += sectionsToMarkdown(article.sections);
      content += `## Conclusion\n\n${article.conclusion}\n`;
      
      // Apply template-specific modifications
      if (template === 'blog') {
        content += `\n---\n\n*This article was generated from the YouTube video "[${article.metadata.sourceVideo.title}](https://youtube.com/watch?v=${article.metadata.sourceVideo.id})" by ${article.metadata.sourceVideo.channelName}.*\n\n`;
        if (includeMetadata) {
          content += `**Tags:** ${article.tags.join(', ')}\n`;
        }
      } else if (template === 'minimal') {
        // Remove metadata for minimal template
        content = `# ${article.title}\n\n${article.introduction}\n\n`;
        content += sectionsToMarkdown(article.sections);
        content += `${article.conclusion}\n`;
      }
      
      mimeType = 'text/markdown';
      extension = 'md';
      break;
      
    case 'html':
      content = `<!DOCTYPE html>\n<html lang="en">\n<head>\n`;
      content += `    <meta charset="UTF-8">\n`;
      content += `    <meta name="viewport" content="width=device-width, initial-scale=1.0">\n`;
      content += `    <title>${article.title}</title>\n`;
      
      if (template === 'article') {
        content += `    <meta name="description" content="${article.metadata.metaDescription}">\n`;
        content += `    <style>\n        body { font-family: Georgia, serif; line-height: 1.8; max-width: 700px; margin: 0 auto; padding: 40px 20px; color: #333; }\n`;
        content += `        h1 { font-size: 2.5em; margin-bottom: 0.5em; text-align: center; }\n`;
        content += `        h2 { font-size: 1.8em; margin-top: 2em; margin-bottom: 0.8em; }\n`;
        content += `        h3 { font-size: 1.4em; margin-top: 1.5em; margin-bottom: 0.6em; }\n`;
        content += `        p { margin-bottom: 1.2em; }\n`;
        content += `        .intro { font-size: 1.1em; font-style: italic; text-align: center; margin: 2em 0; }\n`;
        content += `        .metadata { text-align: center; color: #666; font-size: 0.9em; margin: 2em 0; }\n`;
        content += `        .tags { text-align: center; margin: 2em 0; }\n`;
        content += `        .tag { background: #f0f0f0; padding: 4px 12px; border-radius: 20px; margin: 0 3px; font-size: 0.8em; }\n`;
        content += `    </style>\n</head>\n<body>\n`;
        content += `    <h1>${article.title}</h1>\n`;
        if (includeMetadata) {
          content += `    <div class="metadata">Based on "${article.metadata.sourceVideo.title}" by ${article.metadata.sourceVideo.channelName}</div>\n`;
        }
        content += `    <div class="intro">${article.introduction}</div>\n`;
      } else {
        content += `    <style>\n        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; max-width: 800px; margin: 0 auto; padding: 20px; }\n`;
        content += `        h1 { color: #333; border-bottom: 2px solid #eee; padding-bottom: 10px; }\n`;
        content += `        h2 { color: #555; margin-top: 30px; }\n`;
        content += `        h3 { color: #666; }\n`;
        content += `        .metadata { background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0; }\n`;
        content += `        .tags { margin-top: 10px; }\n`;
        content += `        .tag { background: #e3f2fd; color: #1976d2; padding: 2px 8px; border-radius: 12px; font-size: 0.8em; margin-right: 5px; }\n`;
        content += `    </style>\n</head>\n<body>\n`;
        content += `    <h1>${article.title}</h1>\n`;
        if (includeMetadata) {
          content += `    <div class="metadata">\n`;
          content += `        <strong>Source:</strong> ${article.metadata.sourceVideo.title}<br>\n`;
          content += `        <strong>Channel:</strong> ${article.metadata.sourceVideo.channelName}<br>\n`;
          content += `        <strong>Word Count:</strong> ${article.metadata.wordCount}<br>\n`;
          content += `        <strong>Reading Time:</strong> ${article.metadata.readingTime} minutes\n`;
          content += `        <div class="tags">\n            <strong>Tags:</strong>\n`;
          article.tags.forEach(tag => {
            content += `            <span class="tag">${tag}</span>\n`;
          });
          content += `        </div>\n    </div>\n`;
        }
        content += `    <h2>Introduction</h2>\n    <p>${article.introduction}</p>\n`;
      }
      
      content += sectionsToHtml(article.sections);
      content += `    <h2>Conclusion</h2>\n    <p>${article.conclusion}</p>\n`;
      
      if (template === 'article' && includeMetadata) {
        content += `    <div class="tags">\n`;
        article.tags.forEach(tag => {
          content += `        <span class="tag">${tag}</span>\n`;
        });
        content += `    </div>\n`;
      }
      
      content += `</body>\n</html>`;
      mimeType = 'text/html';
      extension = 'html';
      break;
      
    case 'plain':
      content = `${article.title}\n\n`;
      if (includeMetadata) {
        content += `Source: ${article.metadata.sourceVideo.title}\n`;
        content += `Channel: ${article.metadata.sourceVideo.channelName}\n`;
        content += `Word Count: ${article.metadata.wordCount}\n`;
        content += `Reading Time: ${article.metadata.readingTime} minutes\n`;
        content += `Tags: ${article.tags.join(', ')}\n\n`;
        content += '---\n\n';
      }
      content += `${article.introduction}\n\n`;
      content += sectionsToPlainText(article.sections);
      content += `${article.conclusion}\n`;
      mimeType = 'text/plain';
      extension = 'txt';
      break;
      
    default:
      throw new Error(`Unsupported export format: ${format}`);
  }
  
  // Generate filename
  const sanitizedTitle = article.title
    .replace(/[^a-zA-Z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .toLowerCase();
  const filename = `${sanitizedTitle}.${extension}`;
  
  return {
    content,
    filename,
    mimeType
  };
}

// Download file using browser File API
export function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  
  // Cleanup
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// Copy content to clipboard
export async function copyToClipboard(content: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(content);
      return true;
    } else {
      // Fallback for older browsers or non-secure contexts
      const textArea = document.createElement('textarea');
      textArea.value = content;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      
      const success = document.execCommand('copy');
      document.body.removeChild(textArea);
      return success;
    }
  } catch (error) {
    console.error('Failed to copy to clipboard:', error);
    return false;
  }
}

// Get available templates for a format
export function getAvailableTemplates(format: ExportFormat): string[] {
  switch (format) {
    case 'markdown':
      return Object.keys(templates.markdown);
    case 'html':
      return Object.keys(templates.html);
    case 'plain':
      return ['default']; // Plain text only has one template
    default:
      return [];
  }
}