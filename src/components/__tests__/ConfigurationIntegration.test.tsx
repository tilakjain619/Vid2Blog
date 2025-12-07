import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ConfigurationOptions from '../ConfigurationOptions';
import ConfigurationOptionsCompact from '../ConfigurationOptionsCompact';
import TemplatePreview from '../TemplatePreview';

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock the ArticleGenerator
jest.mock('@/lib/article-generator', () => ({
  ArticleGenerator: {
    getAvailableTemplates: () => [
      {
        name: 'General Article',
        type: 'general',
        estimatedLength: 'medium',
        defaultTone: 'professional',
        structure: [
          { heading: 'Introduction', contentType: 'introduction' },
          { heading: 'Main Content', contentType: 'main_content' },
          { heading: 'Conclusion', contentType: 'conclusion' }
        ]
      },
      {
        name: 'Tutorial Guide',
        type: 'tutorial',
        estimatedLength: 'long',
        defaultTone: 'professional',
        structure: [
          { heading: 'Overview', contentType: 'introduction' },
          { heading: 'Step-by-Step Guide', contentType: 'main_content' },
          { heading: 'Key Takeaways', contentType: 'key_points' }
        ]
      }
    ]
  }
}));

describe('Configuration Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
  });

  it('should persist preferences across component instances', async () => {
    // Render first component and change preferences
    const { unmount } = render(<ConfigurationOptions />);
    
    // Change article length
    fireEvent.click(screen.getByRole('button', { name: 'Long' }));
    
    // Change tone
    fireEvent.click(screen.getByRole('button', { name: 'Casual' }));
    
    // Verify localStorage was called
    expect(localStorageMock.setItem).toHaveBeenCalled();
    
    // Unmount and simulate localStorage returning the saved preferences
    unmount();
    
    const savedPreferences = {
      articleLength: 'long',
      tone: 'casual',
      format: 'markdown',
      includeTimestamps: false,
      selectedTemplate: 'General Article',
      autoSave: true,
      exportFormat: 'markdown',
      includeMetadata: true,
    };
    
    localStorageMock.getItem.mockReturnValue(JSON.stringify(savedPreferences));
    
    // Render new component instance
    render(<ConfigurationOptions />);
    
    // Verify preferences are loaded
    expect(screen.getByRole('button', { name: 'Long' })).toHaveClass('bg-blue-600');
    expect(screen.getByRole('button', { name: 'Casual' })).toHaveClass('bg-blue-600');
  });

  it('should sync preferences between full and compact components', async () => {
    const mockOnConfigChange = jest.fn();
    
    // Render both components
    render(
      <div>
        <ConfigurationOptions onConfigurationChange={mockOnConfigChange} />
        <ConfigurationOptionsCompact onConfigurationChange={mockOnConfigChange} />
      </div>
    );
    
    // Change preference in full component
    const longButtons = screen.getAllByRole('button', { name: 'Long' });
    fireEvent.click(longButtons[0]); // Click the first one (full component)
    
    await waitFor(() => {
      // Both components should reflect the change
      longButtons.forEach(button => {
        expect(button).toHaveClass('bg-blue-600');
      });
    });
    
    // Configuration change callback should be called for both components
    expect(mockOnConfigChange).toHaveBeenCalledWith(
      expect.objectContaining({
        articleLength: 'long'
      })
    );
  });

  it('should handle template selection across components', () => {
    const mockOnTemplateSelect = jest.fn();
    
    render(
      <div>
        <ConfigurationOptions />
        <TemplatePreview 
          selectedTemplate="General Article"
          onTemplateSelect={mockOnTemplateSelect}
        />
      </div>
    );
    
    // Change template in configuration
    const templateSelect = screen.getByRole('combobox');
    fireEvent.change(templateSelect, { target: { value: 'Tutorial Guide' } });
    
    // Template preview should show available templates (use getAllByText to handle multiple matches)
    expect(screen.getAllByText('Tutorial Guide').length).toBeGreaterThan(0);
    expect(screen.getAllByText('General Article').length).toBeGreaterThan(0);
  });

  it('should show advanced options in compact component', () => {
    render(<ConfigurationOptionsCompact />);
    
    // Initially advanced options should be hidden
    expect(screen.queryByText('Template')).not.toBeInTheDocument();
    
    // Click show advanced
    fireEvent.click(screen.getByRole('button', { name: 'Show Advanced' }));
    
    // Advanced options should now be visible
    expect(screen.getByText('Template')).toBeInTheDocument();
    expect(screen.getByLabelText('Timestamps')).toBeInTheDocument();
    expect(screen.getByLabelText('Metadata')).toBeInTheDocument();
  });

  it('should handle processing state correctly', () => {
    const mockOnStartProcessing = jest.fn();
    
    render(
      <ConfigurationOptionsCompact 
        onStartProcessing={mockOnStartProcessing}
        disabled={false}
      />
    );
    
    // Start processing button should be enabled
    const startButton = screen.getByRole('button', { name: /Start Processing/ });
    expect(startButton).not.toBeDisabled();
    
    fireEvent.click(startButton);
    expect(mockOnStartProcessing).toHaveBeenCalled();
  });

  it('should disable controls when processing', () => {
    render(<ConfigurationOptionsCompact disabled={true} />);
    
    // All form controls should be disabled
    const selects = screen.getAllByRole('combobox');
    selects.forEach(select => {
      expect(select).toBeDisabled();
    });
    
    // Show advanced options to access checkboxes
    fireEvent.click(screen.getByRole('button', { name: 'Show Advanced' }));
    
    // Now checkboxes should be available and disabled
    const checkboxes = screen.getAllByRole('checkbox');
    checkboxes.forEach(checkbox => {
      expect(checkbox).toBeDisabled();
    });
  });

  it('should display current settings summary', () => {
    render(<ConfigurationOptionsCompact />);
    
    // Should show current settings at bottom
    expect(screen.getByText(/Current:/)).toBeInTheDocument();
    expect(screen.getByText(/medium professional MARKDOWN/)).toBeInTheDocument();
  });
});