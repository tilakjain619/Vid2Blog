import { ValidationResult, VideoMetadata } from '@/types';

/**
 * Extracts YouTube video ID from various YouTube URL formats
 * Supports:
 * - https://www.youtube.com/watch?v=VIDEO_ID
 * - https://youtu.be/VIDEO_ID
 * - https://youtube.com/watch?v=VIDEO_ID
 * - https://m.youtube.com/watch?v=VIDEO_ID
 */
export function extractVideoId(url: string): string | null {
  try {
    const urlObj = new URL(url);
    
    // Handle youtu.be short URLs
    if (urlObj.hostname === 'youtu.be') {
      return urlObj.pathname.slice(1); // Remove leading slash
    }
    
    // Handle youtube.com URLs
    if (urlObj.hostname.includes('youtube.com')) {
      const videoId = urlObj.searchParams.get('v');
      return videoId;
    }
    
    return null;
  } catch (error) {
    return null;
  }
}

/**
 * Validates YouTube URL format and extracts video ID
 */
export function validateYouTubeUrl(url: string): ValidationResult {
  if (!url || typeof url !== 'string') {
    return {
      isValid: false,
      error: 'URL is required and must be a string'
    };
  }

  // Basic URL format validation
  try {
    new URL(url);
  } catch (error) {
    return {
      isValid: false,
      error: 'Invalid URL format'
    };
  }

  const videoId = extractVideoId(url);
  
  if (!videoId) {
    return {
      isValid: false,
      error: 'Not a valid YouTube URL. Please use a URL like https://www.youtube.com/watch?v=VIDEO_ID or https://youtu.be/VIDEO_ID'
    };
  }

  // Validate video ID format (YouTube video IDs are 11 characters long)
  if (videoId.length !== 11) {
    return {
      isValid: false,
      error: 'Invalid YouTube video ID format'
    };
  }

  // Check for valid characters in video ID (alphanumeric, underscore, hyphen)
  const validIdPattern = /^[a-zA-Z0-9_-]+$/;
  if (!validIdPattern.test(videoId)) {
    return {
      isValid: false,
      error: 'Invalid characters in YouTube video ID'
    };
  }

  return {
    isValid: true,
    videoId
  };
}

/**
 * Formats duration from seconds to human-readable format
 */
export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

/**
 * Parses ISO 8601 duration format (PT4M13S) to seconds
 */
export function parseIsoDuration(duration: string): number {
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;

  const hours = parseInt(match[1] || '0', 10);
  const minutes = parseInt(match[2] || '0', 10);
  const seconds = parseInt(match[3] || '0', 10);

  return hours * 3600 + minutes * 60 + seconds;
}