import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Loader2, DollarSign, MapPin, Navigation, Star, Car } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import RideMap from '@/components/RideMap';
import { haversineKm, stepToward } from '@/lib/geo';

export default function DriverApp() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [vehicle, setVehicle] = useState('');
  const [plate, setPlate] = useState('');
  const [requests, setRequests] = useState([]);
  const [activeRide, setActiveRide] = useState(null);
  const intervalRef = useRef(null);

  useEffect(() => {
    (async () => {
      const me = await base44.auth.me();
      setUser(me);
      const existing = await base44.entities.DriverProfile.filter({ user_email: me.email });
      if (existing.length) setProfile(existing[0]);
      const myRides = await base44.entities.Ride.filter({ driver_email: me.email }, '-created_date', 5);
      const current = myRides.find((r) => ['accepted', 'in_progress'].includes(r.status));
      if (current) setActiveRide(current);
    })();
  }, []);

  // Subscribe to ride requests + active ride updates
  useEffect(() => {
    if (!profile) return;
    loadRequests();
    const unsubscribe = base44.entities.Ride.subscribe((event) => {
      if (event.type === 'create' && event.data.status === 'requested') {
        setRequests((prev) => [event.data, ...prev.filter((r) => r.id !== event.id)]);
      }
      if (event.type === 'update') {
        setRequests((prev) => prev.filter((r) => r.id !== event.id || event.data.status === 'requested'));
        setActiveRide((prev) =>
          prev && prev.id === event.id
            ? event.data.status === 'cancelled' ? null : event.data
            : prev
        );
      }
    });
    return unsubscribe;
  }, [profile?.id]);

  const loadRequests = async () => {
    const reqs = await base44.entities.Ride.filter({ status: 'requested' }, '-created_date', 20);
    setRequests(reqs);
  };

  // GPS simulation: move driver toward pickup (accepted) or dropoff (in_progress)
  useEffect(() => {
    clearInterval(intervalRef.current);
    if (!activeRide || !['accepted', 'in_progress'].includes(activeRide.status)) return;
    intervalRef.current = setInterval(async () => {
      const target =
        activeRide.status === 'accepted'
          ? { lat: activeRide.pickup_lat, lng: activeRide.pickup_lng }
          : { lat: activeRide.dropoff_lat, lng: activeRide.dropoff_lng };
      const cur = {
        lat: activeRide.driver_lat ?? activeRide.pickup_lat + 0.02,
        lng: activeRide.driver_lng ?? activeRide.pickup_lng + 0.02,
      };
      if (haversineKm(cur.lat, cur.lng, target.lat, target.lng) < 0.05) return;
      const next = stepToward(cur.lat, cur.lng, target.lat, target.lng, 0.2);
      await base44.entities.Ride.update(activeRide.id, { driver_lat: next.lat, driver_lng: next.lng });
    }, 3000);
    return () => clearInterval(intervalRef.current);
  }, [activeRide?.id, activeRide?.status, activeRide?.driver_lat]);

  const createProfile = async () => {
    const p = await base44.entities.DriverProfile.create({
      user_email: user.email,
      vehicle,
      plate,
      status: 'offline',
      rating: 5,
      total_earnings: 0,
      trips_completed: 0,
    });
    setProfile(p);
  };

  const toggleOnline = async (online) => {
    const status = online ? 'available' : 'offline';
    await base44.entities.DriverProfile.update(profile.id, { status });
    setProfile({ ...profile, status });
  };

  const acceptRide = async (ride) => {
    await base44.entities.Ride.update(ride.id, {
      status: 'accepted',
      driver_email: user.email,
      driver_lat: ride.pickup_lat + 0.02,
      driver_lng: ride.pickup_lng + 0.02,
    });
    await base44.entities.DriverProfile.update(profile.id, { status: 'busy' });
    setProfile({ ...profile, status: 'busy' });
    setActiveRide({ ...ride, status: 'accepted', driver_email: user.email });
    setRequests((prev) => prev.filter((r) => r.id !== ride.id));
    toast.success('Ride accepted');
  };

  const startTrip = async () => {
    await base44.entities.Ride.update(activeRide.id, { status: 'in_progress' });
    setActiveRide({ ...activeRide, status: 'in_progress' });
  };

  const completeTrip = async () => {
    await base44.entities.Ride.update(activeRide.id, {
      status: 'completed',
      driver_lat: activeRide.dropoff_lat,
      driver_lng: activeRide.dropoff_lng,
    });
    await base44.entities.DriverProfile.update(profile.id, {
      status: 'available',
      total_earnings: (profile.total_earnings || 0) + (activeRide.fare || 0) * 0.8,
      trips_completed: (profile.trips_completed || 0) + 1,
    });
    setProfile({
      ...profile,
      status: 'available',
      total_earnings: (profile.total_earnings || 0) + (activeRide.fare || 0) * 0.8,
      trips_completed: (profile.trips_completed || 0) + 1,
    });
    toast.success(`Trip complete — you earned $${((activeRide.fare || 0) * 0.8).toFixed(2)}`);
    setActiveRide(null);
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-full pt-32">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="max-w-md mx-auto p-6 pt-16 space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center">
          <Car className="w-6 h-6 text-primary-foreground" />
        </div>
        <h1 className="text-2xl font-display font-bold">Become a Velo driver</h1>
        <p className="text-sm text-muted-foreground">Set up your vehicle to start receiving ride requests.</p>
        <Input placeholder="Vehicle (e.g. Toyota Prius 2022)" value={vehicle} onChange={(e) => setVehicle(e.target.value)} />
        <Input placeholder="License plate" value={plate} onChange={(e) => setPlate(e.target.value)} />
        <Button onClick={createProfile} disabled={!vehicle || !plate} className="w-full h-12 rounded-xl font-semibold">
          Start driving
        </Button>
      </div>
    );
  }

  return (
    <div className="absolute inset-0 flex flex-col md:flex-row">
      <div className="flex-1 min-h-[40vh] relative z-0">
        <RideMap
          pickup={activeRide ? { lat: activeRide.pickup_lat, lng: activeRide.pickup_lng } : null}
          dropoff={activeRide ? { lat: activeRide.dropoff_lat, lng: activeRide.dropoff_lng } : null}
          driver={activeRide && activeRide.driver_lat != null ? { lat: activeRide.driver_lat, lng: activeRide.driver_lng } : null}
          center={activeRide ? { lat: activeRide.pickup_lat, lng: activeRide.pickup_lng } : undefined}
        />
      </div>

      <div className="w-full md:w-[400px] border-t md:border-t-0 md:border-l border-border bg-card p-5 space-y-4 overflow-y-auto">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-display font-bold">Driver hub</h1>
            <p className="text-xs text-muted-foreground">{profile.vehicle} · {profile.plate}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">{profile.status === 'offline' ? 'Offline' : 'Online'}</span>
            <Switch checked={profile.status !== 'offline'} onCheckedChange={toggleOnline} disabled={!!activeRide} />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="rounded-xl border border-border p-3">
            <DollarSign className="w-4 h-4 mx-auto text-primary mb-1" />
            <p className="font-display font-bold">${(profile.total_earnings || 0).toFixed(0)}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Earnings</p>
          </div>
          <div className="rounded-xl border border-border p-3">
            <Navigation className="w-4 h-4 mx-auto text-primary mb-1" />
            <p className="font-display font-bold">{profile.trips_completed || 0}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Trips</p>
          </div>
          <div className="rounded-xl border border-border p-3">
            <Star className="w-4 h-4 mx-auto text-primary mb-1" />
            <p className="font-display font-bold">{(profile.rating || 5).toFixed(1)}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Rating</p>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {activeRide ? (
            <motion.div key="active" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold">Current trip</h2>
                <Badge className="capitalize">{activeRide.status.replace('_', ' ')}</Badge>
              </div>
              <div className="rounded-xl border border-border p-3 text-sm space-y-1">
                <p className="flex items-center gap-2"><MapPin className="w-3.5 h-3.5 text-primary" /> {activeRide.pickup_address}</p>
                <p className="flex items-center gap-2"><Navigation className="w-3.5 h-3.5 text-muted-foreground" /> {activeRide.dropoff_address}</p>
                <p className="text-muted-foreground">{activeRide.distance_km} km · ${activeRide.fare?.toFixed(2)} · rider: {activeRide.rider_email}</p>
              </div>
              {activeRide.status === 'accepted' && (
                <Button onClick={startTrip} className="w-full h-12 rounded-xl font-semibold">Rider picked up — start trip</Button>
              )}
              {activeRide.status === 'in_progress' && (
                <Button onClick={completeTrip} className="w-full h-12 rounded-xl font-semibold">Complete trip</Button>
              )}
            </motion.div>
          ) : (
            <motion.div key="requests" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
              <h2 className="font-semibold">Ride requests</h2>
              {profile.status === 'offline' ? (
                <p className="text-sm text-muted-foreground">Go online to receive ride requests.</p>
              ) : requests.length === 0 ? (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" /> Waiting for requests…
                </div>
              ) : (
                requests.map((r) => (
                  <div key={r.id} className="rounded-xl border border-border p-3 text-sm space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-primary">${r.fare?.toFixed(2)}</span>
                      <span className="text-muted-foreground">{r.distance_km} km</span>
                    </div>
                    <p className="text-muted-foreground truncate">{r.pickup_address} → {r.dropoff_address}</p>
                    <Button size="sm" onClick={() => acceptRide(r)} className="w-full rounded-lg font-semibold">
                      Accept
                    </Button>
                  </div>
                ))
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}