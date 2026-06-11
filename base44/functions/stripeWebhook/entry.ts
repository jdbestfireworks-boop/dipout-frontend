import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import Stripe from 'npm:stripe@14.0.0';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        
        // Verify Stripe signature
        const signature = req.headers.get('stripe-signature');
        const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
        
        if (!signature || !webhookSecret) {
            console.error('Missing webhook signature or secret');
            return Response.json({ error: 'Missing webhook signature or secret' }, { status: 400 });
        }

        const body = await req.text();
        const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
        
        if (!stripeKey) {
            console.error('Stripe secret key not configured');
            return Response.json({ error: 'Stripe not configured' }, { status: 500 });
        }

        const stripe = new Stripe(stripeKey);
        
        let event;
        try {
            event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
        } catch (err) {
            console.error('Webhook signature verification failed:', err.message);
            return Response.json({ error: 'Invalid signature' }, { status: 400 });
        }

        console.log('Stripe webhook event:', event.type);

        // Handle successful payment
        if (event.type === 'checkout.session.completed') {
            const session = event.data.object;
            const ride_id = session.metadata.ride_id;
            
            if (!ride_id) {
                console.error('No ride_id in webhook metadata');
                return Response.json({ error: 'Missing ride_id' }, { status: 400 });
            }
            
            try {
                // Verify ride exists
                const ride = await base44.asServiceRole.entities.Ride.get(ride_id);
                if (!ride) {
                    console.error('Ride not found:', ride_id);
                    return Response.json({ error: 'Ride not found' }, { status: 404 });
                }
                
                // Update ride payment status
                await base44.asServiceRole.entities.Ride.update(ride_id, {
                    payment_status: 'paid',
                });
                
                console.log(`✓ Payment confirmed for ride ${ride_id}, amount: $${session.amount_total / 100}`);
            } catch (dbError) {
                console.error('Database error updating ride:', dbError.message);
                return Response.json({ error: 'Failed to update ride' }, { status: 500 });
            }
        }

        return Response.json({ received: true });
    } catch (error) {
        console.error('Stripe webhook error:', error.message, error.stack);
        return Response.json({ error: error.message }, { status: 500 });
    }
});