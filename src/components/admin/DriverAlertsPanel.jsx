import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { 
  AlertCircle, 
  AlertTriangle, 
  CheckCircle2, 
  DollarSign, 
  XCircle,
  RefreshCw,
  Bell,
  TrendingDown,
  Star,
  Mail
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

const severityColors = {
  high: 'bg-red-500/15 text-red-400 border-red-500/30',
  medium: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
  low: 'bg-blue-500/15 text-blue-400 border-blue-500/30'
};

const typeIcons = {
  low_earnings: TrendingDown,
  no_trips: AlertCircle,
  ride_issue: AlertTriangle
};

export default function DriverAlertsPanel() {
  const [threshold, setThreshold] = useState(50);
  const [checking, setChecking] = useState(false);

  const { data: alertsData, refetch } = useQuery({
    queryKey: ['driver-alerts', threshold],
    queryFn: async () => {
      const res = await base44.functions.invoke('checkDriverAlerts', { earningsThreshold: threshold });
      return res.data;
    },
    enabled: false,
  });

  const handleCheck = async () => {
    setChecking(true);
    try {
      await refetch();
      toast.success(`Alert check complete: ${alertsData?.summary?.total || 0} alerts found`);
    } catch (err) {
      toast.error('Failed to check alerts: ' + err.message);
    } finally {
      setChecking(false);
    }
  };

  const handleSendEmailAlert = async (alert) => {
    try {
      await base44.functions.invoke('sendMonthlyReport', {
        to: alert.driver_email,
        subject: `Dip Out Alert: ${alert.title}`,
        message: alert.message
      });
      toast.success('Email sent to driver');
    } catch (err) {
      toast.error('Failed to send email: ' + err.message);
    }
  };

  const alerts = alertsData?.alerts || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-display font-bold">Driver Alerts</h2>
          <p className="text-sm text-muted-foreground mt-0.5">Monitor earnings thresholds and reported issues</p>
        </div>
        <Button 
          onClick={handleCheck} 
          disabled={checking}
          className="gap-2 px-6 py-3 text-base"
          size="lg"
        >
          <RefreshCw className={`w-5 h-5 ${checking ? 'animate-spin' : ''}`} />
          {checking ? 'Checking...' : 'Run Alert Check'}
        </Button>
      </div>

      {/* Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Alert Settings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <label className="text-sm font-medium">Weekly Earnings Threshold:</label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="number"
                  value={threshold}
                  onChange={(e) => setThreshold(Number(e.target.value))}
                  className="pl-8 w-32"
                />
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Drivers earning below this amount this week will trigger an alert
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      {alertsData?.summary && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Alerts</CardTitle>
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{alertsData.summary.total}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Critical</CardTitle>
              <XCircle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-500">{alertsData.summary.critical}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Low Earnings</CardTitle>
              <TrendingDown className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-500">{alertsData.summary.low_earnings}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ride Issues</CardTitle>
              <AlertTriangle className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-500">{alertsData.summary.ride_issues}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Alerts List */}
      <div className="space-y-4">
        {alerts.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              <CheckCircle2 className="w-12 h-12 mx-auto mb-4 text-green-500" />
              <p className="text-lg font-medium">No alerts detected</p>
              <p className="text-sm">All drivers are performing well this week</p>
            </CardContent>
          </Card>
        ) : (
          alerts.map((alert, idx) => {
            const Icon = typeIcons[alert.type] || AlertCircle;
            return (
              <Alert key={idx} className={`border-l-4 ${severityColors[alert.severity]}`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1">
                    <Icon className="w-5 h-5 mt-0.5" />
                    <div className="flex-1">
                      <AlertTitle className="flex items-center gap-2">
                        {alert.title}
                        <Badge className={`${severityColors[alert.severity]} border-0 text-xs`}>
                          {alert.severity}
                        </Badge>
                      </AlertTitle>
                      <AlertDescription className="mt-2 space-y-2">
                        <p className="text-sm">{alert.message}</p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          {alert.driver_email && (
                            <span>Driver: {alert.driver_email}</span>
                          )}
                          {alert.ride_id && (
                            <span>Ride ID: {alert.ride_id}</span>
                          )}
                          {alert.data && (
                            <span className="flex items-center gap-1">
                              <DollarSign className="w-3 h-3" />
                              {alert.data.weekly_earnings !== undefined && 
                                `$${alert.data.weekly_earnings.toFixed(2)}`
                              }
                              {alert.data.trips_completed !== undefined && 
                                `${alert.data.trips_completed} trips`
                              }
                              {alert.data.rating !== undefined && 
                                `Rating: ${alert.data.rating}★`
                              }
                            </span>
                          )}
                        </div>
                        <div className="pt-2">
                          <p className="text-xs font-medium text-muted-foreground mb-2">
                            Action Required: {alert.action_required}
                          </p>
                          {alert.driver_email && (
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleSendEmailAlert(alert)}
                              className="gap-2 text-xs"
                            >
                              <Mail className="w-3 h-3" />
                              Email Driver
                            </Button>
                          )}
                        </div>
                      </AlertDescription>
                    </div>
                  </div>
                </div>
              </Alert>
            );
          })
        )}
      </div>
    </div>
  );
}