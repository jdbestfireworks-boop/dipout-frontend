import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import Stripe from 'npm:stripe@14.0.0';

Deno.serve(async (req) => {
    try {
        const base44 = createClientFromRequest(req);
        
        // Verify Stripe signature
        const signature = req.headers.get('stripe-signature');
        const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
        
        if (!signature || !webhookSecret) {
            return Response.json({ error: 'Missing webhook signature or secret' }, { status: 400 });
        }

        const body = await req.text();
        const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));
        
        let event;
        try {
            event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
        } catch (err) {
            console.error('Webhook signature verification failed:', err.message);
            return Response.json({ error: 'Invalid signature' }, { status: 400 });
        }

        // Handle successful payment
        if (event.type === 'checkout.session.completed') {
            const session = event.data.object;
            const ride_id = session.metadata.ride_id;
            
            if (ride_id) {
                // Update ride payment status
                await base44.asServiceRole.entities.Ride.update(ride_id, {
                    payment_status: 'paid',
                });
                
                console.log(`Payment confirmed for ride ${ride_id}`);
            }
        }

        return Response.json({ received: true });
    } catch (error) {
        console.error('Stripe webhook error:', error);
        return Response.json({ error: error.message }, { status: 500 });
    }
});