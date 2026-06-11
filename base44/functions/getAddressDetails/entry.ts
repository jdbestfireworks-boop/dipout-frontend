import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const user = await base44.auth.me();
        
        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { lat, lng } = await req.json();

        if (!lat || !lng) {
            return Response.json({ error: 'Coordinates required' }, { status: 400 });
        }

        // Nominatim reverse geocoding (free, no API key required)
        const url = new URL('https://nominatim.openstreetmap.org/reverse');
        url.searchParams.set('format', 'json');
        url.searchParams.set('lat', lat.toString());
        url.searchParams.set('lon', lng.toString());

        const response = await fetch(url.toString(), {
            headers: {
                'User-Agent': 'DipOutRideApp/1.0'
            }
        });
        
        const data = await response.json();

        if (!data || data.error) {
            console.error('Reverse geocoding error:', data);
            return Response.json({ error: 'Failed to get address details' });
        }

        return Response.json({
            formatted_address: data.display_name,
            lat: parseFloat(data.lat),
            lng: parseFloat(data.lon),
        });
    } catch (error) {
        console.error('Address details error:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});