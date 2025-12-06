# YouTube API Setup Guide

This guide explains how to set up the YouTube Data API v3 for the Vid2Blog application.

## Prerequisites

- Google Cloud Platform account
- YouTube Data API v3 enabled
- API key with appropriate permissions

## Setup Steps

### 1. Create a Google Cloud Project

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Note your project ID for reference

### 2. Enable YouTube Data API v3

1. In the Google Cloud Console, navigate to "APIs & Services" > "Library"
2. Search for "YouTube Data API v3"
3. Click on the API and press "Enable"

### 3. Create API Credentials

1. Go to "APIs & Services" > "Credentials"
2. Click "Create Credentials" > "API Key"
3. Copy the generated API key
4. (Optional) Restrict the API key to YouTube Data API v3 for security

### 4. Configure Environment Variables

1. Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

2. Add your API key to `.env.local`:
   ```
   YOUTUBE_API_KEY=your_actual_api_key_here
   ```

### 5. Test the Setup

Run the application and test with a YouTube URL:
```bash
npm run dev
```

## API Quotas and Limits

The YouTube Data API v3 has the following quotas (free tier):
- 10,000 units per day
- Each video metadata request costs ~1-3 units
- Rate limit: 100 requests per 100 seconds per user

## Supported Video Types

The API supports:
- Public YouTube videos
- Videos with available metadata
- Videos between 1 minute and 3 hours in length

## Unsupported Content

The following are not supported:
- Private videos
- Deleted videos
- Live streams (while live)
- Age-restricted videos (without authentication)
- Videos longer than 3 hours
- Videos shorter than 1 minute

## Error Handling

Common errors and their meanings:
- `403 Forbidden`: API key invalid or quota exceeded
- `404 Not Found`: Video not found, private, or deleted
- `400 Bad Request`: Invalid video ID or URL format

## Security Best Practices

1. Never commit API keys to version control
2. Use environment variables for API keys
3. Restrict API keys to specific APIs and domains
4. Monitor API usage in Google Cloud Console
5. Rotate API keys regularly

## Troubleshooting

### API Key Issues
- Verify the API key is correct
- Check that YouTube Data API v3 is enabled
- Ensure the API key has proper permissions

### Quota Issues
- Monitor usage in Google Cloud Console
- Implement caching to reduce API calls
- Consider upgrading to paid tier if needed

### Video Access Issues
- Verify the video is public
- Check if the video exists and is not deleted
- Ensure the video meets duration requirements