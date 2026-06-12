import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import {
  Activity, Users, Car, DollarSign, TrendingUp, AlertTriangle,
  CheckCircle2, XCircle, RefreshCw, Zap, Shield, Settings,
  MapPin, Clock, Star, Phone, Mail, Navigation
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function ControlCenter() {
  const queryClient = useQueryClient();
  const [activeSection, setActiveSection] = useState('overview');

  // Fetch all data
  const { data: rides = [], refetch: refetchRides } = useQuery({
    queryKey: ['admin-all-rides'],
    queryFn: () => base44.entities.Ride.list('-created_date', 200),
    refetchInterval: 15000,
  });

  const { data: drivers = [], refetch: refetchDrivers } = useQuery({
    queryKey: ['admin-all-drivers'],
    queryFn: () => base44.entities.DriverProfile.list(),
    refetchInterval: 15000,
  });

  const { data: pricing } = useQuery({
    queryKey: ['pricing-config'],
    queryFn: () => base44.entities.PricingConfig.filter({ active: true }).then(r => r[0]),
  });

  const { data: surgeZones = [] } = useQuery({
    queryKey: ['surge-zones'],
    queryFn: () => base44.entities.SurgeZone.list(),
  });

  // Quick actions
  const toggleDriverStatus = useMutation({
    mutationFn: async ({ driverId, newStatus }) => {
      await base44.entities.DriverProfile.update(driverId, { status: newStatus });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-all-drivers'] });
      toast.success('Driver status updated');
    },
  });

  const updateRideStatus = useMutation({
    mutationFn: async ({ rideId, status }) => {
      await base44.entities.Ride.update(rideId, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-all-rides'] });
      toast.success('Ride status updated');
    },
  });

  const toggleSurgeZone = useMutation({
    mutationFn: async ({ zoneId, active }) => {
      await base44.entities.SurgeZone.update(zoneId, { active });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['surge-zones'] });
      toast.success('Surge zone updated');
    },
  });

  // Stats
  const stats = {
    totalRides: rides.length,
    activeRides: rides.filter(r => ['requested', 'accepted', 'in_progress'].includes(r.status)).length,
    completedRides: rides.filter(r => r.status === 'completed').length,
    cancelledRides: rides.filter(r => r.status === 'cancelled').length,
    totalDrivers: drivers.length,
    onlineDrivers: drivers.filter(d => d.status !== 'offline').length,
    approvedDrivers: drivers.filter(d => d.approved).length,
    pendingDrivers: drivers.filter(d => !d.approved).length,
    revenue: rides.filter(r => r.status === 'completed' && r.payment_status === 'paid')
      .reduce((sum, r) => sum + (r.fare || 0), 0),
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-display font-bold">Control Center</h2>
          <p className="text-sm text-muted-foreground">Complete oversight of Dip Out operations</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => refetchRides()}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={Car}
          label="Active Rides"
          value={stats.activeRides}
          subtext={`${stats.completedRides} completed`}
          color="blue"
        />
        <StatCard
          icon={Users}
          label="Online Drivers"
          value={stats.onlineDrivers}
          subtext={`${stats.approvedDrivers} approved`}
          color="green"
        />
        <StatCard
          icon={DollarSign}
          label="Total Revenue"
          value={`$${stats.revenue.toFixed(2)}`}
          subtext={`${stats.totalRides} total rides`}
          color="primary"
        />
        <StatCard
          icon={AlertTriangle}
          label="Pending Issues"
          value={stats.pendingDrivers}
          subtext="Drivers awaiting approval"
          color="yellow"
        />
      </div>

      {/* Main Control Sections */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Ride Control */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Car className="w-5 h-5 text-primary" />
                <div>
                  <CardTitle>Ride Management</CardTitle>
                  <CardDescription>Monitor and control all active rides</CardDescription>
                </div>
              </div>
              <Badge>{stats.activeRides} active</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {rides.filter(r => ['requested', 'accepted', 'in_progress'].includes(r.status)).slice(0, 8).map(ride => (
                <RideControlCard
                  key={ride.id}
                  ride={ride}
                  onStatusChange={(status) => updateRideStatus.mutate({ rideId: ride.id, status })}
                />
              ))}
              {stats.activeRides === 0 && (
                <p className="text-center text-muted-foreground py-8 text-sm">No active rides</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Driver Control */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                <div>
                  <CardTitle>Driver Control</CardTitle>
                  <CardDescription>Manage driver status and approvals</CardDescription>
                </div>
              </div>
              <Badge>{stats.onlineDrivers} online</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {drivers.slice(0, 8).map(driver => (
                <DriverControlCard
                  key={driver.id}
                  driver={driver}
                  onStatusChange={(status) => toggleDriverStatus.mutate({ driverId: driver.id, newStatus: status })}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System Controls */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-primary" />
            <div>
              <CardTitle>System Controls</CardTitle>
              <CardDescription>Configure pricing, surge zones, and system settings</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2">
            {/* Pricing Control */}
            <div className="space-y-4">
              <h3 className="font-semibold text-sm flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                Active Pricing
              </h3>
              {pricing && (
                <div className="space-y-3 p-4 rounded-xl bg-muted/50">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Base Fare</span>
                    <span className="font-medium">${pricing.base_fare?.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Per Mile Rate</span>
                    <span className="font-medium">${pricing.per_mile_rate?.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Driver Commission</span>
                    <span className="font-medium">{(pricing.driver_commission * 100).toFixed(0)}%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Minimum Fare</span>
                    <span className="font-medium">${pricing.min_fare?.toFixed(2)}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Surge Zones Control */}
            <div className="space-y-4">
              <h3 className="font-semibold text-sm flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Surge Zones
              </h3>
              <div className="space-y-2">
                {surgeZones.map(zone => (
                  <div key={zone.id} className="flex items-center justify-between p-3 rounded-lg border bg-card">
                    <div>
                      <p className="font-medium text-sm">{zone.name}</p>
                      <p className="text-xs text-muted-foreground">{zone.surge_multiplier}x multiplier</p>
                    </div>
                    <Switch
                      checked={zone.active}
                      onCheckedChange={(checked) => toggleSurgeZone.mutate({ zoneId: zone.id, active: checked })}
                    />
                  </div>
                ))}
                {surgeZones.length === 0 && (
                  <p className="text-sm text-muted-foreground">No surge zones configured</p>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary" />
            <div>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Latest rides and system events</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {rides.slice(0, 10).map(ride => (
              <div key={ride.id} className="flex items-center justify-between p-3 rounded-lg border bg-card/50">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${
                    ride.status === 'completed' ? 'bg-green-500' :
                    ride.status === 'cancelled' ? 'bg-red-500' :
                    ride.status === 'in_progress' ? 'bg-primary' :
                    'bg-yellow-500'
                  }`} />
                  <div>
                    <p className="text-sm font-medium">{ride.pickup_address} → {ride.dropoff_address}</p>
                    <p className="text-xs text-muted-foreground">
                      {ride.rider_email} • {format(new Date(ride.created_date), 'MMM d, HH:mm')}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold">${ride.fare?.toFixed(2)}</p>
                  <Badge variant="outline" className="text-[10px] capitalize">{ride.status.replace('_', ' ')}</Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, subtext, color = 'primary' }) {
  const colors = {
    primary: 'bg-primary/10 text-primary',
    blue: 'bg-blue-500/10 text-blue-400',
    green: 'bg-green-500/10 text-green-400',
    yellow: 'bg-yellow-500/10 text-yellow-400',
    red: 'bg-red-500/10 text-red-400',
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{label}</CardTitle>
        <Icon className={`h-4 w-4 ${colors[color]}`} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{subtext}</p>
      </CardContent>
    </Card>
  );
}

function RideControlCard({ ride, onStatusChange }) {
  const statusColors = {
    requested: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30',
    accepted: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
    in_progress: 'bg-primary/10 text-primary border-primary/30',
  };

  return (
    <div className={`p-3 rounded-lg border ${statusColors[ride.status]}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-[10px] capitalize">{ride.status.replace('_', ' ')}</Badge>
          <span className="text-xs text-muted-foreground">{format(new Date(ride.created_date), 'HH:mm')}</span>
        </div>
        <span className="font-bold text-sm">${ride.fare?.toFixed(2)}</span>
      </div>
      <p className="text-sm font-medium mb-2">{ride.pickup_address} → {ride.dropoff_address}</p>
      <div className="flex items-center justify-between gap-2">
        <div className="text-xs text-muted-foreground">
          {ride.rider_email}
          {ride.driver_email && <div>{ride.driver_email}</div>}
        </div>
        <div className="flex gap-1">
          {ride.status === 'requested' && (
            <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => onStatusChange('accepted')}>
              Accept
            </Button>
          )}
          {ride.status === 'accepted' && (
            <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => onStatusChange('in_progress')}>
              Start
            </Button>
          )}
          {ride.status === 'in_progress' && (
            <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => onStatusChange('completed')}>
              Complete
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function DriverControlCard({ driver, onStatusChange }) {
  const statusDot = {
    offline: 'bg-secondary border border-border',
    available: 'bg-green-500',
    busy: 'bg-primary',
  }[driver.status] || 'bg-secondary';

  return (
    <div className="flex items-center justify-between p-3 rounded-lg border bg-card/50">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center text-sm font-bold relative">
          {(driver.user_email?.[0] || '?').toUpperCase()}
          <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-background ${statusDot}`} />
        </div>
        <div>
          <p className="text-sm font-medium">{driver.user_email}</p>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>{driver.vehicle} • {driver.plate}</span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Star className="w-3 h-3 text-primary fill-primary" />
              {driver.rating?.toFixed(1)}
            </span>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <select
          value={driver.status}
          onChange={(e) => onStatusChange(e.target.value)}
          className="text-xs border rounded px-2 py-1 bg-background"
        >
          <option value="offline">Offline</option>
          <option value="available">Available</option>
          <option value="busy">Busy</option>
        </select>
      </div>
    </div>
  );
}