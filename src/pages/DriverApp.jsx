import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Loader2, Car, MapPin, Navigation, ExternalLink, Banknote, CreditCard, Clock, XCircle, ArrowLeft } from 'lucide-react';
import DriverOnboarding from '@/components/driver/DriverOnboarding';
import SurgeAlertBanner from '@/components/driver/SurgeAlertBanner';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

import { useNavigate } from 'react-router-dom';

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
        // Auto-show modal for new requests when online
        if (profile.status !== 'offline' && !activeRide) {
          setSelectedRequest(event.data);
        }
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
  }, [profile?.id, profile?.status, activeRide]);

  const loadRequests = async () => {
    const reqs = await base44.entities.Ride.filter({ status: 'requested' }, '-created_date', 20);
    setRequests(reqs);
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
    setSelectedRequest(null);
    toast.success('Ride accepted — open Maps to navigate');
  };

  const declineRide = async (ride) => {
    setSelectedRequest(null);
    toast.info('Ride declined');
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
      {/* Header with back button + online toggle */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-1">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="h-9 w-9 shrink-0">
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-display font-bold">Driver hub</h1>
            <p className="text-xs text-muted-foreground">{profile.vehicle} · {profile.plate}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs text-muted-foreground">{profile.status === 'offline' ? 'Offline' : 'Online'}</span>
          <Switch checked={profile.status !== 'offline'} onCheckedChange={toggleOnline} disabled={!!activeRide} />
        </div>
      </div>

      <SurgeAlertBanner driverEmail={user.email} />

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
              <div className="space-y-3">
                {requests.map((r) => (
                  <div
                    key={r.id}
                    onClick={() => setSelectedRequest(r)}
                    className="rounded-2xl border border-border bg-card p-4 space-y-2 cursor-pointer hover:border-primary/50 transition-colors"
                  >
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
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}