import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Badge } from '@/components/ui/badge';
import { MapPin, Navigation, CreditCard, Banknote, Loader2 } from 'lucide-react';
import { format } from 'date-fns';

export default function RideHistory() {
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const user = await base44.auth.me();
      const all = await base44.entities.Ride.filter({ rider_email: user.email }, '-created_date', 50);
      setRides(all.filter((r) => r.status === 'completed'));
      setLoading(false);
    })();
  }, []);

  const totalSpent = rides.filter((r) => r.payment_status === 'paid').reduce((s, r) => s + (r.fare || 0), 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-border bg-card p-4 text-center">
          <p className="text-2xl font-display font-bold">{rides.length}</p>
          <p className="text-xs text-muted-foreground uppercase tracking-wider mt-1">Total rides</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-4 text-center">
          <p className="text-2xl font-display font-bold">${totalSpent.toFixed(2)}</p>
          <p className="text-xs text-muted-foreground uppercase tracking-wider mt-1">Total spent</p>
        </div>
      </div>

      {/* Ride list */}
      {rides.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
          No completed rides yet. Book your first ride!
        </div>
      ) : (
        rides.map((r) => (
          <div key={r.id} className="rounded-2xl border border-border bg-card p-4 space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">{format(new Date(r.created_date), 'MMM d, yyyy · h:mm a')}</span>
              <Badge variant={r.payment_status === 'paid' ? 'default' : 'outline'} className="capitalize text-xs">
                {r.payment_status}
              </Badge>
            </div>
            <div className="space-y-1.5">
              <p className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
                <span className="truncate">{r.pickup_address}</span>
              </p>
              <p className="flex items-center gap-2 text-muted-foreground">
                <Navigation className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{r.dropoff_address}</span>
              </p>
            </div>
            <div className="flex items-center justify-between pt-1 border-t border-border">
              <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
                {r.payment_method === 'cash'
                  ? <><Banknote className="w-3.5 h-3.5" /> Cash</>
                  : <><CreditCard className="w-3.5 h-3.5" /> Card</>
                }
              </div>
              <span className="font-bold">${r.fare?.toFixed(2)}</span>
            </div>
          </div>
        ))
      )}
    </div>
  );
}