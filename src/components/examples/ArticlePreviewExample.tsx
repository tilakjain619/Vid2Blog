import React, { useState } from 'react';
import ArticlePreview from '../ArticlePreview';
import { Article } from '@/types';

const ArticlePreviewExample: React.FC = () => {
  const [article, setArticle] = useState<Article>({
    title: "How to Build Amazing Web Applications with React",
    introduction: "React has revolutionized the way we build user interfaces. In this comprehensive guide, we'll explore the key concepts and best practices for creating modern web applications.",
    sections: [
      {
        heading: "Getting Started with React",
        content: "React is a JavaScript library for building user interfaces. It allows you to create reusable components that manage their own state.",
        subsections: [
          {
            heading: "Setting Up Your Development Environment",
            content: "Before you start building React applications, you need to set up your development environment with Node.js and npm."
          },
          {
            heading: "Creating Your First Component",
            content: "Components are the building blocks of React applications. Let's create a simple Hello World component."
          }
        ]
      },
      {
        heading: "State Management",
        content: "Managing state is crucial in React applications. We'll explore useState, useEffect, and other hooks that help you manage component state effectively."
      },
      {
        heading: "Best Practices",
        content: "Following best practices ensures your React applications are maintainable, performant, and scalable. Here are some key guidelines to follow."
      }
    ],
    conclusion: "React provides a powerful and flexible way to build modern web applications. By following the concepts and practices outlined in this guide, you'll be well on your way to creating amazing user experiences.",
    metadata: {
      wordCount: 245,
      readingTime: 2,
      seoTitle: "Complete React Guide - Build Amazing Web Apps",
      metaDescription: "Learn how to build modern web applications with React. Complete guide covering components, state management, and best practices.",
      sourceVideo: {
        id: "dQw4w9WgXcQ",
        title: "React Tutorial for Beginners - Complete Course",
        description: "Learn React from scratch in this comprehensive tutorial",
        duration: 3600,
        thumbnailUrl: "https://img.youtube.com/vi/dQw4w9WgXcQ/maxresdefault.jpg",
        channelName: "Tech Education Channel",
        publishDate: new Date('2024-01-15'),
        viewCount: 125000
      }
    },
    tags: ["react", "javascript", "web-development", "tutorial", "frontend"]
  });

  const handleArticleChange = (updatedArticle: Article) => {
    setArticle(updatedArticle);
  };

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="container mx-auto px-4">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Article Preview & Editor
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            This is an interactive article preview component that allows you to edit content inline. 
            Click on any text to start editing, and use the buttons to add or remove sections.
          </p>
        </div>

        <ArticlePreview 
          article={article} 
          onArticleChange={handleArticleChange}
          className="mb-8"
        />

        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-2xl font-semibold mb-4">Features Demonstrated</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-medium mb-2">✅ Inline Editing</h3>
              <p className="text-gray-600 mb-4">
                Click on any text element (title, headings, content) to edit it inline with real-time preview updates.
              </p>

              <h3 className="text-lg font-medium mb-2">✅ Section Management</h3>
              <p className="text-gray-600 mb-4">
                Add new sections, remove existing ones, and manage subsections with nested editing capabilities.
              </p>

              <h3 className="text-lg font-medium mb-2">✅ Keyboard Shortcuts</h3>
              <p className="text-gray-600">
                Use Enter to save single-line edits and Escape to cancel changes without saving.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-medium mb-2">✅ Tag Management</h3>
              <p className="text-gray-600 mb-4">
                Edit tags as comma-separated values with automatic parsing and visual tag display.
              </p>

              <h3 className="text-lg font-medium mb-2">✅ Metadata Display</h3>
              <p className="text-gray-600 mb-4">
                View article metadata including word count, reading time, and source video information.
              </p>

              <h3 className="text-lg font-medium mb-2">✅ Responsive Design</h3>
              <p className="text-gray-600">
                The component is fully responsive and works well on desktop and mobile devices.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ArticlePreviewExample;