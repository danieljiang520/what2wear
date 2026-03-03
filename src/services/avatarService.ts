import { UserPreferences } from './preferencesStore';

export interface WeatherContext {
  temperature: string;
  condition: string;
  timeOfDay: string;
  season: string;
  cityName?: string;
  actualTemperature?: number;
  temperatureUnit?: string;
  weatherDescription?: string;
}

export interface AvatarGenerationParams {
  preferences: UserPreferences;
  weatherContext: WeatherContext;
  horizon: 'now' | 'today' | 'tonight' | 'tomorrow';
}

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

class AvatarService {
  private cache = new Map<string, { url: string; createdAt: number }>();
  private readonly CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour
  private readonly GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';

  private getFromCache(cacheKey: string): string | null {
    const entry = this.cache.get(cacheKey);
    if (!entry) return null;

    const age = Date.now() - entry.createdAt;
    if (age < this.CACHE_TTL_MS) {
      console.log('Using cached avatar (fresh)');
      return entry.url;
    }

    console.log('Cached avatar expired, evicting');
    this.cache.delete(cacheKey);
    return null;
  }

  private generateCacheKey(params: AvatarGenerationParams): string {
    const { preferences, weatherContext, horizon } = params;
    return `${preferences.gender}-${preferences.hairLength}-${preferences.skinTone}-${preferences.clothingStyle}-${preferences.fashionCountry}-${weatherContext.temperature}-${weatherContext.condition}-${weatherContext.timeOfDay}-${weatherContext.cityName || 'unknown'}-${horizon}`;
  }

  private buildPrompt(params: AvatarGenerationParams): string {
    const { preferences, weatherContext, horizon } = params;

    const genderText = preferences.gender === 'prefer-not-to-say' ? 'person' :
      preferences.gender === 'non-binary' ? 'person' : preferences.gender;

    const skinToneMap: Record<string, string> = {
      'very-light': 'very fair',
      'light': 'light',
      'light-medium': 'light-medium',
      'medium': 'medium',
      'tan': 'tan',
      'deep': 'deep',
      'very-deep': 'very deep',
    };

    const skinToneText = skinToneMap[preferences.skinTone] || 'medium';

    let weatherOutfitGuide = '';
    if (weatherContext.temperature === 'cold' || weatherContext.temperature === 'cool') {
      weatherOutfitGuide = 'wearing a warm coat or jacket, scarf';
      if (weatherContext.condition === 'rainy') weatherOutfitGuide += ', holding an umbrella';
      if (weatherContext.condition === 'snowy') weatherOutfitGuide += ', winter boots';
    } else if (weatherContext.temperature === 'warm' || weatherContext.temperature === 'hot') {
      weatherOutfitGuide = 'wearing light, breathable clothing like a t-shirt or blouse';
      if (weatherContext.condition === 'sunny') weatherOutfitGuide += ', sunglasses';
    } else {
      weatherOutfitGuide = 'wearing comfortable layered clothing';
      if (weatherContext.condition === 'rainy') weatherOutfitGuide += ', with a light jacket or raincoat';
    }

    const timeOfDayText = weatherContext.timeOfDay === 'night' || horizon === 'tonight' ?
      'evening or nighttime setting' : 'daytime setting';

    const locationText = weatherContext.cityName ? ` in ${weatherContext.cityName}` : '';
    const tempText = weatherContext.actualTemperature && weatherContext.temperatureUnit
      ? ` with ${weatherContext.actualTemperature}°${weatherContext.temperatureUnit}`
      : '';
    const weatherText = weatherContext.weatherDescription
      ? ` during ${weatherContext.weatherDescription.toLowerCase()}`
      : '';

    const prompt = `Create a full-body fashion illustration of a ${genderText} avatar with ${preferences.hairLength} hair and ${skinToneText} skin tone. The avatar should be wearing a stylish ${preferences.clothingStyle} outfit inspired by ${preferences.fashionCountry} street fashion${locationText}. The outfit should be ${weatherOutfitGuide}${tempText}${weatherText}. The avatar is shown in a ${timeOfDayText} with a background that reflects the atmosphere of ${weatherContext.cityName || 'the location'} during ${weatherContext.condition} weather in ${weatherContext.season}. The background should subtly incorporate local architectural or cultural elements if the city is recognizable. The illustration style should be modern, clean, and fashion-forward with attention to the ${preferences.fashionCountry} fashion aesthetic. No text or labels in the image.`;

    return prompt;
  }

  async generateAvatarImage(params: AvatarGenerationParams): Promise<string> {
    const cacheKey = this.generateCacheKey(params);

    const cachedUrl = this.getFromCache(cacheKey);
    if (cachedUrl) {
      return cachedUrl;
    }

    if (!SUPABASE_URL && !this.GEMINI_API_KEY) {
      throw new Error(
        'Gemini image generation is not configured. Set VITE_SUPABASE_URL with the edge function or VITE_GEMINI_API_KEY to enable avatar generation.'
      );
    }

    try {
      const prompt = this.buildPrompt(params);
      console.log('Generating avatar with Gemini image model via Gemini API...');

      const body = {
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          responseModalities: ['IMAGE'],
          imageConfig: { aspectRatio: '3:4' },
        },
      };

      let response: Response;
      if (SUPABASE_URL) {
        response = await fetch(`${SUPABASE_URL}/functions/v1/gemini-avatar`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(SUPABASE_ANON_KEY && { Authorization: `Bearer ${SUPABASE_ANON_KEY}` }),
          },
          body: JSON.stringify(body),
        });
      } else {
        response = await fetch(
          'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-goog-api-key': this.GEMINI_API_KEY,
            },
            body: JSON.stringify(body),
          }
        );
      }

      if (!response.ok) {
        const errorText = await response.text();
        if (response.status === 401 && SUPABASE_URL) {
          throw new Error(
            `Supabase returned 401 (Invalid JWT). Check that VITE_SUPABASE_ANON_KEY is set and matches your project's anon key, or deploy the function with: supabase functions deploy gemini-avatar --no-verify-jwt`
          );
        }
        if (response.status === 429) {
          const limitZero = /limit:\s*0/.test(errorText);
          throw new Error(
            limitZero
              ? "Gemini image generation has no free-tier quota (limit: 0). Enable billing in Google AI Studio or use a key with image-generation access. See https://ai.google.dev/gemini-api/docs/rate-limits"
              : `Gemini rate limit (429). Try again in a minute. Details: ${errorText.slice(0, 200)}`
          );
        }
        throw new Error(`Avatar API returned ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      console.log('📦 Gemini API response received');

      if (data.candidates && data.candidates[0]?.content?.parts) {
        for (const part of data.candidates[0].content.parts) {
          if (part.inlineData && part.inlineData.data) {
            const imageUrl = `data:image/png;base64,${part.inlineData.data}`;
            this.cache.set(cacheKey, { url: imageUrl, createdAt: Date.now() });
            console.log('✅ Avatar generated successfully!');
            return imageUrl;
          }
        }
      }

      console.error('❌ No image data in API response');
      console.log('Full response:', JSON.stringify(data, null, 2));
      throw new Error('No image data returned from Gemini API. Check console for details.');
    } catch (error) {
      console.error('Avatar generation failed with Gemini:', error);
      throw error instanceof Error ? error : new Error('Avatar generation failed with unknown error');
    }
  }
}

export const avatarService = new AvatarService();
