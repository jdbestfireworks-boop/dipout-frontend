import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Verify admin access
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get Google Sheets access token
    const { accessToken } = await base44.asServiceRole.connectors.getConnection('googlesheets');

    // Find or create the spreadsheet
    const spreadsheetTitle = 'Dip Out Ride Backup';
    
    // Search for existing spreadsheet
    const searchResponse = await fetch(
      `https://www.googleapis.com/drive/v3/files?q=name='${spreadsheetTitle}' and mimeType='application/vnd.google-apps.spreadsheet' and trashed=false`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      }
    );
    const searchData = await searchResponse.json();
    
    let spreadsheetId;
    
    if (searchData.files && searchData.files.length > 0) {
      spreadsheetId = searchData.files[0].id;
    } else {
      // Create new spreadsheet
      const createResponse = await fetch(
        'https://sheets.googleapis.com/v4/spreadsheets',
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            properties: {
              title: spreadsheetTitle,
            },
            sheets: [
              {
                properties: {
                  title: 'Rides',
                },
              },
            ],
          }),
        }
      );
      const createData = await createResponse.json();
      spreadsheetId = createData.spreadsheetId;
      
      // Add headers
      await fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/A1:K1`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            values: [[
              'Ride ID',
              'Created Date',
              'Rider Email',
              'Driver Email',
              'Pickup Address',
              'Dropoff Address',
              'Distance (km)',
              'Fare',
              'Surge Multiplier',
              'Payment Method',
              'Rider Rating',
              'Rider Comment',
              'Status'
            ]],
          }),
        }
      );
    }

    // Get the ride data from the trigger payload
    const body = await req.json();
    const rideId = body.data?.id;
    
    if (!rideId) {
      return Response.json({ error: 'No ride ID provided' }, { status: 400 });
    }

    // Fetch complete ride data
    const ride = await base44.asServiceRole.entities.Ride.get(rideId);
    
    if (!ride || ride.status !== 'completed') {
      return Response.json({ error: 'Ride not found or not completed' }, { status: 400 });
    }

    // Append ride data to sheet
    const appendResponse = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/A:K:append`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          values: [[
            ride.id || '',
            ride.created_date || '',
            ride.rider_email || '',
            ride.driver_email || '',
            ride.pickup_address || '',
            ride.dropoff_address || '',
            ride.distance_km || '',
            ride.fare || '',
            ride.surge_multiplier || '',
            ride.payment_method || '',
            ride.rider_rating || '',
            ride.rider_comment || '',
            ride.status || ''
          ]],
          valueInputOption: 'USER_ENTERED',
        }),
      }
    );

    const appendData = await appendResponse.json();
    
    return Response.json({ 
      success: true, 
      spreadsheetId,
      updatedRange: appendData.updates?.updatedRange 
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});