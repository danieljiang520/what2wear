import { useState } from 'react';
import { Save, RotateCcw } from 'lucide-react';
import {
  preferencesStore,
  UserPreferences,
  DEFAULT_PREFERENCES,
  CLOTHING_STYLES,
  FASHION_COUNTRIES,
  SKIN_TONES,
} from '../services/preferencesStore';
import { avatarService, WeatherContext } from '../services/avatarService';

const NEUTRAL_WEATHER: WeatherContext = {
  temperature: 'mild',
  condition: 'clear',
  timeOfDay: 'day',
  season: 'spring',
};

export function Settings() {
  const [preferences, setPreferences] = useState<UserPreferences>(preferencesStore.getPreferences());
  const [avatarUrl, setAvatarUrl] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [hasRequestedPreview, setHasRequestedPreview] = useState(false);

  const GENDER_OPTIONS = [
    { value: 'woman', label: 'Woman' },
    { value: 'man', label: 'Man' },
    { value: 'non-binary', label: 'Non-binary' },
    { value: 'prefer-not-to-say', label: 'Prefer not to say' },
  ] as const;

  const HAIR_LENGTH_OPTIONS = [
    { value: 'short', label: 'Short' },
    { value: 'medium', label: 'Medium' },
    { value: 'long', label: 'Long' },
    { value: 'bald', label: 'Bald/Shaved' },
  ] as const;

  const generatePreviewAvatar = async (prefs: UserPreferences) => {
    setIsGenerating(true);
    try {
      const url = await avatarService.generateAvatarImage({
        preferences: prefs,
        weatherContext: NEUTRAL_WEATHER,
        horizon: 'now',
      });
      setAvatarUrl(url);
    } catch (error) {
      console.error('Failed to generate preview:', error);
      setAvatarUrl('');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSave = () => {
    preferencesStore.savePreferences(preferences);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
    setHasRequestedPreview(true);
    generatePreviewAvatar(preferences);
  };

  const handleReset = () => {
    setPreferences(DEFAULT_PREFERENCES);
    preferencesStore.resetToDefaults();
    setAvatarUrl('');
    setHasRequestedPreview(false);
  };

  const handlePreferenceChange = <K extends keyof UserPreferences>(key: K, value: UserPreferences[K]) => {
    setPreferences((prev) => ({ ...prev, [key]: value }));
  };

  const showPreviewPanel = hasRequestedPreview;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Avatar & Style Preferences</h1>
          <p className="text-lg text-gray-600">
            Customize your avatar and clothing style to get personalized outfit suggestions
          </p>
        </div>

        <div
          className={`grid grid-cols-1 ${showPreviewPanel ? 'lg:grid-cols-2' : 'lg:grid-cols-1'} gap-8`}
        >
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Customize Your Avatar</h2>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">Gender</label>
                <div className="grid grid-cols-2 gap-3">
                  {GENDER_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => handlePreferenceChange('gender', option.value)}
                      className={`px-4 py-3 rounded-lg border-2 transition-all ${
                        preferences.gender === option.value
                          ? 'border-blue-500 bg-blue-50 text-blue-700 font-semibold'
                          : 'border-gray-200 hover:border-gray-300 text-gray-700'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">Skin Tone</label>
                <div className="grid grid-cols-4 gap-3">
                  {SKIN_TONES.map((tone) => (
                    <button
                      key={tone.value}
                      onClick={() => handlePreferenceChange('skinTone', tone.value)}
                      className={`relative h-16 rounded-lg border-2 transition-all group ${
                        preferences.skinTone === tone.value
                          ? 'border-blue-500 shadow-lg'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      title={tone.name}
                    >
                      <div
                        className="absolute inset-1 rounded-md"
                        style={{ backgroundColor: tone.hex }}
                      />
                      {preferences.skinTone === tone.value && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-6 h-6 bg-white rounded-full shadow-md flex items-center justify-center">
                            <div className="w-3 h-3 bg-blue-500 rounded-full" />
                          </div>
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">Hair Length</label>
                <div className="grid grid-cols-2 gap-3">
                  {HAIR_LENGTH_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => handlePreferenceChange('hairLength', option.value)}
                      className={`px-4 py-3 rounded-lg border-2 transition-all ${
                        preferences.hairLength === option.value
                          ? 'border-blue-500 bg-blue-50 text-blue-700 font-semibold'
                          : 'border-gray-200 hover:border-gray-300 text-gray-700'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">Clothing Style</label>
                <select
                  value={preferences.clothingStyle}
                  onChange={(e) => handlePreferenceChange('clothingStyle', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none capitalize"
                >
                  {CLOTHING_STYLES.map((style) => (
                    <option key={style} value={style} className="capitalize">
                      {style}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Favorite Fashion Country
                </label>
                <select
                  value={preferences.fashionCountry}
                  onChange={(e) => handlePreferenceChange('fashionCountry', e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                >
                  {FASHION_COUNTRIES.map((country) => (
                    <option key={country} value={country}>
                      {country}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Startup behavior
                </label>
                <div className="flex items-center justify-between gap-4 rounded-lg border border-gray-200 px-4 py-3">
                  <div>
                    <div className="font-medium text-gray-900">Use current location on startup</div>
                    <div className="text-sm text-gray-600">
                      When enabled, the planner will request your location automatically when you land on the site.
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      handlePreferenceChange('autoUseCurrentLocationOnLoad', !preferences.autoUseCurrentLocationOnLoad)
                    }
                    className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
                      preferences.autoUseCurrentLocationOnLoad ? 'bg-blue-600' : 'bg-gray-300'
                    }`}
                    aria-pressed={preferences.autoUseCurrentLocationOnLoad}
                    aria-label="Use current location on startup"
                  >
                    <span
                      className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                        preferences.autoUseCurrentLocationOnLoad ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleSave}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
                >
                  <Save className="w-5 h-5" />
                  Save Preferences
                </button>
                <button
                  onClick={handleReset}
                  className="px-6 py-3 border-2 border-gray-300 hover:border-gray-400 text-gray-700 rounded-lg font-semibold transition-colors flex items-center gap-2"
                >
                  <RotateCcw className="w-5 h-5" />
                  Reset
                </button>
              </div>

              {saveSuccess && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg">
                  Preferences saved successfully! Your planner will use your personalized style.
                </div>
              )}
            </div>
          </div>

          {showPreviewPanel && (
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Avatar Preview</h2>

              <div className="relative">
                {isGenerating ? (
                  <div className="aspect-[2/3] bg-gray-100 rounded-xl flex items-center justify-center">
                    <div className="text-center">
                      <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                      <p className="text-gray-600 font-medium">Generating your avatar...</p>
                    </div>
                  </div>
                ) : avatarUrl ? (
                  <div className="aspect-[2/3] bg-gray-100 rounded-xl overflow-hidden">
                    <img
                      src={avatarUrl}
                      alt="Avatar preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="aspect-[2/3] bg-gray-100 rounded-xl flex items-center justify-center">
                    <p className="text-gray-600 font-medium text-center px-4">
                      Avatar preview will appear here after it is successfully generated with Gemini.
                    </p>
                  </div>
                )}

                <button
                  onClick={() => generatePreviewAvatar(preferences)}
                  disabled={isGenerating}
                  className="mt-4 w-full bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 text-gray-700 px-4 py-3 rounded-lg font-semibold transition-colors disabled:cursor-not-allowed"
                >
                  {isGenerating ? 'Generating...' : 'Regenerate Preview'}
                </button>
              </div>

              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <h3 className="font-semibold text-blue-900 mb-2">About Your Avatar</h3>
                <p className="text-sm text-blue-700 mb-2">
                  Your personalized avatar will adapt to current weather conditions when you use the planner.
                  The outfit shown will change based on temperature, precipitation, and time of day.
                </p>
                <p className="text-xs text-blue-600">
                  The app attempts to use AI image generation with Gemini. If image generation is unavailable, the
                  settings page will hide the preview until Gemini is available again.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
