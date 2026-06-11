import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import Stripe from 'npm:stripe@14.0.0';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        const { ride_id, fare } = await req.json();

        if (!ride_id || !fare) {
            return Response.json({ error: 'Ride ID and fare required' }, { status: 400 });
        }

        const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));

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
                        unit_amount: Math.round(fare * 100), // Convert to cents
                    },
                    quantity: 1,
                },
            ],
            mode: 'payment',
            success_url: `${Deno.env.get('BASE44_APP_URL')}/rides?payment=success&ride_id=${ride_id}`,
            cancel_url: `${Deno.env.get('BASE44_APP_URL')}/rides?payment=cancelled&ride_id=${ride_id}`,
            metadata: {
                base44_app_id: Deno.env.get('BASE44_APP_ID'),
                ride_id: ride_id,
            },
        });

        return Response.json({ 
            success: true, 
            url: session.url,
            session_id: session.id 
        });
    } catch (error) {
        console.error('Stripe checkout error:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});