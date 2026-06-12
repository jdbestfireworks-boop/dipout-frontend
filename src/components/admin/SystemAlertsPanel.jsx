import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  AlertTriangle, Bell, CheckCircle, XCircle, Clock, Filter, Search,
  RefreshCw, Plus, Eye, MessageSquare, Shield, User, Mail, Phone
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

const severityColors = {
  low: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  medium: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
  high: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
  critical: 'bg-red-500/15 text-red-400 border-red-500/30',
};

const typeIcons = {
  stuck_ride: <Clock className="w-4 h-4" />,
  no_drivers: <AlertTriangle className="w-4 h-4" />,
  long_ride: <Clock className="w-4 h-4" />,
  pending_driver: <User className="w-4 h-4" />,
  payment_issues: <Shield className="w-4 h-4" />,
  system_error: <AlertTriangle className="w-4 h-4" />,
};

export default function SystemAlertsPanel() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [resolutionNote, setResolutionNote] = useState('');

  const { data: alerts = [] } = useQuery({
    queryKey: ['system-alerts'],
    queryFn: () => base44.entities.SystemAlert.list('-created_date', 200),
    refetchInterval: 5000,
  });

  const resolveAlert = useMutation({
    mutationFn: async ({ alertId, note }) => {
      await base44.entities.SystemAlert.update(alertId, {
        resolved: true,
        resolved_at: new Date().toISOString(),
        resolution_note: note,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-alerts'] });
      toast.success('Alert resolved successfully');
      setSelectedAlert(null);
      setResolutionNote('');
    },
    onError: (error) => {
      toast.error('Failed to resolve alert: ' + error.message);
    },
  });

  const filteredAlerts = alerts.filter(alert => {
    const matchesFilter = filter === 'all' || 
      (filter === 'resolved' && alert.resolved) ||
      (filter === 'active' && !alert.resolved);
    const matchesSearch = searchQuery === '' ||
      alert.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      alert.message?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      alert.ride_id?.includes(searchQuery) ||
      alert.driver_email?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const activeAlerts = alerts.filter(a => !a.resolved);
  const criticalAlerts = activeAlerts.filter(a => a.severity === 'critical');

  return (
    <div className="space-y-4">
      {/* Header Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-500/15 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{criticalAlerts.length}</p>
                <p className="text-xs text-muted-foreground">Critical</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-orange-500/15 flex items-center justify-center">
                <Bell className="w-5 h-5 text-orange-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{activeAlerts.length}</p>
                <p className="text-xs text-muted-foreground">Active</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-green-500/15 flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{alerts.filter(a => a.resolved).length}</p>
                <p className="text-xs text-muted-foreground">Resolved</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center">
                <RefreshCw className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{alerts.length}</p>
                <p className="text-xs text-muted-foreground">Total</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search alerts..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2">
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('all')}
          >
            All
          </Button>
          <Button
            variant={filter === 'active' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('active')}
          >
            Active
          </Button>
          <Button
            variant={filter === 'resolved' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('resolved')}
          >
            Resolved
          </Button>
        </div>
      </div>

      {/* Alerts List */}
      <div className="grid gap-3">
        {filteredAlerts.map(alert => (
          <Card key={alert.id} className={alert.resolved ? 'opacity-60' : ''}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 flex-1">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${severityColors[alert.severity]}`}>
                    {typeIcons[alert.type] || <AlertTriangle className="w-5 h-5" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <CardTitle className="text-base font-bold">{alert.title}</CardTitle>
                      <Badge className={`${severityColors[alert.severity]} border text-[10px] capitalize`}>
                        {alert.severity}
                      </Badge>
                      {alert.resolved && (
                        <Badge variant="outline" className="text-[10px]">
                          <CheckCircle className="w-3 h-3 mr-1" /> Resolved
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{alert.message}</p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                      <span>{format(new Date(alert.created_date), 'MMM d, HH:mm')}</span>
                      {alert.ride_id && <span>• Ride: {alert.ride_id}</span>}
                      {alert.driver_email && <span>• Driver: {alert.driver_email}</span>}
                    </div>
                  </div>
                </div>
                {!alert.resolved && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setSelectedAlert(alert)}
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </CardHeader>
            {alert.resolved && alert.resolution_note && (
              <CardContent>
                <div className="p-3 rounded-lg bg-muted/50 border border-border">
                  <p className="text-xs text-muted-foreground">
                    <span className="font-semibold">Resolution:</span> {alert.resolution_note}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Resolved at: {format(new Date(alert.resolved_at), 'MMM d, HH:mm')}
                  </p>
                </div>
              </CardContent>
            )}
          </Card>
        ))}
        {filteredAlerts.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              <Filter className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p>No alerts found</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Resolution Dialog */}
      {selectedAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="text-lg">Resolve Alert</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-semibold">{selectedAlert.title}</p>
                <p className="text-sm text-muted-foreground mt-1">{selectedAlert.message}</p>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Resolution Notes</label>
                <Textarea
                  value={resolutionNote}
                  onChange={(e) => setResolutionNote(e.target.value)}
                  placeholder="Describe how you resolved this issue..."
                  className="min-h-[100px]"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedAlert(null);
                    setResolutionNote('');
                  }}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => resolveAlert.mutate({
                    alertId: selectedAlert.id,
                    note: resolutionNote,
                  })}
                  className="flex-1"
                  disabled={!resolutionNote.trim()}
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Mark Resolved
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}