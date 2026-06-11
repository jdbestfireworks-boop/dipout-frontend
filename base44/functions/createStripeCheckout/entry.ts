import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import Stripe from 'npm:stripe@14.0.0';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const { ride_id, fare } = await req.json();

        // Validate inputs
        if (!ride_id || !fare) {
            console.error('Missing required fields:', { ride_id, fare });
            return Response.json({ error: 'Ride ID and fare required' }, { status: 400 });
        }

        if (fare <= 0 || fare > 10000) {
            console.error('Invalid fare amount:', fare);
            return Response.json({ error: 'Invalid fare amount' }, { status: 400 });
        }

        // Verify Stripe keys are configured
        const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
        if (!stripeKey) {
            console.error('Stripe secret key not configured');
            return Response.json({ error: 'Payment system not configured' }, { status: 500 });
        }

        const stripe = new Stripe(stripeKey);

        const appUrl = Deno.env.get('BASE44_APP_URL') || 'https://app.base44.com';
        
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
                        unit_amount: Math.round(fare * 100),
                    },
                    quantity: 1,
                },
            ],
            mode: 'payment',
            success_url: `${appUrl}/rides?payment=success&ride_id=${ride_id}`,
            cancel_url: `${appUrl}/rides?payment=cancelled&ride_id=${ride_id}`,
            metadata: {
                base44_app_id: Deno.env.get('BASE44_APP_ID'),
                ride_id: ride_id,
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