import React from 'react';
import DailyRevenueChart from './DailyRevenueChart';
import StatCard from './StatCard';
import { DollarSign, TrendingUp, Star, CreditCard } from 'lucide-react';
import { format } from 'date-fns';

export default function RevenueTab({ rides, drivers }) {
  const completed = rides.filter(r => r.status === 'completed');
  const paid = completed.filter(r => r.payment_status === 'paid');
  const revenue = paid.reduce((s, r) => s + (r.fare || 0), 0);
  const driverPayout = revenue * 0.8;
  const platformCut = revenue * 0.2;
  const avgFare = paid.length ? revenue / paid.length : 0;
  const avgSurge = rides.length ? rides.reduce((s, r) => s + (r.surge_multiplier || 1), 0) / rides.length : 1;

  // Top earning drivers
  const earningsByDriver = {};
  completed.forEach(r => {
    if (!r.driver_email) return;
    earningsByDriver[r.driver_email] = (earningsByDriver[r.driver_email] || 0) + (r.fare || 0) * 0.8;
  });
  const topDrivers = Object.entries(earningsByDriver)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-display font-bold">Revenue Reports</h2>
        <p className="text-sm text-muted-foreground mt-0.5">Financial overview across all rides</p>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        <StatCard icon={DollarSign} label="Total Revenue" value={`$${revenue.toFixed(2)}`} sub={`${paid.length} paid rides`} />
        <StatCard icon={CreditCard} label="Platform Cut (20%)" value={`$${platformCut.toFixed(2)}`} sub="Net earnings" />
        <StatCard icon={TrendingUp} label="Driver Payouts" value={`$${driverPayout.toFixed(2)}`} sub="80% to drivers" />
        <StatCard icon={Star} label="Avg Fare" value={`$${avgFare.toFixed(2)}`} sub={`${avgSurge.toFixed(2)}x avg surge`} />
      </div>

      <DailyRevenueChart rides={rides} />

      {/* Payment method breakdown */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <div className="px-5 py-4 border-b border-border">
          <h3 className="font-semibold text-sm">Payment Methods</h3>
        </div>
        <div className="divide-y divide-border">
          {['card', 'cash'].map(method => {
            const methodRides = paid.filter(r => r.payment_method === method);
            const methodRevenue = methodRides.reduce((s, r) => s + (r.fare || 0), 0);
            const pct = paid.length ? Math.round((methodRides.length / paid.length) * 100) : 0;
            return (
              <div key={method} className="flex items-center gap-4 px-5 py-3">
                <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center">
                  <CreditCard className="w-4 h-4 text-muted-foreground" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium capitalize">{method}</p>
                  <div className="w-full bg-secondary rounded-full h-1.5 mt-1.5">
                    <div className="bg-primary h-1.5 rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold">${methodRevenue.toFixed(2)}</p>
                  <p className="text-xs text-muted-foreground">{pct}% · {methodRides.length} rides</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Top earning drivers */}
      {topDrivers.length > 0 && (
        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          <div className="px-5 py-4 border-b border-border">
            <h3 className="font-semibold text-sm">Top Earning Drivers</h3>
          </div>
          <div className="divide-y divide-border">
            {topDrivers.map(([email, earned], i) => (
              <div key={email} className="flex items-center gap-4 px-5 py-3">
                <span className="text-lg w-8 text-center">{['🥇','🥈','🥉'][i] || `#${i+1}`}</span>
                <p className="flex-1 text-sm truncate">{email}</p>
                <p className="font-bold text-sm">${earned.toFixed(2)}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}