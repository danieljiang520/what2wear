export interface LocationSuggestion {
  name: string;
  latitude: number;
  longitude: number;
  state?: string;
  country: string;
  displayName: string;
}

const PRESET_LOCATIONS = [
  // --- Original entries ---
  { name: "Boston", lat: 42.35843, lon: -71.05977, state: "MA" },
  { name: "Stanford", lat: 37.42411, lon: -122.16608, state: "CA" },
  { name: "Berkeley", lat: 37.8715, lon: -122.2730, state: "CA" },
  { name: "New York City", lat: 40.71427, lon: -74.00597, state: "NY" },
  { name: "Honolulu", lat: 21.30690, lon: -157.85800, state: "HI" },
  { name: "San Juan", lat: 18.46630, lon: -66.10570, state: "PR" },
  { name: "Miami", lat: 25.77427, lon: -80.19366, state: "FL" },

  // --- Largest cities by state ---
  { name: "Huntsville", lat: 34.73037, lon: -86.58610, state: "AL" },
  { name: "Anchorage", lat: 61.21806, lon: -149.90028, state: "AK" },
  { name: "Phoenix", lat: 33.44838, lon: -112.07403, state: "AZ" },
  { name: "Little Rock", lat: 34.74648, lon: -92.28959, state: "AR" },
  { name: "Los Angeles", lat: 34.05223, lon: -118.24368, state: "CA" },
  { name: "Denver", lat: 39.73915, lon: -104.98470, state: "CO" },
  { name: "Bridgeport", lat: 41.18655, lon: -73.19518, state: "CT" },
  { name: "Wilmington", lat: 39.73910, lon: -75.53979, state: "DE" },
  { name: "Jacksonville", lat: 30.33218, lon: -81.65565, state: "FL" },
  { name: "Atlanta", lat: 33.75375, lon: -84.38633, state: "GA" },
  { name: "Boise", lat: 43.61501, lon: -116.20231, state: "ID" },
  { name: "Chicago", lat: 41.87811, lon: -87.62980, state: "IL" },
  { name: "Indianapolis", lat: 39.76838, lon: -86.15804, state: "IN" },
  { name: "Des Moines", lat: 41.58679, lon: -93.62502, state: "IA" },
  { name: "Wichita", lat: 37.68718, lon: -97.33005, state: "KS" },
  { name: "Louisville", lat: 38.25266, lon: -85.75845, state: "KY" },
  { name: "New Orleans", lat: 29.95107, lon: -90.07153, state: "LA" },
  { name: "Portland", lat: 43.65910, lon: -70.25682, state: "ME" },
  { name: "Baltimore", lat: 39.29038, lon: -76.61219, state: "MD" },
  { name: "Detroit", lat: 42.33143, lon: -83.04575, state: "MI" },
  { name: "Minneapolis", lat: 44.97775, lon: -93.26501, state: "MN" },
  { name: "Jackson", lat: 32.29876, lon: -90.18481, state: "MS" },
  { name: "Kansas City", lat: 39.09973, lon: -94.57857, state: "MO" },
  { name: "Billings", lat: 45.78329, lon: -108.50069, state: "MT" },
  { name: "Omaha", lat: 41.25650, lon: -95.93450, state: "NE" },
  { name: "Las Vegas", lat: 36.16994, lon: -115.13983, state: "NV" },
  { name: "Manchester", lat: 42.99664, lon: -71.45479, state: "NH" },
  { name: "Newark", lat: 40.73566, lon: -74.17237, state: "NJ" },
  { name: "Albuquerque", lat: 35.08438, lon: -106.65042, state: "NM" },
  { name: "Charlotte", lat: 35.22709, lon: -80.84313, state: "NC" },
  { name: "Fargo", lat: 46.87719, lon: -96.78980, state: "ND" },
  { name: "Columbus", lat: 39.96118, lon: -82.99879, state: "OH" },
  { name: "Oklahoma City", lat: 35.46756, lon: -97.51643, state: "OK" },
  { name: "Portland", lat: 45.51523, lon: -122.67837, state: "OR" },
  { name: "Philadelphia", lat: 39.95258, lon: -75.16522, state: "PA" },
  { name: "Providence", lat: 41.82494, lon: -71.41283, state: "RI" },
  { name: "Charleston", lat: 32.77648, lon: -79.93105, state: "SC" },
  { name: "Sioux Falls", lat: 43.55099, lon: -96.70027, state: "SD" },
  { name: "Nashville", lat: 36.16266, lon: -86.78160, state: "TN" },
  { name: "Houston", lat: 29.76043, lon: -95.36980, state: "TX" },
  { name: "Salt Lake City", lat: 40.75870, lon: -111.87618, state: "UT" },
  { name: "Burlington", lat: 44.47588, lon: -73.21207, state: "VT" },
  { name: "Virginia Beach", lat: 36.85293, lon: -75.97799, state: "VA" },
  { name: "Seattle", lat: 47.60621, lon: -122.33207, state: "WA" },
  { name: "Charleston", lat: 38.34982, lon: -81.63262, state: "WV" },
  { name: "Milwaukee", lat: 43.03890, lon: -87.90647, state: "WI" },
  { name: "Cheyenne", lat: 41.14000, lon: -104.82024, state: "WY" },
] as const;


class GeocodingService {
  async searchLocations(query: string): Promise<LocationSuggestion[]> {
    if (!query || query.trim().length < 1) {
      return PRESET_LOCATIONS.map(loc => ({
        name: loc.name,
        latitude: loc.lat,
        longitude: loc.lon,
        state: loc.state,
        country: 'USA',
        displayName: `${loc.name}, ${loc.state}, USA`,
      }));
    }

    const searchTerm = query.toLowerCase().trim();

    const filtered = PRESET_LOCATIONS
      .filter(loc => loc.name.toLowerCase().includes(searchTerm))
      .map(loc => ({
        name: loc.name,
        latitude: loc.lat,
        longitude: loc.lon,
        state: loc.state,
        country: 'USA',
        displayName: `${loc.name}, ${loc.state}, USA`,
      }));

    return filtered;
  }
}

export const geocodingService = new GeocodingService();
