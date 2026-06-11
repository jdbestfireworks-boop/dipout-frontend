import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DollarSign, Car, Users, TrendingUp, Star, CheckCircle2, XCircle, ArrowLeft, Download } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { Activity, BarChart3 } from 'lucide-react';
import StatCard from '@/components/admin/StatCard';
import SurgeZoneManager from '@/components/admin/SurgeZoneManager';
import DriverDocViewer from '@/components/admin/DriverDocViewer';
import DailyRevenueChart from '@/components/admin/DailyRevenueChart';
import PricingControls from '@/components/admin/PricingControls';
import AdminContact from '@/components/admin/AdminContact';
import { Sheet } from 'lucide-react';

const statusColors = {
  requested: 'bg-accent text-accent-foreground',
  accepted: 'bg-primary/15 text-primary',
  in_progress: 'bg-primary/15 text-primary',
  completed: 'bg-primary text-primary-foreground',
  cancelled: 'bg-destructive/15 text-destructive',
};



export default function AdminDashboard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const approveDriver = async (driver) => {
    await base44.entities.DriverProfile.update(driver.id, { approved: true });
    queryClient.invalidateQueries({ queryKey: ['admin-drivers'] });
  };

  const fireDriver = async (driver) => {
    await base44.entities.DriverProfile.update(driver.id, { approved: false, status: 'offline' });
    queryClient.invalidateQueries({ queryKey: ['admin-drivers'] });
  };

  const downloadCSV = async () => {
    // Fetch all rides (not just 100)
    const allRides = await base44.entities.Ride.list('-created_date', 1000);
    
    const headers = [
      'Date', 'Time', 'Rider Email', 'Driver Email', 'Pickup Address', 
      'Dropoff Address', 'Distance (mi)', 'Base Fare', 'Surge Multiplier', 
      'Total Fare', 'Payment Method', 'Payment Status', 'Status', 
      'Rider Rating', 'Rider Comment'
    ];
    
    const rows = allRides.map(r => [
      r.created_date ? format(new Date(r.created_date), 'yyyy-MM-dd') : '',
      r.created_date ? format(new Date(r.created_date), 'HH:mm:ss') : '',
      r.rider_email || '',
      r.driver_email || '',
      r.pickup_address || '',
      r.dropoff_address || '',
      (r.distance_km || 0).toFixed(1),
      (r.base_fare || 0).toFixed(2),
      (r.surge_multiplier || 1).toFixed(2),
      (r.fare || 0).toFixed(2),
      r.payment_method || '',
      r.payment_status || '',
      r.status || '',
      r.rider_rating || '',
      r.rider_comment || ''
    ].map(field => `"${String(field).replace(/"/g, '""')}"`).join(','));
    
    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `dip_out_rides_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
  };

  const { data: rides = [] } = useQuery({
    queryKey: ['admin-rides'],
    queryFn: () => base44.entities.Ride.list('-created_date', 100),
    refetchInterval: 10000,
  });
  const { data: drivers = [] } = useQuery({
    queryKey: ['admin-drivers'],
    queryFn: () => base44.entities.DriverProfile.list('-created_date', 100),
    refetchInterval: 10000,
  });

  const completed = rides.filter((r) => r.status === 'completed');
  const revenue = completed.filter((r) => r.payment_status === 'paid').reduce((s, r) => s + (r.fare || 0), 0);
  const avgSurge = rides.length
    ? rides.reduce((s, r) => s + (r.surge_multiplier || 1), 0) / rides.length
    : 1;
  const online = drivers.filter((d) => d.status !== 'offline').length;

  return (
    <div className="max-w-6xl mx-auto p-5 md:p-8 space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="h-9 w-9">
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-display font-bold">Operations</h1>
            <p className="text-sm text-muted-foreground">Live fleet, rides and dynamic pricing analytics.</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => navigate('/admin/monitoring')} variant="outline" className="gap-2">
            <BarChart3 className="w-4 h-4" /> Monitoring
          </Button>
          <Button onClick={downloadCSV} variant="outline" className="gap-2">
            <Download className="w-4 h-4" /> Export CSV
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard icon={DollarSign} label="Revenue" value={`$${revenue.toFixed(2)}`} sub={`${completed.length} completed trips`} />
        <StatCard icon={Car} label="Rides" value={rides.length} sub={`${rides.filter((r) => ['requested', 'accepted', 'in_progress'].includes(r.status)).length} active now`} />
        <StatCard icon={Users} label="Drivers" value={drivers.length} sub={`${online} online`} />
        <StatCard icon={TrendingUp} label="Avg surge" value={`${avgSurge.toFixed(2)}x`} sub="AI dynamic pricing" />
      </div>

      {/* Google Sheets Integration Status */}
      <div className="rounded-2xl border border-border bg-card p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center">
            <Sheet className="w-5 h-5 text-green-500" />
          </div>
          <div>
            <h3 className="font-semibold text-sm">Google Sheets Sync</h3>
            <p className="text-xs text-muted-foreground">All completed rides are automatically logged for tax reporting</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1 text-xs text-green-500 font-medium">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            Active
          </span>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <DailyRevenueChart rides={rides} />
        <PricingControls />
      </div>

      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <div className="p-4 border-b border-border font-semibold">Recent rides</div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>When</TableHead>
                <TableHead>Rider</TableHead>
                <TableHead>Driver</TableHead>
                <TableHead>Route</TableHead>
                <TableHead>Fare</TableHead>
                <TableHead>Surge</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Payment</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rides.slice(0, 25).map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="whitespace-nowrap text-muted-foreground">
                    {format(new Date(r.created_date), 'MMM d, HH:mm')}
                  </TableCell>
                  <TableCell className="max-w-[140px] truncate">{r.rider_email}</TableCell>
                  <TableCell className="max-w-[140px] truncate">{r.driver_email || '—'}</TableCell>
                  <TableCell className="max-w-[180px] truncate text-muted-foreground">
                    {r.pickup_address} → {r.dropoff_address}
                  </TableCell>
                  <TableCell className="font-medium">${r.fare?.toFixed(2)}</TableCell>
                  <TableCell>{r.surge_multiplier}x</TableCell>
                  <TableCell>
                    <Badge className={`${statusColors[r.status]} capitalize border-0`}>{r.status.replace('_', ' ')}</Badge>
                  </TableCell>
                  <TableCell className="capitalize text-muted-foreground">{r.payment_method || '—'}</TableCell>
                  <TableCell className="capitalize text-muted-foreground">{r.payment_status}</TableCell>
                </TableRow>
              ))}
              {rides.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} className="text-center text-muted-foreground py-8">No rides yet</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <span className="font-semibold">Drivers</span>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5 text-primary" /> {drivers.filter(d => d.approved).length} hired</span>
            <span className="flex items-center gap-1"><XCircle className="w-3.5 h-3.5 text-destructive" /> {drivers.filter(d => !d.approved).length} pending</span>
          </div>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Driver</TableHead>
              <TableHead>Vehicle</TableHead>
              <TableHead>Approval</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Trips</TableHead>
              <TableHead>Rating</TableHead>
              <TableHead>Earnings</TableHead>
              <TableHead>Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {drivers.map((d) => (
              <TableRow key={d.id}>
                <TableCell className="max-w-[140px] truncate">{d.user_email}</TableCell>
                <TableCell className="text-muted-foreground">{d.vehicle} · {d.plate}</TableCell>
                <TableCell>
                  {d.approved
                    ? <Badge className="bg-primary/15 text-primary border-0 flex items-center gap-1 w-fit"><CheckCircle2 className="w-3 h-3" /> Hired</Badge>
                    : <Badge variant="outline" className="text-muted-foreground flex items-center gap-1 w-fit">Pending</Badge>
                  }
                </TableCell>
                <TableCell>
                  <Badge variant={d.status === 'offline' ? 'outline' : 'default'} className="capitalize">{d.status}</Badge>
                </TableCell>
                <TableCell>{d.trips_completed || 0}</TableCell>
                <TableCell>
                  <span className="flex items-center gap-1 font-medium">
                    <Star className="w-3.5 h-3.5 text-primary fill-primary" />
                    {(d.rating || 5).toFixed(1)}
                    <span className="text-xs text-muted-foreground">({d.total_ratings || 0})</span>
                  </span>
                </TableCell>
                <TableCell className="font-medium">${(d.total_earnings || 0).toFixed(2)}</TableCell>
                <TableCell>
                  {d.approved ? (
                    <button
                      onClick={() => fireDriver(d)}
                      className="flex items-center gap-1 text-xs text-destructive hover:underline font-medium"
                    >
                      <XCircle className="w-3.5 h-3.5" /> Fire
                    </button>
                  ) : (
                    <button
                      onClick={() => approveDriver(d)}
                      className="flex items-center gap-1 text-xs text-primary hover:underline font-medium"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" /> Hire
                    </button>
                  )}
                </TableCell>
              </TableRow>
            ))}
            {drivers.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground py-8">No drivers yet</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <AdminContact />
      <SurgeZoneManager />
      <DriverDocViewer drivers={drivers} />

      {/* Leaderboard */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <div className="p-4 border-b border-border flex items-center gap-2">
          <Star className="w-4 h-4 text-primary fill-primary" />
          <span className="font-semibold">Driver Leaderboard</span>
          <span className="text-xs text-muted-foreground ml-1">ranked by rating · trips</span>
        </div>
        <div className="divide-y divide-border">
          {[...drivers]
            .sort((a, b) => {
              const ratingDiff = (b.rating || 5) - (a.rating || 5);
              if (ratingDiff !== 0) return ratingDiff;
              return (b.trips_completed || 0) - (a.trips_completed || 0);
            })
            .map((d, i) => {
              const medal = ['🥇', '🥈', '🥉'][i] || `#${i + 1}`;
              return (
                <div key={d.id} className="flex items-center gap-4 px-4 py-3">
                  <span className="text-xl w-8 text-center">{medal}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{d.user_email}</p>
                    <p className="text-xs text-muted-foreground">{d.vehicle}</p>
                  </div>
                  <div className="flex items-center gap-3 text-sm shrink-0">
                    <span className="flex items-center gap-1 font-bold">
                      <Star className="w-3.5 h-3.5 text-primary fill-primary" />
                      {(d.rating || 5).toFixed(1)}
                    </span>
                    <span className="text-muted-foreground">{d.trips_completed || 0} trips</span>
                  </div>
                </div>
              );
            })}
          {drivers.length === 0 && (
            <p className="text-center text-muted-foreground py-8 text-sm">No drivers yet</p>
          )}
        </div>
      </div>
    </div>
  );
}