import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  TrendingUp, 
  DollarSign, 
  Users, 
  Calendar,
  Download,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { toast } from 'sonner';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend
} from 'recharts';

export default function MonthlyReportTab() {
  const [selectedMonth, setSelectedMonth] = useState(new Date());

  const { data: rides = [] } = useQuery({
    queryKey: ['admin-rides-monthly'],
    queryFn: () => base44.entities.Ride.list('-created_date', 2000),
    refetchInterval: 30000,
  });

  const { data: drivers = [] } = useQuery({
    queryKey: ['admin-drivers-monthly'],
    queryFn: () => base44.entities.DriverProfile.list('-created_date', 500),
    refetchInterval: 30000,
  });

  // Calculate monthly data
  const getMonthData = (date) => {
    const monthStart = startOfMonth(date);
    const monthEnd = endOfMonth(date);
    
    const monthRides = rides.filter(r => {
      if (!r.created_date) return false;
      const rideDate = new Date(r.created_date);
      return rideDate >= monthStart && rideDate <= monthEnd;
    });

    const completed = monthRides.filter(r => r.status === 'completed');
    const paid = completed.filter(r => r.payment_status === 'paid');
    
    const revenue = paid.reduce((s, r) => s + (r.fare || 0), 0);
    const platformCut = revenue * 0.2;
    const driverPayout = revenue * 0.8;
    
    // Active drivers this month
    const activeDrivers = new Set(completed.map(r => r.driver_email)).size;
    
    // Top drivers
    const earningsByDriver = {};
    completed.forEach(r => {
      if (!r.driver_email) return;
      earningsByDriver[r.driver_email] = (earningsByDriver[r.driver_email] || 0) + (r.fare || 0) * 0.8;
    });
    
    const topDrivers = Object.entries(earningsByDriver)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);

    // Daily breakdown for chart
    const daysInMonth = endOfMonth(date).getDate();
    const dailyData = [];
    for (let day = 1; day <= daysInMonth; day++) {
      const dayDate = new Date(date.getFullYear(), date.getMonth(), day);
      const dayRides = paid.filter(r => {
        const rideDate = new Date(r.created_date);
        return rideDate.getDate() === day && 
               rideDate.getMonth() === date.getMonth() && 
               rideDate.getFullYear() === date.getFullYear();
      });
      const dayRevenue = dayRides.reduce((s, r) => s + (r.fare || 0), 0);
      dailyData.push({
        day: format(dayDate, 'MMM d'),
        revenue: dayRevenue,
        rides: dayRides.length,
      });
    }

    return {
      totalRides: monthRides.length,
      completedRides: completed.length,
      revenue,
      platformCut,
      driverPayout,
      activeDrivers,
      topDrivers,
      dailyData,
      avgFare: paid.length ? revenue / paid.length : 0,
      completionRate: monthRides.length ? (completed.length / monthRides.length) * 100 : 0,
    };
  };

  // Calculate month-over-month trend
  const currentMonth = getMonthData(selectedMonth);
  const lastMonth = getMonthData(subMonths(selectedMonth, 1));
  const revenueChange = lastMonth.revenue ? ((currentMonth.revenue - lastMonth.revenue) / lastMonth.revenue) * 100 : 0;
  const ridesChange = lastMonth.totalRides ? ((currentMonth.totalRides - lastMonth.totalRides) / lastMonth.totalRides) * 100 : 0;

  const [generating, setGenerating] = useState(false);

  const handleExport = () => {
    const headers = ['Metric', 'Value'];
    const rows = [
      ['Month', format(selectedMonth, 'MMMM yyyy')],
      ['Total Rides', currentMonth.totalRides],
      ['Completed Rides', currentMonth.completedRides],
      ['Total Revenue', `$${currentMonth.revenue.toFixed(2)}`],
      ['Platform Commission (20%)', `$${currentMonth.platformCut.toFixed(2)}`],
      ['Driver Payouts (80%)', `$${currentMonth.driverPayout.toFixed(2)}`],
      ['Active Drivers', currentMonth.activeDrivers],
      ['Average Fare', `$${currentMonth.avgFare.toFixed(2)}`],
      ['Completion Rate', `${currentMonth.completionRate.toFixed(1)}%`],
    ];
    
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `dip_out_monthly_${format(selectedMonth, 'yyyy-MM')}.csv`;
    link.click();
    toast.success('Monthly report exported');
  };

  const handleGenerateReport = async () => {
    setGenerating(true);
    try {
      const res = await base44.functions.invoke('generateMonthlyReport', {});
      toast.success(`Report sent to your email! ${res.data.stats.total_rides} rides, $${res.data.stats.total_revenue.toFixed(2)} revenue`);
    } catch (err) {
      toast.error('Failed to generate report: ' + err.message);
    } finally {
      setGenerating(false);
    }
  };

  const months = [];
  for (let i = 0; i < 6; i++) {
    months.push(subMonths(new Date(), i));
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-display font-bold">Monthly Performance Report</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Track monthly trends and driver performance</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={format(selectedMonth, 'yyyy-MM')}
            onChange={(e) => {
              const [year, month] = e.target.value.split('-');
              setSelectedMonth(new Date(parseInt(year), parseInt(month) - 1));
            }}
            className="px-4 py-3 rounded-xl border border-border bg-card text-base"
          >
            {months.map(m => (
              <option key={m.toISOString()} value={format(m, 'yyyy-MM')}>
                {format(m, 'MMMM yyyy')}
              </option>
            ))}
          </select>
          <Button 
            variant="outline" 
            onClick={handleExport} 
            className="gap-2 px-6 py-3 text-base"
            size="lg"
          >
            <Download className="w-5 h-5" />
            Export CSV
          </Button>
          <Button 
            variant="default" 
            onClick={handleGenerateReport} 
            disabled={generating}
            className="gap-2 px-6 py-3 text-base"
            size="lg"
          >
            {generating ? 'Generating...' : '📧 Email Report'}
          </Button>
        </div>
      </div>

      {/* Month-over-Month Comparison */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${currentMonth.revenue.toFixed(2)}</div>
            <div className={`flex items-center text-xs ${revenueChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {revenueChange >= 0 ? <ArrowUpRight className="w-3 h-3 mr-1" /> : <ArrowDownRight className="w-3 h-3 mr-1" />}
              {Math.abs(revenueChange).toFixed(1)}% vs last month
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Rides</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currentMonth.totalRides}</div>
            <div className={`flex items-center text-xs ${ridesChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {ridesChange >= 0 ? <ArrowUpRight className="w-3 h-3 mr-1" /> : <ArrowDownRight className="w-3 h-3 mr-1" />}
              {Math.abs(ridesChange).toFixed(1)}% vs last month
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Platform Commission</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${currentMonth.platformCut.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">20% of revenue</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Drivers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currentMonth.activeDrivers}</div>
            <p className="text-xs text-muted-foreground">Completed ≥1 ride</p>
          </CardContent>
        </Card>
      </div>

      {/* Daily Revenue Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Daily Revenue Trend
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={currentMonth.dailyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis dataKey="day" stroke="#888" fontSize={12} />
                <YAxis stroke="#888" fontSize={12} tickFormatter={(v) => `$${v}`} />
                <Tooltip
                  formatter={(value) => [`$${value.toFixed(2)}`, 'Revenue']}
                  contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333' }}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#fbbf24"
                  fill="#fbbf24/20"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Average Fare</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">${currentMonth.avgFare.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground mt-1">Per completed ride</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Completion Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{currentMonth.completionRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground mt-1">
              {currentMonth.completedRides} of {currentMonth.totalRides} rides
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Driver Payout</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-500">${currentMonth.driverPayout.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground mt-1">80% to drivers</p>
          </CardContent>
        </Card>
      </div>

      {/* Top Earning Drivers */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Top 10 Earning Drivers This Month
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Rank</TableHead>
                <TableHead>Driver</TableHead>
                <TableHead className="text-right">Trips</TableHead>
                <TableHead className="text-right">Gross Fare</TableHead>
                <TableHead className="text-right">Earnings (80%)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentMonth.topDrivers.length > 0 ? (
                currentMonth.topDrivers.map(([email, earnings], i) => {
                  const driverRides = rides.filter(
                    r => r.driver_email === email && 
                         r.status === 'completed' &&
                         new Date(r.created_date).getMonth() === selectedMonth.getMonth() &&
                         new Date(r.created_date).getFullYear() === selectedMonth.getFullYear()
                  );
                  const grossFare = driverRides.reduce((s, r) => s + (r.fare || 0), 0);
                  
                  return (
                    <TableRow key={email}>
                      <TableCell>
                        <Badge variant={i < 3 ? 'default' : 'secondary'}>
                          {['🥇','🥈','🥉'][i] || `#${i+1}`}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">{email}</TableCell>
                      <TableCell className="text-right">{driverRides.length}</TableCell>
                      <TableCell className="text-right">${grossFare.toFixed(2)}</TableCell>
                      <TableCell className="text-right font-bold text-green-600">
                        ${earnings.toFixed(2)}
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                    No driver data for this month
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Commission Trends */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Commission Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-lg bg-secondary">
              <div>
                <p className="font-semibold">Platform Revenue (20%)</p>
                <p className="text-xs text-muted-foreground">Your earnings from rides</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-primary">${currentMonth.platformCut.toFixed(2)}</p>
                <p className="text-xs text-muted-foreground">
                  {currentMonth.revenue ? ((currentMonth.platformCut / currentMonth.revenue) * 100).toFixed(1) : 0}% of total
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg bg-green-500/10">
              <div>
                <p className="font-semibold">Driver Payouts (80%)</p>
                <p className="text-xs text-muted-foreground">Paid to drivers</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-green-500">${currentMonth.driverPayout.toFixed(2)}</p>
                <p className="text-xs text-muted-foreground">
                  {currentMonth.revenue ? ((currentMonth.driverPayout / currentMonth.revenue) * 100).toFixed(1) : 0}% of total
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg bg-card border border-border">
              <div>
                <p className="font-semibold">Total Ride Revenue</p>
                <p className="text-xs text-muted-foreground">Gross fare from all rides</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold">${currentMonth.revenue.toFixed(2)}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}