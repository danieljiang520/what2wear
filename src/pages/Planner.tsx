import { useState, useEffect, useRef, useCallback } from 'react';
import {
  Cloud,
  CloudRain,
  CloudSnow,
  Sun,
  Wind,
  Droplets,
  AlertTriangle,
  Moon,
  Sunrise,
  Clock,
  Calendar,
  MapPin,
  ChevronRight,
  Navigation,
} from 'lucide-react';
import { LocationAutocomplete } from '../components/LocationAutocomplete';
import { LocationSuggestion } from '../services/geocodingService';
import { weatherService, ForecastPeriod, HourlyForecast } from '../services/weatherService';
import { avatarService } from '../services/avatarService';
import { preferencesStore } from '../services/preferencesStore';

export function Planner() {
  const [selectedLocation, setSelectedLocation] = useState<LocationSuggestion | null>(null);
  const [forecast, setForecast] = useState<ForecastPeriod[]>([]);
  const [hourlyForecast, setHourlyForecast] = useState<HourlyForecast[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string>('');
  const [isGeneratingAvatar, setIsGeneratingAvatar] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);

  const showRightPanel = Boolean(avatarUrl);

  const scrollToHero = () => {
    heroRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleLocationSelect = useCallback(async (location: LocationSuggestion) => {
    setSelectedLocation(location);
    setAvatarUrl('');
    setIsLoading(true);
    setError(null);
    setIsGeneratingAvatar(false);

    try {
      const [forecastData, hourlyData] = await Promise.all([
        weatherService.getForecast(location.latitude, location.longitude),
        weatherService.getHourlyForecast(location.latitude, location.longitude),
      ]);

      setForecast(forecastData);
      setHourlyForecast(hourlyData);

      const cityDisplayName = location.displayName || location.name;
      const weatherContext = weatherService.getWeatherContext(forecastData, hourlyData, cityDisplayName);
      const preferences = preferencesStore.getPreferences();

      setIsGeneratingAvatar(true);
      const avatarImageUrl = await avatarService.generateAvatarImage({
        preferences,
        weatherContext,
        horizon: 'now',
      });
      setAvatarUrl(avatarImageUrl);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      console.error('Weather fetch error:', err);
      setError(`Unable to fetch weather data: ${errorMessage}`);
    } finally {
      setIsGeneratingAvatar(false);
      setIsLoading(false);
    }
  }, []);

  const handleUseCurrentLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      return;
    }

    setIsGettingLocation(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;

        const location: LocationSuggestion = {
          name: 'Current Location',
          latitude,
          longitude,
          country: 'USA',
          displayName: 'Your Current Location',
        };

        await handleLocationSelect(location);
        setIsGettingLocation(false);
      },
      (error) => {
        setError('Unable to retrieve your location. Please check your browser settings.');
        console.error('Geolocation error:', error);
        setIsGettingLocation(false);
      }
    );
  }, [handleLocationSelect]);

  useEffect(() => {
    const { autoUseCurrentLocationOnLoad } = preferencesStore.getPreferences();
    if (!autoUseCurrentLocationOnLoad) return;
    if (!navigator.geolocation) return;

    const sessionKey = 'weatherfit-autolocate-ran';
    if (sessionStorage.getItem(sessionKey) === '1') return;

    sessionStorage.setItem(sessionKey, '1');
    handleUseCurrentLocation();
  }, [handleUseCurrentLocation]);

  const getWeatherIcon = (shortForecast: string, isDaytime: boolean = true) => {
    const forecast = shortForecast.toLowerCase();
    if (forecast.includes('rain') || forecast.includes('shower')) return <CloudRain className="w-6 h-6" />;
    if (forecast.includes('snow')) return <CloudSnow className="w-6 h-6" />;
    if (forecast.includes('cloud')) return <Cloud className="w-6 h-6" />;
    if (forecast.includes('wind')) return <Wind className="w-6 h-6" />;
    return isDaytime ? <Sun className="w-6 h-6" /> : <Moon className="w-6 h-6" />;
  };

  const getOutfitSuggestion = (period: ForecastPeriod): string => {
    const temp = period.temperature;
    const forecast = period.shortForecast.toLowerCase();

    let suggestion = '';

    if (temp <= 32) {
      suggestion = 'Heavy winter coat, warm layers, gloves, and insulated boots';
    } else if (temp <= 50) {
      suggestion = 'Jacket or sweater, long pants, closed-toe shoes';
    } else if (temp <= 70) {
      suggestion = 'Light layers, comfortable pants or jeans';
    } else if (temp <= 85) {
      suggestion = 'Light, breathable clothing, t-shirt or blouse';
    } else {
      suggestion = 'Very light, loose clothing, stay cool and hydrated';
    }

    if (forecast.includes('rain') || forecast.includes('shower')) {
      suggestion += ', umbrella or raincoat';
    }
    if (forecast.includes('snow')) {
      suggestion += ', waterproof boots';
    }
    if (forecast.includes('sunny') || forecast.includes('clear')) {
      suggestion += ', sunglasses';
    }

    return suggestion;
  };

  const getDynamicBackground = () => {
    if (!forecast || forecast.length === 0) {
      return 'from-blue-100 via-blue-50 to-white';
    }

    const current = forecast[0];
    const shortForecast = current.shortForecast.toLowerCase();
    const isDaytime = current.isDaytime;

    if (shortForecast.includes('rain')) {
      return isDaytime ? 'from-gray-400 via-gray-300 to-blue-200' : 'from-gray-700 via-gray-600 to-gray-800';
    }
    if (shortForecast.includes('snow')) {
      return 'from-blue-200 via-white to-blue-100';
    }
    if (shortForecast.includes('cloud')) {
      return isDaytime ? 'from-gray-300 via-gray-100 to-white' : 'from-gray-600 via-gray-500 to-gray-700';
    }
    if (isDaytime) {
      return 'from-blue-400 via-cyan-200 to-yellow-100';
    }
    return 'from-gray-800 via-blue-900 to-black';
  };

  const currentCondition = forecast[0];
  const todayPeriods = forecast.slice(0, 2);
  const tonightPeriod = forecast.find((p) => !p.isDaytime && p.name.toLowerCase().includes('tonight'));
  const tomorrowPeriod = forecast.find((p) => p.name.toLowerCase().includes('tomorrow'));

  return (
    <div className="min-h-screen">
      <div ref={heroRef} className={`bg-gradient-to-br ${getDynamicBackground()} transition-colors duration-1000`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div
            className={`grid grid-cols-1 ${showRightPanel ? 'lg:grid-cols-2' : 'lg:grid-cols-1'} gap-12 items-center`}
          >
            <div>
              <h1 className={`text-5xl lg:text-6xl font-bold mb-4 ${currentCondition && !currentCondition.isDaytime ? 'text-white' : 'text-gray-900'}`}>
                Dress smarter with weather-informed outfits
              </h1>
              <p className={`text-xl mb-8 leading-relaxed ${currentCondition && !currentCondition.isDaytime ? 'text-gray-100' : 'text-gray-700'}`}>
                Get personalized outfit suggestions tailored to your local forecast. Coverage for now, today, tonight, and tomorrow.
              </p>

              <div className="mb-6">
                <div className="flex gap-3">
                  <div className="flex-1">
                    <LocationAutocomplete
                      onLocationSelect={handleLocationSelect}
                      placeholder="Enter your city..."
                    />
                  </div>
                  <button
                    onClick={handleUseCurrentLocation}
                    disabled={isGettingLocation || isLoading}
                    className="px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg font-semibold transition-colors flex items-center gap-2 whitespace-nowrap disabled:cursor-not-allowed"
                    title="Use your current location"
                  >
                    <Navigation className="w-5 h-5" />
                    {isGettingLocation ? 'Getting...' : 'Current Location'}
                  </button>
                </div>
              </div>

              {(isLoading || isGeneratingAvatar) && (
                <div className={`flex items-center gap-3 mb-4 ${currentCondition && !currentCondition.isDaytime ? 'text-gray-100' : 'text-gray-700'}`}>
                  <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  <span className="font-medium">
                    {isGeneratingAvatar ? 'Generating your avatar...' : 'Loading weather data...'}
                  </span>
                </div>
              )}

              {selectedLocation && (
                <div className={`flex items-center gap-2 mb-4 ${currentCondition && !currentCondition.isDaytime ? 'text-gray-100' : 'text-gray-700'}`}>
                  <MapPin className="w-5 h-5" />
                  <span className="font-medium">
                    {selectedLocation.name}
                    {selectedLocation.state && `, ${selectedLocation.state}`}
                  </span>
                </div>
              )}

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
                  {error}
                </div>
              )}
            </div>

            {showRightPanel && currentCondition && (
              <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl overflow-hidden">
                <div className="relative aspect-[2/3] bg-gradient-to-br from-blue-50 to-purple-50">
                  <img src={avatarUrl} alt="Weather avatar" className="w-full h-full object-cover" />
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
                    <div className="text-white">
                      <div className="flex items-center gap-2 mb-1">
                        {getWeatherIcon(currentCondition.shortForecast, currentCondition.isDaytime)}
                        <span className="text-3xl font-bold">
                          {currentCondition.temperature}°{currentCondition.temperatureUnit}
                        </span>
                      </div>
                      <p className="text-sm">{currentCondition.shortForecast}</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 p-4">
                  {[
                    { label: 'Now', period: currentCondition },
                    { label: 'Today', period: todayPeriods[1] || todayPeriods[0] },
                    { label: 'Tonight', period: tonightPeriod },
                    { label: 'Tomorrow', period: tomorrowPeriod },
                  ].map((item, idx) => (
                    item.period && (
                      <div key={idx} className="bg-gray-50 rounded-lg p-3">
                        <div className="text-xs font-semibold text-gray-500 mb-1">{item.label}</div>
                        <div className="flex items-center gap-2">
                          {getWeatherIcon(item.period.shortForecast, item.period.isDaytime)}
                          <span className="font-bold text-lg">
                            {item.period.temperature}°
                          </span>
                        </div>
                        <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                          {getOutfitSuggestion(item.period)}
                        </p>
                      </div>
                    )
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-center text-gray-900 mb-12">
            Join smart dressers who...
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              'Dress smartly with daily outfit suggestions based on real-time weather conditions',
              'Adjust wardrobe preferences according to personal comfort and climate',
              'Make informed wardrobe choices using weather-specific clothing advice',
              'Use quick-glance sections for instant outfit guidance',
              'Personalize an avatar that models outfits reflecting current weather',
            ].map((text, idx) => (
              <div key={idx} className="flex items-start gap-4">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <ChevronRight className="w-5 h-5 text-blue-600" />
                </div>
                <p className="text-gray-700 leading-relaxed">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {hourlyForecast.length > 0 && (
        <section className="py-20 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-4xl font-bold text-gray-900 mb-8">Real-Time Weather Updates</h2>
            <div className="bg-white rounded-2xl shadow-lg p-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="flex items-center gap-4">
                  {getWeatherIcon(currentCondition.shortForecast, currentCondition.isDaytime)}
                  <div>
                    <div className="text-sm text-gray-500">Current</div>
                    <div className="text-3xl font-bold text-gray-900">
                      {currentCondition.temperature}°{currentCondition.temperatureUnit}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <Wind className="w-6 h-6 text-blue-500" />
                  <div>
                    <div className="text-sm text-gray-500">Wind</div>
                    <div className="text-xl font-semibold text-gray-900">
                      {currentCondition.windSpeed}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <Droplets className="w-6 h-6 text-blue-500" />
                  <div>
                    <div className="text-sm text-gray-500">Precipitation</div>
                    <div className="text-sm font-medium text-gray-900">
                      {weatherService.getNextHourPrecipitation(hourlyForecast)}
                    </div>
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <div className="flex gap-4 pb-4">
                  {hourlyForecast.slice(0, 12).map((hour, idx) => {
                    const time = new Date(hour.startTime);
                    return (
                      <div
                        key={idx}
                        className="flex-shrink-0 w-24 bg-gray-50 rounded-lg p-3 text-center"
                      >
                        <div className="text-xs text-gray-500 mb-2">
                          {time.toLocaleTimeString('en-US', { hour: 'numeric' })}
                        </div>
                        <div className="flex justify-center mb-2">
                          {getWeatherIcon(hour.shortForecast)}
                        </div>
                        <div className="font-bold text-gray-900">{hour.temperature}°</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {forecast.length > 2 && (
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-4xl font-bold text-gray-900 mb-8">Detailed Weather Insights</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {forecast.slice(0, 6).map((period, idx) => (
                <div key={idx} className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 hover:shadow-lg transition-shadow">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-lg text-gray-900">{period.name}</h3>
                    {getWeatherIcon(period.shortForecast, period.isDaytime)}
                  </div>
                  <div className="text-4xl font-bold text-gray-900 mb-2">
                    {period.temperature}°{period.temperatureUnit}
                  </div>
                  <p className="text-gray-600 text-sm mb-4">{period.shortForecast}</p>
                  <div className="border-t border-gray-200 pt-4">
                    <div className="text-xs font-semibold text-gray-500 mb-2">Outfit Suggestion</div>
                    <p className="text-sm text-gray-700">{getOutfitSuggestion(period)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="py-20 bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-gray-900 mb-8">Visual Weather Aesthetics</h2>
          <p className="text-lg text-gray-600 mb-12">
            Your avatar and background dynamically adapt to reflect current weather conditions, time of day, and season.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { condition: 'Sunny Day', bg: 'from-yellow-200 to-orange-100', icon: <Sun className="w-8 h-8" /> },
              { condition: 'Rainy Weather', bg: 'from-gray-400 to-blue-300', icon: <CloudRain className="w-8 h-8" /> },
              { condition: 'Snowy Day', bg: 'from-blue-100 to-white', icon: <CloudSnow className="w-8 h-8" /> },
              { condition: 'Cloudy Sky', bg: 'from-gray-300 to-gray-100', icon: <Cloud className="w-8 h-8" /> },
            ].map((scene, idx) => (
              <div key={idx} className={`bg-gradient-to-br ${scene.bg} rounded-xl p-6 text-center shadow-lg`}>
                <div className="flex justify-center mb-4 text-white">{scene.icon}</div>
                <h3 className="font-bold text-gray-900">{scene.condition}</h3>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-gray-900 mb-12 text-center">
            More than just a weather site
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { icon: <Clock className="w-8 h-8" />, title: 'Minute-by-Minute Precipitation', desc: 'Track rainfall timing with precision' },
              { icon: <Wind className="w-8 h-8" />, title: 'Air Quality Index', desc: 'Monitor air quality for outdoor activities' },
              { icon: <AlertTriangle className="w-8 h-8" />, title: 'Weather Warnings', desc: 'Stay informed about severe weather alerts' },
              { icon: <Moon className="w-8 h-8" />, title: 'Moon Phases', desc: 'Track lunar cycles and phases' },
              { icon: <Sunrise className="w-8 h-8" />, title: 'Sunrise & Sunset', desc: 'Plan your day around daylight hours' },
              { icon: <Calendar className="w-8 h-8" />, title: 'Extended Forecast', desc: 'Plan ahead with 7-day outlook' },
            ].map((feature, idx) => (
              <div key={idx} className="bg-gray-50 rounded-xl p-6 hover:shadow-lg transition-shadow">
                <div className="text-blue-600 mb-4">{feature.icon}</div>
                <h3 className="font-bold text-lg text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 bg-gradient-to-br from-blue-600 to-purple-600 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold mb-6">Ready to dress for any forecast?</h2>
          <p className="text-xl mb-8 text-blue-100">
            Start planning your perfect outfit based on real-time weather data
          </p>
          <button
            onClick={scrollToHero}
            className="bg-white text-blue-600 px-8 py-4 rounded-lg font-bold text-lg hover:bg-blue-50 transition-colors shadow-lg"
          >
            Start Planning Your Outfit
          </button>
        </div>
      </section>
    </div>
  );
}
