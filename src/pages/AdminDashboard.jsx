import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  DollarSign, Car, Users, TrendingUp, Star, CheckCircle2, XCircle,
  Download, BarChart3, Sheet, Activity, Settings, AlertCircle,
  RefreshCw, ExternalLink, MapPin, Menu, X, ShieldCheck, Clock, HardDrive
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import StatCard from '@/components/admin/StatCard';
import SurgeZoneManager from '@/components/admin/SurgeZoneManager';
import DriverDocViewer from '@/components/admin/DriverDocViewer';
import DailyRevenueChart from '@/components/admin/DailyRevenueChart';
import DashboardSummaryCharts from '@/components/admin/DashboardSummaryCharts';
import PricingControls from '@/components/admin/PricingControls';
import PickupHeatmap from '@/components/admin/PickupHeatmap';
import AdminContact from '@/components/admin/AdminContact';
import AdminSidebar from '@/components/admin/AdminSidebar';
import RevenueTab from '@/components/admin/RevenueTab';
import DriverTrackingMap from '@/components/admin/DriverTrackingMap.jsx';
import DriverPerformanceTab from '@/components/admin/DriverPerformanceTab';
import DriverEarningsTab from '@/components/admin/DriverEarningsTab';
import AIAssistantPanel from '@/components/admin/AIAssistantPanel';
import DriverManagementPanel from '@/components/admin/DriverManagementPanel';
import MonthlyReportTab from '@/components/admin/MonthlyReportTab';
import DriverAlertsTab from '@/components/admin/DriverAlertsTab';
import SystemAlertsPanel from '@/components/admin/SystemAlertsPanel';
import UserManagementPanel from '@/components/admin/UserManagementPanel';
import AdvancedAnalytics from '@/components/admin/AdvancedAnalytics';
import { cn } from '@/lib/utils';

const statusColors = {
  requested:   'bg-yellow-500/15 text-yellow-400',
  accepted:    'bg-blue-500/15 text-blue-400',
  in_progress: 'bg-primary/15 text-primary',
  completed:   'bg-green-500/15 text-green-400',
  cancelled:   'bg-destructive/15 text-destructive',
};

export default function AdminDashboard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState('overview');
  const [syncing, setSyncing] = useState(false);
  const [sheetUrl, setSheetUrl] = useState(null);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

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

  const bulkSync = async () => {
    setSyncing(true);
    try {
      const res = await base44.functions.invoke('bulkSyncRidesToSheets', {});
      setSheetUrl(res.data.spreadsheet_url);
      toast.success(`Exported ${res.data.rides_synced} rides + ${res.data.drivers_synced} drivers to Google Sheets`);
    } catch (err) {
      toast.error('Sync failed: ' + err.message);
    } finally {
      setSyncing(false);
    }
  };

  const approveDriver = async (driver) => {
    await base44.entities.DriverProfile.update(driver.id, { approved: true });
    queryClient.invalidateQueries({ queryKey: ['admin-drivers'] });
    toast.success(`Driver hired successfully!`);
  };

  const fireDriver = async (driver) => {
    await base44.entities.DriverProfile.update(driver.id, { approved: false, status: 'offline' });
    queryClient.invalidateQueries({ queryKey: ['admin-drivers'] });
    toast.success(`Driver fired successfully!`);
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
  const completed  = rides.filter(r => r.status === 'completed');
  const active     = rides.filter(r => ['requested','accepted','in_progress'].includes(r.status));
  const revenue    = completed.filter(r => r.payment_status === 'paid').reduce((s, r) => s + (r.fare || 0), 0);
  const avgSurge   = rides.length ? rides.reduce((s, r) => s + (r.surge_multiplier || 1), 0) / rides.length : 1;
  const online     = drivers.filter(d => d.status !== 'offline').length;
  const pending    = drivers.filter(d => !d.approved);
  const hired      = drivers.filter(d => d.approved);

  const handleTabChange = (t) => {
    setTab(t);
    setMobileSidebarOpen(false);
  };

  return (
    <div className="flex min-h-screen bg-background w-full">
      {/* Desktop sidebar */}
      <AdminSidebar tab={tab} setTab={handleTabChange} pendingCount={pending.length} />

      {/* Mobile sidebar overlay */}
      {mobileSidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/60" onClick={() => setMobileSidebarOpen(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-56 bg-card border-r border-border z-50">
            <AdminSidebar tab={tab} setTab={handleTabChange} pendingCount={pending.length} />
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 w-full">
        {/* Top bar */}
        <header className="sticky top-0 z-20 bg-background/95 backdrop-blur border-b border-border px-3 sm:px-5 py-2 sm:py-3 flex items-center justify-between gap-2 sm:gap-3">
          <div className="flex items-center gap-3">
            {/* Mobile menu toggle */}
            <button
              className="lg:hidden p-2 rounded-lg hover:bg-accent transition-colors"
              onClick={() => setMobileSidebarOpen(true)}
            >
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <h1 className="font-display font-bold text-base leading-none capitalize">
                {tab === 'overview' ? 'Overview' : tab === 'rides' ? 'Ride History' : tab === 'drivers' ? 'Driver Management' : tab === 'performance' ? 'Driver Performance' : tab === 'earnings' ? 'Driver Earnings' : tab === 'reports' ? 'Monthly Reports' : tab === 'alerts' ? 'Driver Alerts' : tab === 'ai' ? 'AI Assistant' : tab === 'revenue' ? 'Revenue' : tab === 'map' ? 'Driver Map' : 'Settings'}
              </h1>
              <p className="text-[11px] text-muted-foreground mt-0.5 hidden sm:block">Dip Out Operations</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {pending.length > 0 && (
              <button onClick={() => handleTabChange('drivers')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-yellow-500/15 text-yellow-400 text-xs font-semibold">
                <AlertCircle className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{pending.length} pending</span>
                <span className="sm:hidden">{pending.length}</span>
              </button>
            )}
            <a href="/admin/test" className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-card hover:bg-accent transition-colors text-xs font-medium">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Test Suite</span>
            </a>
            <Button onClick={() => navigate('/admin/test')} variant="outline" size="sm" className="gap-1.5 h-8">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Test Suite</span>
            </Button>
            <Button onClick={() => navigate('/admin/migrate')} variant="outline" size="sm" className="gap-1.5 h-8">
              <HardDrive className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Migrate Data</span>
            </Button>
            <Button onClick={downloadCSV} variant="outline" size="sm" className="gap-1.5 h-8">
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Export CSV</span>
            </Button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-3 sm:p-5 space-y-4 sm:space-y-6 w-full max-w-full sm:max-w-5xl mx-auto">

          {/* ── OVERVIEW ── */}
          {tab === 'overview' && (
            <>
              <DashboardSummaryCharts rides={rides} drivers={drivers} />

              {/* Sheets sync */}
              <div className="rounded-2xl border border-border bg-card p-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-green-500/10 flex items-center justify-center shrink-0">
                    <Sheet className="w-4 h-4 text-green-500" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-sm">Google Sheets Sync</p>
                    <p className="text-xs text-muted-foreground">Auto-sync active · paid completed rides</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {sheetUrl && (
                    <a href={sheetUrl} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs text-primary hover:underline">
                      <ExternalLink className="w-3 h-3" /> Open
                    </a>
                  )}
                  <Button size="sm" variant="outline" onClick={bulkSync} disabled={syncing} className="gap-1.5 h-8">
                    <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
                    {syncing ? 'Syncing…' : 'Sync All'}
                  </Button>
                </div>
              </div>

              <PickupHeatmap rides={rides} />

              <div className="grid gap-4 sm:gap-6 grid-cols-1 xl:grid-cols-2">
                <DailyRevenueChart rides={rides} />
                <PricingControls />
              </div>

              {/* Recent rides */}
              <div className="rounded-2xl border border-border bg-card overflow-hidden">
                <div className="px-4 py-3 border-b border-border flex items-center justify-between">
                  <span className="font-semibold text-sm">Recent Rides</span>
                  <button onClick={() => handleTabChange('rides')} className="text-xs text-primary hover:underline">View all →</button>
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
            </>
          )}

          {/* ── RIDE HISTORY ── */}
          {tab === 'rides' && (
            <div className="rounded-2xl border border-border bg-card overflow-hidden">
              <div className="px-3 sm:px-4 py-3 border-b border-border flex items-center justify-between">
                <span className="font-semibold text-sm sm:text-base">All Rides</span>
                <span className="text-xs text-muted-foreground">{rides.length} total</span>
              </div>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">When</TableHead>
                      <TableHead className="text-xs">Rider</TableHead>
                      <TableHead className="text-xs">Driver</TableHead>
                      <TableHead className="text-xs min-w-[200px]">Route</TableHead>
                      <TableHead className="text-xs">Fare</TableHead>
                      <TableHead className="text-xs">Surge</TableHead>
                      <TableHead className="text-xs">Status</TableHead>
                      <TableHead className="text-xs">Payment</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rides.map(r => (
                      <TableRow key={r.id}>
                        <TableCell className="whitespace-nowrap text-muted-foreground text-[10px] sm:text-xs">
                          {r.created_date ? format(new Date(r.created_date), 'MMM d, HH:mm') : '—'}
                        </TableCell>
                        <TableCell className="max-w-[100px] sm:max-w-[140px] truncate text-xs sm:text-sm">{r.rider_email}</TableCell>
                        <TableCell className="max-w-[100px] sm:max-w-[140px] truncate text-xs sm:text-sm text-muted-foreground">{r.driver_email || '—'}</TableCell>
                        <TableCell className="max-w-[150px] sm:max-w-[200px] truncate text-[10px] sm:text-xs text-muted-foreground">
                          {r.pickup_address} → {r.dropoff_address}
                        </TableCell>
                        <TableCell className="font-semibold text-xs sm:text-sm">${(r.fare||0).toFixed(2)}</TableCell>
                        <TableCell className="text-muted-foreground text-xs sm:text-sm">{r.surge_multiplier||1}x</TableCell>
                        <TableCell>
                          <Badge className={`${statusColors[r.status]} border-0 capitalize text-[9px] sm:text-[10px]`}>{r.status.replace('_',' ')}</Badge>
                        </TableCell>
                        <TableCell>
                          <span className={`text-[10px] sm:text-xs font-medium ${r.payment_status === 'paid' ? 'text-green-400' : 'text-muted-foreground'}`}>
                            {r.payment_status} · {r.payment_method || '—'}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                    {rides.length === 0 && (
                      <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8 sm:py-10 text-xs sm:text-sm">No rides yet</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}



          {/* ── DRIVER MANAGEMENT ── */}
          {tab === 'drivers' && <DriverManagementPanel />}

          {/* ── SYSTEM ALERTS ── */}
          {tab === 'alerts' && <SystemAlertsPanel />}

          {/* ── USER MANAGEMENT ── */}
          {tab === 'users' && <UserManagementPanel users={[]} rides={rides} />}

          {/* ── DRIVER PERFORMANCE ── */}
          {tab === 'performance' && <DriverPerformanceTab rides={rides} drivers={drivers} />}

          {/* ── REVENUE ── */}
          {tab === 'revenue' && <RevenueTab rides={rides} drivers={drivers} />}

          {/* ── DRIVER MAP ── */}
          {tab === 'map' && (
            <DriverTrackingMap drivers={drivers} rides={rides} />
          )}

          {/* ── SETTINGS ── */}
          {tab === 'settings' && (
            <div className="space-y-4">
              <PricingControls />
              <SurgeZoneManager />
              <AdminContact />
            </div>
          )}

          {/* ── EARNINGS ── */}
          {tab === 'earnings' && <DriverEarningsTab />}

          {/* ── MONTHLY REPORTS ── */}
          {tab === 'reports' && <MonthlyReportTab rides={rides} drivers={drivers} />}

          {/* ── SYSTEM ALERTS ── */}
          {tab === 'system-alerts' && <SystemAlertsPanel />}

          {/* ── USER MANAGEMENT ── */}
          {tab === 'users' && <UserManagementPanel rides={rides} />}

          {/* ── ADVANCED ANALYTICS ── */}
          {tab === 'analytics' && <AdvancedAnalytics rides={rides} drivers={drivers} />}

          {/* ── DRIVER ALERTS ── */}
          {tab === 'alerts' && <DriverAlertsTab />}

          {/* ── AI ASSISTANT ── */}
          {tab === 'ai' && <AIAssistantPanel />}

        </main>
      </div>
    </div>
  );
}