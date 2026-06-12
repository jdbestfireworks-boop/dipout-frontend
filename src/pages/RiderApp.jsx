import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Navigation, Loader2, CreditCard, CheckCircle2, X, ExternalLink, Car, Flag, Star, Phone, MapPinned, MapPinOff, AlertTriangle, Bell, Sun, Moon } from 'lucide-react';
import AddressAutocomplete from '@/components/rider/AddressAutocomplete';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import PostRideScreen from '@/components/rider/PostRideScreen';
import RideChat from '@/components/ride/RideChat';
import { haversineMiles, isInLouisiana, checkLouisianaAddress } from '@/lib/geo';
import { useNavigate } from 'react-router-dom';
import { getDynamicFare } from '@/lib/pricing';
import EmptyState from '@/components/ui/empty-state';
import RideBookingForm from '@/components/rider/RideBookingForm';
import ActiveRideCard from '@/components/rider/ActiveRideCard';
import TripProgress from '@/components/rider/TripProgress';
import NotificationPermissionBanner from '@/components/notifications/NotificationPermissionBanner';

const statusLabels = {
  requested: 'Finding your driver…',
  accepted: 'Driver is on the way',
  in_progress: 'Trip in progress',
  completed: 'Trip completed',
  cancelled: 'Trip cancelled',
};

function mapsLink(address) {
  const encoded = encodeURIComponent(address);
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
  
  const [isRequesting, setIsRequesting] = useState(false);
  const [gpsEnabled, setGpsEnabled] = useState(true);
  const [gpsWatchId, setGpsWatchId] = useState(null);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [cancellationFee, setCancellationFee] = useState(0);
  const [notificationPermission, setNotificationPermission] = useState('default');
  const [gettingLocation, setGettingLocation] = useState(false);
  const [stops, setStops] = useState([]);
  const [darkMode, setDarkMode] = useState(true);

  // Theme toggle effect
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  // Auto-detect pickup location from GPS on mount
  useEffect(() => {
    if ('geolocation' in navigator && !pickupCoords) {
      setGettingLocation(true);
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude: lat, longitude: lng } = position.coords;
          try {
            // Reverse geocode to get address
            const response = await base44.functions.invoke('getAddressDetails', {
              lat,
              lng
            });
            if (response.data && response.data.address) {
              setPickupAddress(response.data.address);
              setPickupCoords({ lat, lng });
              toast.success('Pickup location detected');
            }
          } catch (error) {
            console.error('Geocoding error:', error);
            // Still set coords even if address lookup fails
            setPickupCoords({ lat, lng });
            setPickupAddress(`${lat.toFixed(6)}, ${lng.toFixed(6)}`);
          } finally {
            setGettingLocation(false);
          }
        },
        (error) => {
          console.error('GPS error:', error);
          setGettingLocation(false);
          if (error.code === 1) {
            toast.info('Enable location to auto-fill pickup');
          }
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      );
    }
  }, []);

  // Request notification permission
  useEffect(() => {
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission);
      if (Notification.permission === 'default') {
        Notification.requestPermission().then(permission => {
          setNotificationPermission(permission);
          if (permission === 'granted') {
            toast.success('Notifications enabled - you\'ll receive ride updates!');
          }
        });
      }
    }
  }, []);

  // Handle payment success and create ride after Stripe checkout
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const paymentStatus = urlParams.get('payment');
    
    if (paymentStatus === 'success') {
      // Clear the URL params
      window.history.replaceState({}, document.title, '/rider');
      
      // Check if we have pending ride data in localStorage
      const pendingData = window.localStorage.getItem('pending_ride_data');
      if (pendingData) {
        try {
          const rideData = JSON.parse(pendingData);
          window.localStorage.removeItem('pending_ride_data');
          
          // Create the ride after successful payment
          base44.functions.invoke('completeBookingAfterPayment', { ride_data: rideData })
            .then((response) => {
              if (response.data?.success) {
                toast.success('Ride booked successfully! Finding your driver...');
                // Load the newly created ride
                base44.entities.Ride.get(response.data.ride_id).then((ride) => {
                  setRide(ride);
                });
              } else {
                toast.error('Failed to create ride. Please contact support.');
              }
            })
            .catch((error) => {
              console.error('Booking error:', error);
              toast.error('Failed to complete booking. Please contact support.');
            });
        } catch (error) {
          console.error('Parse error:', error);
          toast.error('Failed to process ride data');
        }
      }
    } else if (paymentStatus === 'cancelled') {
      window.history.replaceState({}, document.title, '/rider');
      toast.info('Payment cancelled');
    }
  }, []);

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
          ['requested', 'accepted', 'in_progress'].includes(r.status)
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
      if (event.id === ride.id && event.type === 'update') {
        setRide(event.data);
        // Show notification when driver is assigned
        if (event.data.status === 'accepted' && event.data.driver_email && ride.status === 'requested') {
          toast.success('🚗 Driver found!', {
            description: `Your driver is on the way to ${event.data.pickup_address}`,
            duration: 5000
          });
        }
        // Show notification when ride is cancelled due to no drivers
        if (event.data.status === 'cancelled' && ride.status === 'requested') {
          toast.error('No drivers available', {
            description: 'Your ride was cancelled. Please try again later.',
            duration: 6000
          });
        }
      }
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
      // Calculate total distance including stops
      let miles = 0;
      if (pickupCoords && dropoffCoords) {
        // Calculate distance from pickup to first stop, between stops, and last stop to dropoff
        let prevCoords = pickupCoords;
        const allPoints = [...stops, { lat: dropoffCoords.lat, lng: dropoffCoords.lng }];
        
        for (const point of allPoints) {
          miles += haversineMiles(prevCoords.lat, prevCoords.lng, point.lat, point.lng);
          prevCoords = point;
        }
        miles = Math.max(miles, 0.5);
      } else {
        miles = 5;
      }
      
      const q = await getDynamicFare({
        distanceMiles: miles,
        pickupAddress,
        dropoffAddress,
        stops,
      });
      setQuote(q);
      setDistanceKm(miles);
      toast.success('Fare calculated!');
    } catch (error) {
      console.error('Fare calculation error:', error);
      toast.error('Failed to calculate fare. Please try again.');
    } finally {
      setQuoting(false);
    }
  };

  const requestRide = async (paymentMethod = 'cash') => {
    if (!quote) { toast.error('Please get a fare quote first'); return; }
    if (!pickupCoords || !dropoffCoords) {
      toast.error('Please select valid addresses from the suggestions');
      return;
    }
    setIsRequesting(true);
    try {
      const me = user || await base44.auth.me();
      
      const rideData = {
        rider_email: me.email,
        rider_phone: me.phone_number,
        pickup_address: pickupAddress,
        dropoff_address: dropoffAddress,
        pickup_lat: pickupCoords.lat,
        pickup_lng: pickupCoords.lng,
        dropoff_lat: dropoffCoords.lat,
        dropoff_lng: dropoffCoords.lng,
        distance_km: Math.round(distanceKm * 10) / 10,
        base_fare: quote.baseFare,
        surge_multiplier: quote.surgeMultiplier,
        fare: quote.fare,
        ai_pricing_reason: quote.reason,
        stops: stops,
        payment_method: paymentMethod,
      };
      
      if (paymentMethod === 'card') {
        // Card payment - redirect to Stripe
        window.localStorage.setItem('pending_ride_data', JSON.stringify(rideData));
        
        const response = await base44.functions.invoke('createStripeCheckout', {
          fare: quote.fare,
          ride_data: JSON.stringify(rideData),
        });

        if (response.data?.success && response.data.url) {
          if (window.self !== window.top) {
            toast.info('Payment opened in new tab - complete payment to book your ride');
            window.open(response.data.url, '_blank');
          } else {
            window.location.href = response.data.url;
          }
        } else {
          throw new Error('Failed to create checkout session');
        }
      } else {
        // Cash payment - create ride directly
        const response = await base44.functions.invoke('completeBookingAfterPayment', { 
          ride_data: { ...rideData, payment_status: 'unpaid' } 
        });
        
        if (response.data?.success) {
          toast.success('Ride booked with cash! Finding your driver...');
          const newRide = await base44.entities.Ride.get(response.data.ride_id);
          setRide(newRide);
        } else {
          throw new Error('Failed to create ride');
        }
      }
    } catch (error) {
      console.error('Ride request error:', error);
      toast.error('Failed to book ride. Please try again.');
      setIsRequesting(false);
    }
  };

  const cancelRide = async () => {
    try {
      // Calculate cancellation fee based on ride status
      const fee = ride.status === 'accepted' ? 5.0 : 0;
      
      await base44.entities.Ride.update(ride.id, {
        status: 'cancelled',
        cancellation_fee: fee,
        cancelled_at: new Date().toISOString(),
      });
      
      if (fee > 0) {
        toast.info(`Cancellation fee of $${fee.toFixed(2)} charged`);
      } else {
        toast.success('Ride cancelled');
      }
      
      resetAll();
      setShowCancelConfirm(false);
    } catch (error) {
      console.error('Cancel ride error:', error);
      toast.error('Failed to cancel ride');
    }
  };

  const initiateCancel = () => {
    // Calculate fee based on status
    const fee = ride.status === 'accepted' ? 5.0 : 0;
    setCancellationFee(fee);
    setShowCancelConfirm(true);
  };

  const resetAll = () => {
    setRide(null);
    setPickupAddress('');
    setPickupCoords(null);
    setDropoffAddress('');
    setDropoffCoords(null);
    setQuote(null);
    setDistanceKm(0);
    
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

  const setDropoffFromGps = async () => {
    if ('geolocation' in navigator) {
      setGettingLocation(true);
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude: lat, longitude: lng } = position.coords;
          try {
            const response = await base44.functions.invoke('getAddressDetails', {
              lat,
              lng
            });
            if (response.data && response.data.address) {
              setDropoffAddress(response.data.address);
              setDropoffCoords({ lat, lng });
              toast.success('Dropoff location set from GPS');
            }
          } catch (error) {
            console.error('Geocoding error:', error);
            setDropoffCoords({ lat, lng });
            setDropoffAddress(`${lat.toFixed(6)}, ${lng.toFixed(6)}`);
          } finally {
            setGettingLocation(false);
          }
        },
        (error) => {
          console.error('GPS error:', error);
          setGettingLocation(false);
          toast.error('Failed to get location');
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      );
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
      <div className="max-w-lg mx-auto px-4 pt-4 pb-20 sm:pt-6">
        {/* Notification Permission Banner */}
        <NotificationPermissionBanner 
          permission={notificationPermission}
          onGrant={() => {
            setNotificationPermission('granted');
            toast.success('Notifications enabled! You\'ll receive ride status updates.');
          }}
        />

        {/* Header with Theme Toggle */}
        {!ride && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-5 sm:mb-8"
          >
            <div className="flex items-center justify-between mb-2">
              <motion.h1 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-3xl sm:text-4xl font-display font-bold tracking-tight bg-gradient-to-r from-primary via-primary/90 to-primary/70 bg-clip-text text-transparent"
              >
                Where to?
              </motion.h1>
              <motion.button
                whileHover={{ scale: 1.08, rotate: 8 }}
                whileTap={{ scale: 0.92 }}
                onClick={() => setDarkMode(!darkMode)}
                className="p-3 rounded-2xl bg-gradient-to-br from-card/80 to-card/40 backdrop-blur-xl border border-white/10 hover:border-primary/40 transition-all shadow-xl hover:shadow-primary/20"
                title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                {darkMode ? (
                  <Sun className="w-5 h-5 text-primary" />
                ) : (
                  <Moon className="w-5 h-5 text-muted-foreground" />
                )}
              </motion.button>
            </div>
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="text-sm text-muted-foreground/80 font-light tracking-wide"
            >
              Book a ride in Louisiana with instant AI pricing
            </motion.p>
          </motion.div>
        )}

        {/* Notification Permission Banner */}
        {!ride && notificationPermission !== 'granted' && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-3 sm:mb-4"
          >
            <div className="bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 rounded-2xl p-3 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-lg">
              <div className="flex items-start sm:items-center gap-3">
                <motion.div 
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center shrink-0"
                >
                  <Bell className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                </motion.div>
                <div>
                  <h3 className="font-semibold text-xs sm:text-sm text-primary">Enable Ride Notifications</h3>
                  <p className="text-[10px] sm:text-xs text-muted-foreground mt-0.5">Get instant alerts for driver arrival and trip updates</p>
                </div>
              </div>
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button 
                  size="sm" 
                  onClick={() => {
                    if ('Notification' in window) {
                      window.Notification.requestPermission().then(permission => {
                        setNotificationPermission(permission);
                        if (permission === 'granted') {
                          toast.success('Notifications enabled!');
                        }
                      });
                    }
                  }}
                  className="bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary/80 text-primary-foreground text-xs px-4 h-8 w-full sm:w-auto shadow-md"
                >
                  Enable
                </Button>
              </motion.div>
            </div>
          </motion.div>
        )}

        <AnimatePresence mode="wait">
          {!ride ? (
            <motion.div 
              key="booking" 
              initial={{ opacity: 0, y: 8 }} 
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
            >
              <RideBookingForm
                pickupAddress={pickupAddress}
                setPickupAddress={setPickupAddress}
                pickupCoords={pickupCoords}
                setPickupCoords={setPickupCoords}
                dropoffAddress={dropoffAddress}
                setDropoffAddress={setDropoffAddress}
                dropoffCoords={dropoffCoords}
                setDropoffCoords={setDropoffCoords}
                quote={quote}
                setQuote={setQuote}
                distanceKm={distanceKm}
                setDistanceKm={setDistanceKm}
                quoting={quoting}
                isRequesting={isRequesting}
                onGetQuote={getQuote}
                onRequestRide={requestRide}
                onSetDropoffGps={setDropoffFromGps}
                gettingLocation={gettingLocation}
                stops={stops}
                setStops={setStops}
              />
            </motion.div>
          ) : (
            <motion.div 
              key="active" 
              initial={{ opacity: 0, y: 8 }} 
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="space-y-4"
            >
              {ride.status !== 'cancelled' && (
                <TripProgress status={ride.status} />
              )}

              {ride.status === 'cancelled' && (
                <div className="bg-card rounded-2xl border border-border p-6 text-center space-y-4">
                  <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
                    <X className="w-8 h-8 text-destructive" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold">Ride Cancelled</h3>
                    <p className="text-sm text-muted-foreground mt-1">Your ride has been cancelled</p>
                    {ride.cancellation_fee > 0 && (
                      <p className="text-xs text-destructive mt-2 font-medium">
                        Cancellation fee: ${ride.cancellation_fee.toFixed(2)}
                      </p>
                    )}
                  </div>
                  <Button onClick={resetAll} variant="outline" className="w-full">
                    Book a new ride
                  </Button>
                </div>
              )}

              <ActiveRideCard
                ride={ride}
                user={user}
                gpsEnabled={gpsEnabled}
                onToggleGps={toggleGps}
                onCancelRide={cancelRide}
                onCompleteTrip={riderCompleteTrip}
                onBookNewRide={resetAll}
                onInitiateCancel={initiateCancel}
              />

              {ride.status === 'completed' && ride.payment_status === 'unpaid' && (
                <PostRideScreen ride={ride} onDone={resetAll} />
              )}

              {ride.status === 'completed' && ride.payment_status === 'paid' && (
                <div className="flex items-center gap-2 text-primary font-medium justify-center py-3 rounded-xl bg-primary/5 border border-primary/20">
                  <CheckCircle2 className="w-5 h-5" /> 
                  <span>Paid - Thanks for riding with Dip Out!</span>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Cancellation Confirmation Dialog */}
        {showCancelConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
            onClick={() => setShowCancelConfirm(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="rounded-2xl border border-border bg-card p-6 max-w-sm w-full shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-destructive" />
                </div>
                <div>
                  <h3 className="text-lg font-bold">Cancel Ride?</h3>
                  <p className="text-xs text-muted-foreground">This action cannot be undone</p>
                </div>
              </div>
              
              {cancellationFee > 0 && (
                <div className="mb-4 p-4 rounded-xl bg-destructive/5 border border-destructive/20">
                  <p className="text-sm text-destructive font-semibold">
                    Cancellation Fee: ${cancellationFee.toFixed(2)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    This fee will be charged because your driver has already accepted the ride.
                  </p>
                </div>
              )}
              
              <p className="text-sm text-muted-foreground mb-6">
                {ride.status === 'requested' 
                  ? 'Are you sure you want to cancel this ride request?'
                  : 'Are you sure you want to cancel this ride?'}
              </p>
              
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowCancelConfirm(false)}
                >
                  Keep Ride
                </Button>
                <Button
                  variant="destructive"
                  className="flex-1"
                  onClick={cancelRide}
                >
                  Yes, Cancel
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </div>
    </div>
  );
}