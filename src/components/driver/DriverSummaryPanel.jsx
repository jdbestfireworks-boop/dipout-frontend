import React, { useMemo } from 'react';
import { DollarSign, Navigation, Star, TrendingUp } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { startOfWeek } from 'date-fns';

export default function DriverSummaryPanel({ profile, driverEmail }) {
  const { data: rides = [] } = useQuery({
    queryKey: ['driver-weekly-rides', driverEmail],
    queryFn: () => base44.entities.Ride.filter({ driver_email: driverEmail, status: 'completed' }, '-created_date', 200),
    enabled: !!driverEmail,
  });

  const weeklyEarnings = useMemo(() => {
    const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
    return rides
      .filter((r) => new Date(r.created_date) >= weekStart)
      .reduce((sum, r) => sum + (r.fare || 0) * 0.8, 0);
  }, [rides]);

  const rating = profile.rating || 5;
  const totalRatings = profile.total_ratings || 0;
  const trips = profile.trips_completed || 0;
  const totalEarnings = profile.total_earnings || 0;

  const ratingStars = Math.round(rating);

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      {/* Top: weekly earnings hero */}
      <div className="bg-primary/10 border-b border-border px-5 py-4 flex items-center justify-between">
        <div>
          <p className="text-[11px] font-semibold text-primary uppercase tracking-widest mb-0.5">This week</p>
          <p className="text-3xl font-display font-bold text-primary">${weeklyEarnings.toFixed(2)}</p>
        </div>
        <div className="w-11 h-11 rounded-2xl bg-primary/20 flex items-center justify-center">
          <TrendingUp className="w-5 h-5 text-primary" />
        </div>
      </div>

      {/* Bottom: trips + rating */}
      <div className="grid grid-cols-2 divide-x divide-border">
        {/* Trips */}
        <div className="px-5 py-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center shrink-0">
            <Navigation className="w-4 h-4 text-primary" />
          </div>
          <div>
            <p className="font-display font-bold text-xl leading-none">{trips}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">Total trips</p>
          </div>
        </div>

        {/* Rating */}
        <div className="px-5 py-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center shrink-0">
            <Star className="w-4 h-4 text-primary fill-primary" />
          </div>
          <div>
            <div className="flex items-baseline gap-1.5">
              <p className="font-display font-bold text-xl leading-none">{rating.toFixed(1)}</p>
              <div className="flex gap-0.5">
                {[1,2,3,4,5].map((s) => (
                  <Star
                    key={s}
                    className={`w-2.5 h-2.5 ${s <= ratingStars ? 'text-primary fill-primary' : 'text-muted-foreground'}`}
                  />
                ))}
              </div>
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">{totalRatings} {totalRatings === 1 ? 'review' : 'reviews'}</p>
          </div>
        </div>
      </div>

      {/* All-time earnings footer */}
      <div className="border-t border-border px-5 py-3 flex items-center justify-between">
        <span className="text-xs text-muted-foreground flex items-center gap-1.5">
          <DollarSign className="w-3.5 h-3.5" /> All-time earnings
        </span>
        <span className="text-sm font-semibold">${totalEarnings.toFixed(2)}</span>
      </div>
    </div>
  );
}