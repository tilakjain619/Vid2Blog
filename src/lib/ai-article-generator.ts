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

    return `Create a blog article about: ${videoMetadata.title}

Video Summary: ${analysis.summary}

Main Topics: ${topics}

Key Points:
${keyPoints}

Instructions: ${lengthInstruction}. ${toneInstruction}.

Please respond with ONLY a JSON object in this exact format:
{
  "title": "Your article title here",
  "introduction": "Introduction paragraph",
  "sections": [
    {"heading": "Section 1", "content": "Content for section 1"},
    {"heading": "Section 2", "content": "Content for section 2"}
  ],
  "conclusion": "Conclusion paragraph",
  "tags": ["tag1", "tag2", "tag3"]
}`;
  }

  /**
   * Call OpenRouter API for article generation
   */
  private static async callOpenRouterAPI(prompt: string, options: GenerationOptions): Promise<string> {
    const apiKey = process.env.OPENROUTER_API_KEY;
    
    if (!apiKey) {
      console.error('OpenRouter API key not found in environment variables');
      throw new Error('OpenRouter API key not configured');
    }

    // Use a free model from OpenRouter
    const model = 'meta-llama/llama-3.2-3b-instruct:free';

    console.log('🚀 Calling OpenRouter API with model:', model);

    const requestBody = {
      model,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: options.length === 'long' ? 1500 : options.length === 'medium' ? 1000 : 800,
      temperature: 0.7,
      top_p: 0.9
    };

    console.log('📤 Request body preview:', {
      model: requestBody.model,
      max_tokens: requestBody.max_tokens,
      temperature: requestBody.temperature,
      prompt_length: prompt.length
    });

    const response = await fetch(`${this.OPENROUTER_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000',
        'X-Title': 'Vid2Blog Article Generator'
      },
      body: JSON.stringify(requestBody)
    });

    console.log('📥 OpenRouter response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ OpenRouter API error response:', errorText);
      
      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch {
        errorData = { message: errorText };
      }
      
      throw new Error(`OpenRouter API error: ${response.status} - ${errorData.error?.message || errorData.message || 'Unknown error'}`);
    }

    const data = await response.json();
    console.log('✅ OpenRouter response received');
    console.log('Response structure:', {
      id: data.id,
      model: data.model,
      choices_count: data.choices?.length || 0,
      usage: data.usage
    });
    
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      console.error('❌ Invalid OpenRouter response structure:', data);
      throw new Error('Invalid response from OpenRouter API');
    }

    const content = data.choices[0].message.content;
    console.log('✅ AI content generated');
    console.log('Content length:', content.length);
    console.log('Content preview:', content.substring(0, 100) + '...');

    return content;
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
      console.log('🔍 Parsing AI response...');
      console.log('Raw AI response length:', aiResponse.length);
      console.log('Raw AI response preview:', aiResponse.substring(0, 200) + '...');
      
      // Try to extract JSON from the response
      const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.error('❌ No JSON found in AI response. Full response:', aiResponse);
        throw new Error('No JSON found in AI response');
      }

      console.log('✅ JSON found, length:', jsonMatch[0].length);
      console.log('JSON preview:', jsonMatch[0].substring(0, 100) + '...');
      
      const parsedResponse = JSON.parse(jsonMatch[0]);
      console.log('✅ JSON parsed successfully');
      console.log('Parsed response keys:', Object.keys(parsedResponse));
      
      // Validate required fields
      const requiredFields = ['title', 'introduction', 'sections', 'conclusion'];
      const missingFields = requiredFields.filter(field => !parsedResponse[field]);
      
      if (missingFields.length > 0) {
        console.error('❌ Missing required fields:', missingFields);
        console.error('Available fields:', Object.keys(parsedResponse));
        console.error('Parsed response:', parsedResponse);
        throw new Error(`Missing required fields in AI response: ${missingFields.join(', ')}`);
      }
      
      console.log('✅ All required fields present');

      // Generate metadata
      const metadata = this.generateMetadata(
        parsedResponse.title,
        parsedResponse.sections,
        parsedResponse.introduction,
        parsedResponse.conclusion,
        videoMetadata
      );

      const article = {
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

      console.log('✅ Article structure created successfully');
      console.log('Article title:', article.title);
      console.log('Article sections count:', article.sections.length);
      console.log('Article tags count:', article.tags.length);
      
      return article;

    } catch (error) {
      console.error('❌ Failed to parse AI response:', error);
      console.error('Error type:', error instanceof Error ? error.constructor.name : typeof error);
      console.error('Error message:', error instanceof Error ? error.message : String(error));
      console.error('AI response was:', aiResponse);
      throw new Error(`Failed to parse AI-generated article: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate fallback article using template-based approach
   */
  private static async generateFallbackArticle(
    analysis: ContentAnalysis,
    videoMetadata: VideoMetadata,
    transcript: Transcript,
    options: GenerationOptions
  ): Promise<Article> {
    console.log('🔄 Using fallback template-based generation');
    // Import the original ArticleGenerator for fallback
    const { ArticleGenerator } = await import('./article-generator');
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