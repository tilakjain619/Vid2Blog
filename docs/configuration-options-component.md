# Configuration Options Component

The Configuration Options component provides a comprehensive interface for users to customize article generation settings in Vid2Blog. This component implements user preferences with localStorage persistence and offers both full and compact views.

## Features

### Core Customization Options

1. **Article Length**
   - Short (300-600 words)
   - Medium (600-1200 words) 
   - Long (1200+ words)

2. **Writing Tone**
   - Professional: Formal, business-appropriate language
   - Casual: Conversational, friendly tone
   - Technical: Precise, technical terminology

3. **Output Format**
   - Markdown: Standard markdown formatting
   - HTML: Rich HTML output
   - Plain Text: Simple text format

4. **Template Selection**
   - General Article: Standard blog post structure
   - Tutorial Guide: Step-by-step instructional format
   - Interview Summary: Q&A and discussion format
   - Presentation Notes: Structured presentation content
   - Discussion Summary: Conversational content format

5. **Additional Options**
   - Include timestamps in content
   - Auto-save preferences
   - Include metadata in exports

### Persistence

User preferences are automatically saved to localStorage and restored on subsequent visits. The system merges saved preferences with defaults to handle new preference keys gracefully.

## Components

### ConfigurationOptions

The full configuration interface with all options visible.

```tsx
import { ConfigurationOptions } from '@/components';

<ConfigurationOptions
  onConfigurationChange={(config) => console.log(config)}
  showPreview={true}
  className="custom-class"
/>
```

**Props:**
- `onConfigurationChange?: (config: ConfigurationOptions) => void` - Callback when configuration changes
- `showPreview?: boolean` - Whether to show template preview functionality
- `className?: string` - Additional CSS classes

### ConfigurationOptionsCompact

A compact version suitable for inline use during processing workflows.

```tsx
import { ConfigurationOptionsCompact } from '@/components';

<ConfigurationOptionsCompact
  onConfigurationChange={(config) => console.log(config)}
  onStartProcessing={() => startProcessing()}
  disabled={isProcessing}
/>
```

**Props:**
- `onConfigurationChange?: (config: ConfigurationOptions) => void` - Callback when configuration changes
- `onStartProcessing?: () => void` - Callback when start processing is clicked
- `disabled?: boolean` - Whether controls should be disabled
- `className?: string` - Additional CSS classes

### TemplatePreview

Dedicated component for template selection and preview.

```tsx
import { TemplatePreview } from '@/components';

<TemplatePreview
  selectedTemplate="General Article"
  onTemplateSelect={(name) => setTemplate(name)}
  showFullPreview={true}
/>
```

**Props:**
- `selectedTemplate?: string` - Currently selected template name
- `onTemplateSelect?: (templateName: string) => void` - Callback when template is selected
- `showFullPreview?: boolean` - Whether to show full preview with details
- `className?: string` - Additional CSS classes

## Hook: useUserPreferences

Manages user preferences with localStorage persistence.

```tsx
import { useUserPreferences } from '@/hooks/useUserPreferences';

const {
  preferences,
  isLoading,
  updatePreference,
  savePreferences,
  resetPreferences,
  getConfigurationOptions,
  hasCustomPreferences
} = useUserPreferences();
```

**Returns:**
- `preferences: UserPreferences` - Current user preferences
- `isLoading: boolean` - Whether preferences are loading from storage
- `updatePreference: (key, value) => void` - Update a single preference
- `savePreferences: (partial) => void` - Save multiple preferences
- `resetPreferences: () => void` - Reset to default preferences
- `getConfigurationOptions: () => ConfigurationOptions` - Get config for article generation
- `hasCustomPreferences: () => boolean` - Check if preferences differ from defaults

## Types

### UserPreferences

```typescript
interface UserPreferences {
  articleLength: 'short' | 'medium' | 'long';
  tone: 'professional' | 'casual' | 'technical';
  format: 'markdown' | 'html' | 'plain';
  includeTimestamps: boolean;
  selectedTemplate: string;
  autoSave: boolean;
  exportFormat: 'markdown' | 'html' | 'pdf';
  includeMetadata: boolean;
}
```

### ConfigurationOptions

```typescript
interface ConfigurationOptions {
  articleLength: 'short' | 'medium' | 'long';
  tone: 'professional' | 'casual' | 'technical';
  format: 'markdown' | 'html' | 'plain';
  template: string;
  includeTimestamps: boolean;
  customPrompt?: string;
}
```

## Usage Examples

### Basic Configuration

```tsx
import { ConfigurationOptions } from '@/components';

function MyComponent() {
  const handleConfigChange = (config) => {
    console.log('New configuration:', config);
  };

  return (
    <ConfigurationOptions 
      onConfigurationChange={handleConfigChange}
    />
  );
}
```

### Processing Workflow Integration

```tsx
import { ConfigurationOptionsCompact } from '@/components';
import { useProcessing } from '@/hooks/useProcessing';

function ProcessingWorkflow() {
  const { isProcessing, startProcessing } = useProcessing();
  
  return (
    <ConfigurationOptionsCompact
      onStartProcessing={startProcessing}
      disabled={isProcessing}
    />
  );
}
```

### Template Selection

```tsx
import { TemplatePreview } from '@/components';
import { useState } from 'react';

function TemplateSelector() {
  const [selectedTemplate, setSelectedTemplate] = useState('General Article');
  
  return (
    <TemplatePreview
      selectedTemplate={selectedTemplate}
      onTemplateSelect={setSelectedTemplate}
      showFullPreview={true}
    />
  );
}
```

### Custom Preferences Management

```tsx
import { useUserPreferences } from '@/hooks/useUserPreferences';

function PreferencesManager() {
  const { 
    preferences, 
    updatePreference, 
    resetPreferences,
    hasCustomPreferences 
  } = useUserPreferences();

  return (
    <div>
      <h3>Current Preferences</h3>
      <p>Length: {preferences.articleLength}</p>
      <p>Tone: {preferences.tone}</p>
      
      <button onClick={() => updatePreference('tone', 'casual')}>
        Make Casual
      </button>
      
      {hasCustomPreferences() && (
        <button onClick={resetPreferences}>
          Reset to Defaults
        </button>
      )}
    </div>
  );
}
```

## Styling

The components use Tailwind CSS classes and can be customized through:

1. **className prop**: Add custom CSS classes
2. **CSS variables**: Override color schemes
3. **Tailwind configuration**: Modify default styles

### Custom Styling Example

```tsx
<ConfigurationOptions 
  className="bg-gray-100 border-2 border-blue-500 rounded-xl"
/>
```

## Accessibility

- All form controls have proper labels
- Keyboard navigation support
- Screen reader compatible
- Focus management for modals
- High contrast support

## Testing

The components include comprehensive test coverage:

- Unit tests for individual components
- Integration tests for component interaction
- Hook testing for preference management
- localStorage mocking for persistence testing

Run tests with:
```bash
npm test -- --testPathPattern="Configuration"
```

## Performance Considerations

- Preferences are cached in memory after initial load
- localStorage operations are debounced
- Component re-renders are optimized with React.memo where appropriate
- Template data is memoized to prevent unnecessary recalculations

## Browser Support

- Modern browsers with localStorage support
- Graceful degradation when localStorage is unavailable
- Progressive enhancement for advanced features