import { renderHook, act } from '@testing-library/react';
import { useUserPreferences } from '../useUserPreferences';

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

describe('useUserPreferences', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should initialize with default preferences when localStorage is empty', () => {
    localStorageMock.getItem.mockReturnValue(null);

    const { result } = renderHook(() => useUserPreferences());

    expect(result.current.preferences).toEqual({
      articleLength: 'medium',
      tone: 'professional',
      format: 'markdown',
      includeTimestamps: false,
      selectedTemplate: 'General Article',
      autoSave: true,
      exportFormat: 'markdown',
      includeMetadata: true,
    });
    expect(result.current.isLoading).toBe(false);
  });

  it('should load preferences from localStorage', () => {
    const storedPreferences = {
      articleLength: 'long',
      tone: 'casual',
      format: 'html',
      includeTimestamps: true,
      selectedTemplate: 'Tutorial Guide',
      autoSave: false,
      exportFormat: 'pdf',
      includeMetadata: false,
    };

    localStorageMock.getItem.mockReturnValue(JSON.stringify(storedPreferences));

    const { result } = renderHook(() => useUserPreferences());

    expect(result.current.preferences).toEqual(storedPreferences);
  });

  it('should merge stored preferences with defaults for missing keys', () => {
    const partialPreferences = {
      articleLength: 'short',
      tone: 'technical',
    };

    localStorageMock.getItem.mockReturnValue(JSON.stringify(partialPreferences));

    const { result } = renderHook(() => useUserPreferences());

    expect(result.current.preferences).toEqual({
      articleLength: 'short',
      tone: 'technical',
      format: 'markdown',
      includeTimestamps: false,
      selectedTemplate: 'General Article',
      autoSave: true,
      exportFormat: 'markdown',
      includeMetadata: true,
    });
  });

  it('should handle localStorage errors gracefully', () => {
    localStorageMock.getItem.mockImplementation(() => {
      throw new Error('localStorage error');
    });

    const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

    const { result } = renderHook(() => useUserPreferences());

    expect(result.current.preferences).toEqual({
      articleLength: 'medium',
      tone: 'professional',
      format: 'markdown',
      includeTimestamps: false,
      selectedTemplate: 'General Article',
      autoSave: true,
      exportFormat: 'markdown',
      includeMetadata: true,
    });
    expect(consoleSpy).toHaveBeenCalledWith('Failed to load user preferences:', expect.any(Error));

    consoleSpy.mockRestore();
  });

  it('should update a single preference', () => {
    localStorageMock.getItem.mockReturnValue(null);

    const { result } = renderHook(() => useUserPreferences());

    act(() => {
      result.current.updatePreference('articleLength', 'long');
    });

    expect(result.current.preferences.articleLength).toBe('long');
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'vid2blog-user-preferences',
      JSON.stringify({
        ...result.current.preferences,
        articleLength: 'long',
      })
    );
  });

  it('should save multiple preferences', () => {
    localStorageMock.getItem.mockReturnValue(null);

    const { result } = renderHook(() => useUserPreferences());

    act(() => {
      result.current.savePreferences({
        articleLength: 'short',
        tone: 'casual',
        includeTimestamps: true,
      });
    });

    expect(result.current.preferences).toMatchObject({
      articleLength: 'short',
      tone: 'casual',
      includeTimestamps: true,
    });
    expect(localStorageMock.setItem).toHaveBeenCalled();
  });

  it('should reset preferences to defaults', () => {
    const storedPreferences = {
      articleLength: 'long',
      tone: 'casual',
      format: 'html',
      includeTimestamps: true,
      selectedTemplate: 'Tutorial Guide',
      autoSave: false,
      exportFormat: 'pdf',
      includeMetadata: false,
    };

    localStorageMock.getItem.mockReturnValue(JSON.stringify(storedPreferences));

    const { result } = renderHook(() => useUserPreferences());

    act(() => {
      result.current.resetPreferences();
    });

    expect(result.current.preferences).toEqual({
      articleLength: 'medium',
      tone: 'professional',
      format: 'markdown',
      includeTimestamps: false,
      selectedTemplate: 'General Article',
      autoSave: true,
      exportFormat: 'markdown',
      includeMetadata: true,
    });
  });

  it('should return configuration options', () => {
    localStorageMock.getItem.mockReturnValue(null);

    const { result } = renderHook(() => useUserPreferences());

    const config = result.current.getConfigurationOptions();

    expect(config).toEqual({
      articleLength: 'medium',
      tone: 'professional',
      format: 'markdown',
      template: 'General Article',
      includeTimestamps: false,
    });
  });

  it('should detect custom preferences', () => {
    localStorageMock.getItem.mockReturnValue(null);

    const { result } = renderHook(() => useUserPreferences());

    // Initially should not have custom preferences
    expect(result.current.hasCustomPreferences()).toBe(false);

    // After updating a preference, should have custom preferences
    act(() => {
      result.current.updatePreference('articleLength', 'long');
    });

    expect(result.current.hasCustomPreferences()).toBe(true);
  });

  it('should handle localStorage save errors', () => {
    localStorageMock.getItem.mockReturnValue(null);
    localStorageMock.setItem.mockImplementation(() => {
      throw new Error('localStorage save error');
    });

    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

    const { result } = renderHook(() => useUserPreferences());

    act(() => {
      result.current.updatePreference('articleLength', 'long');
    });

    expect(consoleSpy).toHaveBeenCalledWith('Failed to save user preferences:', expect.any(Error));

    consoleSpy.mockRestore();
  });
});