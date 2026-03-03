export interface Location {
  name: string;
  latitude: number;
  longitude: number;
  state?: string;
  country?: string;
}

export interface ForecastPeriod {
  number: number;
  name: string;
  startTime: string;
  endTime: string;
  isDaytime: boolean;
  temperature: number;
  temperatureUnit: string;
  windSpeed: string;
  windDirection: string;
  icon: string;
  shortForecast: string;
  detailedForecast: string;
}

export interface HourlyForecast {
  startTime: string;
  endTime: string;
  temperature: number;
  temperatureUnit: string;
  windSpeed: string;
  windDirection: string;
  shortForecast: string;
  icon: string;
  probabilityOfPrecipitation?: {
    value: number;
  };
}

export interface Alert {
  id: string;
  event: string;
  headline: string;
  description: string;
  severity: string;
  urgency: string;
  certainty: string;
}

interface PointsResponse {
  properties: {
    forecast: string;
    forecastHourly: string;
    forecastGridData: string;
    gridId: string;
    gridX: number;
    gridY: number;
  };
}

class WeatherService {
  private static readonly USER_AGENT =
    'What2Wear/1.0 (https://danieljiang520.github.io/what2wear/)';
  private forecastCache = new Map<string, { data: any; timestamp: number }>();
  private cacheDuration = 10 * 60 * 1000;

  private async fetchWithUserAgent(url: string) {
    const nwsUrl = url.startsWith('https://api.weather.gov')
      ? url
      : `https://api.weather.gov${url}`;

    const response = await fetch(nwsUrl, {
      headers: {
        'User-Agent': WeatherService.USER_AGENT,
        Accept: 'application/geo+json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Weather API error: ${response.status} - ${errorText}`);
    }

    return response.json();
  }

  private getCacheKey(lat: number, lon: number, type: string): string {
    return `${lat.toFixed(4)},${lon.toFixed(4)}-${type}`;
  }

  private getFromCache(key: string) {
    const cached = this.forecastCache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheDuration) {
      return cached.data;
    }
    return null;
  }

  private setCache(key: string, data: any) {
    this.forecastCache.set(key, { data, timestamp: Date.now() });
  }

  async getPointData(latitude: number, longitude: number): Promise<PointsResponse> {
    const cacheKey = this.getCacheKey(latitude, longitude, 'points');
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    const url = `https://api.weather.gov/points/${latitude.toFixed(4)},${longitude.toFixed(4)}`;
    const data = await this.fetchWithUserAgent(url);
    this.setCache(cacheKey, data);
    return data;
  }

  async getForecast(latitude: number, longitude: number): Promise<ForecastPeriod[]> {
    const cacheKey = this.getCacheKey(latitude, longitude, 'forecast');
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    const pointData = await this.getPointData(latitude, longitude);
    const forecastUrl = pointData.properties.forecast;
    const data = await this.fetchWithUserAgent(forecastUrl);
    const periods = data.properties.periods as ForecastPeriod[];

    this.setCache(cacheKey, periods);
    return periods;
  }

  async getHourlyForecast(latitude: number, longitude: number): Promise<HourlyForecast[]> {
    const cacheKey = this.getCacheKey(latitude, longitude, 'hourly');
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    const pointData = await this.getPointData(latitude, longitude);
    const hourlyUrl = pointData.properties.forecastHourly;
    const data = await this.fetchWithUserAgent(hourlyUrl);
    const periods = data.properties.periods as HourlyForecast[];

    this.setCache(cacheKey, periods);
    return periods;
  }

  async getAlerts(state: string): Promise<Alert[]> {
    try {
      const url = `https://api.weather.gov/alerts/active?area=${state}`;
      const data = await this.fetchWithUserAgent(url);
      return data.features.map((feature: any) => ({
        id: feature.id,
        event: feature.properties.event,
        headline: feature.properties.headline,
        description: feature.properties.description,
        severity: feature.properties.severity,
        urgency: feature.properties.urgency,
        certainty: feature.properties.certainty,
      }));
    } catch (error) {
      console.error('Failed to fetch alerts:', error);
      return [];
    }
  }

  getNextHourPrecipitation(hourlyForecast: HourlyForecast[]): string {
    if (!hourlyForecast || hourlyForecast.length === 0) {
      return 'No precipitation expected in the next hour';
    }

    const now = new Date();
    const nextHour = hourlyForecast.find((period) => {
      const startTime = new Date(period.startTime);
      return startTime > now;
    });

    if (!nextHour) {
      return 'No precipitation expected in the next hour';
    }

    const startTime = new Date(nextHour.startTime);
    const minutesUntil = Math.round((startTime.getTime() - now.getTime()) / 60000);

    const hasPrecipitation = nextHour.shortForecast.toLowerCase().includes('rain') ||
      nextHour.shortForecast.toLowerCase().includes('snow') ||
      nextHour.shortForecast.toLowerCase().includes('shower') ||
      (nextHour.probabilityOfPrecipitation?.value && nextHour.probabilityOfPrecipitation.value > 30);

    if (hasPrecipitation) {
      return `${nextHour.shortForecast} starting in ${minutesUntil} minutes`;
    }

    return 'No precipitation expected in the next hour';
  }

  getWeatherContext(forecast: ForecastPeriod[], hourlyForecast: HourlyForecast[], cityName?: string) {
    if (!forecast || forecast.length === 0) {
      return {
        temperature: 'mild',
        condition: 'clear',
        timeOfDay: 'day',
        season: 'spring',
      };
    }

    const current = forecast[0];
    const temp = current.temperature;
    const shortForecast = current.shortForecast.toLowerCase();
    const isDaytime = current.isDaytime;
    const date = new Date(current.startTime);
    const month = date.getMonth();

    let temperature: string;
    if (temp <= 32) temperature = 'cold';
    else if (temp <= 50) temperature = 'cool';
    else if (temp <= 70) temperature = 'mild';
    else if (temp <= 85) temperature = 'warm';
    else temperature = 'hot';

    let condition: string;
    if (shortForecast.includes('rain') || shortForecast.includes('shower')) condition = 'rainy';
    else if (shortForecast.includes('snow')) condition = 'snowy';
    else if (shortForecast.includes('cloud')) condition = 'cloudy';
    else if (shortForecast.includes('clear') || shortForecast.includes('sunny')) condition = 'sunny';
    else condition = 'clear';

    const timeOfDay = isDaytime ? 'day' : 'night';

    let season: string;
    if (month >= 11 || month <= 1) season = 'winter';
    else if (month >= 2 && month <= 4) season = 'spring';
    else if (month >= 5 && month <= 7) season = 'summer';
    else season = 'autumn';

    return {
      temperature,
      condition,
      timeOfDay,
      season,
      cityName,
      actualTemperature: temp,
      temperatureUnit: current.temperatureUnit,
      weatherDescription: current.shortForecast,
    };
  }
}

export const weatherService = new WeatherService();
