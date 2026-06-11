import React from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DollarSign, Car, Users, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';
import StatCard from '@/components/admin/StatCard';

const statusColors = {
  requested: 'bg-accent text-accent-foreground',
  accepted: 'bg-primary/15 text-primary',
  in_progress: 'bg-primary/15 text-primary',
  completed: 'bg-primary text-primary-foreground',
  cancelled: 'bg-destructive/15 text-destructive',
};

export default function AdminDashboard() {
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
      <div>
        <h1 className="text-3xl font-display font-bold">Operations</h1>
        <p className="text-sm text-muted-foreground">Live fleet, rides and dynamic pricing analytics.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard icon={DollarSign} label="Revenue" value={`$${revenue.toFixed(2)}`} sub={`${completed.length} completed trips`} />
        <StatCard icon={Car} label="Rides" value={rides.length} sub={`${rides.filter((r) => ['requested', 'accepted', 'in_progress'].includes(r.status)).length} active now`} />
        <StatCard icon={Users} label="Drivers" value={drivers.length} sub={`${online} online`} />
        <StatCard icon={TrendingUp} label="Avg surge" value={`${avgSurge.toFixed(2)}x`} sub="AI dynamic pricing" />
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
                  <TableCell className="capitalize text-muted-foreground">{r.payment_status}</TableCell>
                </TableRow>
              ))}
              {rides.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted-foreground py-8">No rides yet</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <div className="p-4 border-b border-border font-semibold">Drivers</div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Driver</TableHead>
              <TableHead>Vehicle</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Trips</TableHead>
              <TableHead>Earnings</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {drivers.map((d) => (
              <TableRow key={d.id}>
                <TableCell className="max-w-[160px] truncate">{d.user_email}</TableCell>
                <TableCell className="text-muted-foreground">{d.vehicle} · {d.plate}</TableCell>
                <TableCell>
                  <Badge variant={d.status === 'offline' ? 'outline' : 'default'} className="capitalize">{d.status}</Badge>
                </TableCell>
                <TableCell>{d.trips_completed || 0}</TableCell>
                <TableCell className="font-medium">${(d.total_earnings || 0).toFixed(2)}</TableCell>
              </TableRow>
            ))}
            {drivers.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">No drivers yet</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}