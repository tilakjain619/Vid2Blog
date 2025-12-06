# ProcessingStatus Component

The ProcessingStatus component provides a comprehensive UI for tracking the progress of YouTube video processing through multiple stages: validation, metadata extraction, transcription, analysis, and article generation.

## Features

- **Visual Progress Tracking**: Shows overall progress and individual stage progress
- **Real-time Updates**: Displays current stage, progress percentage, and estimated time remaining
- **Error Handling**: Provides clear error messages and recovery options
- **Interactive Controls**: Start, cancel, and reset processing operations
- **Responsive Design**: Works well on different screen sizes
- **Accessibility**: Proper ARIA labels and keyboard navigation support

## Components

### ProcessingStatus (Full Version)

The main component with complete progress visualization and controls.

```tsx
import { ProcessingStatus } from '@/components/ProcessingStatus';

<ProcessingStatus
  videoUrl="https://youtube.com/watch?v=example"
  onComplete={(result) => console.log('Processing complete:', result)}
  onError={(error) => console.error('Processing error:', error)}
  autoStart={true}
  className="custom-styles"
/>
```

#### Props

- `videoUrl?: string` - YouTube URL to process
- `onComplete?: (result: any) => void` - Callback when processing completes successfully
- `onError?: (error: string) => void` - Callback when processing encounters an error
- `autoStart?: boolean` - Whether to start processing automatically (default: true)
- `className?: string` - Additional CSS classes

### ProcessingStatusCompact

A compact version suitable for smaller spaces or embedded use.

```tsx
import { ProcessingStatusCompact } from '@/components/ProcessingStatusCompact';

<ProcessingStatusCompact
  videoUrl="https://youtube.com/watch?v=example"
  showDetails={true}
  onComplete={(result) => console.log(result)}
  onError={(error) => console.error(error)}
/>
```

#### Props

- `videoUrl?: string` - YouTube URL to process
- `onComplete?: (result: any) => void` - Callback when processing completes
- `onError?: (error: string) => void` - Callback when processing fails
- `showDetails?: boolean` - Whether to show detailed status messages
- `className?: string` - Additional CSS classes

## Hook: useProcessingStatus

The underlying hook that manages processing state and API calls.

```tsx
import { useProcessingStatus } from '@/hooks/useProcessingStatus';

const {
  status,
  isProcessing,
  result,
  startProcessing,
  cancelProcessing,
  resetProcessing,
  getOverallProgress
} = useProcessingStatus({
  onComplete: (result) => console.log(result),
  onError: (error) => console.error(error),
  onStageChange: (stage) => console.log('Stage changed:', stage)
});
```

### Hook Options

- `onComplete?: (result: ProcessingResult) => void` - Called when processing completes
- `onError?: (error: string) => void` - Called when processing fails
- `onStageChange?: (stage: ProcessingStage) => void` - Called when stage changes

### Hook Return Value

- `status: ProcessingStatus` - Current processing status
- `isProcessing: boolean` - Whether processing is active
- `result: ProcessingResult` - Processing results
- `startProcessing: (videoUrl: string) => Promise<void>` - Start processing
- `cancelProcessing: () => void` - Cancel current processing
- `resetProcessing: () => void` - Reset to initial state
- `getOverallProgress: () => number` - Get overall progress percentage

## Processing Stages

The component tracks progress through these stages:

1. **Validation** - Validates YouTube URL and checks accessibility
2. **Metadata** - Extracts video information and details
3. **Transcription** - Converts audio to text with timestamps
4. **Analysis** - Analyzes content and identifies key topics
5. **Generation** - Generates structured blog article

## Status Types

```typescript
interface ProcessingStatus {
  stage: 'validation' | 'metadata' | 'transcription' | 'analysis' | 'generation' | 'complete' | 'error';
  progress: number; // 0-100
  message: string;
  estimatedTimeRemaining?: number; // seconds
}
```

## Processing Result

```typescript
interface ProcessingResult {
  metadata?: VideoMetadata;
  transcript?: Transcript;
  analysis?: ContentAnalysis;
  article?: Article;
}
```

## Error Handling

The component handles various error scenarios:

- Invalid YouTube URLs
- Private or unavailable videos
- API failures and timeouts
- Network connectivity issues
- Processing cancellation

## Styling

The components use Tailwind CSS classes and can be customized:

```tsx
<ProcessingStatus
  className="custom-container"
  // Custom styles will be merged with default styles
/>
```

## API Integration

The component integrates with these API endpoints:

- `POST /api/youtube/metadata` - Extract video metadata
- `POST /api/youtube/transcript` - Extract video transcript
- `POST /api/content/analyze` - Analyze content structure
- `POST /api/content/generate` - Generate blog article

## Examples

See `src/components/examples/ProcessingStatusExample.tsx` for complete usage examples.

## Testing

The component includes comprehensive tests:

- Unit tests for the hook functionality
- Component rendering tests
- Integration tests for API interactions
- Error handling tests

Run tests with:

```bash
npm test -- --testPathPattern="ProcessingStatus"
```