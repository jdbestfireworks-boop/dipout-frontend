import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Car, ArrowLeft, Bell, DollarSign } from 'lucide-react';
import DriverOnboarding from '@/components/driver/DriverOnboarding';
import DriverAlertBanner from '@/components/driver/DriverAlertBanner';
import DriverWalkthrough from '@/components/driver/DriverWalkthrough';
import DriverQuickActions from '@/components/driver/DriverQuickActions';
import RideRequestModal from '@/components/driver/RideRequestModal';
import ActiveTripCard from '@/components/driver/ActiveTripCard';
import RideRequestCard from '@/components/driver/RideRequestCard';
import NotificationPermissionBanner from '@/components/notifications/NotificationPermissionBanner';
import { Settings, Calendar, MapPin, TrendingUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import DriverSettingsModal from '@/components/driver/DriverSettingsModal';
import DriverScheduleEditor from '@/components/driver/DriverScheduleEditor';
import DriverStopsManager from '@/components/driver/DriverStopsManager';
import DriverPricingManager from '@/components/driver/DriverPricingManager';
import { toast } from 'sonner';
import { haversineMiles } from '@/lib/geo';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Lazy-create audio to avoid module-level crashes (iOS blocks autoplay before user gesture)
let notificationSound = null;
function getSound() {
  if (!notificationSound) {
    notificationSound = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
    notificationSound.preload = 'auto';
  }
  return notificationSound;
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
  const [todayStats, setTodayStats] = useState({ trips: 0, earnings: 0, activeRide: null });
  const [showSettings, setShowSettings] = useState(false);
  const [swipeMode, setSwipeMode] = useState(true);
  const [autoAccept, setAutoAccept] = useState(false);
  const [maxDistance, setMaxDistance] = useState(10);
  const [showHistory, setShowHistory] = useState(false);
  const [tripHistory, setTripHistory] = useState([]);
  const [showSchedule, setShowSchedule] = useState(false);
  const [showStops, setShowStops] = useState(false);
  const [showPricing, setShowPricing] = useState(false);

  // Load driver settings
  useEffect(() => {
    (async () => {
      try {
        const me = await base44.auth.me();
        const profiles = await base44.entities.DriverProfile.filter({ user_email: me.email });
        if (profiles.length > 0) {
          const profile = profiles[0];
          setSwipeMode(profile.swipe_mode ?? true);
          setAutoAccept(profile.auto_accept ?? false);
          setMaxDistance(profile.max_accept_distance ?? 10);
        }
      } catch (error) {
        console.error('Failed to load settings:', error);
      }
    })();
  }, []);

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

        // Calculate today's stats
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const allMyRides = await base44.entities.Ride.filter({ driver_email: me.email }, '-created_date', 100);
        const todayRides = allMyRides.filter(r => {
          const rideDate = new Date(r.created_date);
          return rideDate >= today && r.status === 'completed';
        });
        const todayEarnings = todayRides.reduce((sum, r) => sum + ((r.fare || 0) * 0.8), 0);
        setTodayStats({ trips: todayRides.length, earnings: todayEarnings, activeRide: current });

        // Load trip history (completed and cancelled) - hidden by default
        const history = allMyRides.filter(r => ['completed', 'cancelled'].includes(r.status));
        setTripHistory(history);
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
            getSound().currentTime = 0;
            getSound().play().catch(() => console.log('Audio autoplay blocked'));
            
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
          getSound().currentTime = 0;
          getSound().play().catch(() => {});
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
    getSound().currentTime = 0;
    getSound().play().catch(() => console.log('Audio autoplay blocked'));
  }, [profile?.status, requests.length]);

  const loadRequests = async () => {
    const me = user || await base44.auth.me().catch(() => null);
    if (!me) return;
    const reqs = await base44.entities.Ride.filter({ status: 'requested' }, '-created_date', 20);
    // Filter out rides this driver already declined
    const filtered = reqs.filter(r => !(r.declined_by || []).includes(me.email));
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
      // Update today's stats
      setTodayStats(prev => ({
        ...prev,
        trips: prev.trips + 1,
        earnings: prev.earnings + earned,
        activeRide: null
      }));
      toast.success(`Trip complete — you earned $${earned.toFixed(2)}`);
      setActiveRide(null);
      setRequests([]); // Clear requests after completion
    } catch (error) {
      console.error('Complete trip error:', error);
      toast.error('Failed to complete trip');
    }
  };

  const cancelRide = async () => {
    try {
      await base44.entities.Ride.update(activeRide.id, {
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
      });
      await base44.entities.DriverProfile.update(profile.id, {
        status: 'available',
      });
      setProfile({ ...profile, status: 'available' });
      toast.info('Ride cancelled');
      setActiveRide(null);
      setRequests([]);
    } catch (error) {
      console.error('Cancel ride error:', error);
      toast.error('Failed to cancel ride');
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-background via-background to-accent/5">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
          className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full"
        />
      </div>
    );
  }

  if (!profile) {
    return <DriverOnboarding user={user} onComplete={(p) => setProfile(p)} />;
  }

  if (!profile.approved) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gradient-to-br from-background via-background to-accent/5 px-6 text-center space-y-6">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="w-20 h-20 rounded-full bg-gradient-to-br from-accent/50 to-accent/30 backdrop-blur-xl border border-white/10 flex items-center justify-center shadow-xl"
        >
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </motion.div>
        <div className="space-y-2 max-w-xs">
          <h2 className="text-xl font-display font-bold bg-gradient-to-r from-primary via-primary/90 to-primary/70 bg-clip-text text-transparent">Application under review</h2>
          <p className="text-sm text-muted-foreground/80">
            Your driver application has been submitted. An admin needs to approve your account before you can start driving.
          </p>
          <p className="text-xs text-muted-foreground/60">We'll notify you once you're approved.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-lg mx-auto px-4 py-6 pb-24">
        {/* Header - Clean & Simple */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="h-10 w-10 rounded-xl">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold font-display">{profile.vehicle}</h1>
              <p className="text-xs text-muted-foreground">{profile.plate}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowSettings(true)}
            className="h-10 w-10 rounded-xl"
          >
            <Settings className="w-5 h-5" />
          </Button>
        </div>

        {/* Online Status - Prominent & Clean */}
        <motion.div 
          initial={{ scale: 0.98, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className={`mb-6 p-5 rounded-2xl border-2 transition-all ${
            profile.status !== 'offline' 
              ? 'bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/50' 
              : 'bg-card border-border'
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className={`w-4 h-4 rounded-full ${profile.status === 'offline' ? 'bg-gray-500' : 'bg-green-500 animate-pulse'}`} />
                {profile.status !== 'offline' && (
                  <div className="absolute inset-0 w-4 h-4 rounded-full bg-green-500 animate-ping opacity-75" />
                )}
              </div>
              <div>
                <p className="font-bold text-sm">{profile.status === 'offline' ? 'Offline' : 'Online & Available'}</p>
                <p className="text-xs text-muted-foreground">{profile.status === 'offline' ? 'Tap to go online' : 'Receiving ride requests'}</p>
              </div>
            </div>
            <Button 
              disabled={!!activeRide}
              className={`rounded-full px-6 font-bold text-xs ${
                profile.status !== 'offline' 
                  ? 'bg-red-500 hover:bg-red-600' 
                  : 'bg-green-500 hover:bg-green-600'
              }`}
              onClick={() => toggleOnline(profile.status === 'offline')}
            >
              {profile.status === 'offline' ? 'GO ONLINE' : 'OFFLINE'}
            </Button>
          </div>
        </motion.div>

        {/* Today's Stats - Compact Grid */}
        {!activeRide && (
          <div className="grid grid-cols-2 gap-3 mb-6">
            <motion.div 
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 rounded-2xl border border-border bg-card/50"
            >
              <div className="flex items-center gap-2 mb-2">
                <Car className="w-4 h-4 text-primary" />
                <span className="text-xs text-muted-foreground">Trips</span>
              </div>
              <p className="text-2xl font-bold font-display">{todayStats.trips}</p>
            </motion.div>
            <motion.div 
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="p-4 rounded-2xl border border-border bg-card/50"
            >
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="w-4 h-4 text-green-500" />
                <span className="text-xs text-muted-foreground">Earned</span>
              </div>
              <p className="text-2xl font-bold font-display text-green-500">${todayStats.earnings.toFixed(2)}</p>
            </motion.div>
          </div>
        )}



        {/* Main Content Area - Polished */}
        <AnimatePresence mode="wait">
        {activeRide ? (
          <motion.div 
            key="active" 
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
          >
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-lg font-bold bg-gradient-to-r from-primary via-primary/90 to-primary/70 bg-clip-text text-transparent">Active Trip</h2>
                <p className="text-xs text-muted-foreground/80 mt-0.5">Focus on the road ahead</p>
              </div>
              <Badge className="bg-gradient-to-r from-primary/20 to-primary/10 text-primary border-primary/30 capitalize font-semibold text-xs px-3 py-1.5 rounded-full shadow-lg">{activeRide.status.replace('_', ' ')}</Badge>
            </div>
            <ActiveTripCard
              ride={activeRide}
              user={user}
              onStartTrip={startTrip}
              onCompleteTrip={completeTrip}
              onCancelRide={cancelRide}
            />
          </motion.div>
        ) : showHistory ? (
          <motion.div 
            key="history" 
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
          >
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-lg font-bold bg-gradient-to-r from-primary via-primary/90 to-primary/70 bg-clip-text text-transparent">Trip History</h2>
                <p className="text-xs text-muted-foreground/80 mt-0.5">{tripHistory.length} {tripHistory.length === 1 ? 'trip' : 'trips'} recorded</p>
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowHistory(false)}
                className="text-xs font-semibold px-4 py-2 rounded-xl bg-gradient-to-br from-card/80 to-card/40 border border-white/10 hover:border-primary/40 transition-all"
              >
                Back
              </motion.button>
            </div>
            {tripHistory.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-gradient-to-br from-card/90 via-card to-card/85 backdrop-blur-xl rounded-3xl border border-white/10 p-12 text-center shadow-xl"
              >
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center mx-auto mb-4">
                  <Car className="w-8 h-8 text-primary" />
                </div>
                <p className="text-sm text-muted-foreground font-medium">No trips yet</p>
                <p className="text-xs text-muted-foreground/60 mt-1">Complete your first ride to see history</p>
              </motion.div>
            ) : (
              <div className="space-y-2.5">
                {tripHistory.map((r, i) => (
                  <motion.div
                    key={r.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <RideRequestCard ride={r} user={user} onSelect={() => {}} isHistory />
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div 
            key="requests" 
            initial={{ opacity: 0, y: 10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
          >
            {!showHistory && (
              <>
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <h2 className="text-lg font-bold bg-gradient-to-r from-primary via-primary/90 to-primary/70 bg-clip-text text-transparent">
                      {profile.status === 'offline' ? 'Go Online' : requests.length === 0 ? 'No Rides' : 'Available Rides'}
                    </h2>
                    <p className="text-xs text-muted-foreground/80 mt-0.5">
                      {profile.status === 'offline' ? 'Start earning today' : requests.length === 0 ? 'Stay ready' : `${requests.length} ride${requests.length > 1 ? 's' : ''} waiting`}
                    </p>
                  </div>
                  {!activeRide && tripHistory.length > 0 && (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setShowHistory(true)}
                      className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-gradient-to-br from-card/80 to-card/40 border border-white/10 hover:border-primary/40 transition-all"
                    >
                      History ({tripHistory.length})
                    </motion.button>
                  )}
                </div>
                {profile.status === 'offline' ? (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-gradient-to-br from-card/90 via-card to-card/85 backdrop-blur-xl rounded-3xl border border-white/10 p-12 text-center shadow-xl"
                  >
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-muted/80 to-muted/40 flex items-center justify-center mx-auto mb-5">
                      <Car className="w-10 h-10 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-bold mb-2">You're Offline</h3>
                    <p className="text-sm text-muted-foreground/80">Go online to start receiving ride requests and earning</p>
                  </motion.div>
                ) : requests.length === 0 ? (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-gradient-to-br from-card/90 via-card to-card/85 backdrop-blur-xl rounded-3xl border border-white/10 p-12 text-center shadow-xl relative overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2" />
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/15 to-primary/5 flex items-center justify-center mx-auto mb-5 relative">
                      <Car className="w-10 h-10 text-primary" />
                    </div>
                    <h3 className="text-lg font-bold mb-2">No Rides Available</h3>
                    <p className="text-sm text-muted-foreground/80">Stay online - new rides will appear here instantly</p>
                  </motion.div>
                ) : (
                  <div className="space-y-2.5">
                    {requests.map((r, i) => (
                      <motion.div
                        key={r.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        whileHover={{ scale: 1.01 }}
                      >
                        <RideRequestCard ride={r} user={user} onSelect={() => setSelectedRequest(r)} />
                      </motion.div>
                    ))}
                  </div>
                )}
              </>
            )}
          </motion.div>
        )}
        </AnimatePresence>

      </div>

      {/* Modals - Enhanced */}
      <AnimatePresence>
        {selectedRequest && (
          <RideRequestModal
            ride={selectedRequest}
            onAccept={() => acceptRide(selectedRequest)}
            onDecline={declineRide}
            swipeMode={swipeMode}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showSettings && (
          <Dialog open={showSettings} onOpenChange={setShowSettings}>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto bg-gradient-to-br from-background via-background to-accent/5">
              <DialogHeader>
                <DialogTitle className="text-xl font-display font-bold bg-gradient-to-r from-primary via-primary/90 to-primary/70 bg-clip-text text-transparent">Settings</DialogTitle>
              </DialogHeader>
              <Tabs defaultValue="preferences" className="w-full mt-4">
                <TabsList className="grid w-full grid-cols-4 bg-gradient-to-br from-card/90 via-card to-card/85 backdrop-blur-xl border border-white/10 rounded-2xl">
                  <TabsTrigger value="preferences" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary/20 data-[state=active]:to-primary/10 data-[state=active]:text-primary rounded-xl transition-all">Prefs</TabsTrigger>
                  <TabsTrigger value="schedule" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary/20 data-[state=active]:to-primary/10 data-[state=active]:text-primary rounded-xl transition-all">Schedule</TabsTrigger>
                  <TabsTrigger value="stops" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary/20 data-[state=active]:to-primary/10 data-[state=active]:text-primary rounded-xl transition-all">Stops</TabsTrigger>
                  <TabsTrigger value="pricing" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary/20 data-[state=active]:to-primary/10 data-[state=active]:text-primary rounded-xl transition-all">Pricing</TabsTrigger>
                </TabsList>
                <TabsContent value="preferences" className="space-y-4 mt-4">
                  <DriverSettingsModal
                    onClose={() => setShowSettings(false)}
                    swipeMode={swipeMode}
                    setSwipeMode={setSwipeMode}
                    autoAccept={autoAccept}
                    setAutoAccept={setAutoAccept}
                    maxDistance={maxDistance}
                    setMaxDistance={setMaxDistance}
                    onSave={async () => {
                      try {
                        const me = await base44.auth.me();
                        const profiles = await base44.entities.DriverProfile.filter({ user_email: me.email });
                        if (profiles.length > 0) {
                          await base44.entities.DriverProfile.update(profiles[0].id, {
                            swipe_mode: swipeMode,
                            auto_accept: autoAccept,
                            max_accept_distance: maxDistance,
                          });
                        }
                        toast.success('Settings saved!');
                        setShowSettings(false);
                      } catch (error) {
                        console.error('Failed to save settings:', error);
                        toast.error('Failed to save settings');
                      }
                    }}
                  />
                </TabsContent>
                <TabsContent value="schedule" className="mt-4">
                  <DriverScheduleEditor driverEmail={user.email} />
                </TabsContent>
                <TabsContent value="stops" className="mt-4">
                  <DriverStopsManager driverEmail={user.email} />
                </TabsContent>
                <TabsContent value="pricing" className="mt-4">
                  <DriverPricingManager driverEmail={user.email} />
                </TabsContent>
              </Tabs>
            </DialogContent>
          </Dialog>
        )}
      </AnimatePresence>

      {/* Helper Components - Hidden */}
      <div className="hidden">
        <DriverWalkthrough />
        <DriverAlertBanner driverEmail={user?.email} />
        <DriverQuickActions profile={profile} onToggleOnline={toggleOnline} todayStats={todayStats} />
        <NotificationPermissionBanner permission={notificationPermission} onGrant={() => {}} />
      </div>
    </div>
  );
}