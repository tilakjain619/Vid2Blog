import { useState, useEffect, useCallback } from 'react';
import { UserPreferences, ConfigurationOptions } from '@/types';

const DEFAULT_PREFERENCES: UserPreferences = {
  articleLength: 'medium',
  tone: 'professional',
  format: 'markdown',
  includeTimestamps: false,
  selectedTemplate: 'General Article',
  autoSave: true,
  exportFormat: 'markdown',
  includeMetadata: true,
};

const STORAGE_KEY = 'vid2blog-user-preferences';

/**
 * Hook for managing user preferences with localStorage persistence
 */
export function useUserPreferences() {
  const [preferences, setPreferences] = useState<UserPreferences>(DEFAULT_PREFERENCES);
  const [isLoading, setIsLoading] = useState(true);

  // Load preferences from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsedPreferences = JSON.parse(stored) as UserPreferences;
        // Merge with defaults to handle new preference keys
        setPreferences({ ...DEFAULT_PREFERENCES, ...parsedPreferences });
      }
    } catch (error) {
      console.warn('Failed to load user preferences:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Save preferences to localStorage
  const savePreferences = useCallback((newPreferences: Partial<UserPreferences>) => {
    try {
      const updatedPreferences = { ...preferences, ...newPreferences };
      setPreferences(updatedPreferences);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedPreferences));
    } catch (error) {
      console.error('Failed to save user preferences:', error);
    }
  }, [preferences]);

  // Update a single preference
  const updatePreference = useCallback(<K extends keyof UserPreferences>(
    key: K,
    value: UserPreferences[K]
  ) => {
    savePreferences({ [key]: value });
  }, [savePreferences]);

  // Reset preferences to defaults
  const resetPreferences = useCallback(() => {
    try {
      setPreferences(DEFAULT_PREFERENCES);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_PREFERENCES));
    } catch (error) {
      console.error('Failed to reset user preferences:', error);
    }
  }, []);

  // Get configuration options for article generation
  const getConfigurationOptions = useCallback((): ConfigurationOptions => {
    return {
      articleLength: preferences.articleLength,
      tone: preferences.tone,
      format: preferences.format,
      template: preferences.selectedTemplate,
      includeTimestamps: preferences.includeTimestamps,
    };
  }, [preferences]);

  // Check if preferences have been modified from defaults
  const hasCustomPreferences = useCallback(() => {
    return JSON.stringify(preferences) !== JSON.stringify(DEFAULT_PREFERENCES);
  }, [preferences]);

  return {
    preferences,
    isLoading,
    updatePreference,
    savePreferences,
    resetPreferences,
    getConfigurationOptions,
    hasCustomPreferences,
  };
}