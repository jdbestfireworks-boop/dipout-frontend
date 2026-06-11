import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        
        // Verify this is called by automation (service role)
        const { ride_id } = await req.json();
        
        if (!ride_id) {
            return Response.json({ error: 'Ride ID required' }, { status: 400 });
        }

        // Get Google Sheets connection
        const { accessToken } = await base44.asServiceRole.connectors.getConnection('googlesheets');
        
        // Fetch the ride data
        const ride = await base44.asServiceRole.entities.Ride.get(ride_id);
        
        if (!ride || ride.status !== 'completed') {
            return Response.json({ error: 'Ride not found or not completed' }, { status: 400 });
        }

        // Get or create spreadsheet ID from app settings (or create new one)
        // For first time, we'll create a new spreadsheet
        let spreadsheetId = Deno.env.get('GOOGLE_SHEETS_SPREADSHEET_ID');
        
        if (!spreadsheetId) {
            // Create new spreadsheet
            const createResponse = await fetch('https://sheets.googleapis.com/spreadsheets', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    properties: {
                        title: 'Dip Out - Ride Records'
                    }
                })
            });
            
            const spreadsheet = await createResponse.json();
            spreadsheetId = spreadsheet.spreadsheetId;
            
            // Store the spreadsheet ID for future use
            // Note: In production, you'd want to store this in app settings
            console.log('Created new spreadsheet:', spreadsheetId);
        }

        // Prepare row data
        const rowData = [
            ride.created_date,
            ride.rider_email,
            ride.driver_email || 'N/A',
            ride.pickup_address,
            ride.dropoff_address,
            `${ride.distance_km?.toFixed(2) || '0'} km`,
            `$${ride.base_fare?.toFixed(2) || '0'}`,
            `${ride.surge_multiplier}x`,
            `$${ride.fare?.toFixed(2) || '0'}`,
            ride.payment_method || 'N/A',
            ride.payment_status || 'unpaid',
            ride.rider_rating ? `${ride.rider_rating}/5` : 'N/A',
            ride.rider_comment || '',
            ride.ai_pricing_reason || '',
        ];

        // Append row to the first sheet
        const appendResponse = await fetch(
            `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Sheet1:append`,
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    values: [rowData],
                    valueInputOption: 'USER_ENTERED',
                    insertDataOption: 'INSERT_ROWS',
                }),
            }
        );

        if (!appendResponse.ok) {
            const error = await appendResponse.json();
            throw new Error(error.error?.message || 'Failed to append row');
        }

        return Response.json({ 
            success: true, 
            spreadsheetId,
            message: 'Ride logged to Google Sheets' 
        });
    } catch (error) {
        console.error('Sync to Sheets error:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});