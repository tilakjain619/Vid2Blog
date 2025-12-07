# Vid2Blog

Transform YouTube videos into well-structured blog articles with AI-powered transcription and content analysis.

## Features

- 🎥 **YouTube Video Processing**: Extract metadata, transcripts, and content from any YouTube video
- 🤖 **AI-Powered Article Generation**: Uses OpenRouter API with free LLM models for intelligent content creation
- 📝 **Multiple Output Formats**: Generate articles in Markdown, HTML, or plain text
- 🎨 **Customizable Templates**: Choose from tutorial guides, interview summaries, presentation notes, and more
- 📋 **Easy Copy & Export**: One-click copying in multiple formats
- ⚡ **Real-time Processing**: Live progress tracking through the processing pipeline

## Setup

### 1. Environment Variables

Copy `.env.example` to `.env.local` and configure:

```bash
# YouTube Data API v3 Key (required)
# Get your API key from: https://console.developers.google.com/
YOUTUBE_API_KEY=your_youtube_api_key_here

# OpenRouter API Key for AI article generation (required)
# Get your free API key from: https://openrouter.ai/
OPENROUTER_API_KEY=your_openrouter_api_key_here
```

### 2. Getting API Keys

#### YouTube API Key
1. Go to [Google Cloud Console](https://console.developers.google.com/)
2. Create a new project or select existing one
3. Enable the YouTube Data API v3
4. Create credentials (API Key)
5. Copy the API key to your `.env.local` file

#### OpenRouter API Key (Free)
1. Visit [OpenRouter.ai](https://openrouter.ai/)
2. Sign up for a free account
3. Go to your dashboard and create an API key
4. Copy the API key to your `.env.local` file

*Note: OpenRouter provides free access to several LLM models including Llama 3.2 3B which is used by default.*

### 3. Installation

```bash
npm install
npm run dev
```

## Usage

1. **Configure Options**: Select article length, writing tone, template, and output format
2. **Enter YouTube URL**: Paste any YouTube video URL
3. **Generate Article**: Click "Generate Blog Article" and wait for AI processing
4. **Copy & Use**: Copy the generated article in your preferred format

## How It Works

1. **Video Analysis**: Extracts metadata and transcript from YouTube video
2. **Content Processing**: Analyzes transcript for topics, key points, and structure
3. **AI Generation**: Uses OpenRouter's free LLM to create a well-structured article
4. **Format & Export**: Provides the article in multiple formats with copy functionality

## Templates

- **Auto-detect (AI)**: Let AI choose the best template based on content
- **Tutorial Guide**: Step-by-step instructional format
- **Interview Summary**: Q&A and discussion format
- **Presentation Notes**: Technical presentation format
- **Discussion Summary**: Casual conversation format
- **General Article**: Standard blog article format

## Tech Stack

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Node.js
- **AI**: OpenRouter API (free Llama 3.2 3B model)
- **APIs**: YouTube Data API v3, youtube-transcript