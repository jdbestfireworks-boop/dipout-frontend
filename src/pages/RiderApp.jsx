import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { MapPin, Navigation, Loader2, CreditCard, CheckCircle2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import RideMap from '@/components/RideMap';
import FareCard from '@/components/rider/FareCard';
import { haversineKm } from '@/lib/geo';
import { getDynamicFare } from '@/lib/pricing';

const statusLabels = {
  requested: 'Finding your driver…',
  accepted: 'Driver is on the way',
  in_progress: 'Trip in progress',
  completed: 'Trip completed',
  cancelled: 'Trip cancelled',
};

export default function RiderApp() {
  const [pickup, setPickup] = useState(null);
  const [dropoff, setDropoff] = useState(null);
  const [pickupAddress, setPickupAddress] = useState('');
  const [dropoffAddress, setDropoffAddress] = useState('');
  const [quote, setQuote] = useState(null);
  const [quoting, setQuoting] = useState(false);
  const [ride, setRide] = useState(null);

  // Resume an active ride
  useEffect(() => {
    (async () => {
      const user = await base44.auth.me();
      const active = await base44.entities.Ride.filter(
        { rider_email: user.email },
        '-created_date',
        5
      );
      const current = active.find((r) =>
        ['requested', 'accepted', 'in_progress'].includes(r.status) ||
        (r.status === 'completed' && r.payment_status === 'unpaid')
      );
      if (current) setRide(current);
    })();
  }, []);

  // Live updates on the active ride
  useEffect(() => {
    if (!ride) return;
    const unsubscribe = base44.entities.Ride.subscribe((event) => {
      if (event.id === ride.id && event.type === 'update') setRide(event.data);
    });
    return unsubscribe;
  }, [ride?.id]);

  const distanceKm =
    pickup && dropoff ? haversineKm(pickup.lat, pickup.lng, dropoff.lat, dropoff.lng) : 0;

  const handleMapClick = (latlng) => {
    if (ride) return;
    if (!pickup) {
      setPickup(latlng);
    } else if (!dropoff) {
      setDropoff(latlng);
    }
    setQuote(null);
  };

  const getQuote = async () => {
    setQuoting(true);
    const q = await getDynamicFare({
      distanceKm,
      pickupAddress: pickupAddress || `${pickup.lat.toFixed(4)}, ${pickup.lng.toFixed(4)}`,
      dropoffAddress: dropoffAddress || `${dropoff.lat.toFixed(4)}, ${dropoff.lng.toFixed(4)}`,
    });
    setQuote(q);
    setQuoting(false);
  };

  const requestRide = async () => {
    const user = await base44.auth.me();
    const created = await base44.entities.Ride.create({
      rider_email: user.email,
      pickup_address: pickupAddress || 'Pinned location',
      dropoff_address: dropoffAddress || 'Pinned location',
      pickup_lat: pickup.lat,
      pickup_lng: pickup.lng,
      dropoff_lat: dropoff.lat,
      dropoff_lng: dropoff.lng,
      status: 'requested',
      distance_km: Math.round(distanceKm * 10) / 10,
      base_fare: quote.baseFare,
      surge_multiplier: quote.surgeMultiplier,
      fare: quote.fare,
      ai_pricing_reason: quote.reason,
      payment_status: 'unpaid',
    });
    setRide(created);
    toast.success('Ride requested');
  };

  const cancelRide = async () => {
    await base44.entities.Ride.update(ride.id, { status: 'cancelled' });
    resetAll();
  };

  const payRide = async () => {
    await base44.entities.Ride.update(ride.id, { payment_status: 'paid' });
    toast.success(`Payment of $${ride.fare.toFixed(2)} confirmed`);
    resetAll();
  };

  const resetAll = () => {
    setRide(null);
    setPickup(null);
    setDropoff(null);
    setQuote(null);
    setPickupAddress('');
    setDropoffAddress('');
  };

  const driverPos =
    ride && ride.driver_lat != null ? { lat: ride.driver_lat, lng: ride.driver_lng } : null;

  return (
    <div className="absolute inset-0 flex flex-col md:flex-row">
      <div className="flex-1 min-h-[45vh] relative z-0">
        <RideMap
          pickup={ride ? { lat: ride.pickup_lat, lng: ride.pickup_lng } : pickup}
          dropoff={ride ? { lat: ride.dropoff_lat, lng: ride.dropoff_lng } : dropoff}
          driver={driverPos}
          onMapClick={handleMapClick}
        />
        {!ride && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[1000] bg-card/90 backdrop-blur px-4 py-1.5 rounded-full text-xs text-muted-foreground border border-border">
            {!pickup ? 'Tap the map to set your pickup' : !dropoff ? 'Tap to set your destination' : 'Route set'}
          </div>
        )}
      </div>

      <div className="w-full md:w-[400px] border-t md:border-t-0 md:border-l border-border bg-card p-5 space-y-4 overflow-y-auto">
        <AnimatePresence mode="wait">
          {!ride ? (
            <motion.div key="book" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              <h1 className="text-2xl font-display font-bold">Where to?</h1>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-primary shrink-0" />
                  <Input
                    placeholder="Pickup label (optional)"
                    value={pickupAddress}
                    onChange={(e) => setPickupAddress(e.target.value)}
                    disabled={!pickup}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Navigation className="w-4 h-4 text-muted-foreground shrink-0" />
                  <Input
                    placeholder="Destination label (optional)"
                    value={dropoffAddress}
                    onChange={(e) => setDropoffAddress(e.target.value)}
                    disabled={!dropoff}
                  />
                </div>
              </div>

              {pickup && dropoff && !quote && (
                <Button onClick={getQuote} disabled={quoting} className="w-full h-12 rounded-xl font-semibold">
                  {quoting ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Analyzing traffic & demand…</>
                  ) : (
                    'Get AI fare quote'
                  )}
                </Button>
              )}

              <FareCard quote={quote} distanceKm={distanceKm} />

              {quote && (
                <Button onClick={requestRide} className="w-full h-12 rounded-xl font-semibold">
                  Request ride · ${quote.fare.toFixed(2)}
                </Button>
              )}

              {(pickup || dropoff) && (
                <Button variant="ghost" onClick={resetAll} className="w-full text-muted-foreground">
                  <X className="w-4 h-4 mr-1" /> Clear route
                </Button>
              )}
            </motion.div>
          ) : (
            <motion.div key="trip" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              <div className="flex items-center justify-between">
                <h1 className="text-xl font-display font-bold">{statusLabels[ride.status]}</h1>
                <Badge variant="outline" className="capitalize">{ride.status.replace('_', ' ')}</Badge>
              </div>

              {ride.status === 'requested' && (
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin text-primary" />
                  Matching you with a nearby driver…
                </div>
              )}

              {ride.driver_email && ride.status !== 'completed' && (
                <div className="rounded-xl border border-border p-3 text-sm">
                  <p className="text-muted-foreground">Your driver</p>
                  <p className="font-medium">{ride.driver_email}</p>
                </div>
              )}

              <div className="rounded-xl border border-border p-3 text-sm space-y-1">
                <p><span className="text-muted-foreground">From:</span> {ride.pickup_address}</p>
                <p><span className="text-muted-foreground">To:</span> {ride.dropoff_address}</p>
                <p><span className="text-muted-foreground">Fare:</span> <span className="font-semibold">${ride.fare?.toFixed(2)}</span> ({ride.surge_multiplier}x)</p>
              </div>

              {ride.status === 'completed' && ride.payment_status === 'unpaid' && (
                <Button onClick={payRide} className="w-full h-12 rounded-xl font-semibold">
                  <CreditCard className="w-4 h-4 mr-2" /> Pay ${ride.fare?.toFixed(2)}
                </Button>
              )}

              {ride.status === 'completed' && ride.payment_status === 'paid' && (
                <div className="flex items-center gap-2 text-primary font-medium">
                  <CheckCircle2 className="w-5 h-5" /> Paid — thanks for riding!
                </div>
              )}

              {['requested', 'accepted'].includes(ride.status) && (
                <Button variant="ghost" onClick={cancelRide} className="w-full text-destructive">
                  Cancel ride
                </Button>
              )}

              {['cancelled'].includes(ride.status) && (
                <Button variant="outline" onClick={resetAll} className="w-full">
                  Book a new ride
                </Button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}