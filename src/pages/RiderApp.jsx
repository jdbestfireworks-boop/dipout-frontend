import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Navigation, Loader2, CreditCard, Banknote, CheckCircle2, X, ExternalLink, Car, Flag, Star, Phone, MapPinned, MapPinOff } from 'lucide-react';
import AddressAutocomplete from '@/components/rider/AddressAutocomplete';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import PostRideScreen from '@/components/rider/PostRideScreen';
import RideChat from '@/components/ride/RideChat';
import { haversineMiles, isInLouisiana, checkLouisianaAddress } from '@/lib/geo';
import { useNavigate } from 'react-router-dom';
import { getDynamicFare } from '@/lib/pricing';
import EmptyState from '@/components/ui/empty-state';

function DriverContactCard({ ride, myEmail, user, onToggleGps, gpsEnabled }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-muted-foreground text-xs mb-1">Your driver</p>
          <p className="font-medium">{ride.driver_email}</p>
          {ride.driver_phone && (
            <p className="text-xs text-muted-foreground">Phone: {ride.driver_phone}</p>
          )}
        </div>
        <button
          onClick={onToggleGps}
          className={`p-2 rounded-full transition-colors ${
            gpsEnabled ? 'bg-green-500/10 text-green-500' : 'bg-gray-500/10 text-gray-500'
          }`}
          title={gpsEnabled ? 'GPS is on' : 'GPS is off'}
        >
          {gpsEnabled ? <MapPinned className="w-5 h-5" /> : <MapPinOff className="w-5 h-5" />}
        </button>
      </div>
      <div className="flex items-center gap-2 text-xs">
        <span className={gpsEnabled ? 'text-green-500' : 'text-gray-500'}>
          {gpsEnabled ? '● Location sharing on' : '○ Location sharing off'}
        </span>
      </div>
      <RideChat
        ride={ride}
        myEmail={myEmail}
        myRole="rider"
        otherEmail={ride.driver_email}
        driverPhone={ride.driver_phone}
        riderPhone={user?.phone_number}
      />
    </div>
  );
}

function TripMilestones({ status }) {
  const milestones = [
    { 
      id: 'requested', 
      label: 'Request Sent', 
      icon: Flag,
      description: 'Looking for a driver'
    },
    { 
      id: 'accepted', 
      label: 'Driver Arrived', 
      icon: Car,
      description: 'Driver is on the way'
    },
    { 
      id: 'in_progress', 
      label: 'Trip In Progress', 
      icon: Navigation,
      description: 'Heading to destination'
    },
    { 
      id: 'completed', 
      label: 'Trip Completed', 
      icon: Star,
      description: 'Journey complete'
    },
  ];

  const getStatusIndex = (status) => milestones.findIndex(m => m.id === status);
  const currentIndex = getStatusIndex(status);

  return (
    <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Trip Progress</h3>
      <div className="relative">
        {/* Progress line */}
        <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-border">
          <div 
            className="bg-primary transition-all duration-500"
            style={{ 
              height: `${Math.min(100, (currentIndex / (milestones.length - 1)) * 100)}%`,
              width: '100%'
            }}
          />
        </div>
        
        {/* Milestone nodes */}
        <div className="space-y-6 relative">
          {milestones.map((milestone, index) => {
            const Icon = milestone.icon;
            const isActive = index === currentIndex;
            const isCompleted = index < currentIndex;
            const isPending = index > currentIndex;

            return (
              <div key={milestone.id} className="flex items-start gap-4">
                <div
                  className={`
                    relative z-10 w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all duration-300
                    ${isActive ? 'bg-primary border-primary text-primary-foreground scale-110 shadow-lg shadow-primary/30' : ''}
                    ${isCompleted ? 'bg-primary border-primary text-primary-foreground' : ''}
                    ${isPending ? 'bg-background border-border text-muted-foreground' : ''}
                  `}
                >
                  <Icon className="w-5 h-5" />
                  {isCompleted && !isActive && (
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full flex items-center justify-center">
                      <CheckCircle2 className="w-3 h-3 text-white" />
                    </div>
                  )}
                </div>
                <div className="flex-1 pt-1">
                  <p className={`font-semibold text-sm ${isActive || isCompleted ? 'text-foreground' : 'text-muted-foreground'}`}>
                    {milestone.label}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">{milestone.description}</p>
                  {isActive && (
                    <div className="flex items-center gap-2 mt-2">
                      <Loader2 className="w-3 h-3 animate-spin text-primary" />
                      <span className="text-xs text-primary font-medium">Current step</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
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
  const [loading, setLoading] = useState(true);
  const [pickupAddress, setPickupAddress] = useState('');
  const [pickupCoords, setPickupCoords] = useState(null);
  const [dropoffAddress, setDropoffAddress] = useState('');
  const [dropoffCoords, setDropoffCoords] = useState(null);
  const [distanceKm, setDistanceKm] = useState(0);
  const [quote, setQuote] = useState(null);
  const [quoting, setQuoting] = useState(false);
  const [ride, setRide] = useState(null);
  const [payMethod, setPayMethod] = useState(null);
  const [isRequesting, setIsRequesting] = useState(false);
  const [gpsEnabled, setGpsEnabled] = useState(true);
  const [gpsWatchId, setGpsWatchId] = useState(null);

  // Resume an active ride
  useEffect(() => {
    (async () => {
      try {
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
      } catch (error) {
        console.error('Error loading ride:', error);
      } finally {
        setLoading(false);
      }
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

  // GPS tracking for rider (when enabled)
  useEffect(() => {
    if (!gpsEnabled || !ride || !['accepted', 'in_progress'].includes(ride.status)) return;

    let watchId = null;
    const updateInterval = 10000; // Update every 10 seconds
    let lastUpdate = 0;

    const startTracking = () => {
      if ('geolocation' in navigator) {
        watchId = navigator.geolocation.watchPosition(
          async (position) => {
            const now = Date.now();
            if (now - lastUpdate < updateInterval) return;
            lastUpdate = now;

            const { latitude: lat, longitude: lng } = position.coords;
            try {
              await base44.entities.Ride.update(ride.id, {
                rider_lat: lat,
                rider_lng: lng,
              });
            } catch (error) {
              console.error('Failed to update rider location:', error);
            }
          },
          (error) => {
            console.error('GPS error:', error);
            if (error.code === 1) {
              toast.error('Location permission denied');
              setGpsEnabled(false);
            }
          },
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0,
          }
        );
        setGpsWatchId(watchId);
      }
    };

    startTracking();

    return () => {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [gpsEnabled, ride?.id, ride?.status]);

  const getQuote = async () => {
    if (!pickupAddress.trim() || !dropoffAddress.trim()) {
      toast.error('Enter both pickup and destination addresses');
      return;
    }
    if (!pickupCoords || !dropoffCoords) {
      toast.error('Please select valid addresses from the suggestions');
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
      let miles = 5;
      if (pickupCoords && dropoffCoords) {
        miles = haversineMiles(pickupCoords.lat, pickupCoords.lng, dropoffCoords.lat, dropoffCoords.lng);
        miles = Math.max(miles, 0.5);
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
    if (!pickupCoords || !dropoffCoords) {
      toast.error('Please select valid addresses from the suggestions');
      return;
    }
    setIsRequesting(true);
    try {
      const me = user || await base44.auth.me();
      
      // Validate phone number exists
      if (!me?.phone_number || !me.phone_number.trim()) {
        toast.error('Please add your phone number in Notification Settings first');
        navigate('/notifications');
        setIsRequesting(false);
        return;
      }
      
      const created = await base44.entities.Ride.create({
        rider_email: me.email,
        rider_phone: me.phone_number,
        pickup_address: pickupAddress,
        dropoff_address: dropoffAddress,
        pickup_lat: pickupCoords.lat,
        pickup_lng: pickupCoords.lng,
        dropoff_lat: dropoffCoords.lat,
        dropoff_lng: dropoffCoords.lng,
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
    // Clear GPS tracking
    if (gpsWatchId !== null) {
      navigator.geolocation.clearWatch(gpsWatchId);
      setGpsWatchId(null);
    }
  };

  const toggleGps = async () => {
    if (!gpsEnabled) {
      if ('geolocation' in navigator) {
        try {
          const permission = await navigator.permissions.query({ name: 'geolocation' });
          if (permission.state === 'denied') {
            toast.error('GPS permission denied. Please enable in browser settings.');
            return;
          }
          setGpsEnabled(true);
          toast.success('GPS tracking enabled');
        } catch (error) {
          toast.error('Failed to enable GPS');
        }
      }
    } else {
      if (gpsWatchId !== null) {
        navigator.geolocation.clearWatch(gpsWatchId);
        setGpsWatchId(null);
      }
      setGpsEnabled(false);
      toast.info('GPS tracking disabled');
    }
  };

  const riderCompleteTrip = async () => {
    if (!ride) return;
    await base44.entities.Ride.update(ride.id, { status: 'completed' });
    toast.success('Trip completed');
    setRide({ ...ride, status: 'completed' });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

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
              {ride.status !== 'cancelled' && (
                <TripMilestones status={ride.status} />
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

              {/* Driver info with GPS toggle */}
              {ride.driver_email && ride.status !== 'completed' && (
                <div className="space-y-3">
                  {/* GPS Toggle */}
                  <div className="rounded-2xl border border-border bg-card p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${gpsEnabled ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
                      <div>
                        <p className="text-sm font-medium">GPS Tracking</p>
                        <p className="text-xs text-muted-foreground">
                          {gpsEnabled ? 'Driver can see your location' : 'Location sharing off'}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={toggleGps}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        gpsEnabled ? 'bg-primary' : 'bg-gray-400'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          gpsEnabled ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>

                  <DriverContactCard 
                    ride={ride} 
                    myEmail={user?.email}
                    user={user}
                    onToggleGps={toggleGps}
                    gpsEnabled={gpsEnabled}
                  />
                </div>
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