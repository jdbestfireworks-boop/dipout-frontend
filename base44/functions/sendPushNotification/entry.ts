import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Verify user is authenticated
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { title, message, data, player_ids } = await req.json();

    if (!title || !message) {
      return Response.json({ error: 'Title and message are required' }, { status: 400 });
    }

    const appId = Deno.env.get('ONESIGNAL_APP_ID');
    const apiKey = Deno.env.get('ONESIGNAL_API_KEY');

    if (!appId || !apiKey) {
      return Response.json({ error: 'OneSignal not configured' }, { status: 500 });
    }

    // Prepare notification payload
    const notification = {
      app_id: appId,
      contents: { en: message },
      headings: { en: title },
      include_aliases: {
        external_id: player_ids || [user.email]
      },
      data: data || {},
    };

    // Send to OneSignal API
    const response = await fetch('https://onesignal.com/api/v1/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${apiKey}`,
      },
      body: JSON.stringify(notification),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('OneSignal API error:', error);
      return Response.json({ error: 'Failed to send notification', details: error }, { status: 500 });
    }

    const result = await response.json();
    console.log('Notification sent:', result);

    return Response.json({ success: true, id: result.id });
  } catch (error) {
    console.error('Send notification error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});