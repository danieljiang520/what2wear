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
  allowFallback?: boolean;
}

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

class AvatarService {
  private cache = new Map<string, string>();
  private readonly GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';

  private generateCacheKey(params: AvatarGenerationParams): string {
    const { preferences, weatherContext, horizon, allowFallback } = params;
    const fallbackFlag = allowFallback === false ? 'no-fallback' : 'fallback-ok';
    return `${preferences.gender}-${preferences.hairLength}-${preferences.skinTone}-${preferences.clothingStyle}-${preferences.fashionCountry}-${weatherContext.temperature}-${weatherContext.condition}-${weatherContext.timeOfDay}-${weatherContext.cityName || 'unknown'}-${horizon}-${fallbackFlag}`;
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

    if (this.cache.has(cacheKey)) {
      console.log('Using cached avatar');
      return this.cache.get(cacheKey)!;
    }

    if (!SUPABASE_URL && !this.GEMINI_API_KEY) {
      if (params.allowFallback === false) {
        throw new Error('Gemini image generation is not configured. No fallback avatar is allowed for this request.');
      }
      const fallbackUrl = this.getStyledFallbackAvatar(params);
      this.cache.set(cacheKey, fallbackUrl);
      return fallbackUrl;
    }

    try {
      const prompt = this.buildPrompt(params);
      console.log('Generating avatar with Gemini 2.5 Flash Image...');

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
            this.cache.set(cacheKey, imageUrl);
            console.log('✅ Avatar generated successfully!');
            return imageUrl;
          }
        }
      }

      console.error('❌ No image data in API response');
      console.log('Full response:', JSON.stringify(data, null, 2));
      throw new Error('No image data returned from Gemini API. Check console for details.');
    } catch (error) {
      if (params.allowFallback === false) {
        console.error('Avatar generation failed and fallback is disabled:', error);
        throw error instanceof Error ? error : new Error('Avatar generation failed with unknown error');
      }
      console.error('Avatar generation failed, using styled fallback:', error);
      const fallbackUrl = this.getStyledFallbackAvatar(params);
      this.cache.set(cacheKey, fallbackUrl);
      return fallbackUrl;
    }
  }

  private getStyledFallbackAvatar(params: AvatarGenerationParams): string {
    const { preferences, weatherContext } = params;

    const skinToneColors: Record<string, string> = {
      'very-light': '#fde8d5',
      'light': '#f3d4ba',
      'light-medium': '#ddb598',
      'medium': '#c19376',
      'tan': '#9d7355',
      'deep': '#6b4733',
      'very-deep': '#3d2817',
    };

    const skinColor = skinToneColors[preferences.skinTone] || '#c19376';

    let bgColor = '#e0f2fe';
    if (weatherContext.condition === 'rainy') bgColor = '#cbd5e1';
    else if (weatherContext.condition === 'snowy') bgColor = '#f0f9ff';
    else if (weatherContext.condition === 'cloudy') bgColor = '#e2e8f0';
    else if (weatherContext.timeOfDay === 'night') bgColor = '#1e293b';

    const outfitColor = weatherContext.temperature === 'cold' ? '#1e40af' :
                       weatherContext.temperature === 'hot' ? '#fbbf24' : '#10b981';

    return 'data:image/svg+xml,' + encodeURIComponent(`
      <svg width="400" height="600" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="bg" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style="stop-color:${bgColor};stop-opacity:1" />
            <stop offset="100%" style="stop-color:${bgColor};stop-opacity:0.7" />
          </linearGradient>
        </defs>
        <rect width="400" height="600" fill="url(#bg)"/>

        <!-- Head -->
        <circle cx="200" cy="140" r="50" fill="${skinColor}"/>

        <!-- Hair -->
        ${preferences.hairLength !== 'bald' ? `
          <ellipse cx="200" cy="110" rx="55" ry="${preferences.hairLength === 'long' ? '70' : preferences.hairLength === 'medium' ? '40' : '25'}" fill="#4a4a4a"/>
        ` : ''}

        <!-- Body/Outfit -->
        <rect x="150" y="195" width="100" height="140" rx="15" fill="${outfitColor}"/>

        <!-- Arms -->
        <rect x="130" y="210" width="20" height="100" rx="10" fill="${outfitColor}"/>
        <rect x="250" y="210" width="20" height="100" rx="10" fill="${outfitColor}"/>
        <ellipse cx="140" cy="315" rx="12" ry="15" fill="${skinColor}"/>
        <ellipse cx="260" cy="315" rx="12" ry="15" fill="${skinColor}"/>

        <!-- Legs -->
        <rect x="170" y="335" width="25" height="110" fill="#2c3e50"/>
        <rect x="205" y="335" width="25" height="110" fill="#2c3e50"/>

        <!-- Weather indicator -->
        ${weatherContext.condition === 'rainy' ? `
          <line x1="100" y1="50" x2="95" y2="70" stroke="#3b82f6" stroke-width="2"/>
          <line x1="120" y1="60" x2="115" y2="80" stroke="#3b82f6" stroke-width="2"/>
          <line x1="280" y1="55" x2="275" y2="75" stroke="#3b82f6" stroke-width="2"/>
        ` : weatherContext.condition === 'sunny' ? `
          <circle cx="320" cy="80" r="25" fill="#fbbf24" opacity="0.8"/>
        ` : weatherContext.condition === 'snowy' ? `
          <circle cx="100" cy="60" r="4" fill="white"/>
          <circle cx="130" cy="80" r="4" fill="white"/>
          <circle cx="270" cy="65" r="4" fill="white"/>
          <circle cx="290" cy="85" r="4" fill="white"/>
        ` : ''}

        <text x="200" y="560" font-family="Arial, sans-serif" font-size="12" fill="${weatherContext.timeOfDay === 'night' ? '#ffffff' : '#4b5563'}" text-anchor="middle">
          ${preferences.clothingStyle.charAt(0).toUpperCase() + preferences.clothingStyle.slice(1)} • ${weatherContext.temperature}
        </text>
      </svg>
    `);
  }

  clearCache(): void {
    this.cache.clear();
  }
}

export const avatarService = new AvatarService();
