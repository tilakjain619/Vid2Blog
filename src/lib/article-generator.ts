import { 
  ContentAnalysis, 
  Article, 
  ArticleMetadata, 
  ArticleSection, 
  GenerationOptions, 
  VideoMetadata,
  Transcript 
} from '@/types';

/**
 * Article template interface for different content types
 */
export interface ArticleTemplate {
  name: string;
  type: 'tutorial' | 'interview' | 'presentation' | 'discussion' | 'review' | 'general';
  structure: TemplateSection[];
  defaultTone: 'professional' | 'casual' | 'technical';
  estimatedLength: 'short' | 'medium' | 'long';
}

/**
 * Template section configuration
 */
export interface TemplateSection {
  heading: string;
  contentType: 'introduction' | 'main_content' | 'key_points' | 'summary' | 'conclusion' | 'custom';
  minLength?: number; // minimum words
  maxLength?: number; // maximum words
  includeTimestamps?: boolean;
  keywordFocus?: string[]; // focus on specific keywords
}

/**
 * Service for generating blog articles from analyzed content
 */
export class ArticleGenerator {
  private static readonly PREDEFINED_TEMPLATES: ArticleTemplate[] = [
    {
      name: 'Tutorial Guide',
      type: 'tutorial',
      defaultTone: 'professional',
      estimatedLength: 'long',
      structure: [
        {
          heading: 'Introduction',
          contentType: 'introduction',
          minLength: 50,
          maxLength: 150
        },
        {
          heading: 'Overview',
          contentType: 'summary',
          minLength: 100,
          maxLength: 200
        },
        {
          heading: 'Step-by-Step Guide',
          contentType: 'main_content',
          minLength: 300,
          maxLength: 800,
          includeTimestamps: true
        },
        {
          heading: 'Key Takeaways',
          contentType: 'key_points',
          minLength: 100,
          maxLength: 300
        },
        {
          heading: 'Conclusion',
          contentType: 'conclusion',
          minLength: 50,
          maxLength: 150
        }
      ]
    },
    {
      name: 'Interview Summary',
      type: 'interview',
      defaultTone: 'professional',
      estimatedLength: 'medium',
      structure: [
        {
          heading: 'Introduction',
          contentType: 'introduction',
          minLength: 50,
          maxLength: 100
        },
        {
          heading: 'Key Discussion Points',
          contentType: 'key_points',
          minLength: 200,
          maxLength: 400,
          includeTimestamps: true
        },
        {
          heading: 'Main Insights',
          contentType: 'main_content',
          minLength: 200,
          maxLength: 500
        },
        {
          heading: 'Summary',
          contentType: 'conclusion',
          minLength: 100,
          maxLength: 200
        }
      ]
    },
    {
      name: 'Presentation Notes',
      type: 'presentation',
      defaultTone: 'technical',
      estimatedLength: 'medium',
      structure: [
        {
          heading: 'Overview',
          contentType: 'introduction',
          minLength: 50,
          maxLength: 150
        },
        {
          heading: 'Main Topics',
          contentType: 'main_content',
          minLength: 300,
          maxLength: 600,
          includeTimestamps: true
        },
        {
          heading: 'Key Points',
          contentType: 'key_points',
          minLength: 150,
          maxLength: 300
        },
        {
          heading: 'Conclusion',
          contentType: 'conclusion',
          minLength: 50,
          maxLength: 150
        }
      ]
    },
    {
      name: 'Discussion Summary',
      type: 'discussion',
      defaultTone: 'casual',
      estimatedLength: 'short',
      structure: [
        {
          heading: 'Introduction',
          contentType: 'introduction',
          minLength: 30,
          maxLength: 100
        },
        {
          heading: 'Main Discussion',
          contentType: 'main_content',
          minLength: 200,
          maxLength: 400
        },
        {
          heading: 'Key Takeaways',
          contentType: 'key_points',
          minLength: 100,
          maxLength: 200
        }
      ]
    },
    {
      name: 'General Article',
      type: 'general',
      defaultTone: 'professional',
      estimatedLength: 'medium',
      structure: [
        {
          heading: 'Introduction',
          contentType: 'introduction',
          minLength: 50,
          maxLength: 150
        },
        {
          heading: 'Main Content',
          contentType: 'main_content',
          minLength: 250,
          maxLength: 500
        },
        {
          heading: 'Key Points',
          contentType: 'key_points',
          minLength: 100,
          maxLength: 250
        },
        {
          heading: 'Conclusion',
          contentType: 'conclusion',
          minLength: 50,
          maxLength: 150
        }
      ]
    }
  ];

  /**
   * Generate a complete article from content analysis
   */
  static generateArticle(
    analysis: ContentAnalysis,
    videoMetadata: VideoMetadata,
    transcript: Transcript,
    options: GenerationOptions = {
      length: 'medium',
      tone: 'professional',
      format: 'markdown'
    }
  ): Article {
    // Select appropriate template
    const template = this.selectTemplate(analysis, options);
    
    // Generate article sections based on template
    const sections = this.generateSections(analysis, transcript, template, options);
    
    // Generate title
    const title = this.generateTitle(videoMetadata, analysis, options);
    
    // Generate introduction and conclusion
    const introduction = this.generateIntroduction(videoMetadata, analysis, options);
    const conclusion = this.generateConclusion(analysis, options);
    
    // Generate metadata
    const metadata = this.generateMetadata(title, sections, introduction, conclusion, videoMetadata);
    
    // Generate tags
    const tags = this.generateTags(analysis, videoMetadata);

    return {
      title,
      introduction,
      sections,
      conclusion,
      metadata,
      tags
    };
  }

  /**
   * Select the most appropriate template based on content analysis
   */
  private static selectTemplate(
    analysis: ContentAnalysis,
    options: GenerationOptions
  ): ArticleTemplate {
    // If custom template is provided, try to find it
    if (options.customTemplate) {
      const customTemplate = this.PREDEFINED_TEMPLATES.find(
        t => t.name.toLowerCase() === options.customTemplate?.toLowerCase()
      );
      if (customTemplate) return customTemplate;
    }

    // Auto-select based on content characteristics
    const keyPointCategories = analysis.keyPoints.map(kp => kp.category.toLowerCase());
    const topicNames = analysis.topics.map(t => t.name.toLowerCase());
    
    // Check for tutorial indicators
    if (this.containsWords(topicNames.concat(keyPointCategories), 
        ['step', 'guide', 'tutorial', 'how', 'method', 'process'])) {
      return this.PREDEFINED_TEMPLATES.find(t => t.type === 'tutorial')!;
    }
    
    // Check for interview indicators
    if (this.containsWords(topicNames.concat(keyPointCategories), 
        ['interview', 'discussion', 'conversation', 'question', 'answer'])) {
      return this.PREDEFINED_TEMPLATES.find(t => t.type === 'interview')!;
    }
    
    // Check for presentation indicators
    if (this.containsWords(topicNames.concat(keyPointCategories), 
        ['presentation', 'slide', 'technical', 'system', 'architecture'])) {
      return this.PREDEFINED_TEMPLATES.find(t => t.type === 'presentation')!;
    }

    // Default to general template
    return this.PREDEFINED_TEMPLATES.find(t => t.type === 'general')!;
  }

  /**
   * Check if any of the target words appear in the source array
   */
  private static containsWords(source: string[], targets: string[]): boolean {
    const sourceText = source.join(' ').toLowerCase();
    return targets.some(target => sourceText.includes(target.toLowerCase()));
  }

  /**
   * Generate article sections based on template and analysis
   */
  private static generateSections(
    analysis: ContentAnalysis,
    transcript: Transcript,
    template: ArticleTemplate,
    options: GenerationOptions
  ): ArticleSection[] {
    const sections: ArticleSection[] = [];

    for (const templateSection of template.structure) {
      // Skip introduction and conclusion as they're handled separately
      if (templateSection.contentType === 'introduction' || 
          templateSection.contentType === 'conclusion') {
        continue;
      }

      const section = this.generateSection(
        templateSection,
        analysis,
        transcript,
        options
      );
      
      if (section) {
        sections.push(section);
      }
    }

    return sections;
  }

  /**
   * Generate a single article section
   */
  private static generateSection(
    templateSection: TemplateSection,
    analysis: ContentAnalysis,
    transcript: Transcript,
    options: GenerationOptions
  ): ArticleSection | null {
    let content = '';

    switch (templateSection.contentType) {
      case 'main_content':
        content = this.generateMainContent(analysis, transcript, templateSection, options);
        break;
      case 'key_points':
        content = this.generateKeyPointsContent(analysis, templateSection, options);
        break;
      case 'summary':
        content = this.generateSummaryContent(analysis, templateSection, options);
        break;
      default:
        content = this.generateCustomContent(analysis, transcript, templateSection, options);
    }

    if (!content.trim()) {
      return null;
    }

    return {
      heading: templateSection.heading,
      content: this.formatContent(content, options)
    };
  }

  /**
   * Generate main content section
   */
  private static generateMainContent(
    analysis: ContentAnalysis,
    transcript: Transcript,
    templateSection: TemplateSection,
    options: GenerationOptions
  ): string {
    const paragraphs: string[] = [];

    // Group topics by relevance and create paragraphs
    const sortedTopics = analysis.topics
      .sort((a, b) => b.relevance - a.relevance)
      .slice(0, 5); // Limit to top 5 topics

    for (const topic of sortedTopics) {
      // Find relevant transcript segments for this topic
      const relevantSegments = this.findRelevantSegments(topic, transcript);
      
      if (relevantSegments.length > 0) {
        let paragraph = `## ${topic.name}\n\n`;
        
        // Create content from relevant segments
        const topicContent = this.createTopicContent(relevantSegments, templateSection, options);
        paragraph += topicContent;

        // Add timestamp if requested
        if (templateSection.includeTimestamps && topic.timeRanges.length > 0) {
          const firstRange = topic.timeRanges[0];
          paragraph += `\n\n*Discussed at ${this.formatTimestamp(firstRange.start)}*`;
        }

        paragraphs.push(paragraph);
      }
    }

    return paragraphs.join('\n\n');
  }

  /**
   * Find transcript segments relevant to a topic
   */
  private static findRelevantSegments(
    topic: any,
    transcript: Transcript
  ): any[] {
    const relevantSegments: any[] = [];
    const topicKeywords = topic.name.toLowerCase().split(' ');

    for (const timeRange of topic.timeRanges) {
      const segments = transcript.segments.filter(segment =>
        segment.startTime >= timeRange.start && segment.endTime <= timeRange.end + 30
      );

      // Filter segments that contain topic keywords
      const matchingSegments = segments.filter(segment =>
        topicKeywords.some((keyword: string) =>
          segment.text.toLowerCase().includes(keyword)
        )
      );

      relevantSegments.push(...matchingSegments);
    }

    return relevantSegments;
  }

  /**
   * Create content from transcript segments
   */
  private static createTopicContent(
    segments: any[],
    templateSection: TemplateSection,
    options: GenerationOptions
  ): string {
    if (segments.length === 0) return '';

    // Combine and clean segment text
    const combinedText = segments
      .map(s => s.text)
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();

    // Split into sentences and select the most relevant ones
    const sentences = combinedText
      .split(/[.!?]+/)
      .map(s => s.trim())
      .filter(s => s.length > 20);

    // Apply length constraints
    let content = sentences.join('. ');
    
    if (templateSection.maxLength) {
      const words = content.split(' ');
      if (words.length > templateSection.maxLength) {
        content = words.slice(0, templateSection.maxLength).join(' ') + '...';
      }
    }

    return content;
  }

  /**
   * Generate key points content section
   */
  private static generateKeyPointsContent(
    analysis: ContentAnalysis,
    templateSection: TemplateSection,
    options: GenerationOptions
  ): string {
    const keyPoints = analysis.keyPoints
      .sort((a, b) => b.importance - a.importance)
      .slice(0, 8); // Limit to top 8 key points

    if (keyPoints.length === 0) {
      return 'No key points identified from the content.';
    }

    const formattedPoints = keyPoints.map((point, index) => {
      let formatted = `${index + 1}. **${point.category}**: ${point.text}`;
      
      if (templateSection.includeTimestamps) {
        formatted += ` *(${this.formatTimestamp(point.timestamp)})*`;
      }
      
      return formatted;
    });

    return formattedPoints.join('\n\n');
  }

  /**
   * Generate summary content section
   */
  private static generateSummaryContent(
    analysis: ContentAnalysis,
    templateSection: TemplateSection,
    options: GenerationOptions
  ): string {
    let summary = analysis.summary;

    // Enhance summary based on tone
    if (options.tone === 'casual') {
      summary = this.makeCasual(summary);
    } else if (options.tone === 'technical') {
      summary = this.makeTechnical(summary, analysis);
    }

    return summary;
  }

  /**
   * Generate custom content for other section types
   */
  private static generateCustomContent(
    analysis: ContentAnalysis,
    transcript: Transcript,
    templateSection: TemplateSection,
    options: GenerationOptions
  ): string {
    // Fallback to summary content for custom sections
    return this.generateSummaryContent(analysis, templateSection, options);
  }

  /**
   * Generate article title
   */
  private static generateTitle(
    videoMetadata: VideoMetadata,
    analysis: ContentAnalysis,
    options: GenerationOptions
  ): string {
    const originalTitle = videoMetadata.title;
    
    // If original title is good, use it with minor modifications
    if (originalTitle && originalTitle.length > 10 && originalTitle.length < 80) {
      // Add context based on content type
      const mainTopic = analysis.topics[0]?.name;
      if (mainTopic && !originalTitle.toLowerCase().includes(mainTopic.toLowerCase())) {
        return `${originalTitle}: A Guide to ${mainTopic}`;
      }
      return originalTitle;
    }

    // Generate new title from topics
    const topTopics = analysis.topics.slice(0, 2);
    if (topTopics.length > 0) {
      const topicNames = topTopics.map(t => t.name).join(' and ');
      return `Understanding ${topicNames}: Key Insights and Analysis`;
    }

    // Fallback title
    return 'Video Content Analysis and Key Insights';
  }

  /**
   * Generate article introduction
   */
  private static generateIntroduction(
    videoMetadata: VideoMetadata,
    analysis: ContentAnalysis,
    options: GenerationOptions
  ): string {
    const duration = this.formatDuration(videoMetadata.duration);
    const topTopics = analysis.topics.slice(0, 3).map(t => t.name).join(', ');
    
    let intro = `This article summarizes the key insights from a ${duration} video `;
    
    if (videoMetadata.channelName) {
      intro += `by ${videoMetadata.channelName} `;
    }
    
    if (topTopics) {
      intro += `covering topics including ${topTopics}. `;
    }
    
    intro += `The content has been analyzed and structured to provide you with the most important takeaways and actionable insights.`;

    return this.formatContent(intro, options);
  }

  /**
   * Generate article conclusion
   */
  private static generateConclusion(
    analysis: ContentAnalysis,
    options: GenerationOptions
  ): string {
    const keyPointCount = analysis.keyPoints.length;
    const topicCount = analysis.topics.length;
    
    let conclusion = `This analysis covered ${topicCount} main topics and identified ${keyPointCount} key insights. `;
    
    if (analysis.sentiment === 'positive') {
      conclusion += 'The overall tone of the content was positive and informative. ';
    } else if (analysis.sentiment === 'negative') {
      conclusion += 'The content addressed some challenges and areas for improvement. ';
    }
    
    conclusion += 'These insights can serve as a valuable reference for understanding the discussed concepts and applying them in relevant contexts.';

    return this.formatContent(conclusion, options);
  }

  /**
   * Generate article metadata
   */
  private static generateMetadata(
    title: string,
    sections: ArticleSection[],
    introduction: string,
    conclusion: string,
    videoMetadata: VideoMetadata
  ): ArticleMetadata {
    // Calculate word count
    const allText = [
      title,
      introduction,
      ...sections.map(s => s.heading + ' ' + s.content),
      conclusion
    ].join(' ');
    
    const wordCount = allText.split(/\s+/).length;
    const readingTime = Math.ceil(wordCount / 200); // Assume 200 words per minute

    // Generate SEO title (max 60 characters)
    const seoTitle = title.length <= 60 ? title : title.substring(0, 57) + '...';
    
    // Generate meta description (max 160 characters)
    const metaDescription = introduction.length <= 160 
      ? introduction 
      : introduction.substring(0, 157) + '...';

    return {
      wordCount,
      readingTime,
      seoTitle,
      metaDescription,
      sourceVideo: videoMetadata
    };
  }

  /**
   * Generate article tags
   */
  private static generateTags(
    analysis: ContentAnalysis,
    videoMetadata: VideoMetadata
  ): string[] {
    const tags: string[] = [];

    // Add topic-based tags
    analysis.topics.slice(0, 5).forEach(topic => {
      tags.push(topic.name.toLowerCase());
    });

    // Add category-based tags
    const categories = [...new Set(analysis.keyPoints.map(kp => kp.category))];
    tags.push(...categories.map(c => c.toLowerCase()));

    // Add channel-based tag if available
    if (videoMetadata.channelName) {
      tags.push(videoMetadata.channelName.toLowerCase().replace(/\s+/g, '-'));
    }

    // Add content type tags
    tags.push('video-summary', 'content-analysis');

    // Remove duplicates and limit to 10 tags
    return [...new Set(tags)].slice(0, 10);
  }

  /**
   * Format content based on options
   */
  private static formatContent(content: string, options: GenerationOptions): string {
    let formatted = content;

    // Apply tone adjustments
    if (options.tone === 'casual') {
      formatted = this.makeCasual(formatted);
    } else if (options.tone === 'technical') {
      formatted = this.makeTechnical(formatted, null);
    }

    return formatted.trim();
  }

  /**
   * Make content more casual in tone
   */
  private static makeCasual(content: string): string {
    return content
      .replace(/\bThis article\b/g, "This post")
      .replace(/\bfurthermore\b/gi, "also")
      .replace(/\bin conclusion\b/gi, "to wrap up")
      .replace(/\bmoreover\b/gi, "plus")
      .replace(/\btherefore\b/gi, "so");
  }

  /**
   * Make content more technical in tone
   */
  private static makeTechnical(content: string, analysis: ContentAnalysis | null): string {
    // Add more precise language and technical terms where appropriate
    return content
      .replace(/\bshow\b/gi, "demonstrate")
      .replace(/\btalk about\b/gi, "discuss")
      .replace(/\bway\b/gi, "method")
      .replace(/\bthing\b/gi, "component")
      .replace(/\bsummarizes\b/gi, "demonstrates")
      .replace(/\bprovide\b/gi, "demonstrate");
  }

  /**
   * Format timestamp for display
   */
  private static formatTimestamp(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }

  /**
   * Format duration for display
   */
  private static formatDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours} hour${hours > 1 ? 's' : ''} and ${minutes} minute${minutes !== 1 ? 's' : ''}`;
    }
    return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
  }

  /**
   * Get available templates
   */
  static getAvailableTemplates(): ArticleTemplate[] {
    return [...this.PREDEFINED_TEMPLATES];
  }

  /**
   * Get template by name
   */
  static getTemplate(name: string): ArticleTemplate | null {
    return this.PREDEFINED_TEMPLATES.find(
      t => t.name.toLowerCase() === name.toLowerCase()
    ) || null;
  }
}