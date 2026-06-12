import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import Stripe from 'npm:stripe@14.0.0';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const { ride_id, amount, fare } = await req.json();

        // Validate inputs - support both 'amount' and 'fare' parameter names
        const fareAmount = amount || fare;
        if (!ride_id || !fareAmount) {
            console.error('Missing required fields:', { ride_id, amount: fareAmount });
            return Response.json({ error: 'Ride ID and fare required' }, { status: 400 });
        }

        if (fareAmount <= 0 || fareAmount > 10000) {
            console.error('Invalid fare amount:', fareAmount);
            return Response.json({ error: 'Invalid fare amount' }, { status: 400 });
        }

        // Verify Stripe keys are configured
        const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
        if (!stripeKey) {
            console.error('Stripe secret key not configured');
            return Response.json({ error: 'Payment system not configured' }, { status: 500 });
        }

        const stripe = new Stripe(stripeKey);

        // Use BASE44_APP_URL if available, otherwise construct from app ID
        // BASE44_APP_URL is optional - we fallback to app ID or default domain
        const baseUrl = Deno.env.get('BASE44_APP_URL');
        const appId = Deno.env.get('BASE44_APP_ID');
        let appUrl = baseUrl || (appId ? `https://${appId}.base44.com` : 'https://app.base44.com');
        
        // Ensure appUrl has a scheme and no trailing slash
        if (!appUrl.startsWith('http://') && !appUrl.startsWith('https://')) {
            appUrl = 'https://' + appUrl;
        }
        appUrl = appUrl.replace(/\/$/, '');
        
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [
                {
                    price_data: {
                        currency: 'usd',
                        product_data: {
                            name: 'Dip Out Ride',
                            description: 'Ride-sharing service',
                        },
                        unit_amount: Math.round(fareAmount * 100),
                    },
                    quantity: 1,
                },
            ],
            mode: 'payment',
            success_url: `${appUrl}/rider?payment=success`,
            cancel_url: `${appUrl}/rider?payment=cancelled`,
            metadata: {
                base44_app_id: appId,
                ride_data: req.body.ride_data || '',
            },
        });

        console.log('Stripe checkout created:', session.id, 'for ride:', ride_id);

        return Response.json({ 
            success: true, 
            url: session.url,
            session_id: session.id 
        });
    } catch (error) {
        console.error('Stripe checkout error:', error.message, error.stack);
        return Response.json({ error: 'Payment processing failed. Please try again.' }, { status: 500 });
    }
});