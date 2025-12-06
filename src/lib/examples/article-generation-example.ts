/**
 * Example usage of the Article Generator
 * This file demonstrates how to use the article generation functionality
 */

import { ArticleGenerator } from '../article-generator';
import { ContentAnalyzer } from '../content-analyzer';
import {
    Transcript,
    VideoMetadata,
    GenerationOptions
} from '@/types';

// Example transcript data
const exampleTranscript: Transcript = {
    segments: [
        {
            text: 'Welcome to this tutorial on React hooks. Today we will learn about useState and useEffect.',
            startTime: 0,
            endTime: 6,
            confidence: 0.95
        },
        {
            text: 'useState is a hook that allows you to add state to functional components.',
            startTime: 10,
            endTime: 16,
            confidence: 0.94
        },
        {
            text: 'useEffect is used for side effects like data fetching and subscriptions.',
            startTime: 20,
            endTime: 26,
            confidence: 0.93
        },
        {
            text: 'Let me show you how to implement a counter using useState.',
            startTime: 30,
            endTime: 35,
            confidence: 0.92
        }
    ],
    language: 'en',
    confidence: 0.94,
    duration: 300
};

// Example video metadata
const exampleVideoMetadata: VideoMetadata = {
    id: 'react_hooks_tutorial',
    title: 'React Hooks Tutorial: useState and useEffect',
    description: 'Learn the fundamentals of React hooks with practical examples',
    duration: 300,
    thumbnailUrl: 'https://example.com/thumbnail.jpg',
    channelName: 'React Academy',
    publishDate: new Date('2024-01-15'),
    viewCount: 15000
};

/**
 * Example 1: Basic article generation
 */
export function generateBasicArticle() {
    console.log('=== Basic Article Generation ===');

    // Step 1: Analyze the content
    const analysis = ContentAnalyzer.analyzeContent(exampleTranscript, {
        maxTopics: 5,
        maxKeyPoints: 8,
        summaryLength: 3
    });

    console.log('Content Analysis:', {
        topicsFound: analysis.topics.length,
        keyPointsFound: analysis.keyPoints.length,
        sentiment: analysis.sentiment
    });

    // Step 2: Generate article with default options
    const article = ArticleGenerator.generateArticle(
        analysis,
        exampleVideoMetadata,
        exampleTranscript
    );

    console.log('Generated Article:', {
        title: article.title,
        sectionsCount: article.sections.length,
        wordCount: article.metadata.wordCount,
        readingTime: article.metadata.readingTime,
        tags: article.tags
    });

    return article;
}

/**
 * Example 2: Article generation with custom options
 */
export function generateCustomArticle() {
    console.log('=== Custom Article Generation ===');

    const analysis = ContentAnalyzer.analyzeContent(exampleTranscript);

    // Custom generation options
    const options: GenerationOptions = {
        length: 'long',
        tone: 'technical',
        format: 'markdown',
        includeTimestamps: true,
        customTemplate: 'Tutorial Guide'
    };

    const article = ArticleGenerator.generateArticle(
        analysis,
        exampleVideoMetadata,
        exampleTranscript,
        options
    );

    console.log('Custom Article:', {
        title: article.title,
        tone: 'technical',
        hasTimestamps: article.sections.some(s => s.content.includes('*')),
        sectionsCount: article.sections.length
    });

    return article;
}

/**
 * Example 3: Different tones comparison
 */
export function compareTones() {
    console.log('=== Tone Comparison ===');

    const analysis = ContentAnalyzer.analyzeContent(exampleTranscript);

    const tones: Array<'professional' | 'casual' | 'technical'> = ['professional', 'casual', 'technical'];

    const articles = tones.map(tone => {
        const article = ArticleGenerator.generateArticle(
            analysis,
            exampleVideoMetadata,
            exampleTranscript,
            { tone, length: 'medium', format: 'markdown' }
        );

        return {
            tone,
            introduction: article.introduction.substring(0, 100) + '...',
            wordCount: article.metadata.wordCount
        };
    });

    console.log('Tone Comparison:', articles);

    return articles;
}

/**
 * Example 4: Template selection
 */
export function exploreTemplates() {
    console.log('=== Available Templates ===');

    const templates = ArticleGenerator.getAvailableTemplates();

    templates.forEach(template => {
        console.log(`Template: ${template.name}`, {
            type: template.type,
            defaultTone: template.defaultTone,
            estimatedLength: template.estimatedLength,
            sectionsCount: template.structure.length,
            sections: template.structure.map(s => s.heading)
        });
    });

    return templates;
}

/**
 * Example 5: API usage simulation
 */
export async function simulateAPIUsage() {
    console.log('=== API Usage Simulation ===');

    // Simulate the API request body
    const requestBody = {
        analysis: ContentAnalyzer.analyzeContent(exampleTranscript),
        videoMetadata: exampleVideoMetadata,
        transcript: exampleTranscript,
        options: {
            length: 'medium' as const,
            tone: 'professional' as const,
            format: 'markdown' as const,
            includeTimestamps: false
        }
    };

    console.log('API Request Body Structure:', {
        hasAnalysis: !!requestBody.analysis,
        hasVideoMetadata: !!requestBody.videoMetadata,
        hasTranscript: !!requestBody.transcript,
        options: requestBody.options
    });

    // Simulate article generation (as would happen in the API)
    const startTime = Date.now();

    const article = ArticleGenerator.generateArticle(
        requestBody.analysis,
        requestBody.videoMetadata,
        requestBody.transcript,
        requestBody.options
    );

    const processingTime = Date.now() - startTime;

    // Simulate API response
    const response = {
        success: true,
        article,
        processingTime
    };

    console.log('API Response:', {
        success: response.success,
        processingTime: response.processingTime,
        articleGenerated: !!response.article,
        articleTitle: response.article?.title
    });

    return response;
}

/**
 * Run all examples
 */
export function runAllExamples() {
    console.log('🚀 Running Article Generation Examples\n');

    try {
        generateBasicArticle();
        console.log('\n');

        generateCustomArticle();
        console.log('\n');

        compareTones();
        console.log('\n');

        exploreTemplates();
        console.log('\n');

        simulateAPIUsage();
        console.log('\n');

        console.log('✅ All examples completed successfully!');
    } catch (error) {
        console.error('❌ Error running examples:', error);
    }
}

// Export for use in other files or testing
export {
    exampleTranscript,
    exampleVideoMetadata
};