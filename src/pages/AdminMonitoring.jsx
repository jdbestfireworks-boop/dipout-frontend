import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Activity, AlertTriangle, DollarSign, Users, TrendingUp, Clock, CheckCircle, XCircle, BarChart3, ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

// Icon component for StatCard
const IconWrapper = ({ icon: Icon, color }) => Icon ? <Icon className={`w-4 h-4 ${color}`} /> : null;

export default function AdminMonitoring() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchMonitoringData = async () => {
    try {
      setLoading(true);
      const response = await base44.functions.invoke('getMonitoringData', {});
      
      if (response.data.success) {
        setData(response.data.data);
      } else {
        toast.error('Failed to load monitoring data');
      }
    } catch (error) {
      console.error('Monitoring fetch error:', error);
      toast.error('Failed to connect to monitoring service');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMonitoringData();
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchMonitoringData, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-muted-foreground">Loading monitoring dashboard...</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center space-y-4">
            <AlertTriangle className="w-12 h-12 text-destructive mx-auto" />
            <h2 className="text-xl font-bold">Failed to load monitoring data</h2>
            <Button onClick={fetchMonitoringData}>Retry</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate('/admin')} className="h-9 w-9">
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-display font-bold">System Monitoring</h1>
              <p className="text-sm text-muted-foreground">Real-time platform health and performance metrics</p>
            </div>
          </div>
          <Button onClick={fetchMonitoringData} variant="outline" className="gap-2">
            <Activity className="w-4 h-4" /> Refresh
          </Button>
        </div>

        {/* Last updated */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Clock className="w-3 h-3" />
          Last updated: {format(new Date(data.lastUpdated), 'HH:mm:ss')}
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={Activity}
            label="Active Rides"
            value={data.overview.activeRides}
            sub={`${data.overview.todayRides} today`}
            color="text-blue-500"
          />
          <StatCard
            icon={DollarSign}
            label="Revenue (Today)"
            value={`$${data.overview.todayRevenue.toFixed(2)}`}
            sub={`$${data.overview.weekRevenue.toFixed(2)} this week`}
            color="text-green-500"
          />
          <StatCard
            icon={Users}
            label="Active Drivers"
            value={data.drivers.active}
            sub={`${data.drivers.approved} approved, ${data.drivers.pending} pending`}
            color="text-purple-500"
          />
          <StatCard
            icon={TrendingUp}
            label="Success Rate"
            value={`${data.overview.successRate}%`}
            sub={`${data.overview.paymentFailures} payment failures`}
            color={data.overview.successRate >= 90 ? 'text-green-500' : 'text-yellow-500'}
          />
        </div>

        {/* Pricing Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Average Fare</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${data.pricing.avgFare.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground mt-1">Per completed ride</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Avg Surge Multiplier</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.pricing.avgSurge.toFixed(2)}x</div>
              <p className="text-xs text-muted-foreground mt-1">AI dynamic pricing</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Active Surge Zones</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{data.pricing.activeZones}</div>
              <p className="text-xs text-muted-foreground mt-1">High demand areas</p>
            </CardContent>
          </Card>
        </div>

        {/* Recent Errors */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-yellow-500" />
              Recent Issues (Last 24h)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.recentErrors.length === 0 ? (
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle className="w-4 h-4" />
                <span className="text-sm font-medium">No issues detected</span>
              </div>
            ) : (
              <div className="space-y-2">
                {data.recentErrors.map((error) => (
                  <div key={error.id} className="flex items-start justify-between p-3 rounded-lg border border-border bg-secondary/50">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">{error.type}</Badge>
                        <span className="text-sm font-medium">{error.message}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(error.timestamp), 'HH:mm:ss')} · {error.details.rider}
                      </p>
                    </div>
                    <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20">
                      {error.severity}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Hourly Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-blue-500" />
              Hourly Ride Distribution (Today)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-32 flex items-end gap-1">
              {data.hourlyDistribution.map((hour) => (
                <div key={hour.hour} className="flex-1 flex flex-col items-center gap-1">
                  <div 
                    className="w-full bg-primary/20 hover:bg-primary/40 transition-colors rounded-t"
                    style={{ 
                      height: `${Math.min(100, (hour.count / Math.max(...data.hourlyDistribution.map(h => h.count))) * 100)}%`,
                      minHeight: hour.count > 0 ? '4px' : '0px'
                    }}
                  ></div>
                  <span className="text-[10px] text-muted-foreground rotate-0">
                    {hour.hour}:00
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, sub, color }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
        <IconWrapper icon={Icon} color={color} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground mt-1">{sub}</p>
      </CardContent>
    </Card>
  );
}