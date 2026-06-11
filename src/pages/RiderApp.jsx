import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Navigation, Loader2, CreditCard, Banknote, CheckCircle2, X, ExternalLink, Phone } from 'lucide-react';
import AddressAutocomplete from '@/components/rider/AddressAutocomplete';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';


import PostRideScreen from '@/components/rider/PostRideScreen';
import RideChat from '@/components/ride/RideChat';
import { haversineMiles, isInLouisiana, checkLouisianaAddress } from '@/lib/geo';
import { useNavigate } from 'react-router-dom';
import { getDynamicFare } from '@/lib/pricing';
import EmptyState from '@/components/ui/empty-state';

function DriverContactCard({ ride, myEmail }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
      <div>
        <p className="text-muted-foreground text-xs mb-1">Your driver</p>
        <p className="font-medium">{ride.driver_email}</p>
      </div>
      <RideChat
        ride={ride}
        myEmail={myEmail}
        myRole="rider"
        otherEmail={ride.driver_email}
      />
    </div>
  );
}

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
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [pickupAddress, setPickupAddress] = useState('');
  const [pickupCoords, setPickupCoords] = useState(null);
  const [dropoffAddress, setDropoffAddress] = useState('');
  const [dropoffCoords, setDropoffCoords] = useState(null);
  const [distanceKm, setDistanceKm] = useState(0);
  const [quote, setQuote] = useState(null);
  const [quoting, setQuoting] = useState(false);
  const [ride, setRide] = useState(null);
  const [payMethod, setPayMethod] = useState(null); // 'card' | 'cash'

  const [isRequesting, setIsRequesting] = useState(false);

  // Resume an active ride
  useEffect(() => {
    (async () => {
      const me = await base44.auth.me();
      setUser(me);
      const active = await base44.entities.Ride.filter(
        { rider_email: me.email },
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
    // Check if addresses are in Louisiana
    if (!checkLouisianaAddress(pickupAddress) || !checkLouisianaAddress(dropoffAddress)) {
      toast.error('Dip Out is only available in Louisiana');
      return;
    }
    // If coords available, verify they're in Louisiana bounds
    if (pickupCoords && dropoffCoords) {
      if (!isInLouisiana(pickupCoords.lat, pickupCoords.lng) || !isInLouisiana(dropoffCoords.lat, dropoffCoords.lng)) {
        toast.error('Dip Out is only available in Louisiana');
        return;
      }
    }
    setQuoting(true);
    try {
      // Calculate real distance if both coords known, otherwise fall back to 5 miles
      let miles = distanceKm > 0 ? distanceKm : 5;
      if (pickupCoords && dropoffCoords) {
        miles = haversineMiles(pickupCoords.lat, pickupCoords.lng, dropoffCoords.lat, dropoffCoords.lng);
        miles = Math.max(miles, 0.5);
        setDistanceKm(miles);
      }
      const q = await getDynamicFare({
        distanceMiles: miles,
        pickupAddress,
        dropoffAddress,
      });
      setQuote(q);
      setDistanceKm(miles);
    } catch (error) {
      console.error('Fare calculation error:', error);
      toast.error('Failed to calculate fare. Please try again.');
    } finally {
      setQuoting(false);
    }
  };

  const requestRide = async () => {
    if (!payMethod) { toast.error('Choose a payment method'); return; }
    if (!quote) { toast.error('Please get a fare quote first'); return; }
    setIsRequesting(true);
    try {
      const me = user || await base44.auth.me();
      
      // Validate phone number exists
      if (!me.phone_number || !me.phone_number.trim()) {
        toast.error('Please add your phone number in Notification Settings first');
        navigate('/notifications');
        return;
      }
      
      const created = await base44.entities.Ride.create({
        rider_email: me.email,
        rider_phone: me.phone_number,
        pickup_address: pickupAddress,
        dropoff_address: dropoffAddress,
        pickup_lat: pickupCoords?.lat || 0,
        pickup_lng: pickupCoords?.lng || 0,
        dropoff_lat: dropoffCoords?.lat || 0,
        dropoff_lng: dropoffCoords?.lng || 0,
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
      toast.success('Ride requested! Waiting for driver acceptance...');
    } catch (error) {
      console.error('Ride request error:', error);
      toast.error('Failed to request ride. Please try again.');
    } finally {
      setIsRequesting(false);
    }
  };

  const cancelRide = async () => {
    await base44.entities.Ride.update(ride.id, { status: 'cancelled' });
    resetAll();
  };

  const resetAll = () => {
    setRide(null);
    setPickupAddress('');
    setPickupCoords(null);
    setDropoffAddress('');
    setDropoffCoords(null);
    setQuote(null);
    setDistanceKm(0);
    setPayMethod(null);
  };

  const riderCompleteTrip = async () => {
    if (!ride) return;
    await base44.entities.Ride.update(ride.id, { status: 'completed' });
    toast.success('Trip completed');
    setRide({ ...ride, status: 'completed' });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-lg mx-auto px-4 pt-8 pb-20 space-y-6">


        {/* Header */}
        {!ride && (
          <div>
            <h1 className="text-3xl font-display font-bold">Where to?</h1>
            <p className="text-sm text-muted-foreground mt-1">Enter your pickup and drop-off to get an AI fare estimate.</p>
          </div>
        )}

        <AnimatePresence mode="wait">
          {!ride ? (
            <motion.div key="book" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">

              {/* Addresses */}
              <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
                <AddressAutocomplete
                  placeholder="Pickup address"
                  value={pickupAddress}
                  onChange={(val, coords) => { setPickupAddress(val); setPickupCoords(coords); setQuote(null); }}
                  icon={<MapPin className="w-4 h-4 text-primary" />}
                />
                <AddressAutocomplete
                  placeholder="Destination"
                  value={dropoffAddress}
                  onChange={(val, coords) => { setDropoffAddress(val); setDropoffCoords(coords); setQuote(null); }}
                  icon={<Navigation className="w-4 h-4 text-muted-foreground" />}
                />
              </div>

              {/* Get quote */}
              {!quote && (
                <Button
                  onClick={getQuote}
                  disabled={quoting || !pickupAddress || !dropoffAddress}
                  className="w-full h-12 rounded-xl font-semibold"
                >
                  {quoting ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Getting fare…</>
                  ) : (
                    'Get Fare'
                  )}
                </Button>
              )}

              {/* Fare card */}
              {quote && (
                <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Distance</span>
                    <span className="font-medium">{distanceKm.toFixed(1)} mi</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Fare</span>
                    <span className="text-2xl font-bold text-primary">${quote.fare.toFixed(2)}</span>
                  </div>
                  {quote.surgeMultiplier > 1 && (
                    <div className="text-xs text-muted-foreground pt-2 border-t border-border">
                      Surge pricing active ({quote.surgeMultiplier}x) due to high demand
                    </div>
                  )}
                </div>
              )}

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
                <Button 
                  onClick={requestRide} 
                  disabled={isRequesting}
                  className="w-full h-12 rounded-xl font-semibold"
                >
                  {isRequesting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Requesting…</> : `Request Ride ($${quote.fare.toFixed(2)})`}
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
                  Matching you with a driver…
                </div>
              )}

              {ride.status === 'cancelled' && (
                <EmptyState
                  icon={X}
                  title="Ride Cancelled"
                  description="Your ride has been cancelled. Book a new ride whenever you're ready."
                />
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

              {/* Fare */}
              <div className="rounded-2xl border border-border bg-card p-4 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Fare</span>
                  <span className="font-bold text-lg">${ride.fare?.toFixed(2)}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1 capitalize">Payment: {ride.payment_method}</p>
              </div>

              {/* Driver info */}
              {ride.driver_email && ride.status !== 'completed' && (
                <DriverContactCard ride={ride} myEmail={user?.email} />
              )}

              {/* Post-ride rating + payment */}
              {ride.status === 'completed' && ride.payment_status === 'unpaid' && (
                <PostRideScreen ride={ride} onDone={resetAll} />
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

              {ride.status === 'in_progress' && (
                <Button variant="outline" onClick={riderCompleteTrip} className="w-full">
                  Mark as completed
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