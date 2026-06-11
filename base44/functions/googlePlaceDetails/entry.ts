import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();
        
        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { place_id } = await req.json();

        if (!place_id) {
            return Response.json({ error: 'Place ID required' }, { status: 400 });
        }

        const apiKey = Deno.env.get("GOOGLE_MAPS_API_KEY");
        if (!apiKey) {
            console.error('Google Maps API key missing');
            return Response.json({ error: 'GOOGLE_MAPS_API_KEY not configured' }, { status: 500 });
        }

        // Place Details API
        const url = new URL('https://maps.googleapis.com/maps/api/place/details/json');
        url.searchParams.set('place_id', place_id);
        url.searchParams.set('key', apiKey);
        url.searchParams.set('fields', 'formatted_address,geometry,name');

        const response = await fetch(url.toString());
        const data = await response.json();

        if (data.status !== 'OK') {
            console.error('Place Details API error:', data);
            return Response.json({ error: data.status });
        }

        const result = data.result;
        return Response.json({
            formatted_address: result.formatted_address,
            lat: result.geometry.location.lat,
            lng: result.geometry.location.lng,
            name: result.name,
        });
    } catch (error) {
        console.error('Place details error:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});