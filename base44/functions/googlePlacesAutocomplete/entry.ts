import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();
        
        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { query, types = 'address' } = await req.json();

        if (!query || query.trim().length < 3) {
            return Response.json({ suggestions: [] });
        }

        const apiKey = Deno.env.get("GOOGLE_MAPS_API_KEY");
        if (!apiKey) {
            console.error('Google Maps API key missing');
            return Response.json({ error: 'GOOGLE_MAPS_API_KEY not configured' }, { status: 500 });
        }

        // Places Autocomplete API
        const url = new URL('https://maps.googleapis.com/maps/api/place/autocomplete/json');
        url.searchParams.set('input', query);
        url.searchParams.set('key', apiKey);
        url.searchParams.set('types', types);
        url.searchParams.set('language', 'en');

        const response = await fetch(url.toString());
        const data = await response.json();

        if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
            console.error('Places API error:', data);
            return Response.json({ suggestions: [], error: data.status });
        }

        const suggestions = data.predictions.map((prediction) => ({
            place_id: prediction.place_id,
            description: prediction.description,
            structured_formatting: prediction.structured_formatting,
        }));

        return Response.json({ suggestions });
    } catch (error) {
        console.error('Autocomplete error:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});