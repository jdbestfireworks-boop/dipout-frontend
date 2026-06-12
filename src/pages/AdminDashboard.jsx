import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  DollarSign, Car, Users, TrendingUp, Star, CheckCircle2, XCircle,
  Download, BarChart3, Sheet, Activity, FileText, Settings, ChevronRight,
  Clock, MapPin, CreditCard, AlertCircle
} from 'lucide-react';
import { format } from 'date-fns';
import { Link, useNavigate } from 'react-router-dom';
import StatCard from '@/components/admin/StatCard';
import SurgeZoneManager from '@/components/admin/SurgeZoneManager';
import DriverDocViewer from '@/components/admin/DriverDocViewer';
import DailyRevenueChart from '@/components/admin/DailyRevenueChart';
import PricingControls from '@/components/admin/PricingControls';
import AdminContact from '@/components/admin/AdminContact';

const statusColors = {
  requested:   'bg-yellow-500/15 text-yellow-400',
  accepted:    'bg-blue-500/15 text-blue-400',
  in_progress: 'bg-primary/15 text-primary',
  completed:   'bg-green-500/15 text-green-400',
  cancelled:   'bg-destructive/15 text-destructive',
};

const TABS = [
  { id: 'overview',  label: 'Overview',  icon: Activity },
  { id: 'rides',     label: 'Rides',     icon: Car },
  { id: 'drivers',   label: 'Drivers',   icon: Users },
  { id: 'settings',  label: 'Settings',  icon: Settings },
];

export default function AdminDashboard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState('overview');

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

  const approveDriver = async (driver) => {
    await base44.entities.DriverProfile.update(driver.id, { approved: true });
    queryClient.invalidateQueries({ queryKey: ['admin-drivers'] });
  };

  const fireDriver = async (driver) => {
    await base44.entities.DriverProfile.update(driver.id, { approved: false, status: 'offline' });
    queryClient.invalidateQueries({ queryKey: ['admin-drivers'] });
  };

  const downloadCSV = async () => {
    const allRides = await base44.entities.Ride.list('-created_date', 1000);
    const headers = ['Date','Time','Rider','Driver','Pickup','Dropoff','Distance (km)','Base Fare','Surge','Total Fare','Payment','Status'];
    const rows = allRides.map(r => [
      r.created_date ? format(new Date(r.created_date), 'yyyy-MM-dd') : '',
      r.created_date ? format(new Date(r.created_date), 'HH:mm') : '',
      r.rider_email || '', r.driver_email || '',
      r.pickup_address || '', r.dropoff_address || '',
      (r.distance_km || 0).toFixed(1),
      (r.base_fare || 0).toFixed(2),
      (r.surge_multiplier || 1).toFixed(2),
      (r.fare || 0).toFixed(2),
      r.payment_status || '', r.status || '',
    ].map(f => `"${String(f).replace(/"/g,'""')}"`).join(','));
    const blob = new Blob([[headers.join(','), ...rows].join('\n')], { type: 'text/csv' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `dip_out_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
  };

  // Derived stats
  const completed   = rides.filter(r => r.status === 'completed');
  const active      = rides.filter(r => ['requested','accepted','in_progress'].includes(r.status));
  const revenue     = completed.filter(r => r.payment_status === 'paid').reduce((s, r) => s + (r.fare || 0), 0);
  const avgSurge    = rides.length ? rides.reduce((s, r) => s + (r.surge_multiplier || 1), 0) / rides.length : 1;
  const online      = drivers.filter(d => d.status !== 'offline').length;
  const pending     = drivers.filter(d => !d.approved);
  const hired       = drivers.filter(d => d.approved);

  return (
    <div className="min-h-screen bg-background">
      {/* Top header bar */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur border-b border-border">
        <div className="max-w-6xl mx-auto px-5 py-4 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-display font-bold leading-none">Admin Dashboard</h1>
            <p className="text-xs text-muted-foreground mt-0.5">Dip Out Operations</p>
          </div>
          <div className="flex items-center gap-2">
            {pending.length > 0 && (
              <button onClick={() => setTab('drivers')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-yellow-500/15 text-yellow-400 text-xs font-semibold animate-pulse">
                <AlertCircle className="w-3.5 h-3.5" />
                {pending.length} pending approval
              </button>
            )}
            <Button onClick={() => navigate('/admin/monitoring')} variant="outline" size="sm" className="gap-1.5 hidden sm:flex">
              <BarChart3 className="w-3.5 h-3.5" /> Monitoring
            </Button>
            <Button onClick={downloadCSV} variant="outline" size="sm" className="gap-1.5">
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Export</span>
            </Button>
          </div>
        </div>

        {/* Tab bar */}
        <div className="max-w-6xl mx-auto px-5">
          <div className="flex gap-1">
            {TABS.map(t => {
              const Icon = t.icon;
              const isActive = tab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                    isActive
                      ? 'border-primary text-primary'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {t.label}
                  {t.id === 'drivers' && pending.length > 0 && (
                    <span className="w-4 h-4 rounded-full bg-yellow-500 text-background text-[10px] font-bold flex items-center justify-center">
                      {pending.length}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-5 py-6 space-y-6">

        {/* ── OVERVIEW ─────────────────────────────────────────── */}
        {tab === 'overview' && (
          <>
            {/* Stat cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              <StatCard icon={DollarSign} label="Revenue" value={`$${revenue.toFixed(2)}`} sub={`${completed.length} completed`} />
              <StatCard icon={Car}        label="Active Rides" value={active.length}     sub={`${rides.length} total`} />
              <StatCard icon={Users}      label="Drivers"      value={drivers.length}    sub={`${online} online now`} />
              <StatCard icon={TrendingUp} label="Avg Surge"    value={`${avgSurge.toFixed(2)}x`} sub="AI dynamic pricing" />
            </div>

            {/* Sheets sync status */}
            <div className="rounded-2xl border border-border bg-card p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-green-500/10 flex items-center justify-center">
                  <Sheet className="w-4.5 h-4.5 text-green-500" />
                </div>
                <div>
                  <p className="font-semibold text-sm">Google Sheets Sync</p>
                  <p className="text-xs text-muted-foreground">Completed rides logged automatically for tax reporting</p>
                </div>
              </div>
              <span className="flex items-center gap-1.5 text-xs text-green-500 font-medium shrink-0">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" /> Active
              </span>
            </div>

            {/* Charts */}
            <div className="grid gap-4 lg:grid-cols-2">
              <DailyRevenueChart rides={rides} />
              <PricingControls />
            </div>

            {/* Recent rides summary */}
            <div className="rounded-2xl border border-border bg-card overflow-hidden">
              <div className="px-4 py-3 border-b border-border flex items-center justify-between">
                <span className="font-semibold text-sm">Recent Rides</span>
                <button onClick={() => setTab('rides')} className="text-xs text-primary flex items-center gap-1 hover:underline">
                  View all <ChevronRight className="w-3 h-3" />
                </button>
              </div>
              <div className="divide-y divide-border">
                {rides.slice(0, 5).map(r => (
                  <div key={r.id} className="flex items-center gap-3 px-4 py-3">
                    <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center shrink-0">
                      <MapPin className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{r.pickup_address} → {r.dropoff_address}</p>
                      <p className="text-xs text-muted-foreground">{r.rider_email} · {r.created_date ? format(new Date(r.created_date), 'MMM d, HH:mm') : ''}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="font-bold text-sm">${(r.fare || 0).toFixed(2)}</span>
                      <Badge className={`${statusColors[r.status]} border-0 capitalize text-[10px]`}>{r.status.replace('_',' ')}</Badge>
                    </div>
                  </div>
                ))}
                {rides.length === 0 && <p className="text-center text-muted-foreground py-8 text-sm">No rides yet</p>}
              </div>
            </div>

            {/* Driver leaderboard */}
            <div className="rounded-2xl border border-border bg-card overflow-hidden">
              <div className="px-4 py-3 border-b border-border flex items-center gap-2">
                <Star className="w-4 h-4 text-primary fill-primary" />
                <span className="font-semibold text-sm">Driver Leaderboard</span>
                <span className="text-xs text-muted-foreground">by rating &amp; trips</span>
              </div>
              <div className="divide-y divide-border">
                {[...drivers].sort((a,b) => {
                  const rd = (b.rating||5) - (a.rating||5);
                  return rd !== 0 ? rd : (b.trips_completed||0) - (a.trips_completed||0);
                }).slice(0, 5).map((d, i) => (
                  <div key={d.id} className="flex items-center gap-4 px-4 py-3">
                    <span className="text-lg w-8 text-center">{['🥇','🥈','🥉'][i] || `#${i+1}`}</span>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{d.user_email}</p>
                      <p className="text-xs text-muted-foreground">{d.vehicle}</p>
                    </div>
                    <div className="flex items-center gap-3 text-sm shrink-0">
                      <span className="flex items-center gap-1 font-bold">
                        <Star className="w-3.5 h-3.5 text-primary fill-primary" />
                        {(d.rating||5).toFixed(1)}
                      </span>
                      <span className="text-muted-foreground text-xs">{d.trips_completed||0} trips</span>
                    </div>
                  </div>
                ))}
                {drivers.length === 0 && <p className="text-sm text-muted-foreground text-center py-6">No drivers yet</p>}
              </div>
            </div>
          </>
        )}

        {/* ── RIDES ────────────────────────────────────────────── */}
        {tab === 'rides' && (
          <div className="rounded-2xl border border-border bg-card overflow-hidden">
            <div className="px-4 py-3 border-b border-border flex items-center justify-between">
              <span className="font-semibold">All Rides</span>
              <span className="text-xs text-muted-foreground">{rides.length} total</span>
            </div>
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
                    <TableHead>Payment</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rides.map(r => (
                    <TableRow key={r.id}>
                      <TableCell className="whitespace-nowrap text-muted-foreground text-xs">
                        {r.created_date ? format(new Date(r.created_date), 'MMM d, HH:mm') : '—'}
                      </TableCell>
                      <TableCell className="max-w-[140px] truncate text-sm">{r.rider_email}</TableCell>
                      <TableCell className="max-w-[140px] truncate text-sm text-muted-foreground">{r.driver_email || '—'}</TableCell>
                      <TableCell className="max-w-[200px] truncate text-xs text-muted-foreground">
                        {r.pickup_address} → {r.dropoff_address}
                      </TableCell>
                      <TableCell className="font-semibold">${(r.fare||0).toFixed(2)}</TableCell>
                      <TableCell className="text-muted-foreground text-sm">{r.surge_multiplier||1}x</TableCell>
                      <TableCell>
                        <Badge className={`${statusColors[r.status]} border-0 capitalize text-[10px]`}>{r.status.replace('_',' ')}</Badge>
                      </TableCell>
                      <TableCell>
                        <span className={`text-xs font-medium ${r.payment_status === 'paid' ? 'text-green-400' : 'text-muted-foreground'}`}>
                          {r.payment_status} · {r.payment_method || '—'}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                  {rides.length === 0 && (
                    <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-10">No rides yet</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        {/* ── DRIVERS ──────────────────────────────────────────── */}
        {tab === 'drivers' && (
          <div className="space-y-4">
            {/* Pending approvals — prominent */}
            {pending.length > 0 && (
              <div className="rounded-2xl border-2 border-yellow-500/30 bg-yellow-500/5 overflow-hidden">
                <div className="px-4 py-3 border-b border-yellow-500/20 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-yellow-500" />
                  <span className="font-semibold text-sm text-yellow-400">{pending.length} Pending Approval</span>
                </div>
                <div className="divide-y divide-yellow-500/10">
                  {pending.map(d => (
                    <DriverRow key={d.id} driver={d} onApprove={approveDriver} onFire={fireDriver} />
                  ))}
                </div>
              </div>
            )}

            {/* All drivers */}
            <div className="rounded-2xl border border-border bg-card overflow-hidden">
              <div className="px-4 py-3 border-b border-border flex items-center justify-between">
                <span className="font-semibold text-sm">All Drivers</span>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500" />{hired.length} hired</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-secondary border border-border" />{pending.length} pending</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-primary" />{online} online</span>
                </div>
              </div>
              <div className="divide-y divide-border">
                {drivers.map(d => (
                  <DriverRow key={d.id} driver={d} onApprove={approveDriver} onFire={fireDriver} />
                ))}
                {drivers.length === 0 && <p className="text-sm text-muted-foreground text-center py-10">No drivers yet</p>}
              </div>
            </div>

            <DriverDocViewer drivers={drivers} />
          </div>
        )}

        {/* ── SETTINGS ─────────────────────────────────────────── */}
        {tab === 'settings' && (
          <div className="space-y-4">
            <PricingControls />
            <SurgeZoneManager />
            <AdminContact />
          </div>
        )}

      </div>
    </div>
  );
}

// ── Driver row component ─────────────────────────────────────────
function DriverRow({ driver: d, onApprove, onFire }) {
  const statusDot = {
    offline:   'bg-secondary border border-border',
    available: 'bg-green-500',
    busy:      'bg-primary',
  }[d.status] || 'bg-secondary';

  return (
    <div className="flex items-center gap-3 px-4 py-3 hover:bg-accent/20 transition-colors">
      {/* Avatar */}
      <div className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center shrink-0 text-sm font-bold relative">
        {(d.user_email?.[0] || '?').toUpperCase()}
        <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-background ${statusDot}`} />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{d.user_email}</p>
        <p className="text-xs text-muted-foreground truncate">{d.vehicle} · {d.plate}</p>
      </div>

      {/* Stats */}
      <div className="hidden sm:flex items-center gap-4 text-xs text-muted-foreground shrink-0">
        <span className="flex items-center gap-1">
          <Star className="w-3 h-3 text-primary fill-primary" />
          {(d.rating||5).toFixed(1)}
        </span>
        <span>{d.trips_completed||0} trips</span>
        <span className="font-medium text-foreground">${(d.total_earnings||0).toFixed(0)}</span>
      </div>

      {/* Approval badge + action */}
      <div className="flex items-center gap-2 shrink-0">
        {d.approved ? (
          <Badge className="bg-green-500/15 text-green-400 border-0 text-[10px] hidden sm:flex">Hired</Badge>
        ) : (
          <Badge className="bg-yellow-500/15 text-yellow-400 border-0 text-[10px] hidden sm:flex">Pending</Badge>
        )}
        {d.approved ? (
          <Button size="sm" variant="outline"
            onClick={() => onFire(d)}
            className="h-7 px-2.5 text-xs text-destructive border-destructive/30 hover:bg-destructive/10">
            <XCircle className="w-3.5 h-3.5 mr-1" /> Fire
          </Button>
        ) : (
          <Button size="sm"
            onClick={() => onApprove(d)}
            className="h-7 px-2.5 text-xs bg-green-600 hover:bg-green-700 text-white">
            <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Approve
          </Button>
        )}
      </div>
    </div>
  );
}