import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();
        
        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { query } = await req.json();

        if (!query || query.trim().length < 3) {
            return Response.json({ suggestions: [] });
        }

        // Nominatim OpenStreetMap autocomplete (free, no API key required)
        const url = new URL('https://nominatim.openstreetmap.org/search');
        url.searchParams.set('q', query);
        url.searchParams.set('format', 'json');
        url.searchParams.set('limit', '5');
        url.searchParams.set('addressdetails', '1');
        url.searchParams.set('countrycodes', 'us');
        // Bias to Louisiana area
        url.searchParams.set('viewbox', '-94.0,33.0,-88.8,28.8');
        url.searchParams.set('bounded', '1');

        const response = await fetch(url.toString(), {
            headers: {
                'User-Agent': 'DipOutRideApp/1.0',
                'Accept': 'application/json'
            }
        });
        
        const data = await response.json();

        if (!Array.isArray(data)) {
            console.error('Nominatim API error:', data);
            return Response.json({ suggestions: [], error: 'Failed to fetch suggestions' });
        }

        const suggestions = data.map((result) => ({
            place_id: result.place_id,
            description: result.display_name,
            lat: parseFloat(result.lat),
            lng: parseFloat(result.lon),
        }));

        return Response.json({ suggestions });
    } catch (error) {
        console.error('Autocomplete error:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});