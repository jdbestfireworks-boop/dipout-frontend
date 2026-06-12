import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  AlertTriangle, 
  TrendingDown, 
  AlertCircle, 
  CheckCircle, 
  RefreshCw,
  Bell,
  DollarSign,
  UserX,
  Clock
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

const severityColors = {
  low: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  medium: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
  high: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
  critical: 'bg-red-500/15 text-red-400 border-red-500/30',
};

const typeIcons = {
  low_earnings: DollarSign,
  no_trips: UserX,
  issue_reported: AlertCircle,
};

export default function DriverAlertsTab() {
  const [threshold, setThreshold] = useState(50);
  const queryClient = useQueryClient();

  const { data: alertsData, isLoading, refetch } = useQuery({
    queryKey: ['driver-alerts', threshold],
    queryFn: async () => {
      const res = await base44.functions.invoke('checkDriverAlerts', { earningsThreshold: threshold });
      return res.data.alerts || [];
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const createAlertMutation = useMutation({
    mutationFn: async (alertData) => {
      await base44.entities.SystemAlert.create(alertData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['driver-alerts'] });
      toast.success('Alert saved successfully');
    },
  });

  const handleSaveAlert = (alert) => {
    createAlertMutation.mutate({
      type: alert.type,
      severity: alert.severity,
      title: alert.title,
      message: alert.message,
      driver_email: alert.driver_email,
      action_required: alert.action_required,
      resolved: false,
    });
  };

  const handleDismissAlert = (index) => {
    if (alertsData && alertsData[index]) {
      handleSaveAlert(alertsData[index]);
      refetch();
    }
  };

  const alertCounts = {
    total: alertsData?.length || 0,
    low: alertsData?.filter(a => a.severity === 'low').length || 0,
    medium: alertsData?.filter(a => a.severity === 'medium').length || 0,
    high: alertsData?.filter(a => a.severity === 'high').length || 0,
    critical: alertsData?.filter(a => a.severity === 'critical').length || 0,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-display font-bold">Driver Alerts</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Monitor driver performance and issues in real-time</p>
        </div>
        <Button 
          onClick={() => refetch()} 
          variant="outline" 
          size="lg"
          className="gap-2 px-6 py-3"
        >
          <RefreshCw className="w-5 h-5" />
          Refresh Alerts
        </Button>
      </div>

      {/* Alert Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{alertCounts.total}</div>
            <p className="text-xs text-muted-foreground">Active monitoring</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Earnings</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-400">{alertCounts.medium}</div>
            <p className="text-xs text-muted-foreground">Below threshold</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">No Trips</CardTitle>
            <UserX className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-400">{alertCounts.low}</div>
            <p className="text-xs text-muted-foreground">This week</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Critical</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-400">{alertCounts.critical}</div>
            <p className="text-xs text-muted-foreground">Action needed</p>
          </CardContent>
        </Card>
      </div>

      {/* Threshold Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            Earnings Threshold Settings
          </CardTitle>
          <CardDescription>
            Set the minimum weekly earnings threshold for alerts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Threshold: $</span>
              <Input
                type="number"
                value={threshold}
                onChange={(e) => setThreshold(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-24 text-center"
              />
            </div>
            <Button 
              onClick={() => refetch()} 
              size="lg"
              className="px-6"
            >
              Apply
            </Button>
            <span className="text-xs text-muted-foreground ml-auto">
              Current: Drivers earning less than ${threshold}/week will trigger alerts
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Alerts List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Active Alerts
          </CardTitle>
          <CardDescription>
            {isLoading ? 'Loading alerts...' : `${alertsData?.length || 0} alerts found`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : alertsData && alertsData.length > 0 ? (
            <div className="space-y-3">
              {alertsData.map((alert, index) => {
                const Icon = typeIcons[alert.type] || AlertCircle;
                return (
                  <div
                    key={index}
                    className={`p-4 rounded-xl border ${severityColors[alert.severity]} flex items-start gap-4`}
                  >
                    <div className="w-10 h-10 rounded-lg bg-background/20 flex items-center justify-center shrink-0">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h3 className="font-semibold text-base">{alert.title}</h3>
                          <p className="text-sm mt-1 opacity-90">{alert.message}</p>
                          {alert.data && (
                            <div className="flex items-center gap-4 mt-2 text-xs opacity-75">
                              {alert.data.weekly_earnings !== undefined && (
                                <span className="flex items-center gap-1">
                                  <DollarSign className="w-3 h-3" />
                                  ${alert.data.weekly_earnings.toFixed(2)} earned
                                </span>
                              )}
                              {alert.data.trips_completed !== undefined && (
                                <span className="flex items-center gap-1">
                                  <CheckCircle className="w-3 h-3" />
                                  {alert.data.trips_completed} trips
                                </span>
                              )}
                              {alert.data.driver_status && (
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  Status: {alert.data.driver_status}
                                </span>
                              )}
                            </div>
                          )}
                          <div className="flex items-center gap-2 mt-3">
                            <Badge className={`${severityColors[alert.severity]} border-0 text-xs`}>
                              {alert.severity}
                            </Badge>
                            <span className="text-xs opacity-75">
                              Driver: {alert.driver_email}
                            </span>
                          </div>
                        </div>
                        <Button
                          onClick={() => handleDismissAlert(index)}
                          variant="outline"
                          size="sm"
                          className="shrink-0"
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Dismiss
                        </Button>
                      </div>
                      {alert.action_required && (
                        <div className="mt-3 p-3 rounded-lg bg-background/30 text-sm">
                          <strong>Action:</strong> {alert.action_required}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <CheckCircle className="w-12 h-12 text-green-500 mb-4" />
              <p className="text-lg font-semibold">No Active Alerts</p>
              <p className="text-sm text-muted-foreground mt-1">
                All drivers are performing within expected parameters
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}