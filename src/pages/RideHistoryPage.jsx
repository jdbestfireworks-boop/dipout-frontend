import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { MapPin, Navigation, CreditCard, Banknote, Loader2, Clock, ChevronDown, ChevronUp, User, ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function RideHistoryPage() {
  // Check URL params for payment status
  const urlParams = new URLSearchParams(window.location.search);
  const paymentStatus = urlParams.get('payment');
  const rideId = urlParams.get('ride_id');
  const navigate = useNavigate();
  
  // Show payment success/error message on mount
  useEffect(() => {
    if (paymentStatus === 'success' && rideId) {
      toast.success('Payment successful! Thank you for your ride.');
      // Clean URL
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (paymentStatus === 'cancelled' && rideId) {
      toast.error('Payment was cancelled. Please contact support if you were charged.');
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [paymentStatus, rideId]);
  const [rides, setRides] = useState([]);
  const [driverNames, setDriverNames] = useState({});
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    (async () => {
      const user = await base44.auth.me();
      const all = await base44.entities.Ride.filter({ rider_email: user.email }, '-created_date', 100);
      const completed = all.filter((r) => r.status === 'completed');
      setRides(completed);

      // Fetch driver profiles for all unique driver emails
      const driverEmails = [...new Set(completed.map((r) => r.driver_email).filter(Boolean))];
      if (driverEmails.length) {
        const profiles = await Promise.all(
          driverEmails.map((email) =>
            base44.entities.DriverProfile.filter({ user_email: email }, null, 1).then((p) => ({ email, profile: p[0] }))
          )
        );
        const nameMap = {};
        profiles.forEach(({ email, profile }) => {
          nameMap[email] = profile?.name || profile?.user_email || email;
        });
        setDriverNames(nameMap);
      }

      setLoading(false);
    })();
  }, []);

  const totalSpent = rides.filter((r) => r.payment_status === 'paid').reduce((s, r) => s + (r.fare || 0), 0);
  const totalRides = rides.length;
  const avgFare = totalRides > 0 ? totalSpent / totalRides : 0;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-lg mx-auto px-4 pt-8 pb-20 space-y-6">

        {/* Header with back button */}
        <div className="flex items-center gap-3 mb-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="h-9 w-9">
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-display font-bold">Trip History</h1>
            <p className="text-sm text-muted-foreground mt-1">All your completed rides in one place.</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 rounded-xl bg-secondary w-fit mb-6">
          <Link
            to="/"
            className="px-5 py-2 rounded-lg text-sm font-semibold transition-all text-muted-foreground hover:text-foreground"
          >
            Book
          </Link>
          <span className="px-5 py-2 rounded-lg text-sm font-semibold bg-card shadow text-foreground">
            History
          </span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            {/* Summary stats */}
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-2xl border border-border bg-card p-4 text-center">
                <p className="text-2xl font-display font-bold">{totalRides}</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">Total rides</p>
              </div>
              <div className="rounded-2xl border border-border bg-card p-4 text-center">
                <p className="text-2xl font-display font-bold">${totalSpent.toFixed(2)}</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">Total spent</p>
              </div>
              <div className="rounded-2xl border border-border bg-card p-4 text-center">
                <p className="text-2xl font-display font-bold">${avgFare.toFixed(2)}</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-1">Avg fare</p>
              </div>
            </div>

            {/* Ride list */}
            {rides.length === 0 ? (
              <div className="rounded-2xl border border-border bg-card p-10 text-center space-y-3">
                <p className="text-muted-foreground text-sm">No completed rides yet.</p>
                <Link to="/" className="text-primary text-sm font-medium hover:underline">Book your first ride →</Link>
              </div>
            ) : (
              <div className="space-y-3">
                {rides.map((r) => {
                  const isExpanded = expandedId === r.id;
                  return (
                    <div key={r.id} className="rounded-2xl border border-border bg-card overflow-hidden">
                      {/* Row header — always visible */}
                      <button
                        className="w-full flex items-center justify-between p-4 text-left hover:bg-accent/40 transition-colors"
                        onClick={() => setExpandedId(isExpanded ? null : r.id)}
                      >
                        <div className="space-y-0.5">
                          <p className="text-xs text-muted-foreground">{format(new Date(r.created_date), 'EEE, MMM d yyyy · h:mm a')}</p>
                          <p className="text-sm font-medium truncate max-w-[220px]">{r.pickup_address}</p>
                          <p className="text-xs text-muted-foreground truncate max-w-[220px]">→ {r.dropoff_address}</p>
                          {r.driver_email && (
                            <p className="text-xs text-muted-foreground flex items-center gap-1 pt-0.5">
                              <User className="w-3 h-3" />
                              {driverNames[r.driver_email] || r.driver_email}
                            </p>
                          )}
                        </div>
                        <div className="flex flex-col items-end gap-1.5 shrink-0 ml-3">
                          <span className="font-bold text-base">${r.fare?.toFixed(2)}</span>
                          {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                        </div>
                      </button>

                      {/* Expanded details */}
                      {isExpanded && (
                        <div className="border-t border-border px-4 pb-4 pt-3 space-y-3 text-sm">
                          <div className="space-y-2">
                            <div className="flex items-start gap-2">
                              <MapPin className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                              <div>
                                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Pickup</p>
                                <p className="font-medium">{r.pickup_address}</p>
                              </div>
                            </div>
                            <div className="flex items-start gap-2">
                              <Navigation className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                              <div>
                                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Drop-off</p>
                                <p className="font-medium">{r.dropoff_address}</p>
                              </div>
                            </div>
                          </div>

                          {r.driver_email && (
                            <div className="flex items-center gap-2 text-sm">
                              <User className="w-4 h-4 text-muted-foreground shrink-0" />
                              <div>
                                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Driver</p>
                                <p className="font-medium">{driverNames[r.driver_email] || r.driver_email}</p>
                              </div>
                            </div>
                          )}

                          <div className="grid grid-cols-3 gap-2 pt-1">
                            <div className="rounded-xl bg-secondary p-2.5 text-center">
                              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Distance</p>
                              <p className="font-semibold text-sm mt-0.5">{r.distance_km ? `${r.distance_km} km` : '—'}</p>
                            </div>
                            <div className="rounded-xl bg-secondary p-2.5 text-center">
                              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Payment</p>
                              <p className="font-semibold text-sm mt-0.5 flex items-center justify-center gap-1">
                                {r.payment_method === 'cash'
                                  ? <><Banknote className="w-3 h-3" />Cash</>
                                  : <><CreditCard className="w-3 h-3" />Card</>
                                }
                              </p>
                            </div>
                            <div className="rounded-xl bg-secondary p-2.5 text-center">
                              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Status</p>
                              <p className="font-semibold text-sm mt-0.5 capitalize">{r.payment_status}</p>
                            </div>
                          </div>

                          {r.scheduled_for && (
                            <div className="flex items-center gap-2 text-xs text-primary font-medium">
                              <Clock className="w-3.5 h-3.5" />
                              Scheduled for {format(new Date(r.scheduled_for), 'EEE, MMM d · h:mm a')}
                            </div>
                          )}

                          {r.ai_pricing_reason && (
                            <p className="text-xs text-muted-foreground italic border-l-2 border-border pl-2">{r.ai_pricing_reason}</p>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}