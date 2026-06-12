import React, { useState } from 'react';
import DailyRevenueChart from './DailyRevenueChart';
import StatCard from './StatCard';
import { DollarSign, TrendingUp, Star, CreditCard, Sheet, ExternalLink, RefreshCw, Download } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function RevenueTab({ rides, drivers }) {
  const [syncing, setSyncing] = useState(false);
  const [sheetUrl, setSheetUrl] = useState(null);

  const handleSync = async () => {
    setSyncing(true);
    try {
      const res = await base44.functions.invoke('bulkSyncRidesToSheets', {});
      setSheetUrl(res.data.spreadsheet_url);
      toast.success(`Exported ${res.data.rides_synced} rides + ${res.data.drivers_synced} drivers to Google Sheets`);
    } catch (err) {
      toast.error('Export failed: ' + err.message);
    } finally {
      setSyncing(false);
    }
  };

  const downloadCSV = async () => {
    const allRides = await base44.entities.Ride.list('-created_date', 2000);
    const headers = ['Date','Time','ID','Status','Rider','Driver','Pickup','Dropoff','Distance (mi)','Base Fare','Surge','Total Fare','Driver Earnings','Payment Method','Payment Status','Rating','Comment'];
    const rows = allRides.map(r => [
      r.created_date ? format(new Date(r.created_date), 'yyyy-MM-dd') : '',
      r.created_date ? format(new Date(r.created_date), 'HH:mm') : '',
      r.id || '',
      r.status || '',
      r.rider_email || '', r.driver_email || '',
      r.pickup_address || '', r.dropoff_address || '',
      (r.distance_km || 0).toFixed(2),
      (r.base_fare || 0).toFixed(2),
      (r.surge_multiplier || 1).toFixed(2),
      (r.fare || 0).toFixed(2),
      r.status === 'completed' ? ((r.fare || 0) * 0.8).toFixed(2) : '',
      r.payment_method || '', r.payment_status || '',
      r.rider_rating || '', r.rider_comment || '',
    ].map(f => `"${String(f).replace(/"/g,'""')}"`).join(','));
    const blob = new Blob([[headers.join(','), ...rows].join('\n')], { type: 'text/csv' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `dip_out_export_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
    toast.success(`Downloaded ${allRides.length} rides as CSV`);
  };

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
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-display font-bold">Revenue Reports</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Financial overview across all rides</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button size="sm" variant="outline" onClick={downloadCSV} className="gap-1.5 h-8">
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">CSV</span>
          </Button>
          <Button size="sm" variant="outline" onClick={handleSync} disabled={syncing} className="gap-1.5 h-8">
            <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">{syncing ? 'Exporting…' : 'Google Sheets'}</span>
          </Button>
          {sheetUrl && (
            <a href={sheetUrl} target="_blank" rel="noopener noreferrer">
              <Button size="sm" className="gap-1.5 h-8 bg-green-600 hover:bg-green-700 text-white">
                <ExternalLink className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Open Sheet</span>
              </Button>
            </a>
          )}
        </div>
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