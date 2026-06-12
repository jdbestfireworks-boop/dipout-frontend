import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  Bot, 
  AlertTriangle, 
  CheckCircle2, 
  RefreshCw, 
  TrendingUp, 
  Clock,
  Zap,
  Shield,
  DollarSign,
  Users,
  Car,
  AlertCircle,
  X,
  Sparkles
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

export default function AIAssistantPanel() {
  const queryClient = useQueryClient();
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [maintenanceRunning, setMaintenanceRunning] = useState(false);

  // Fetch active alerts
  const { data: alerts = [], refetch } = useQuery({
    queryKey: ['system-alerts'],
    queryFn: () => base44.entities.SystemAlert.filter({ resolved: false }, '-created_date', 50),
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  // Fetch system stats
  const { data: stats } = useQuery({
    queryKey: ['system-stats'],
    queryFn: async () => {
      const rides = await base44.entities.Ride.list();
      const drivers = await base44.entities.DriverProfile.list();
      return {
        total_rides: rides.length,
        active_rides: rides.filter(r => ['requested', 'accepted', 'in_progress'].includes(r.status)).length,
        online_drivers: drivers.filter(d => d.status !== 'offline').length,
        total_drivers: drivers.length,
        revenue: rides.filter(r => r.status === 'completed' && r.payment_status === 'paid')
          .reduce((sum, r) => sum + (r.fare || 0), 0)
      };
    },
    refetchInterval: 60000,
  });

  // Run maintenance
  const runMaintenance = useMutation({
    mutationFn: (task) => base44.functions.invoke('aiServerMaintenance', { task }),
    onMutate: () => setMaintenanceRunning(true),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['system-alerts'] });
      queryClient.invalidateQueries({ queryKey: ['system-stats'] });
      toast.success('Maintenance complete', {
        description: `${data.data.results.cleanup.completed} items cleaned, ${data.data.results.archive.completed} archived`
      });
    },
    onError: (error) => {
      toast.error('Maintenance failed', { description: error.message });
    },
    onSettled: () => setMaintenanceRunning(false),
  });

  // Resolve alert
  const resolveAlert = useMutation({
    mutationFn: async ({ alertId, note }) => {
      await base44.entities.SystemAlert.update(alertId, {
        resolved: true,
        resolved_at: new Date().toISOString(),
        resolution_note: note
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-alerts'] });
      toast.success('Alert resolved');
      setSelectedAlert(null);
    },
    onError: (error) => {
      toast.error('Failed to resolve alert', { description: error.message });
    },
  });

  const severityColors = {
    critical: 'bg-red-500/15 text-red-400 border-red-500/30',
    high: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
    medium: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
    low: 'bg-blue-500/15 text-blue-400 border-blue-500/30'
  };

  const severityIcons = {
    critical: AlertTriangle,
    high: AlertTriangle,
    medium: AlertCircle,
    low: CheckCircle2
  };

  const criticalCount = alerts.filter(a => a.severity === 'critical').length;
  const highCount = alerts.filter(a => a.severity === 'high').length;

  return (
    <div className="space-y-6">
      {/* AI Assistant Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Bot className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-display font-bold">AI System Assistant</h2>
            <p className="text-sm text-muted-foreground">Automated monitoring & maintenance</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => refetch()}
            className="gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>
          <Button
            onClick={() => runMaintenance.mutate('full')}
            disabled={maintenanceRunning}
            className="gap-2 bg-primary hover:bg-primary/90"
          >
            <Zap className={`w-4 h-4 ${maintenanceRunning ? 'animate-spin' : ''}`} />
            {maintenanceRunning ? 'Running...' : 'Run Maintenance'}
          </Button>
        </div>
      </div>

      {/* System Health Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Status</CardTitle>
            <Shield className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">
              {criticalCount === 0 && highCount === 0 ? 'Healthy' : 'Issues Detected'}
            </div>
            <p className="text-xs text-muted-foreground">
              {criticalCount} critical, {highCount} high priority alerts
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Rides</CardTitle>
            <Car className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.active_rides || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.total_rides || 0} total rides
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Online Drivers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.online_drivers || 0}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.total_drivers || 0} total drivers
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats?.revenue?.toFixed(2) || '0.00'}</div>
            <p className="text-xs text-muted-foreground">Total earned</p>
          </CardContent>
        </Card>
      </div>

      {/* Active Alerts */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-400" />
              <CardTitle>Active Alerts</CardTitle>
            </div>
            <Badge variant="secondary">{alerts.length} active</Badge>
          </div>
        </CardHeader>
        <CardContent>
          {alerts.length === 0 ? (
            <Alert className="bg-green-500/10 border-green-500/30">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <AlertTitle className="text-green-500">All Systems Normal</AlertTitle>
              <AlertDescription className="text-green-500/80">
                No issues detected. Automated monitoring is active.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-3">
              {alerts.slice(0, 10).map((alert) => {
                const Icon = severityIcons[alert.severity] || AlertCircle;
                return (
                  <div
                    key={alert.id}
                    className={`p-4 rounded-xl border cursor-pointer transition-all hover:shadow-md ${severityColors[alert.severity]}`}
                    onClick={() => setSelectedAlert(alert)}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 flex-1">
                        <Icon className="w-5 h-5 mt-0.5 shrink-0" />
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge className="capitalize text-[10px]">{alert.severity}</Badge>
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(alert.created_date), 'MMM d, HH:mm')}
                            </span>
                          </div>
                          <h4 className="font-semibold text-sm mb-1">{alert.title}</h4>
                          <p className="text-xs opacity-80">{alert.message}</p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="shrink-0 h-8 text-xs"
                        onClick={(e) => {
                          e.stopPropagation();
                          resolveAlert.mutate({ alertId: alert.id, note: 'Manually resolved' });
                        }}
                      >
                        Resolve
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            AI-Powered Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2">
            <Button
              variant="outline"
              className="justify-start gap-3 h-auto py-3"
              onClick={() => runMaintenance.mutate('cleanup')}
            >
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <RefreshCw className="w-4 h-4 text-blue-500" />
              </div>
              <div className="text-left">
                <p className="font-semibold text-sm">Clean Old Data</p>
                <p className="text-xs text-muted-foreground">Remove messages & old alerts</p>
              </div>
            </Button>

            <Button
              variant="outline"
              className="justify-start gap-3 h-auto py-3"
              onClick={() => runMaintenance.mutate('analyze')}
            >
              <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
                <Bot className="w-4 h-4 text-purple-500" />
              </div>
              <div className="text-left">
                <p className="font-semibold text-sm">AI System Analysis</p>
                <p className="text-xs text-muted-foreground">Get smart recommendations</p>
              </div>
            </Button>

            <Button
              variant="outline"
              className="justify-start gap-3 h-auto py-3"
              onClick={() => runMaintenance.mutate('archive')}
            >
              <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
              </div>
              <div className="text-left">
                <p className="font-semibold text-sm">Archive Old Rides</p>
                <p className="text-xs text-muted-foreground">Archive rides older than 90 days</p>
              </div>
            </Button>

            <Button
              variant="outline"
              className="justify-start gap-3 h-auto py-3"
              onClick={() => {
                runMaintenance.mutate('full');
              }}
            >
              <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center">
                <Zap className="w-4 h-4 text-orange-500" />
              </div>
              <div className="text-left">
                <p className="font-semibold text-sm">Full Maintenance</p>
                <p className="text-xs text-muted-foreground">Run all maintenance tasks</p>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Alert Detail Modal */}
      {selectedAlert && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <Card className="max-w-lg w-full max-h-[80vh] overflow-y-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {severityIcons[selectedAlert.severity] && 
                    React.createElement(severityIcons[selectedAlert.severity], {
                      className: `w-5 h-5 ${selectedAlert.severity === 'critical' ? 'text-red-500' : selectedAlert.severity === 'high' ? 'text-orange-500' : 'text-yellow-500'}`
                    })
                  }
                  <CardTitle>{selectedAlert.title}</CardTitle>
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => setSelectedAlert(null)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-semibold mb-1">Severity</p>
                <Badge className="capitalize">{selectedAlert.severity}</Badge>
              </div>

              <div>
                <p className="text-sm font-semibold mb-1">Message</p>
                <p className="text-sm text-muted-foreground">{selectedAlert.message}</p>
              </div>

              {selectedAlert.action_required && (
                <div>
                  <p className="text-sm font-semibold mb-1">Action Required</p>
                  <p className="text-sm text-muted-foreground">{selectedAlert.action_required}</p>
                </div>
              )}

              {selectedAlert.ride_id && (
                <div>
                  <p className="text-sm font-semibold mb-1">Related Ride</p>
                  <p className="text-sm text-muted-foreground">{selectedAlert.ride_id}</p>
                </div>
              )}

              <div className="flex gap-2 pt-4">
                <Button
                  className="flex-1"
                  onClick={() => resolveAlert.mutate({ 
                    alertId: selectedAlert.id, 
                    note: 'Resolved manually from dashboard' 
                  })}
                >
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Mark as Resolved
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setSelectedAlert(null)}
                >
                  Close
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}