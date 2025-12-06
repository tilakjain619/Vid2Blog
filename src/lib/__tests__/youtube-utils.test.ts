import { 
  extractVideoId, 
  validateYouTubeUrl, 
  formatDuration, 
  parseIsoDuration 
} from '../youtube-utils';

describe('YouTube Utils', () => {
  describe('extractVideoId', () => {
    it('should extract video ID from standard YouTube URL', () => {
      const url = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
      expect(extractVideoId(url)).toBe('dQw4w9WgXcQ');
    });

    it('should extract video ID from youtu.be short URL', () => {
      const url = 'https://youtu.be/dQw4w9WgXcQ';
      expect(extractVideoId(url)).toBe('dQw4w9WgXcQ');
    });

    it('should extract video ID from mobile YouTube URL', () => {
      const url = 'https://m.youtube.com/watch?v=dQw4w9WgXcQ';
      expect(extractVideoId(url)).toBe('dQw4w9WgXcQ');
    });

    it('should extract video ID from YouTube URL without www', () => {
      const url = 'https://youtube.com/watch?v=dQw4w9WgXcQ';
      expect(extractVideoId(url)).toBe('dQw4w9WgXcQ');
    });

    it('should extract video ID from URL with additional parameters', () => {
      const url = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=30s&list=PLrAXtmRdnEQy';
      expect(extractVideoId(url)).toBe('dQw4w9WgXcQ');
    });

    it('should return null for invalid URLs', () => {
      expect(extractVideoId('not-a-url')).toBeNull();
      expect(extractVideoId('https://example.com')).toBeNull();
      expect(extractVideoId('https://vimeo.com/123456')).toBeNull();
    });

    it('should return null for YouTube URLs without video ID', () => {
      expect(extractVideoId('https://www.youtube.com')).toBeNull();
      expect(extractVideoId('https://www.youtube.com/channel/UC123')).toBeNull();
    });
  });

  describe('validateYouTubeUrl', () => {
    it('should validate correct YouTube URLs', () => {
      const validUrls = [
        'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        'https://youtu.be/dQw4w9WgXcQ',
        'https://m.youtube.com/watch?v=dQw4w9WgXcQ',
        'https://youtube.com/watch?v=dQw4w9WgXcQ'
      ];

      validUrls.forEach(url => {
        const result = validateYouTubeUrl(url);
        expect(result.isValid).toBe(true);
        expect(result.videoId).toBe('dQw4w9WgXcQ');
        expect(result.error).toBeUndefined();
      });
    });

    it('should reject empty or invalid input', () => {
      const invalidInputs = ['', null, undefined, 123];
      
      invalidInputs.forEach(input => {
        const result = validateYouTubeUrl(input as string);
        expect(result.isValid).toBe(false);
        expect(result.error).toBe('URL is required and must be a string');
      });
    });

    it('should reject malformed URLs', () => {
      const malformedUrls = [
        'not-a-url',
        'http://',
        'ftp://example.com',
        'just-text'
      ];

      malformedUrls.forEach(url => {
        const result = validateYouTubeUrl(url);
        expect(result.isValid).toBe(false);
        // The actual error message varies based on the URL format
        expect(result.error).toBeDefined();
      });
    });

    it('should reject non-YouTube URLs', () => {
      const nonYouTubeUrls = [
        'https://vimeo.com/123456',
        'https://example.com/video',
        'https://facebook.com/video/123'
      ];

      nonYouTubeUrls.forEach(url => {
        const result = validateYouTubeUrl(url);
        expect(result.isValid).toBe(false);
        expect(result.error).toContain('Not a valid YouTube URL');
      });
    });

    it('should reject YouTube URLs with invalid video ID length', () => {
      const invalidLengthUrls = [
        'https://www.youtube.com/watch?v=short',
        'https://www.youtube.com/watch?v=toolongvideoid123',
        'https://youtu.be/abc'
      ];

      invalidLengthUrls.forEach(url => {
        const result = validateYouTubeUrl(url);
        expect(result.isValid).toBe(false);
        expect(result.error).toBe('Invalid YouTube video ID format');
      });
    });

    it('should reject video IDs with invalid characters', () => {
      const invalidCharUrls = [
        'https://www.youtube.com/watch?v=invalid@char',
        'https://www.youtube.com/watch?v=invalid space',
        'https://youtu.be/invalid#hash'
      ];

      invalidCharUrls.forEach(url => {
        const result = validateYouTubeUrl(url);
        expect(result.isValid).toBe(false);
        // These URLs have invalid length or characters, so error message may vary
        expect(result.error).toBeDefined();
      });
    });
  });

  describe('formatDuration', () => {
    it('should format seconds correctly', () => {
      expect(formatDuration(30)).toBe('0:30');
      expect(formatDuration(90)).toBe('1:30');
      expect(formatDuration(3661)).toBe('1:01:01');
    });

    it('should handle zero duration', () => {
      expect(formatDuration(0)).toBe('0:00');
    });

    it('should pad single digits with zeros', () => {
      expect(formatDuration(65)).toBe('1:05');
      expect(formatDuration(3605)).toBe('1:00:05');
    });
  });

  describe('parseIsoDuration', () => {
    it('should parse ISO 8601 duration formats', () => {
      expect(parseIsoDuration('PT4M13S')).toBe(253); // 4*60 + 13
      expect(parseIsoDuration('PT1H30M45S')).toBe(5445); // 1*3600 + 30*60 + 45
      expect(parseIsoDuration('PT2H')).toBe(7200); // 2*3600
      expect(parseIsoDuration('PT45S')).toBe(45);
      expect(parseIsoDuration('PT10M')).toBe(600); // 10*60
    });

    it('should handle missing components', () => {
      expect(parseIsoDuration('PT1H')).toBe(3600);
      expect(parseIsoDuration('PT30M')).toBe(1800);
      expect(parseIsoDuration('PT45S')).toBe(45);
    });

    it('should return 0 for invalid formats', () => {
      expect(parseIsoDuration('invalid')).toBe(0);
      expect(parseIsoDuration('')).toBe(0);
      expect(parseIsoDuration('P1D')).toBe(0); // Days not supported
    });
  });
});