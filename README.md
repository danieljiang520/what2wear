# WeatherFit Web - Weather-Based Outfit Planner

A modern, responsive single-page web application that combines real-time weather data with AI-generated avatar styling to provide personalized outfit recommendations.

## Features

- **Weather Integration**: Real-time weather data from the US National Weather Service API
- **Location Search**: Autocomplete location search with dropdown suggestions for US cities
- **AI-Generated Avatars**: Personalized avatars created with Gemini 3 Pro Image Preview
- **Dynamic Backgrounds**: Weather-aware backgrounds that change based on conditions
- **Outfit Suggestions**: Tailored clothing recommendations for now, today, tonight, and tomorrow
- **Customizable Preferences**: Avatar and style customization on the Settings page
- **Responsive Design**: Optimized for all screen sizes

## Setup

### Prerequisites

- Node.js (v16 or higher)
- A Google Gemini API key (optional for AI avatar generation)

### Installation

1. Install dependencies:
```bash
npm install
```

2. Configure your Gemini API key in `.env`:
```
VITE_GEMINI_API_KEY=your_actual_gemini_api_key_here
```

To get a Gemini API key:
1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Create a new API key
4. Copy the key to your `.env` file

**Avatar generation (recommended: Supabase proxy)**  
To keep the Gemini API key secure, use the Supabase Edge Function proxy:

1. Deploy the `gemini-avatar` Edge Function: `supabase functions deploy gemini-avatar`
2. In Supabase Dashboard, go to **Project Settings → Edge Functions → Secrets** and set `GEMINI_API_KEY` to your Gemini API key
3. In your `.env` (and in your build environment for static deploys like GitHub Pages), set:
   - `VITE_SUPABASE_URL=https://<your-project-ref>.supabase.co`
   - `VITE_SUPABASE_ANON_KEY=<your-anon-key>` (from Dashboard → Settings → API)

The frontend will call the proxy instead of Gemini directly; the key never leaves Supabase.

**Local dev without Supabase:**  
You can still set `VITE_GEMINI_API_KEY` in `.env` and leave `VITE_SUPABASE_URL` unset; the app will call Gemini directly (key is visible in dev only).

**Note on Avatar Generation**:
- The app uses the Gemini 2.5 Flash Image model (`gemini-2.5-flash-image`) to generate avatars
- If the API is unavailable or quota is exceeded, styled SVG fallback avatars will be displayed
- Fallback avatars are personalized based on your preferences and weather conditions
- The "Regenerate Preview" button in Settings uses the same Gemini API endpoint

### Running the App

Start the development server:
```bash
npm run dev
```

Build for production:
```bash
npm run build
```

### Deploying to GitHub Pages

1. In your GitHub repo, go to **Settings → Pages → Build and deployment**
2. Set the **Source** dropdown to **GitHub Actions** (not "Deploy from a branch")
3. Push to `main` or manually run the "Deploy Vite to GitHub Pages" workflow from the Actions tab

## Usage

### Planner Page

1. Enter a US city in the location search box OR click "Current Location" to use your device's location
2. Select your location from the dropdown (if using search)
3. View your personalized avatar with weather-appropriate outfit
4. See detailed forecasts and outfit suggestions for different time periods

Note: Using the "Current Location" button requires browser location permissions

### Settings Page

1. Navigate to Settings from the top navigation
2. Customize your avatar:
   - Gender
   - Skin tone
   - Hair length
   - Clothing style (casual, formal, streetwear, etc.)
   - Favorite fashion country
3. Click "Save Preferences" to apply changes
4. Your avatar will update across the app

## Architecture

### Services

- **WeatherService**: Manages all NWS API interactions
- **GeocodingService**: Handles location search and autocomplete
- **AvatarService**: Generates AI avatars using Gemini API
- **PreferencesStore**: Manages user preferences in local storage

### Pages

- **Planner**: Main page with weather forecast and outfit suggestions
- **Settings**: Avatar and style customization

### Components

- **Navigation**: Top navigation bar with routing
- **LocationAutocomplete**: Search input with location suggestions

## API Integration

### National Weather Service API

- Endpoint: `https://api.weather.gov`
- Provides 7-day forecast, hourly data, and weather alerts
- No API key required
- Custom User-Agent header included per NWS guidelines

### Gemini API

- Model: `gemini-3-pro-image-preview`
- Generates custom avatar images based on preferences and weather
- Caching implemented to reduce API calls

## Technologies

- React 18
- TypeScript
- Vite
- React Router
- Tailwind CSS
- Lucide React (icons)

## Notes

- The app uses the National Weather Service API, which provides data for US locations only
- Avatar generation requires a valid Gemini API key
- Preferences are stored in browser local storage
- Dynamic backgrounds change based on weather conditions and time of day
