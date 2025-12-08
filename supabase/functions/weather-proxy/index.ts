import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const USER_AGENT = 'WeatherFit-Web-App (contact@weatherfit.web)';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const url = new URL(req.url);
    const path = url.searchParams.get('path');

    if (!path) {
      return new Response(
        JSON.stringify({ error: 'Missing path parameter' }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    const nwsUrl = `https://api.weather.gov${path}`;
    
    const nwsResponse = await fetch(nwsUrl, {
      headers: {
        'User-Agent': USER_AGENT,
        'Accept': 'application/geo+json',
      },
    });

    if (!nwsResponse.ok) {
      return new Response(
        JSON.stringify({ error: `NWS API error: ${nwsResponse.status}` }),
        {
          status: nwsResponse.status,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    const data = await nwsResponse.json();

    return new Response(JSON.stringify(data), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});