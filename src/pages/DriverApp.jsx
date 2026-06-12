import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Car, MapPin, Navigation, ExternalLink, Banknote, CreditCard, Clock, XCircle, ArrowLeft, Bell, Phone } from 'lucide-react';
import DriverOnboarding from '@/components/driver/DriverOnboarding';
import DriverAlertBanner from '@/components/driver/DriverAlertBanner';
import DriverWalkthrough from '@/components/driver/DriverWalkthrough';
import RideRequestModal from '@/components/driver/RideRequestModal';
import RideChat from '@/components/ride/RideChat';
import ActiveTripCard from '@/components/driver/ActiveTripCard';
import RideRequestCard from '@/components/driver/RideRequestCard';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { isInLouisiana, haversineMiles } from '@/lib/geo';

import { useNavigate } from 'react-router-dom';

// Preload notification sound
const notificationSound = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
notificationSound.preload = 'auto';

function mapsLink(address) {
  const encoded = encodeURIComponent(address);
  return `https://maps.google.com/?q=${encoded}`;
}

function dirLink(from, to) {
  return `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(from)}&destination=${encodeURIComponent(to)}`;
}

export default function DriverApp() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [requests, setRequests] = useState([]);
  const [activeRide, setActiveRide] = useState(null);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [locationPermission, setLocationPermission] = useState('prompt');
  const [notificationPermission, setNotificationPermission] = useState('default');

  // Request browser notification permission on mount
  useEffect(() => {
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission);
      if (Notification.permission === 'default') {
        Notification.requestPermission().then(permission => {
          setNotificationPermission(permission);
          if (permission === 'granted') {
            toast.success('Notifications enabled - you\'ll get alerts for new rides!');
          }
        });
      }
    }
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const me = await base44.auth.me();
        setUser(me);
        const existing = await base44.entities.DriverProfile.filter({ user_email: me.email });
        if (existing.length) setProfile(existing[0]);
        const myRides = await base44.entities.Ride.filter({ driver_email: me.email }, '-created_date', 5);
        const current = myRides.find((r) => ['accepted', 'in_progress'].includes(r.status));
        if (current) setActiveRide(current);
      } catch (error) {
        console.error('Driver app init error:', error);
        toast.error('Failed to load driver profile');
      }
    })();
  }, []);

  // GPS Location tracking - works on Android & iPhone
  useEffect(() => {
    if (!profile || profile.status === 'offline') return;

    let watchId = null;
    let lastUpdate = 0;
    const UPDATE_INTERVAL = 5000; // Only update every 5 seconds to avoid rate limits

    const startTracking = () => {
      if ('geolocation' in navigator) {
        watchId = navigator.geolocation.watchPosition(
          async (position) => {
            const now = Date.now();
            if (now - lastUpdate < UPDATE_INTERVAL) return; // Throttle updates
            lastUpdate = now;

            const { latitude: lat, longitude: lng } = position.coords;
            // Update driver location in database
            await base44.entities.DriverProfile.update(profile.id, { lat, lng });
            setProfile((prev) => prev ? { ...prev, lat, lng } : null);
            
            // Auto-complete based on GPS proximity
            if (activeRide) {
              // Check if near pickup (for accepted rides)
              if (activeRide.status === 'accepted' && activeRide.pickup_lat && activeRide.pickup_lng) {
                const distToPickup = haversineMiles(lat, lng, activeRide.pickup_lat, activeRide.pickup_lng);
                if (distToPickup < 0.1) { // Within 0.1 miles (~160m)
                  await startTrip();
                  toast.success('Auto-detected: Rider picked up!');
                }
              }
              // Check if near dropoff (for in_progress rides)
              if (activeRide.status === 'in_progress' && activeRide.dropoff_lat && activeRide.dropoff_lng) {
                const distToDropoff = haversineMiles(lat, lng, activeRide.dropoff_lat, activeRide.dropoff_lng);
                if (distToDropoff < 0.1) { // Within 0.1 miles (~160m)
                  await completeTrip();
                  toast.success('Auto-detected: Trip completed!');
                }
              }
            }
          },
          (error) => {
            console.error('GPS error:', error);
            setLocationPermission('denied');
          },
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0,
          }
        );
        setLocationPermission('granted');
      }
    };

    startTracking();

    return () => {
      if (watchId !== null) {
        navigator.geolocation.clearWatch(watchId);
      }
    };
  }, [profile?.id, profile?.status, activeRide?.id, activeRide?.status]);

  // Subscribe to ride requests + active ride updates
  useEffect(() => {
    if (!profile) return;
    loadRequests();
    const unsubscribe = base44.entities.Ride.subscribe((event) => {
      if (event.type === 'create' && event.data.status === 'requested') {
        // Filter out rides this driver already declined
        const declinedBy = event.data.declined_by || [];
        if (!declinedBy.includes(user.email)) {
          setRequests((prev) => [event.data, ...prev.filter((r) => r.id !== event.id)]);
          // Auto-show modal for new requests when online and no active ride
          if (profile.status !== 'offline' && !activeRide && !selectedRequest) {
            // Play notification sound
            notificationSound.currentTime = 0;
            notificationSound.play().catch(() => console.log('Audio autoplay blocked'));
            
            setSelectedRequest(event.data);
            // Show browser notification
            if ('Notification' in window && Notification.permission === 'granted') {
              new Notification('🔔 New Ride Request!', {
                body: `$${((event.data.fare || 0) * 0.8).toFixed(2)} earnings - ${event.data.distance_km || 0} mi`,
                icon: 'https://media.base44.com/images/public/6a2adf5a7f92459340d0efc2/925d1fd18_generated_image.png',
                tag: `ride-${event.id}`,
              });
            }
          }
        }
      }
      if (event.type === 'update') {
        setRequests((prev) => prev.filter((r) => r.id !== event.id || event.data.status === 'requested'));

        // 🔔 Toast + sound when THIS driver is assigned a ride
        if (
          event.data?.status === 'accepted' &&
          event.data?.driver_email === user?.email &&
          !activeRide
        ) {
          notificationSound.currentTime = 0;
          notificationSound.play().catch(() => {});
          toast.success(
            `🚗 Ride assigned! Head to ${event.data.pickup_address}`,
            { duration: 6000, description: `Fare: $${((event.data.fare || 0) * 0.8).toFixed(2)} · ${event.data.distance_km || 0} mi` }
          );
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('🚗 Ride Assigned!', {
              body: `Pickup: ${event.data.pickup_address}\nEarnings: $${((event.data.fare || 0) * 0.8).toFixed(2)}`,
              icon: 'https://media.base44.com/images/public/6a2adf5a7f92459340d0efc2/925d1fd18_generated_image.png',
              tag: `assigned-${event.id}`,
            });
          }
        }

        setActiveRide((prev) =>
          prev && prev.id === event.id
            ? event.data.status === 'cancelled' ? null : event.data
            : prev
        );
      }
    });
    return unsubscribe;
  }, [profile?.id, profile?.status, activeRide, selectedRequest, user?.email]);

  // Auto-show first request when driver goes online or page loads
  useEffect(() => {
    if (!profile || profile.status === 'offline' || activeRide || selectedRequest || requests.length === 0) return;
    
    // Auto-show the most recent request
    const mostRecent = requests[0];
    setSelectedRequest(mostRecent);
    
    // Play notification sound
    notificationSound.currentTime = 0;
    notificationSound.play().catch(() => console.log('Audio autoplay blocked'));
  }, [profile?.status, requests.length]);

  const loadRequests = async () => {
    const reqs = await base44.entities.Ride.filter({ status: 'requested' }, '-created_date', 20);
    // Filter out rides this driver already declined
    const filtered = reqs.filter(r => !(r.declined_by || []).includes(user.email));
    setRequests(filtered);
  };

  const toggleOnline = async (online) => {
    if (online) {
      // Go online immediately — attempt to get GPS in background but don't block
      await base44.entities.DriverProfile.update(profile.id, { status: 'available' });
      setProfile((prev) => ({ ...prev, status: 'available' }));
      toast.success("You're now online!");

      // Try to grab GPS silently in background
      if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const { latitude: lat, longitude: lng } = position.coords;
            await base44.entities.DriverProfile.update(profile.id, { lat, lng });
            setProfile((prev) => ({ ...prev, lat, lng }));
            setLocationPermission('granted');
          },
          (error) => {
            console.error('GPS error:', error);
            setLocationPermission('denied');
          },
          { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
        );
      }
    } else {
      await base44.entities.DriverProfile.update(profile.id, { status: 'offline' });
      setProfile((prev) => ({ ...prev, status: 'offline' }));
      toast.info("You're now offline");
    }
  };

  const acceptRide = async (ride) => {
    try {
      await base44.entities.Ride.update(ride.id, {
        status: 'accepted',
        driver_email: user.email,
      });
      await base44.entities.DriverProfile.update(profile.id, { status: 'busy' });
      setProfile({ ...profile, status: 'busy' });
      setActiveRide({ ...ride, status: 'accepted', driver_email: user.email });
      setRequests((prev) => prev.filter((r) => r.id !== ride.id));
      setSelectedRequest(null);
      toast.success('Ride accepted — navigate to pickup location');
    } catch (error) {
      console.error('Accept ride error:', error);
      toast.error('Failed to accept ride. Another driver may have taken it.');
      setSelectedRequest(null);
      loadRequests();
    }
  };

  const declineRide = async () => {
    if (!selectedRequest?.id) {
      toast.error('No ride selected');
      setSelectedRequest(null);
      return;
    }
    try {
      const result = await base44.functions.invoke('declineRide', { ride_id: selectedRequest.id });
      setRequests((prev) => prev.filter((r) => r.id !== selectedRequest?.id));
      setSelectedRequest(null);
      if (result.data?.notified_driver) {
        toast.info(`Ride declined - offered to driver ${result.data.distance}mi away`);
      } else {
        toast.info('Ride declined');
      }
    } catch (error) {
      console.error('Decline error:', error);
      toast.error('Failed to decline ride');
      setRequests((prev) => prev.filter((r) => r.id !== selectedRequest?.id));
      setSelectedRequest(null);
    }
  };

  const startTrip = async () => {
    try {
      await base44.entities.Ride.update(activeRide.id, { status: 'in_progress' });
      setActiveRide({ ...activeRide, status: 'in_progress' });
      toast.success('Trip started - head to drop-off location');
    } catch (error) {
      console.error('Start trip error:', error);
      toast.error('Failed to start trip');
    }
  };

  const completeTrip = async () => {
    try {
      await base44.entities.Ride.update(activeRide.id, { status: 'completed' });
      const earned = (activeRide.fare || 0) * 0.8;
      await base44.entities.DriverProfile.update(profile.id, {
        status: 'available',
        total_earnings: (profile.total_earnings || 0) + earned,
        trips_completed: (profile.trips_completed || 0) + 1,
      });
      setProfile({
        ...profile,
        status: 'available',
        total_earnings: (profile.total_earnings || 0) + earned,
        trips_completed: (profile.trips_completed || 0) + 1,
      });
      toast.success(`Trip complete — you earned $${earned.toFixed(2)}`);
      setActiveRide(null);
      setRequests([]); // Clear requests after completion
    } catch (error) {
      console.error('Complete trip error:', error);
      toast.error('Failed to complete trip');
    }
  };

  // Allow rider to mark trip as complete (for cash payments or if driver unavailable)
  const riderCompleteTrip = async () => {
    if (!activeRide) return;
    try {
      await base44.entities.Ride.update(activeRide.id, { status: 'completed' });
      toast.success('Trip marked as complete');
      setActiveRide(null);
    } catch (error) {
      console.error('Complete trip error:', error);
      toast.error('Failed to complete trip');
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-full pt-32">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!profile) {
    return <DriverOnboarding user={user} onComplete={(p) => setProfile(p)} />;
  }

  if (!profile.approved) {
    return (
      <div className="flex flex-col items-center justify-center h-full pt-32 px-6 text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-accent flex items-center justify-center">
          <Loader2 className="w-7 h-7 text-muted-foreground animate-spin" />
        </div>
        <h2 className="text-xl font-display font-bold">Application under review</h2>
        <p className="text-sm text-muted-foreground max-w-xs">
          Your driver application has been submitted. An admin needs to approve your account before you can start driving.
        </p>
        <p className="text-xs text-muted-foreground">We'll update you once you're approved.</p>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 pt-8 pb-20 space-y-5">
      {/* Onboarding walkthrough for newly approved drivers */}
      <DriverWalkthrough />

      {/* Alert banner */}
      <DriverAlertBanner driverEmail={user?.email} />

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="h-10 w-10 shrink-0 rounded-xl">
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-display font-bold">Driver Hub</h1>
            <p className="text-xs text-muted-foreground mt-0.5">{profile.vehicle} · {profile.plate}</p>
          </div>
        </div>
      </div>

      {/* Online/Offline Status Card - Production Ready */}
      <motion.div 
        initial={{ scale: 0.98, opacity: 0 }}
        animate={{ 
          scale: 1, 
          opacity: 1,
          boxShadow: profile.status !== 'offline' ? '0 0 30px -5px rgba(34,197,94,0.3)' : '0 1px 3px rgba(0,0,0,0.1)'
        }}
        transition={{ duration: 0.3 }}
        className={`p-6 rounded-3xl border-2 transition-all duration-500 ${
          profile.status !== 'offline' 
            ? 'bg-green-500/10 border-green-500/50' 
            : 'bg-card border-border'
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className={`w-4 h-4 rounded-full ${profile.status === 'offline' ? 'bg-gray-500' : 'bg-green-500 animate-pulse'}`}></div>
              {profile.status !== 'offline' && (
                <div className="absolute inset-0 w-4 h-4 rounded-full bg-green-500 animate-ping opacity-75"></div>
              )}
            </div>
            <div>
              <h3 className="text-xl font-bold font-display">
                {profile.status === 'offline' ? 'Ready to drive?' : 'You are Online'}
              </h3>
              <p className="text-sm text-muted-foreground mt-0.5">
                {profile.status === 'offline' 
                  ? 'Go online to start receiving ride requests' 
                  : 'You are currently visible to nearby riders'}
              </p>
            </div>
          </div>
          <Button 
            size="lg"
            disabled={!!activeRide}
            className={`rounded-full px-8 font-bold text-sm shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
              profile.status !== 'offline' 
                ? 'bg-red-500 hover:bg-red-600 shadow-red-500/30' 
                : 'bg-green-500 hover:bg-green-600 shadow-green-500/30'
            }`}
            onClick={() => toggleOnline(profile.status === 'offline')}
          >
            {profile.status === 'offline' ? 'GO ONLINE' : 'GO OFFLINE'}
          </Button>
        </div>
      </motion.div>

      {/* Status indicators */}
      {profile.status !== 'offline' && (
        <div className="flex items-center gap-4 text-xs">
          {locationPermission === 'granted' && (
            <span className="text-green-500 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-green-500"></span>
              GPS active
            </span>
          )}
          {locationPermission === 'denied' && (
            <span className="text-destructive flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-destructive"></span>
              GPS denied
            </span>
          )}
          {notificationPermission === 'granted' && (
            <span className="text-green-500 flex items-center gap-1">
              <Bell className="w-3 h-3" />
              Notifications on
            </span>
          )}
          {notificationPermission === 'denied' && (
            <button
              onClick={() => {
                Notification.requestPermission().then(permission => {
                  setNotificationPermission(permission);
                  if (permission === 'granted') {
                    toast.success('Notifications enabled!');
                  }
                });
              }}
              className="text-muted-foreground flex items-center gap-1 hover:text-primary hover:underline cursor-pointer"
            >
              <Bell className="w-3 h-3" /> Notifications blocked
            </button>
          )}
        </div>
      )}

      <AnimatePresence mode="wait">
        {activeRide ? (
          <motion.div 
            key="active" 
            initial={{ opacity: 0, y: 8 }} 
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
          >
            <ActiveTripCard
              ride={activeRide}
              user={user}
              onStartTrip={startTrip}
              onCompleteTrip={completeTrip}
            />
          </motion.div>
        ) : (
          <motion.div 
            key="requests" 
            initial={{ opacity: 0, y: 8 }} 
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="space-y-3"
          >
            <h2 className="font-semibold text-lg">Ride requests</h2>
            {profile.status === 'offline' ? (
              <div className="bg-card rounded-2xl border border-border p-8 text-center">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                  <Car className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-bold">You're offline</h3>
                <p className="text-sm text-muted-foreground mt-2">Toggle online above to start receiving ride requests</p>
              </div>
            ) : requests.length === 0 ? (
              <div className="bg-card rounded-2xl border border-border p-8 text-center">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Car className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-lg font-bold">No rides available</h3>
                <p className="text-sm text-muted-foreground mt-2">Stay online - you'll see requests here when riders book</p>
              </div>
            ) : (
              <div className="space-y-3">
                {requests.map((r) => (
                  <RideRequestCard
                    key={r.id}
                    ride={r}
                    user={user}
                    onSelect={() => setSelectedRequest(r)}
                  />
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Ride request popup modal with sound */}
      <AnimatePresence>
        {selectedRequest && (
          <RideRequestModal
            ride={selectedRequest}
            onAccept={() => acceptRide(selectedRequest)}
            onDecline={declineRide}
          />
        )}
      </AnimatePresence>
    </div>
  );
}