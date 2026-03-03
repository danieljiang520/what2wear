export interface UserPreferences {
  gender: 'woman' | 'man' | 'non-binary' | 'prefer-not-to-say';
  skinTone: string;
  hairLength: 'short' | 'medium' | 'long' | 'bald';
  clothingStyle: string;
  fashionCountry: string;
  autoUseCurrentLocationOnLoad: boolean;
}

export const DEFAULT_PREFERENCES: UserPreferences = {
  gender: 'prefer-not-to-say',
  skinTone: 'medium',
  hairLength: 'medium',
  clothingStyle: 'casual',
  fashionCountry: 'United States',
  autoUseCurrentLocationOnLoad: false,
};

const STORAGE_KEY = 'weatherfit-preferences';

class PreferencesStore {
  getPreferences(): UserPreferences {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return { ...DEFAULT_PREFERENCES, ...JSON.parse(stored) };
      }
    } catch (error) {
      console.error('Failed to load preferences:', error);
    }
    return DEFAULT_PREFERENCES;
  }

  savePreferences(preferences: UserPreferences): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
    } catch (error) {
      console.error('Failed to save preferences:', error);
    }
  }

  resetToDefaults(): void {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error('Failed to reset preferences:', error);
    }
  }
}

export const preferencesStore = new PreferencesStore();

export const CLOTHING_STYLES = [
  'casual',
  'formal',
  'bohemian',
  'streetwear',
  'vintage',
  'chic',
  'sporty',
  'minimalist',
  'eclectic',
  'romantic',
  'artsy',
  'retro',
  'androgynous',
  'editorial',
  'edgy',
];

export const FASHION_COUNTRIES = [
  'United States',
  'France',
  'Italy',
  'Japan',
  'Korea',
  'United Kingdom',
  'Spain',
  'Germany',
  'Brazil',
  'India',
];

export const SKIN_TONES = [
  { name: 'Very Light', value: 'very-light', hex: '#fde8d5' },
  { name: 'Light', value: 'light', hex: '#f3d4ba' },
  { name: 'Light Medium', value: 'light-medium', hex: '#ddb598' },
  { name: 'Medium', value: 'medium', hex: '#c19376' },
  { name: 'Tan', value: 'tan', hex: '#9d7355' },
  { name: 'Deep', value: 'deep', hex: '#6b4733' },
  { name: 'Very Deep', value: 'very-deep', hex: '#3d2817' },
];
