import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  TrendingUp, TrendingDown, DollarSign, Clock, MapPin, Users,
  Car, Star, Activity, Calendar, BarChart3, PieChart
} from 'lucide-react';
import { format } from 'date-fns';

export default function AdvancedAnalytics({ rides = [], drivers = [] }) {
  // Calculate time-based metrics
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
  const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

  const todayRides = rides.filter(r => new Date(r.created_date) >= today);
  const weekRides = rides.filter(r => new Date(r.created_date) >= weekAgo);
  const monthRides = rides.filter(r => new Date(r.created_date) >= monthAgo);

  const todayRevenue = todayRides
    .filter(r => r.status === 'completed' && r.payment_status === 'paid')
    .reduce((sum, r) => sum + (r.fare || 0), 0);
  
  const weekRevenue = weekRides
    .filter(r => r.status === 'completed' && r.payment_status === 'paid')
    .reduce((sum, r) => sum + (r.fare || 0), 0);

  const completedRides = rides.filter(r => r.status === 'completed');
  const avgFare = completedRides.length > 0 
    ? completedRides.reduce((sum, r) => sum + (r.fare || 0), 0) / completedRides.length 
    : 0;

  const avgDistance = completedRides.length > 0
    ? completedRides.reduce((sum, r) => sum + (r.distance_km || 0), 0) / completedRides.length
    : 0;

  const peakHours = {};
  rides.forEach(ride => {
    if (ride.created_date) {
      const hour = new Date(ride.created_date).getHours();
      peakHours[hour] = (peakHours[hour] || 0) + 1;
    }
  });
  const peakHour = Object.entries(peakHours).sort((a, b) => b[1] - a[1])[0];

  // Driver performance
  const activeDrivers = drivers.filter(d => d.status !== 'offline');
  const approvedDrivers = drivers.filter(d => d.approved);
  const avgDriverRating = approvedDrivers.length > 0
    ? approvedDrivers.reduce((sum, d) => sum + (d.rating || 0), 0) / approvedDrivers.length
    : 0;

  // Payment methods
  const cardPayments = completedRides.filter(r => r.payment_method === 'card').length;
  const cashPayments = completedRides.filter(r => r.payment_method === 'cash').length;
  const totalPayments = cardPayments + cashPayments;

  // Growth calculations
  const previousWeekRides = rides.filter(r => {
    const date = new Date(r.created_date);
    return date >= new Date(weekAgo.getTime() - 7 * 24 * 60 * 60 * 1000) && date < weekAgo;
  }).length;
  
  const growthRate = previousWeekRides > 0 
    ? ((weekRides.length - previousWeekRides) / previousWeekRides * 100).toFixed(1)
    : 0;

  return (
    <div className="space-y-4">
      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Today</p>
                <p className="text-2xl font-bold">{todayRides.length}</p>
                <p className="text-[10px] text-muted-foreground">
                  ${todayRevenue.toFixed(0)} revenue
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-primary/15 flex items-center justify-center">
                <Calendar className="w-6 h-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground mb-1">This Week</p>
                <p className="text-2xl font-bold">{weekRides.length}</p>
                <div className="flex items-center gap-1 mt-1">
                  {parseFloat(growthRate) > 0 ? (
                    <TrendingUp className="w-3 h-3 text-green-500" />
                  ) : (
                    <TrendingDown className="w-3 h-3 text-red-500" />
                  )}
                  <span className={`text-[10px] font-medium ${parseFloat(growthRate) > 0 ? 'text-green-500' : 'text-red-500'}`}>
                    {Math.abs(growthRate)}%
                  </span>
                </div>
              </div>
              <div className="w-12 h-12 rounded-xl bg-blue-500/15 flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground mb-1">This Month</p>
                <p className="text-2xl font-bold">{monthRides.length}</p>
                <p className="text-[10px] text-muted-foreground">
                  ${weekRevenue.toFixed(0)} this week
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-green-500/15 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground mb-1">Avg Fare</p>
                <p className="text-2xl font-bold">${avgFare.toFixed(2)}</p>
                <p className="text-[10px] text-muted-foreground">
                  {avgDistance.toFixed(1)} km avg
                </p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-purple-500/15 flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-purple-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Grid */}
      <div className="grid md:grid-cols-2 gap-4">
        {/* Driver Stats */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="w-4 h-4" />
              Driver Performance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Active Drivers</span>
              <Badge variant="outline">{activeDrivers.length} / {approvedDrivers.length}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Avg Rating</span>
              <div className="flex items-center gap-1">
                <Star className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                <span className="text-sm font-semibold">{avgDriverRating.toFixed(1)}</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Completion Rate</span>
              <span className="text-sm font-semibold">
                {rides.length > 0 ? ((completedRides.length / rides.length) * 100).toFixed(1) : 0}%
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Payment Analytics */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <PieChart className="w-4 h-4" />
              Payment Methods
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Card</span>
                <div className="flex items-center gap-2">
                  <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary"
                      style={{ width: totalPayments > 0 ? `${(cardPayments / totalPayments) * 100}%` : '0%' }}
                    />
                  </div>
                  <span className="text-sm font-semibold w-12 text-right">
                    {totalPayments > 0 ? ((cardPayments / totalPayments) * 100).toFixed(0) : 0}%
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Cash</span>
                <div className="flex items-center gap-2">
                  <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-green-500"
                      style={{ width: totalPayments > 0 ? `${(cashPayments / totalPayments) * 100}%` : '0%' }}
                    />
                  </div>
                  <span className="text-sm font-semibold w-12 text-right">
                    {totalPayments > 0 ? ((cashPayments / totalPayments) * 100).toFixed(0) : 0}%
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Peak Hours */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Peak Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          {peakHour ? (
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <div className="h-24 flex items-end gap-1">
                  {Array.from({ length: 24 }, (_, i) => {
                    const count = peakHours[i] || 0;
                    const maxCount = Math.max(...Object.values(peakHours));
                    const height = maxCount > 0 ? (count / maxCount) * 100 : 0;
                    return (
                      <div
                        key={i}
                        className="flex-1 bg-primary/20 rounded-t"
                        style={{ height: `${Math.max(height, 5)}%` }}
                        title={`${i}:00 - ${count} rides`}
                      />
                    );
                  })}
                </div>
                <div className="flex justify-between mt-2 text-[10px] text-muted-foreground">
                  <span>12 AM</span>
                  <span>6 AM</span>
                  <span>12 PM</span>
                  <span>6 PM</span>
                  <span>11 PM</span>
                </div>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-primary">{peakHour[0]}:00</p>
                <p className="text-xs text-muted-foreground">Peak Hour</p>
                <p className="text-sm font-semibold mt-1">{peakHour[1]} rides</p>
              </div>
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8">No ride data available</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}