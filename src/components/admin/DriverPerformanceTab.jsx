import React, { useMemo } from 'react';
import { format } from 'date-fns';
import { Star, DollarSign, TrendingUp, Calendar, Car, BarChart3 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function DriverPerformanceTab({ rides, drivers }) {
  // Calculate driver performance metrics
  const driverMetrics = useMemo(() => {
    const approvedDrivers = drivers.filter(d => d.approved);
    
    return approvedDrivers.map(driver => {
      const driverRides = rides.filter(r => 
        r.driver_email === driver.user_email && r.status === 'completed'
      );
      
      const totalEarnings = driverRides.reduce((sum, r) => sum + ((r.fare || 0) * 0.8), 0);
      const avgRating = driverRides.length > 0 
        ? driverRides.reduce((sum, r) => sum + (r.rider_rating || 5), 0) / driverRides.length 
        : driver.rating || 5;
      
      // Calculate daily earnings for the last 7 days
      const today = new Date();
      const dailyEarnings = [];
      
      for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateStr = format(date, 'yyyy-MM-dd');
        
        const dayEarnings = driverRides
          .filter(r => r.created_date && format(new Date(r.created_date), 'yyyy-MM-dd') === dateStr)
          .reduce((sum, r) => sum + ((r.fare || 0) * 0.8), 0);
        
        dailyEarnings.push({
          date: format(date, 'MMM d'),
          earnings: Math.round(dayEarnings * 100) / 100,
          fullDate: dateStr
        });
      }
      
      const totalTrips = driverRides.length;
      const avgFare = totalTrips > 0 ? totalEarnings / totalTrips : 0;
      
      return {
        ...driver,
        totalEarnings,
        avgRating: Math.round(avgRating * 10) / 10,
        totalTrips,
        avgFare: Math.round(avgFare * 100) / 100,
        dailyEarnings
      };
    }).sort((a, b) => b.totalEarnings - a.totalEarnings);
  }, [rides, drivers]);

  // Overall stats
  const totalRevenue = driverMetrics.reduce((sum, d) => sum + d.totalEarnings, 0);
  const avgPlatformRating = driverMetrics.length > 0
    ? driverMetrics.reduce((sum, d) => sum + d.avgRating, 0) / driverMetrics.length
    : 0;
  const totalTrips = driverMetrics.reduce((sum, d) => sum + d.totalTrips, 0);

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Driver Earnings</CardTitle>
            <DollarSign className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalRevenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Across all drivers</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
            <Star className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgPlatformRating.toFixed(1)}</div>
            <p className="text-xs text-muted-foreground">Platform-wide</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Trips</CardTitle>
            <Car className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTrips}</div>
            <p className="text-xs text-muted-foreground">Completed rides</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Drivers</CardTitle>
            <BarChart3 className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{driverMetrics.length}</div>
            <p className="text-xs text-muted-foreground">With completed trips</p>
          </CardContent>
        </Card>
      </div>

      {/* Driver Performance Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Driver Performance Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Driver</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Total Earnings</TableHead>
                  <TableHead className="text-right">Avg Rating</TableHead>
                  <TableHead className="text-right">Total Trips</TableHead>
                  <TableHead className="text-right">Avg per Trip</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {driverMetrics.map((driver) => (
                  <TableRow key={driver.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium text-sm">{driver.user_email}</p>
                        <p className="text-xs text-muted-foreground">{driver.vehicle} · {driver.plate}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={
                        driver.status === 'available' ? 'bg-green-500/15 text-green-400' :
                        driver.status === 'busy' ? 'bg-primary/15 text-primary' :
                        'bg-secondary text-secondary-foreground'
                      }>
                        {driver.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-semibold text-green-600">
                      ${driver.totalEarnings.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Star className="w-3.5 h-3.5 text-primary fill-primary" />
                        <span className="font-medium">{driver.avgRating.toFixed(1)}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {driver.totalTrips}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      ${driver.avgFare.toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))}
                {driverMetrics.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      No driver performance data available
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Daily Earnings Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        {driverMetrics.slice(0, 4).map((driver) => (
          <Card key={driver.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">{driver.user_email.split('@')[0]}</CardTitle>
                  <p className="text-xs text-muted-foreground mt-1">
                    Last 7 days · Total: ${driver.totalEarnings.toFixed(2)}
                  </p>
                </div>
                <div className="flex items-center gap-1 text-sm">
                  <Star className="w-4 h-4 text-primary fill-primary" />
                  <span className="font-medium">{driver.avgRating.toFixed(1)}</span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={driver.dailyEarnings}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="date" 
                    className="text-xs"
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                  />
                  <YAxis 
                    className="text-xs"
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                    tickFormatter={(value) => `$${value}`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      fontSize: '12px'
                    }}
                    formatter={(value) => [`$${value.toFixed(2)}`, 'Earnings']}
                  />
                  <Bar 
                    dataKey="earnings" 
                    fill="hsl(var(--primary))"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}