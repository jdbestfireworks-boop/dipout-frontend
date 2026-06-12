import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Loader2, Car } from 'lucide-react';
import DriverOnboarding from '@/components/driver/DriverOnboarding';
import DriverAlertBanner from '@/components/driver/DriverAlertBanner';
import DriverWalkthrough from '@/components/driver/DriverWalkthrough';
import DriverQuickActions from '@/components/driver/DriverQuickActions';
import RideRequestModal from '@/components/driver/RideRequestModal';
import ActiveTripCard from '@/components/driver/ActiveTripCard';
import RideRequestCard from '@/components/driver/RideRequestCard';
import NotificationPermissionBanner from '@/components/notifications/NotificationPermissionBanner';
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
import DriverHeader from '@/components/driver/DriverHeader';
import DriverOnlineStatus from '@/components/driver/DriverOnlineStatus';
import DriverStats from '@/components/driver/DriverStats';
import DriverContentView from '@/components/driver/DriverContentView';

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
    const UPDATE_INTERVAL = 5000;

    const startTracking = () => {
      if ('geolocation' in navigator) {
        watchId = navigator.geolocation.watchPosition(
          async (position) => {
            const now = Date.now();
            if (now - lastUpdate < UPDATE_INTERVAL) return;
            lastUpdate = now;

            const { latitude: lat, longitude: lng } = position.coords;
            await base44.entities.DriverProfile.update(profile.id, { lat, lng });
            setProfile((prev) => prev ? { ...prev, lat, lng } : null);
            
            if (activeRide) {
              if (activeRide.status === 'accepted' && activeRide.pickup_lat && activeRide.pickup_lng) {
                const distToPickup = haversineMiles(lat, lng, activeRide.pickup_lat, activeRide.pickup_lng);
                if (distToPickup < 0.1) {
                  await startTrip();
                  toast.success('Auto-detected: Rider picked up!');
                }
              }
              if (activeRide.status === 'in_progress' && activeRide.dropoff_lat && activeRide.dropoff_lng) {
                const distToDropoff = haversineMiles(lat, lng, activeRide.dropoff_lat, activeRide.dropoff_lng);
                if (distToDropoff < 0.1) {
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
        const declinedBy = event.data.declined_by || [];
        if (!declinedBy.includes(user.email)) {
          setRequests((prev) => [event.data, ...prev.filter((r) => r.id !== event.id)]);
          if (profile.status !== 'offline' && !activeRide && !selectedRequest) {
            getSound().currentTime = 0;
            getSound().play().catch(() => console.log('Audio autoplay blocked'));
            setSelectedRequest(event.data);
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
    
    const mostRecent = requests[0];
    setSelectedRequest(mostRecent);
    
    getSound().currentTime = 0;
    getSound().play().catch(() => console.log('Audio autoplay blocked'));
  }, [profile?.status, requests.length]);

  const loadRequests = async () => {
    const me = user || await base44.auth.me().catch(() => null);
    if (!me) return;
    const reqs = await base44.entities.Ride.filter({ status: 'requested' }, '-created_date', 20);
    const filtered = reqs.filter(r => !(r.declined_by || []).includes(me.email));
    setRequests(filtered);
  };

  const toggleOnline = async (online) => {
    if (online) {
      await base44.entities.DriverProfile.update(profile.id, { status: 'available' });
      setProfile((prev) => ({ ...prev, status: 'available' }));
      toast.success("You're now online!");

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
      setTodayStats(prev => ({
        ...prev,
        trips: prev.trips + 1,
        earnings: prev.earnings + earned,
        activeRide: null
      }));
      toast.success(`Trip complete — you earned $${earned.toFixed(2)}`);
      setActiveRide(null);
      setRequests([]);
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
        <DriverHeader profile={profile} onOpenSettings={() => setShowSettings(true)} onBack={() => navigate(-1)} />
        
        <DriverOnlineStatus profile={profile} onToggleOnline={toggleOnline} hasActiveRide={!!activeRide} />
        
        {!activeRide && (
          <DriverStats trips={todayStats.trips} earnings={todayStats.earnings} hasActiveRide={false} />
        )}

        <DriverContentView
          activeRide={activeRide}
          showHistory={showHistory}
          tripHistory={tripHistory}
          profile={profile}
          requests={requests}
          user={user}
          onSelectRide={setSelectedRequest}
          onShowHistory={() => setShowHistory(true)}
          onBackFromHistory={() => setShowHistory(false)}
          onStartTrip={startTrip}
          onCompleteTrip={completeTrip}
          onCancelRide={cancelRide}
        />
      </div>

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

      <div className="hidden">
        <DriverWalkthrough />
        <DriverAlertBanner driverEmail={user?.email} />
        <DriverQuickActions profile={profile} onToggleOnline={toggleOnline} todayStats={todayStats} />
        <NotificationPermissionBanner permission={notificationPermission} onGrant={() => {}} />
      </div>
    </div>
  );
}