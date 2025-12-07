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
 * AI-powered article generator using OpenRouter API
 */
export class AIArticleGenerator {
  private static readonly OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';
  
  /**
   * Generate article using AI
   */
  static async generateArticle(
    analysis: ContentAnalysis,
    videoMetadata: VideoMetadata,
    transcript: Transcript,
    options: GenerationOptions = {
      length: 'medium',
      tone: 'professional',
      format: 'markdown'
    }
  ): Promise<Article> {
    try {
      // Prepare the prompt for AI generation
      const prompt = this.createPrompt(analysis, videoMetadata, transcript, options);
      
      // Call OpenRouter API
      const aiResponse = await this.callOpenRouterAPI(prompt, options);
      
      // Parse AI response into article structure
      const article = this.parseAIResponse(aiResponse, videoMetadata, analysis);
      
      return article;
    } catch (error) {
      console.error('AI article generation failed:', error);
      // Fallback to template-based generation
      return this.generateFallbackArticle(analysis, videoMetadata, transcript, options);
    }
  }

  /**
   * Create a comprehensive prompt for AI article generation
   */
  private static createPrompt(
    analysis: ContentAnalysis,
    videoMetadata: VideoMetadata,
    transcript: Transcript,
    options: GenerationOptions
  ): string {
    const transcriptText = transcript.segments
      .map(segment => segment.text)
      .join(' ')
      .substring(0, 4000); // Limit to avoid token limits

    const keyPoints = analysis.keyPoints
      .slice(0, 10)
      .map(kp => `- ${kp.category}: ${kp.text}`)
      .join('\n');

    const topics = analysis.topics
      .slice(0, 5)
      .map(topic => topic.name)
      .join(', ');

    const lengthInstruction = {
      'short': 'Write a concise article (300-500 words)',
      'medium': 'Write a comprehensive article (600-1000 words)', 
      'long': 'Write a detailed, in-depth article (1000-1500 words)'
    }[options.length];

    const toneInstruction = {
      'professional': 'Use a professional, informative tone suitable for business or educational content',
      'casual': 'Use a conversational, friendly tone that feels approachable and easy to read',
      'technical': 'Use precise, technical language appropriate for expert audiences'
    }[options.tone];

    return `You are an expert content writer. Create a well-structured blog article based on the following YouTube video analysis.

VIDEO INFORMATION:
- Title: ${videoMetadata.title}
- Channel: ${videoMetadata.channelName}
- Duration: ${Math.floor(videoMetadata.duration / 60)} minutes
- Description: ${videoMetadata.description?.substring(0, 200) || 'No description available'}

CONTENT ANALYSIS:
- Main Topics: ${topics}
- Sentiment: ${analysis.sentiment}
- Summary: ${analysis.summary}

KEY POINTS:
${keyPoints}

TRANSCRIPT EXCERPT:
${transcriptText}

INSTRUCTIONS:
${lengthInstruction}. ${toneInstruction}.

Structure the article with:
1. An engaging title (different from the video title)
2. A compelling introduction that hooks the reader
3. 3-5 main sections with descriptive headings
4. A conclusion that summarizes key takeaways
5. 5-8 relevant tags

Format the response as JSON with this exact structure:
{
  "title": "Article title here",
  "introduction": "Introduction paragraph here",
  "sections": [
    {
      "heading": "Section heading",
      "content": "Section content here"
    }
  ],
  "conclusion": "Conclusion paragraph here",
  "tags": ["tag1", "tag2", "tag3"]
}

Make sure the content is original, engaging, and provides value to readers. Focus on the most important insights and make them actionable.`;
  }

  /**
   * Call OpenRouter API for article generation
   */
  private static async callOpenRouterAPI(prompt: string, options: GenerationOptions): Promise<string> {
    const apiKey = process.env.OPENROUTER_API_KEY;
    
    if (!apiKey) {
      throw new Error('OpenRouter API key not configured');
    }

    // Use a free model from OpenRouter
    const model = 'meta-llama/llama-3.2-3b-instruct:free';

    const response = await fetch(`${this.OPENROUTER_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000',
        'X-Title': 'Vid2Blog Article Generator'
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: options.length === 'long' ? 2000 : options.length === 'medium' ? 1500 : 1000,
        temperature: 0.7,
        top_p: 0.9
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`OpenRouter API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      throw new Error('Invalid response from OpenRouter API');
    }

    return data.choices[0].message.content;
  }

  /**
   * Parse AI response into article structure
   */
  private static parseAIResponse(
    aiResponse: string,
    videoMetadata: VideoMetadata,
    analysis: ContentAnalysis
  ): Article {
    try {
      // Try to extract JSON from the response
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in AI response');
      }

      const parsedResponse = JSON.parse(jsonMatch[0]);
      
      // Validate required fields
      if (!parsedResponse.title || !parsedResponse.introduction || !parsedResponse.sections || !parsedResponse.conclusion) {
        throw new Error('Missing required fields in AI response');
      }

      // Generate metadata
      const metadata = this.generateMetadata(
        parsedResponse.title,
        parsedResponse.sections,
        parsedResponse.introduction,
        parsedResponse.conclusion,
        videoMetadata
      );

      return {
        title: parsedResponse.title,
        introduction: parsedResponse.introduction,
        sections: parsedResponse.sections.map((section: any) => ({
          heading: section.heading,
          content: section.content
        })),
        conclusion: parsedResponse.conclusion,
        metadata,
        tags: parsedResponse.tags || this.generateFallbackTags(analysis, videoMetadata)
      };

    } catch (error) {
      console.error('Failed to parse AI response:', error);
      throw new Error('Failed to parse AI-generated article');
    }
  }

  /**
   * Generate fallback article using template-based approach
   */
  private static generateFallbackArticle(
    analysis: ContentAnalysis,
    videoMetadata: VideoMetadata,
    transcript: Transcript,
    options: GenerationOptions
  ): Article {
    // Import the original ArticleGenerator for fallback
    const { ArticleGenerator } = require('./article-generator');
    return ArticleGenerator.generateArticle(analysis, videoMetadata, transcript, options);
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
   * Generate fallback tags if AI doesn't provide them
   */
  private static generateFallbackTags(
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
    tags.push('video-summary', 'ai-generated');

    // Remove duplicates and limit to 8 tags
    return [...new Set(tags)].slice(0, 8);
  }

  /**
   * Test OpenRouter API connection
   */
  static async testConnection(): Promise<boolean> {
    try {
      const response = await this.callOpenRouterAPI(
        'Test message: Please respond with "Connection successful"',
        { length: 'short', tone: 'professional', format: 'markdown' }
      );
      return response.toLowerCase().includes('connection') || response.toLowerCase().includes('successful');
    } catch (error) {
      console.error('OpenRouter connection test failed:', error);
      return false;
    }
  }
}