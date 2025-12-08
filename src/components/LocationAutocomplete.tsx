import { useState, useEffect, useRef } from 'react';
import { MapPin, Search } from 'lucide-react';
import { geocodingService, LocationSuggestion } from '../services/geocodingService';

interface LocationAutocompleteProps {
  onLocationSelect: (location: LocationSuggestion) => void;
  placeholder?: string;
}

export function LocationAutocomplete({ onLocationSelect, placeholder = 'Search for a city...' }: LocationAutocompleteProps) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (query.trim().length < 2) {
      setSuggestions([]);
      return;
    }

    const timeoutId = setTimeout(async () => {
      setIsLoading(true);
      try {
        const results = await geocodingService.searchLocations(query);
        setSuggestions(results);
        setShowDropdown(true);
      } catch (error) {
        console.error('Search error:', error);
        setSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [query]);

  const handleSelect = (location: LocationSuggestion) => {
    setQuery(location.displayName);
    setShowDropdown(false);
    onLocationSelect(location);
  };

  return (
    <div ref={wrapperRef} className="relative w-full">
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => suggestions.length > 0 && setShowDropdown(true)}
          placeholder={placeholder}
          className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
        />
        {isLoading && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2">
            <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>

      {showDropdown && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg max-h-80 overflow-y-auto">
          {suggestions.map((suggestion, index) => (
            <button
              key={index}
              onClick={() => handleSelect(suggestion)}
              className="w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors flex items-start gap-3 border-b border-gray-100 last:border-b-0"
            >
              <MapPin className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
              <div>
                <div className="font-medium text-gray-900">
                  {suggestion.name}
                  {suggestion.state && `, ${suggestion.state}`}
                </div>
                <div className="text-sm text-gray-500">{suggestion.country}</div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
