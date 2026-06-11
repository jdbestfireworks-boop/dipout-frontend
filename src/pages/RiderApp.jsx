import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { MapPin, Navigation, Loader2, CreditCard, Banknote, CheckCircle2, X, ExternalLink, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
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

function mapsLink(address) {
  const encoded = encodeURIComponent(address);
  // Universal link — opens Apple Maps on iOS, Google Maps on Android
  return `https://maps.google.com/?q=${encoded}`;
}

export default function RiderApp() {
  const [pickupAddress, setPickupAddress] = useState('');
  const [dropoffAddress, setDropoffAddress] = useState('');
  const [distanceKm, setDistanceKm] = useState(0);
  const [quote, setQuote] = useState(null);
  const [quoting, setQuoting] = useState(false);
  const [ride, setRide] = useState(null);
  const [payMethod, setPayMethod] = useState(null); // 'card' | 'cash'

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

  const getQuote = async () => {
    if (!pickupAddress.trim() || !dropoffAddress.trim()) {
      toast.error('Enter both pickup and destination addresses');
      return;
    }
    setQuoting(true);
    // Estimate ~5 km default if we can't geocode — AI pricing still works off addresses
    const km = distanceKm > 0 ? distanceKm : 5;
    const q = await getDynamicFare({
      distanceKm: km,
      pickupAddress,
      dropoffAddress,
    });
    setQuote(q);
    setDistanceKm(km);
    setQuoting(false);
  };

  const requestRide = async () => {
    if (!payMethod) { toast.error('Choose a payment method'); return; }
    const user = await base44.auth.me();
    const created = await base44.entities.Ride.create({
      rider_email: user.email,
      pickup_address: pickupAddress,
      dropoff_address: dropoffAddress,
      pickup_lat: 0,
      pickup_lng: 0,
      dropoff_lat: 0,
      dropoff_lng: 0,
      status: 'requested',
      distance_km: Math.round(distanceKm * 10) / 10,
      base_fare: quote.baseFare,
      surge_multiplier: quote.surgeMultiplier,
      fare: quote.fare,
      ai_pricing_reason: quote.reason,
      payment_status: 'unpaid',
      payment_method: payMethod,
    });
    setRide(created);
    toast.success('Ride requested — finding your driver');
  };

  const cancelRide = async () => {
    await base44.entities.Ride.update(ride.id, { status: 'cancelled' });
    resetAll();
  };

  const confirmPayment = async () => {
    await base44.entities.Ride.update(ride.id, { payment_status: 'paid' });
    toast.success(`Payment confirmed — thanks for riding with Dip Out!`);
    resetAll();
  };

  const resetAll = () => {
    setRide(null);
    setPickupAddress('');
    setDropoffAddress('');
    setQuote(null);
    setDistanceKm(0);
    setPayMethod(null);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-lg mx-auto px-4 pt-8 pb-20 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-display font-bold">Where to?</h1>
          <p className="text-sm text-muted-foreground mt-1">Enter your pickup and drop-off to get an AI fare estimate.</p>
        </div>

        <AnimatePresence mode="wait">
          {!ride ? (
            <motion.div key="book" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">

              {/* Addresses */}
              <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shrink-0">
                    <MapPin className="w-4 h-4 text-primary-foreground" />
                  </div>
                  <Input
                    placeholder="Pickup address"
                    value={pickupAddress}
                    onChange={(e) => { setPickupAddress(e.target.value); setQuote(null); }}
                    className="border-0 bg-transparent p-0 h-auto text-base focus-visible:ring-0 shadow-none"
                  />
                </div>
                <div className="border-t border-border ml-4" />
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-secondary border border-border flex items-center justify-center shrink-0">
                    <Navigation className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <Input
                    placeholder="Destination address"
                    value={dropoffAddress}
                    onChange={(e) => { setDropoffAddress(e.target.value); setQuote(null); }}
                    className="border-0 bg-transparent p-0 h-auto text-base focus-visible:ring-0 shadow-none"
                  />
                </div>
              </div>

              {/* Get quote */}
              {!quote && (
                <Button
                  onClick={getQuote}
                  disabled={quoting || !pickupAddress || !dropoffAddress}
                  className="w-full h-12 rounded-xl font-semibold"
                >
                  {quoting ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Analyzing traffic & demand…</>
                  ) : (
                    <><Sparkles className="w-4 h-4 mr-2" /> Get AI fare quote</>
                  )}
                </Button>
              )}

              {/* Fare card */}
              <FareCard quote={quote} distanceKm={distanceKm} />

              {/* Payment method */}
              {quote && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground uppercase tracking-widest">Payment method</p>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setPayMethod('card')}
                      className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all ${
                        payMethod === 'card'
                          ? 'border-primary bg-primary/10'
                          : 'border-border bg-card hover:border-primary/50'
                      }`}
                    >
                      <CreditCard className={`w-6 h-6 ${payMethod === 'card' ? 'text-primary' : 'text-muted-foreground'}`} />
                      <span className={`font-semibold text-sm ${payMethod === 'card' ? 'text-primary' : ''}`}>Card</span>
                    </button>
                    <button
                      onClick={() => setPayMethod('cash')}
                      className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all ${
                        payMethod === 'cash'
                          ? 'border-primary bg-primary/10'
                          : 'border-border bg-card hover:border-primary/50'
                      }`}
                    >
                      <Banknote className={`w-6 h-6 ${payMethod === 'cash' ? 'text-primary' : 'text-muted-foreground'}`} />
                      <span className={`font-semibold text-sm ${payMethod === 'cash' ? 'text-primary' : ''}`}>Cash</span>
                    </button>
                  </div>
                </div>
              )}

              {quote && payMethod && (
                <Button onClick={requestRide} className="w-full h-12 rounded-xl font-semibold">
                  Request ride · ${quote.fare.toFixed(2)} · {payMethod === 'card' ? 'Card' : 'Cash'}
                </Button>
              )}

              {quote && (
                <Button variant="ghost" onClick={resetAll} className="w-full text-muted-foreground">
                  <X className="w-4 h-4 mr-1" /> Clear
                </Button>
              )}
            </motion.div>
          ) : (
            <motion.div key="trip" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-display font-bold">{statusLabels[ride.status]}</h2>
                <Badge variant="outline" className="capitalize">{ride.status.replace('_', ' ')}</Badge>
              </div>

              {ride.status === 'requested' && (
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin text-primary" />
                  Matching you with a nearby driver…
                </div>
              )}

              {/* Trip details */}
              <div className="rounded-2xl border border-border bg-card p-4 space-y-3 text-sm">
                <div className="flex items-start gap-3">
                  <MapPin className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                  <div className="flex-1">
                    <p className="text-muted-foreground text-xs">Pickup</p>
                    <p className="font-medium">{ride.pickup_address}</p>
                    <a
                      href={mapsLink(ride.pickup_address)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-primary mt-1 hover:underline"
                    >
                      Open in Maps <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
                <div className="border-t border-border" />
                <div className="flex items-start gap-3">
                  <Navigation className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                  <div className="flex-1">
                    <p className="text-muted-foreground text-xs">Drop-off</p>
                    <p className="font-medium">{ride.dropoff_address}</p>
                    <a
                      href={mapsLink(ride.dropoff_address)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-primary mt-1 hover:underline"
                    >
                      Open in Maps <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              </div>

              {/* Fare + payment method */}
              <div className="rounded-2xl border border-border bg-card p-4 flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Fare</span>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-lg">${ride.fare?.toFixed(2)}</span>
                  <Badge variant="outline" className="capitalize">
                    {ride.payment_method === 'cash' ? <><Banknote className="w-3 h-3 mr-1" />Cash</> : <><CreditCard className="w-3 h-3 mr-1" />Card</>}
                  </Badge>
                </div>
              </div>

              {/* Driver info */}
              {ride.driver_email && ride.status !== 'completed' && (
                <div className="rounded-2xl border border-border bg-card p-4 text-sm">
                  <p className="text-muted-foreground text-xs mb-1">Your driver</p>
                  <p className="font-medium">{ride.driver_email}</p>
                </div>
              )}

              {/* Payment confirmation on completion */}
              {ride.status === 'completed' && ride.payment_status === 'unpaid' && (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground text-center">Your trip is complete. Confirm payment below.</p>
                  <Button onClick={confirmPayment} className="w-full h-12 rounded-xl font-semibold">
                    {ride.payment_method === 'cash'
                      ? <><Banknote className="w-4 h-4 mr-2" /> Confirm cash payment · ${ride.fare?.toFixed(2)}</>
                      : <><CreditCard className="w-4 h-4 mr-2" /> Confirm card payment · ${ride.fare?.toFixed(2)}</>
                    }
                  </Button>
                </div>
              )}

              {ride.status === 'completed' && ride.payment_status === 'paid' && (
                <div className="flex items-center gap-2 text-primary font-medium justify-center py-2">
                  <CheckCircle2 className="w-5 h-5" /> Paid — thanks for riding with Dip Out!
                </div>
              )}

              {['requested', 'accepted'].includes(ride.status) && (
                <Button variant="ghost" onClick={cancelRide} className="w-full text-destructive">
                  Cancel ride
                </Button>
              )}

              {ride.status === 'cancelled' && (
                <Button variant="outline" onClick={resetAll} className="w-full">
                  Book a new ride
                </Button>
              )}

              {ride.status === 'completed' && ride.payment_status === 'paid' && (
                <Button variant="outline" onClick={resetAll} className="w-full mt-2">
                  Book another ride
                </Button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}