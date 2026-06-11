import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Loader2, Car, MapPin, Navigation, ExternalLink, Banknote, CreditCard, Clock, Phone } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import EarningsChart from '@/components/driver/EarningsChart';
import RideChat from '@/components/ride/RideChat';
import DriverSummaryPanel from '@/components/driver/DriverSummaryPanel';

function mapsLink(address) {
  const encoded = encodeURIComponent(address);
  return `https://maps.google.com/?q=${encoded}`;
}

function dirLink(from, to) {
  return `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(from)}&destination=${encodeURIComponent(to)}`;
}

export default function DriverApp() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [vehicle, setVehicle] = useState('');
  const [plate, setPlate] = useState('');
  const [phone, setPhone] = useState('');
  const [requests, setRequests] = useState([]);
  const [activeRide, setActiveRide] = useState(null);

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

  const createProfile = async () => {
    const p = await base44.entities.DriverProfile.create({
      user_email: user.email,
      vehicle,
      plate,
      phone,
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
    });
    await base44.entities.DriverProfile.update(profile.id, { status: 'busy' });
    setProfile({ ...profile, status: 'busy' });
    setActiveRide({ ...ride, status: 'accepted', driver_email: user.email });
    setRequests((prev) => prev.filter((r) => r.id !== ride.id));
    toast.success('Ride accepted — open Maps to navigate');
  };

  const startTrip = async () => {
    await base44.entities.Ride.update(activeRide.id, { status: 'in_progress' });
    setActiveRide({ ...activeRide, status: 'in_progress' });
  };

  const completeTrip = async () => {
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
      <div className="max-w-md mx-auto p-6 pt-10 space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center">
          <Car className="w-6 h-6 text-primary-foreground" />
        </div>
        <h1 className="text-2xl font-display font-bold">Become a Dip Out driver</h1>
        <p className="text-sm text-muted-foreground">Set up your vehicle to start receiving ride requests.</p>
        <Input placeholder="Vehicle (e.g. Toyota Prius 2022)" value={vehicle} onChange={(e) => setVehicle(e.target.value)} />
        <Input placeholder="License plate" value={plate} onChange={(e) => setPlate(e.target.value)} />
        <Input placeholder="Phone number (optional, for riders to call)" value={phone} onChange={(e) => setPhone(e.target.value)} type="tel" />
        <Button onClick={createProfile} disabled={!vehicle || !plate} className="w-full h-12 rounded-xl font-semibold">
          Start driving
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 pt-8 pb-20 space-y-5">
      {/* Header + online toggle */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold">Driver hub</h1>
          <p className="text-xs text-muted-foreground">{profile.vehicle} · {profile.plate}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">{profile.status === 'offline' ? 'Offline' : 'Online'}</span>
          <Switch checked={profile.status !== 'offline'} onCheckedChange={toggleOnline} disabled={!!activeRide} />
        </div>
      </div>

      <DriverSummaryPanel profile={profile} driverEmail={user.email} />

      {!activeRide && <EarningsChart driverEmail={user.email} />}

      <AnimatePresence mode="wait">
        {activeRide ? (
          <motion.div key="active" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-lg">Current trip</h2>
              <Badge className="capitalize">{activeRide.status.replace('_', ' ')}</Badge>
            </div>

            {/* Rider + payment info */}
            <div className="rounded-2xl border border-border bg-card p-4 text-sm space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Rider</span>
                <span className="font-medium">{activeRide.rider_email}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Fare</span>
                <span className="font-bold text-base">${activeRide.fare?.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Payment</span>
                <Badge variant="outline" className="capitalize flex items-center gap-1">
                  {activeRide.payment_method === 'cash'
                    ? <><Banknote className="w-3 h-3" /> Cash</>
                    : <><CreditCard className="w-3 h-3" /> Card</>
                  }
                </Badge>
              </div>
              {activeRide.scheduled_for && (
                <div className="flex items-center justify-between border-t border-border pt-2">
                  <span className="text-muted-foreground flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> Scheduled</span>
                  <span className="font-medium text-primary">
                    {new Intl.DateTimeFormat('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }).format(new Date(activeRide.scheduled_for))}
                  </span>
                </div>
              )}
            </div>

            {/* Pickup card with Maps link */}
            <div className="rounded-2xl border border-border bg-card p-4 space-y-3 text-sm">
              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground mb-0.5">Pickup</p>
                  <p className="font-medium">{activeRide.pickup_address}</p>
                  <a
                    href={mapsLink(activeRide.pickup_address)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-primary mt-1 hover:underline font-semibold"
                  >
                    <ExternalLink className="w-3 h-3" /> Open in Maps
                  </a>
                </div>
              </div>
              <div className="border-t border-border" />
              <div className="flex items-start gap-3">
                <Navigation className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground mb-0.5">Drop-off</p>
                  <p className="font-medium">{activeRide.dropoff_address}</p>
                  <a
                    href={mapsLink(activeRide.dropoff_address)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-primary mt-1 hover:underline font-semibold"
                  >
                    <ExternalLink className="w-3 h-3" /> Open in Maps
                  </a>
                </div>
              </div>
              {/* Full directions link */}
              <a
                href={dirLink(activeRide.pickup_address, activeRide.dropoff_address)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full mt-1 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-opacity"
              >
                <Navigation className="w-4 h-4" /> Get full directions
              </a>
            </div>

            {/* Chat */}
            <RideChat rideId={activeRide.id} userEmail={user.email} role="driver" />

            {activeRide.status === 'accepted' && (
              <Button onClick={startTrip} className="w-full h-12 rounded-xl font-semibold" variant="outline">
                Rider picked up — start trip
              </Button>
            )}
            {activeRide.status === 'in_progress' && (
              <Button onClick={completeTrip} className="w-full h-12 rounded-xl font-semibold">
                Complete trip
              </Button>
            )}
          </motion.div>
        ) : (
          <motion.div key="requests" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
            <h2 className="font-semibold text-lg">Ride requests</h2>
            {profile.status === 'offline' ? (
              <div className="rounded-2xl border border-border bg-card p-6 text-center text-sm text-muted-foreground">
                Go online to start receiving ride requests.
              </div>
            ) : requests.length === 0 ? (
              <div className="rounded-2xl border border-border bg-card p-6 flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" /> Waiting for requests…
              </div>
            ) : (
              requests.map((r) => (
                <div key={r.id} className="rounded-2xl border border-border bg-card p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-primary text-lg">${r.fare?.toFixed(2)}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">{r.distance_km} km</span>
                      <Badge variant="outline" className="text-xs flex items-center gap-1">
                        {r.payment_method === 'cash'
                          ? <><Banknote className="w-3 h-3" /> Cash</>
                          : <><CreditCard className="w-3 h-3" /> Card</>
                        }
                      </Badge>
                    </div>
                  </div>
                  {r.scheduled_for && (
                    <div className="flex items-center gap-1.5 text-xs text-primary font-medium">
                      <Clock className="w-3.5 h-3.5" />
                      Scheduled: {new Intl.DateTimeFormat('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }).format(new Date(r.scheduled_for))}
                    </div>
                  )}
                  <div className="text-sm space-y-1">
                    <p className="flex items-center gap-2 text-muted-foreground">
                      <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
                      <span className="truncate">{r.pickup_address}</span>
                    </p>
                    <p className="flex items-center gap-2 text-muted-foreground">
                      <Navigation className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{r.dropoff_address}</span>
                    </p>
                  </div>
                  <Button size="sm" onClick={() => acceptRide(r)} className="w-full rounded-xl font-semibold h-10">
                    Accept ride
                  </Button>
                </div>
              ))
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}