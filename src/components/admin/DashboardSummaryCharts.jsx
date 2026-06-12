import React from 'react';
import { AreaChart, Area, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, Activity, Clock, DollarSign, Car, Users, Star } from 'lucide-react';
import { format } from 'date-fns';

const COLORS = ['#fbbf24', '#3b82f6', '#10b981', '#ef4444', '#8b5cf6'];

export default function DashboardSummaryCharts({ rides, drivers }) {
  // Calculate hourly ride distribution (last 24 hours)
  const getHourlyData = () => {
    const now = new Date();
    const hours = [];
    
    for (let i = 23; i >= 0; i--) {
      const hour = new Date(now);
      hour.setHours(hour.getHours() - i);
      hours.push(hour);
    }
    
    return hours.map(hour => {
      const hourStr = hour.getHours().toString().padStart(2, '0');
      const dayRides = rides.filter(r => {
        if (!r.created_date) return false;
        const rideDate = new Date(r.created_date);
        return rideDate.getHours() === hour.getHours() &&
               rideDate.toDateString() === hour.toDateString();
      });
      
      return {
        hour: hourStr,
        display: hour.toLocaleTimeString('en-US', { hour: 'numeric', hour12: true }),
        rides: dayRides.length,
        revenue: dayRides.reduce((sum, r) => sum + (r.fare || 0), 0),
      };
    });
  };

  // Calculate ride status distribution
  const getStatusData = () => {
    const statusCounts = {};
    rides.forEach(r => {
      statusCounts[r.status] = (statusCounts[r.status] || 0) + 1;
    });
    
    return Object.entries(statusCounts).map(([status, count]) => ({
      name: status.replace('_', ' '),
      value: count,
      color: COLORS[Object.keys(statusCounts).indexOf(status) % COLORS.length],
    }));
  };

  // Calculate driver performance metrics
  const getDriverStats = () => {
    const driverMap = {};
    
    drivers.forEach(d => {
      driverMap[d.user_email] = {
        email: d.user_email,
        trips: d.trips_completed || 0,
        earnings: d.total_earnings || 0,
        rating: d.rating || 5,
        status: d.status,
      };
    });
    
    rides.filter(r => r.status === 'completed' && r.driver_email).forEach(r => {
      if (driverMap[r.driver_email]) {
        // Already counted in driver profile
      }
    });
    
    return Object.values(driverMap)
      .sort((a, b) => b.earnings - a.earnings)
      .slice(0, 5);
  };

  // Calculate weekly trends
  const getWeeklyTrends = () => {
    const today = new Date();
    const weeks = [];
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - (i * 7));
      weeks.push(date);
    }
    
    return weeks.map(date => {
      const weekStart = new Date(date);
      const weekEnd = new Date(date);
      weekEnd.setDate(weekEnd.getDate() + 6);
      
      const weekRides = rides.filter(r => {
        if (!r.created_date) return false;
        const rideDate = new Date(r.created_date);
        return rideDate >= weekStart && rideDate <= weekEnd;
      });
      
      return {
        week: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        rides: weekRides.length,
        revenue: weekRides.filter(r => r.status === 'completed').reduce((sum, r) => sum + (r.fare || 0), 0),
        avgFare: weekRides.length > 0 ? weekRides.reduce((sum, r) => sum + (r.fare || 0), 0) / weekRides.length : 0,
      };
    });
  };

  const hourlyData = getHourlyData();
  const statusData = getStatusData();
  const topDrivers = getDriverStats();
  const weeklyData = getWeeklyTrends();

  const totalRides = rides.length;
  const completedRides = rides.filter(r => r.status === 'completed').length;
  const activeDrivers = drivers.filter(d => d.status !== 'offline').length;
  const avgRating = drivers.length > 0 
    ? drivers.reduce((sum, d) => sum + (d.rating || 5), 0) / drivers.length 
    : 5;

  // Custom tooltip component
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-card border border-border rounded-lg p-3 shadow-lg">
          <p className="font-semibold text-sm mb-2">{label}</p>
          {payload.map((entry, index) => (
            <div key={index} className="flex items-center justify-between gap-4 text-xs">
              <span className="text-muted-foreground" style={{ color: entry.color || entry.stroke }}>
                {entry.name}
              </span>
              <span className="font-bold">
                {entry.dataKey === 'revenue' || entry.dataKey === 'avgFare' 
                  ? `$${entry.value.toFixed(2)}` 
                  : entry.value}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-4 mb-6">
      {/* Top Summary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="rounded-2xl border border-border bg-card p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
              <Car className="w-4 h-4 text-primary" />
            </div>
            <TrendingUp className="w-4 h-4 text-green-500" />
          </div>
          <p className="text-2xl font-bold font-display">{totalRides}</p>
          <p className="text-xs text-muted-foreground">Total Rides</p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="w-9 h-9 rounded-xl bg-green-500/10 flex items-center justify-center">
              <DollarSign className="w-4 h-4 text-green-500" />
            </div>
            <Activity className="w-4 h-4 text-green-500" />
          </div>
          <p className="text-2xl font-bold font-display">{completedRides}</p>
          <p className="text-xs text-muted-foreground">Completed</p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 flex items-center justify-center">
              <Users className="w-4 h-4 text-blue-500" />
            </div>
            <span className="text-xs font-semibold text-green-500">{activeDrivers} online</span>
          </div>
          <p className="text-2xl font-bold font-display">{drivers.length}</p>
          <p className="text-xs text-muted-foreground">Total Drivers</p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="w-9 h-9 rounded-xl bg-yellow-500/10 flex items-center justify-center">
              <Star className="w-4 h-4 text-yellow-500" />
            </div>
            <TrendingUp className="w-4 h-4 text-green-500" />
          </div>
          <p className="text-2xl font-bold font-display">{avgRating.toFixed(1)}</p>
          <p className="text-xs text-muted-foreground">Avg Rating</p>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Hourly Activity Chart */}
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="font-bold flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary" />
                24-Hour Activity
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">Rides per hour</p>
            </div>
          </div>
          
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={hourlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis 
                  dataKey="display" 
                  tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis 
                  tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area 
                  type="monotone" 
                  dataKey="rides" 
                  stroke="hsl(var(--primary))" 
                  fill="hsl(var(--primary))"
                  fillOpacity={0.2}
                  strokeWidth={2}
                  animationDuration={1000}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Ride Status Distribution */}
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="mb-4">
            <h3 className="font-bold flex items-center gap-2">
              <Activity className="w-4 h-4 text-primary" />
              Ride Status
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">Current distribution</p>
          </div>
          
          <div className="h-48 flex items-center justify-center">
            {statusData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={70}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted-foreground">No rides yet</p>
            )}
          </div>
        </div>
      </div>

      {/* Weekly Trends & Top Drivers */}
      <div className="grid gap-4 lg:grid-cols-2">
        {/* Weekly Revenue Trend */}
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="font-bold flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-green-500" />
                Weekly Trends
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">Rides & revenue over 6 weeks</p>
            </div>
          </div>
          
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis 
                  dataKey="week" 
                  tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis 
                  yAxisId="left"
                  tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                />
                <YAxis 
                  yAxisId="right"
                  orientation="right"
                  tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => `$${v}`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Line 
                  yAxisId="left"
                  type="monotone" 
                  dataKey="rides" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  name="Rides"
                  animationDuration={1000}
                />
                <Line 
                  yAxisId="right"
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="hsl(142, 76%, 36%)" 
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  name="Revenue"
                  animationDuration={1000}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Performing Drivers */}
        <div className="rounded-2xl border border-border bg-card p-5">
          <div className="mb-4">
            <h3 className="font-bold flex items-center gap-2">
              <Users className="w-4 h-4 text-primary" />
              Top Drivers
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">By total earnings</p>
          </div>
          
          <div className="space-y-3">
            {topDrivers.length > 0 ? (
              topDrivers.map((driver, idx) => (
                <div key={driver.email} className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-xs font-bold text-primary">
                    {idx + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{driver.email}</p>
                    <p className="text-xs text-muted-foreground">
                      {driver.trips} trips · {driver.status}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-sm text-green-500">${driver.earnings.toFixed(2)}</p>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Star className="w-3 h-3 fill-yellow-500 text-yellow-500" />
                      {driver.rating.toFixed(1)}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">No driver data yet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}