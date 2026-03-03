export interface LocationSuggestion {
  name: string;
  latitude: number;
  longitude: number;
  state?: string;
  country: string;
  displayName: string;
}

const DEFAULT_LOCATIONS: LocationSuggestion[] = [
  { name: 'New York City', latitude: 40.7143, longitude: -74.006, state: 'NY', country: 'USA', displayName: 'New York City, NY, USA' },
  { name: 'Los Angeles', latitude: 34.0522, longitude: -118.2437, state: 'CA', country: 'USA', displayName: 'Los Angeles, CA, USA' },
  { name: 'Chicago', latitude: 41.8781, longitude: -87.6298, state: 'IL', country: 'USA', displayName: 'Chicago, IL, USA' },
  { name: 'Houston', latitude: 29.7604, longitude: -95.3698, state: 'TX', country: 'USA', displayName: 'Houston, TX, USA' },
  { name: 'Phoenix', latitude: 33.4484, longitude: -112.074, state: 'AZ', country: 'USA', displayName: 'Phoenix, AZ, USA' },
  { name: 'Miami', latitude: 25.7743, longitude: -80.1937, state: 'FL', country: 'USA', displayName: 'Miami, FL, USA' },
  { name: 'Seattle', latitude: 47.6062, longitude: -122.3321, state: 'WA', country: 'USA', displayName: 'Seattle, WA, USA' },
  { name: 'Denver', latitude: 39.7392, longitude: -104.9847, state: 'CO', country: 'USA', displayName: 'Denver, CO, USA' },
  { name: 'Boston', latitude: 42.3584, longitude: -71.0598, state: 'MA', country: 'USA', displayName: 'Boston, MA, USA' },
  { name: 'Atlanta', latitude: 33.7538, longitude: -84.3863, state: 'GA', country: 'USA', displayName: 'Atlanta, GA, USA' },
];

interface NominatimResult {
  display_name: string;
  lat: string;
  lon: string;
  address?: {
    city?: string;
    town?: string;
    village?: string;
    hamlet?: string;
    county?: string;
    state?: string;
    country?: string;
  };
  type?: string;
}

const STATE_ABBREVS: Record<string, string> = {
  Alabama: 'AL', Alaska: 'AK', Arizona: 'AZ', Arkansas: 'AR', California: 'CA',
  Colorado: 'CO', Connecticut: 'CT', Delaware: 'DE', Florida: 'FL', Georgia: 'GA',
  Hawaii: 'HI', Idaho: 'ID', Illinois: 'IL', Indiana: 'IN', Iowa: 'IA',
  Kansas: 'KS', Kentucky: 'KY', Louisiana: 'LA', Maine: 'ME', Maryland: 'MD',
  Massachusetts: 'MA', Michigan: 'MI', Minnesota: 'MN', Mississippi: 'MS', Missouri: 'MO',
  Montana: 'MT', Nebraska: 'NE', Nevada: 'NV', 'New Hampshire': 'NH', 'New Jersey': 'NJ',
  'New Mexico': 'NM', 'New York': 'NY', 'North Carolina': 'NC', 'North Dakota': 'ND',
  Ohio: 'OH', Oklahoma: 'OK', Oregon: 'OR', Pennsylvania: 'PA', 'Rhode Island': 'RI',
  'South Carolina': 'SC', 'South Dakota': 'SD', Tennessee: 'TN', Texas: 'TX', Utah: 'UT',
  Vermont: 'VT', Virginia: 'VA', Washington: 'WA', 'West Virginia': 'WV', Wisconsin: 'WI',
  Wyoming: 'WY', 'Puerto Rico': 'PR', 'District of Columbia': 'DC',
};

function abbrevState(stateName?: string): string | undefined {
  if (!stateName) return undefined;
  return STATE_ABBREVS[stateName] ?? stateName;
}

class GeocodingService {
  private static readonly USER_AGENT = 'What2Wear/1.0';

  async searchLocations(query: string): Promise<LocationSuggestion[]> {
    if (!query || query.trim().length < 2) {
      return DEFAULT_LOCATIONS;
    }

    const url =
      `https://nominatim.openstreetmap.org/search?` +
      `q=${encodeURIComponent(query.trim())}` +
      `&countrycodes=us&format=jsonv2&addressdetails=1&limit=10`;

    const response = await fetch(url, {
      headers: { 'User-Agent': GeocodingService.USER_AGENT },
    });

    if (!response.ok) {
      console.error('Nominatim error:', response.status);
      return [];
    }

    const results: NominatimResult[] = await response.json();

    return results.map((r) => {
      const addr = r.address;
      const placeName = addr?.city || addr?.town || addr?.village || addr?.hamlet || addr?.county || query.trim();
      const stateAbbr = abbrevState(addr?.state);
      const displayParts = [placeName];
      if (stateAbbr) displayParts.push(stateAbbr);
      displayParts.push('USA');

      return {
        name: placeName,
        latitude: parseFloat(r.lat),
        longitude: parseFloat(r.lon),
        state: stateAbbr,
        country: 'USA',
        displayName: displayParts.join(', '),
      };
    });
  }

  async reverseLookup(latitude: number, longitude: number): Promise<LocationSuggestion | null> {
    const url =
      `https://nominatim.openstreetmap.org/reverse?` +
      `lat=${encodeURIComponent(latitude.toString())}` +
      `&lon=${encodeURIComponent(longitude.toString())}` +
      `&countrycodes=us&format=jsonv2&addressdetails=1`;

    const response = await fetch(url, {
      headers: { 'User-Agent': GeocodingService.USER_AGENT },
    });

    if (!response.ok) {
      console.error('Nominatim reverse error:', response.status);
      return null;
    }

    const result: NominatimResult = await response.json();
    const addr = result.address;
    const placeName =
      addr?.city || addr?.town || addr?.village || addr?.hamlet || addr?.county || result.display_name;
    const stateAbbr = abbrevState(addr?.state);
    const displayParts = [placeName];
    if (stateAbbr) displayParts.push(stateAbbr);
    const country = addr?.country ?? 'USA';
    displayParts.push(country);

    return {
      name: placeName,
      latitude,
      longitude,
      state: stateAbbr,
      country,
      displayName: displayParts.join(', '),
    };
  }
}

export const geocodingService = new GeocodingService();
