import React from 'react';
import ExportOptions from '../ExportOptions';
import { Article, VideoMetadata, ArticleMetadata } from '@/types';

const ExportOptionsExample: React.FC = () => {
  // Sample article data for demonstration
  const sampleVideoMetadata: VideoMetadata = {
    id: 'dQw4w9WgXcQ',
    title: 'How to Build Amazing Web Applications',
    description: 'A comprehensive guide to modern web development techniques and best practices.',
    duration: 1800, // 30 minutes
    thumbnailUrl: 'https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg',
    channelName: 'Tech Education Channel',
    publishDate: new Date('2023-12-01'),
    viewCount: 125000
  };

  const sampleArticleMetadata: ArticleMetadata = {
    wordCount: 1250,
    readingTime: 6,
    seoTitle: 'How to Build Amazing Web Applications - Complete Guide',
    metaDescription: 'Learn modern web development techniques, best practices, and tools to build amazing web applications from scratch.',
    sourceVideo: sampleVideoMetadata
  };

  const sampleArticle: Article = {
    title: 'How to Build Amazing Web Applications',
    introduction: 'In today\'s digital landscape, creating exceptional web applications requires a deep understanding of modern development practices, user experience principles, and the latest technologies. This comprehensive guide will walk you through the essential steps and considerations for building web applications that not only function flawlessly but also provide an outstanding user experience.',
    sections: [
      {
        heading: 'Planning and Architecture',
        content: 'Before writing a single line of code, successful web applications start with thorough planning. This involves understanding your target audience, defining clear objectives, and designing a scalable architecture that can grow with your needs.',
        subsections: [
          {
            heading: 'User Research and Requirements',
            content: 'Understanding your users is crucial for building applications that solve real problems. Conduct user interviews, analyze competitor solutions, and create detailed user personas to guide your development decisions.'
          },
          {
            heading: 'Technology Stack Selection',
            content: 'Choose technologies that align with your project requirements, team expertise, and long-term maintenance goals. Consider factors like performance, scalability, community support, and development velocity.'
          }
        ]
      },
      {
        heading: 'Development Best Practices',
        content: 'Following established best practices ensures your code is maintainable, scalable, and secure. This includes writing clean code, implementing proper testing strategies, and following security guidelines.',
        subsections: [
          {
            heading: 'Code Quality and Standards',
            content: 'Establish coding standards, use linting tools, and implement code review processes to maintain high code quality throughout your project lifecycle.'
          },
          {
            heading: 'Testing Strategies',
            content: 'Implement comprehensive testing including unit tests, integration tests, and end-to-end tests to ensure your application works reliably across different scenarios.'
          }
        ]
      },
      {
        heading: 'User Experience and Design',
        content: 'Great web applications prioritize user experience through intuitive design, responsive layouts, and accessibility considerations. Focus on creating interfaces that are both beautiful and functional.',
        subsections: [
          {
            heading: 'Responsive Design',
            content: 'Ensure your application works seamlessly across all device sizes and screen resolutions using modern CSS techniques and frameworks.'
          },
          {
            heading: 'Accessibility',
            content: 'Build inclusive applications that work for users with disabilities by following WCAG guidelines and implementing proper semantic HTML and ARIA attributes.'
          }
        ]
      },
      {
        heading: 'Performance Optimization',
        content: 'Optimize your application for speed and efficiency through various techniques including code splitting, lazy loading, caching strategies, and performance monitoring.',
        subsections: [
          {
            heading: 'Frontend Performance',
            content: 'Minimize bundle sizes, optimize images, implement efficient caching strategies, and use performance monitoring tools to identify and resolve bottlenecks.'
          },
          {
            heading: 'Backend Optimization',
            content: 'Optimize database queries, implement proper caching layers, use CDNs for static assets, and monitor server performance metrics.'
          }
        ]
      }
    ],
    conclusion: 'Building amazing web applications is a journey that requires continuous learning and adaptation to new technologies and best practices. By focusing on solid planning, following development best practices, prioritizing user experience, and optimizing for performance, you can create applications that not only meet current needs but are also prepared for future growth and evolution. Remember that great applications are built iteratively – start with a solid foundation and continuously improve based on user feedback and changing requirements.',
    metadata: sampleArticleMetadata,
    tags: ['web development', 'best practices', 'user experience', 'performance', 'architecture', 'frontend', 'backend', 'testing']
  };

  const handleExportComplete = (format: string) => {
    console.log(`Article exported successfully as ${format}`);
    // In a real application, you might want to show a toast notification
    // or update some state to reflect the successful export
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Export Options Example
        </h1>
        <p className="text-lg text-gray-600 mb-8">
          This example demonstrates the export functionality for converting articles 
          into different formats (Markdown, HTML, and Plain Text) with various templates 
          and customization options.
        </p>
      </div>

      {/* Article Preview */}
      <div className="bg-gray-50 p-6 rounded-lg">
        <h2 className="text-xl font-semibold mb-4">Sample Article</h2>
        <div className="bg-white p-4 rounded border">
          <h3 className="text-lg font-medium mb-2">{sampleArticle.title}</h3>
          <p className="text-sm text-gray-600 mb-2">
            {sampleArticle.metadata.wordCount} words • {sampleArticle.metadata.readingTime} min read
          </p>
          <p className="text-gray-700 text-sm">
            {sampleArticle.introduction.substring(0, 200)}...
          </p>
          <div className="mt-2">
            <span className="text-xs text-gray-500">
              {sampleArticle.sections.length} sections • {sampleArticle.tags.length} tags
            </span>
          </div>
        </div>
      </div>

      {/* Export Options Component */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Export Options</h2>
        <ExportOptions 
          article={sampleArticle}
          onExportComplete={handleExportComplete}
        />
      </div>

      {/* Usage Instructions */}
      <div className="bg-blue-50 p-6 rounded-lg">
        <h2 className="text-xl font-semibold mb-4 text-blue-900">
          How to Use Export Options
        </h2>
        <div className="space-y-3 text-blue-800">
          <div>
            <strong>1. Select Format:</strong> Choose between Markdown (.md), HTML (.html), or Plain Text (.txt)
          </div>
          <div>
            <strong>2. Choose Template:</strong> Different templates provide various styling and layout options
          </div>
          <div>
            <strong>3. Configure Options:</strong> Toggle metadata inclusion to control what information is included
          </div>
          <div>
            <strong>4. Export:</strong> Use Download to save the file, Copy to Clipboard for quick sharing, or Preview to see the result
          </div>
        </div>
      </div>

      {/* Format Examples */}
      <div className="grid md:grid-cols-3 gap-6">
        <div className="bg-white p-4 border rounded-lg">
          <h3 className="font-semibold mb-2 text-green-700">Markdown</h3>
          <p className="text-sm text-gray-600 mb-2">
            Perfect for documentation, GitHub README files, and technical blogs.
          </p>
          <div className="text-xs bg-gray-100 p-2 rounded font-mono">
            # Article Title<br/>
            ## Section<br/>
            Content here...
          </div>
        </div>

        <div className="bg-white p-4 border rounded-lg">
          <h3 className="font-semibold mb-2 text-blue-700">HTML</h3>
          <p className="text-sm text-gray-600 mb-2">
            Ready-to-publish web content with styling and proper semantic structure.
          </p>
          <div className="text-xs bg-gray-100 p-2 rounded font-mono">
            &lt;h1&gt;Article Title&lt;/h1&gt;<br/>
            &lt;h2&gt;Section&lt;/h2&gt;<br/>
            &lt;p&gt;Content here...&lt;/p&gt;
          </div>
        </div>

        <div className="bg-white p-4 border rounded-lg">
          <h3 className="font-semibold mb-2 text-purple-700">Plain Text</h3>
          <p className="text-sm text-gray-600 mb-2">
            Simple, clean text format compatible with any text editor or system.
          </p>
          <div className="text-xs bg-gray-100 p-2 rounded font-mono">
            Article Title<br/>
            <br/>
            # Section<br/>
            Content here...
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExportOptionsExample;