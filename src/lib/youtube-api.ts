import { VideoMetadata } from '@/types';
import { parseIsoDuration } from './youtube-utils';

export interface YouTubeApiError {
  code: number;
  message: string;
  errors?: Array<{
    domain: string;
    reason: string;
    message: string;
  }>;
}

export class YouTubeApiService {
  private apiKey: string;
  private baseUrl = 'https://www.googleapis.com/youtube/v3';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  /**
   * Fetches video metadata from YouTube Data API v3
   */
  async getVideoMetadata(videoId: string): Promise<VideoMetadata> {
    const url = `${this.baseUrl}/videos?part=snippet,statistics,contentDetails&id=${videoId}&key=${this.apiKey}`;

    try {
      const response = await fetch(url);
      const data = await response.json();

      if (!response.ok) {
        throw new YouTubeApiError(data.error);
      }

      if (!data.items || data.items.length === 0) {
        throw new Error('Video not found. It may be private, deleted, or restricted.');
      }

      const video = data.items[0];
      const snippet = video.snippet;
      const statistics = video.statistics;
      const contentDetails = video.contentDetails;

      // Check if video is available
      if (snippet.liveBroadcastContent === 'live') {
        throw new Error('Live streams are not supported. Please wait until the stream ends.');
      }

      return {
        id: videoId,
        title: snippet.title,
        description: snippet.description || '',
        duration: parseIsoDuration(contentDetails.duration),
        thumbnailUrl: snippet.thumbnails?.maxres?.url || 
                     snippet.thumbnails?.high?.url || 
                     snippet.thumbnails?.medium?.url || 
                     snippet.thumbnails?.default?.url || '',
        channelName: snippet.channelTitle,
        publishDate: new Date(snippet.publishedAt),
        viewCount: parseInt(statistics.viewCount || '0', 10)
      };
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to fetch video metadata from YouTube API');
    }
  }

  /**
   * Checks if a video is accessible and not restricted
   */
  async checkVideoAccessibility(videoId: string): Promise<{ accessible: boolean; reason?: string }> {
    try {
      await this.getVideoMetadata(videoId);
      return { accessible: true };
    } catch (error) {
      if (error instanceof Error) {
        return { 
          accessible: false, 
          reason: error.message 
        };
      }
      return { 
        accessible: false, 
        reason: 'Unknown error occurred while checking video accessibility' 
      };
    }
  }
}