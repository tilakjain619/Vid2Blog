import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ConfigurationOptions from '../ConfigurationOptions';
import { useUserPreferences } from '@/hooks/useUserPreferences';

// Mock the useUserPreferences hook
jest.mock('@/hooks/useUserPreferences');
const mockUseUserPreferences = useUserPreferences as jest.MockedFunction<typeof useUserPreferences>;

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

describe('ConfigurationOptions', () => {
  const mockUpdatePreference = jest.fn();
  const mockResetPreferences = jest.fn();
  const mockGetConfigurationOptions = jest.fn();
  const mockHasCustomPreferences = jest.fn();

  const defaultPreferences = {
    articleLength: 'medium' as const,
    tone: 'professional' as const,
    format: 'markdown' as const,
    includeTimestamps: false,
    selectedTemplate: 'General Article',
    autoSave: true,
    exportFormat: 'markdown' as const,
    includeMetadata: true,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockUseUserPreferences.mockReturnValue({
      preferences: defaultPreferences,
      isLoading: false,
      updatePreference: mockUpdatePreference,
      savePreferences: jest.fn(),
      resetPreferences: mockResetPreferences,
      getConfigurationOptions: mockGetConfigurationOptions,
      hasCustomPreferences: mockHasCustomPreferences,
    });

    mockGetConfigurationOptions.mockReturnValue({
      articleLength: 'medium',
      tone: 'professional',
      format: 'markdown',
      template: 'General Article',
      includeTimestamps: false,
    });

    mockHasCustomPreferences.mockReturnValue(false);
  });

  it('should render configuration options', () => {
    render(<ConfigurationOptions />);

    expect(screen.getByText('Configuration Options')).toBeInTheDocument();
    expect(screen.getByText('Article Length')).toBeInTheDocument();
    expect(screen.getByText('Writing Tone')).toBeInTheDocument();
    expect(screen.getByText('Output Format')).toBeInTheDocument();
    expect(screen.getByText('Article Template')).toBeInTheDocument();
  });

  it('should display current preferences correctly', () => {
    render(<ConfigurationOptions />);

    // Check that the correct buttons are selected
    expect(screen.getByRole('button', { name: 'Medium' })).toHaveClass('bg-blue-600');
    expect(screen.getByRole('button', { name: 'Professional' })).toHaveClass('bg-blue-600');
    expect(screen.getByRole('button', { name: 'MARKDOWN' })).toHaveClass('bg-blue-600');

    // Check template selection - look for the select element and check its value
    const templateSelect = screen.getByRole('combobox');
    expect(templateSelect).toHaveValue('General Article');
  });

  it('should update article length preference', () => {
    render(<ConfigurationOptions />);

    fireEvent.click(screen.getByRole('button', { name: 'Long' }));

    expect(mockUpdatePreference).toHaveBeenCalledWith('articleLength', 'long');
  });

  it('should update tone preference', () => {
    render(<ConfigurationOptions />);

    fireEvent.click(screen.getByRole('button', { name: 'Casual' }));

    expect(mockUpdatePreference).toHaveBeenCalledWith('tone', 'casual');
  });

  it('should update format preference', () => {
    render(<ConfigurationOptions />);

    fireEvent.click(screen.getByRole('button', { name: 'HTML' }));

    expect(mockUpdatePreference).toHaveBeenCalledWith('format', 'html');
  });

  it('should update template selection', () => {
    render(<ConfigurationOptions />);

    const templateSelect = screen.getByRole('combobox');
    fireEvent.change(templateSelect, { target: { value: 'Tutorial Guide' } });

    expect(mockUpdatePreference).toHaveBeenCalledWith('selectedTemplate', 'Tutorial Guide');
  });

  it('should toggle timestamp preference', () => {
    render(<ConfigurationOptions />);

    const timestampCheckbox = screen.getByLabelText('Include timestamps in content');
    fireEvent.click(timestampCheckbox);

    expect(mockUpdatePreference).toHaveBeenCalledWith('includeTimestamps', true);
  });

  it('should toggle auto-save preference', () => {
    render(<ConfigurationOptions />);

    const autoSaveCheckbox = screen.getByLabelText('Auto-save preferences');
    fireEvent.click(autoSaveCheckbox);

    expect(mockUpdatePreference).toHaveBeenCalledWith('autoSave', false);
  });

  it('should show reset button when preferences are customized', () => {
    mockHasCustomPreferences.mockReturnValue(true);

    render(<ConfigurationOptions />);

    expect(screen.getByRole('button', { name: 'Reset to Defaults' })).toBeInTheDocument();
  });

  it('should hide reset button when preferences are default', () => {
    mockHasCustomPreferences.mockReturnValue(false);

    render(<ConfigurationOptions />);

    expect(screen.queryByRole('button', { name: 'Reset to Defaults' })).not.toBeInTheDocument();
  });

  it('should reset preferences when reset button is clicked', () => {
    mockHasCustomPreferences.mockReturnValue(true);

    render(<ConfigurationOptions />);

    fireEvent.click(screen.getByRole('button', { name: 'Reset to Defaults' }));

    expect(mockResetPreferences).toHaveBeenCalled();
  });

  it('should display current configuration summary', () => {
    render(<ConfigurationOptions />);

    expect(screen.getByText('Current Configuration')).toBeInTheDocument();
    
    // Use more specific queries to avoid multiple matches
    const summarySection = screen.getByText('Current Configuration').closest('div');
    expect(summarySection).toHaveTextContent('Length: medium');
    expect(summarySection).toHaveTextContent('Tone: professional');
    expect(summarySection).toHaveTextContent('Format: MARKDOWN');
    expect(summarySection).toHaveTextContent('Template: General Article');
  });

  it('should show template preview when preview button is clicked', async () => {
    render(<ConfigurationOptions />);

    fireEvent.click(screen.getByRole('button', { name: 'Preview Template' }));

    await waitFor(() => {
      expect(screen.getByText('Template Preview')).toBeInTheDocument();
    });
  });

  it('should call onConfigurationChange when preferences change', () => {
    const mockOnConfigurationChange = jest.fn();
    
    render(<ConfigurationOptions onConfigurationChange={mockOnConfigurationChange} />);

    expect(mockOnConfigurationChange).toHaveBeenCalledWith({
      articleLength: 'medium',
      tone: 'professional',
      format: 'markdown',
      template: 'General Article',
      includeTimestamps: false,
    });
  });

  it('should display appropriate length descriptions', () => {
    render(<ConfigurationOptions />);

    // Default should show medium description
    expect(screen.getByText('Detailed analysis (600-1200 words)')).toBeInTheDocument();

    // Change to short and check description
    fireEvent.click(screen.getByRole('button', { name: 'Short' }));
    
    // Update mock to reflect the change
    mockUseUserPreferences.mockReturnValue({
      preferences: { ...defaultPreferences, articleLength: 'short' },
      isLoading: false,
      updatePreference: mockUpdatePreference,
      savePreferences: jest.fn(),
      resetPreferences: mockResetPreferences,
      getConfigurationOptions: mockGetConfigurationOptions,
      hasCustomPreferences: mockHasCustomPreferences,
    });

    // Re-render to see the updated description
    render(<ConfigurationOptions />);
    expect(screen.getByText('Quick summary (300-600 words)')).toBeInTheDocument();
  });

  it('should display appropriate tone descriptions', () => {
    render(<ConfigurationOptions />);

    expect(screen.getByText('Formal, business-appropriate language')).toBeInTheDocument();
  });
});