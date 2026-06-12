import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { 
  DollarSign, 
  TrendingUp, 
  Calendar, 
  RefreshCw,
  Download,
  Users
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

export default function DriverEarningsTab() {
  const queryClient = useQueryClient();
  const [selectedWeek, setSelectedWeek] = useState(null);

  const { data: earnings = [], isLoading } = useQuery({
    queryKey: ['driver-earnings'],
    queryFn: () => base44.entities.DriverEarnings.list('-week_end', 52),
    refetchInterval: 60000,
  });

  const calculateMutation = useMutation({
    mutationFn: () => base44.functions.invoke('calculateWeeklyEarnings', {}),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['driver-earnings'] });
      toast.success(`Calculated earnings for ${data.data.drivers_processed} drivers`, {
        description: `Total payout: $${data.data.total_driver_payout}`
      });
    },
    onError: (error) => {
      toast.error('Failed to calculate earnings', {
        description: error.message
      });
    },
  });

  const handleManualCalculation = () => {
    calculateMutation.mutate();
  };

  // Group earnings by week
  const weeksMap = {};
  earnings.forEach(e => {
    const weekKey = `${e.week_start} to ${e.week_end}`;
    if (!weeksMap[weekKey]) {
      weeksMap[weekKey] = {
        week_start: e.week_start,
        week_end: e.week_end,
        drivers: [],
        total_trips: 0,
        total_payout: 0,
        total_platform: 0
      };
    }
    weeksMap[weekKey].drivers.push(e);
    weeksMap[weekKey].total_trips += e.trips_completed || 0;
    weeksMap[weekKey].total_payout += e.driver_payout || 0;
    weeksMap[weekKey].total_platform += e.platform_cut || 0;
  });

  const weeks = Object.values(weeksMap).sort((a, b) => 
    new Date(b.week_end) - new Date(a.week_end)
  );

  const selectedWeekData = selectedWeek ? weeksMap[`${selectedWeek.week_start} to ${selectedWeek.week_end}`] : null;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Drivers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Set(earnings.map(e => e.driver_email)).size}
            </div>
            <p className="text-xs text-muted-foreground">Active drivers</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Payout (All Time)</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${earnings.reduce((sum, e) => sum + (e.driver_payout || 0), 0).toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">80% to drivers</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Platform Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${earnings.reduce((sum, e) => sum + (e.platform_cut || 0), 0).toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">20% commission</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Trips</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {earnings.reduce((sum, e) => sum + (e.trips_completed || 0), 0)}
            </div>
            <p className="text-xs text-muted-foreground">All time completed</p>
          </CardContent>
        </Card>
      </div>

      {/* Manual Calculation Button */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Weekly Earnings Records</h2>
        <Button 
          onClick={handleManualCalculation} 
          disabled={calculateMutation.isPending}
          className="gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${calculateMutation.isPending ? 'animate-spin' : ''}`} />
          {calculateMutation.isPending ? 'Calculating...' : 'Calculate Now'}
        </Button>
      </div>

      {/* Weeks List */}
      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Week Period</TableHead>
              <TableHead className="text-right">Drivers</TableHead>
              <TableHead className="text-right">Trips</TableHead>
              <TableHead className="text-right">Total Payout</TableHead>
              <TableHead className="text-right">Platform Revenue</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {weeks.map((week) => (
              <TableRow key={week.week_start}>
                <TableCell className="font-medium">
                  {format(new Date(week.week_start), 'MMM d')} - {format(new Date(week.week_end), 'MMM d, yyyy')}
                </TableCell>
                <TableCell className="text-right">
                  <Badge variant="secondary">{week.drivers.length}</Badge>
                </TableCell>
                <TableCell className="text-right">{week.total_trips}</TableCell>
                <TableCell className="text-right font-medium">
                  ${week.total_payout.toFixed(2)}
                </TableCell>
                <TableCell className="text-right font-medium text-green-500">
                  ${week.total_platform.toFixed(2)}
                </TableCell>
                <TableCell className="text-right">
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => setSelectedWeek(week)}
                  >
                    View Details
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {weeks.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  No earnings records yet. Click "Calculate Now" to generate from completed rides.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Selected Week Details */}
      {selectedWeekData && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>
                Week of {format(new Date(selectedWeekData.week_start), 'MMM d')} - {format(new Date(selectedWeekData.week_end), 'MMM d, yyyy')}
              </CardTitle>
              <Button 
                size="sm" 
                variant="ghost" 
                onClick={() => setSelectedWeek(null)}
              >
                Close
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Driver</TableHead>
                  <TableHead className="text-right">Trips</TableHead>
                  <TableHead className="text-right">Gross Fare</TableHead>
                  <TableHead className="text-right">Driver Payout (80%)</TableHead>
                  <TableHead className="text-right">Platform (20%)</TableHead>
                  <TableHead className="text-right">Calculated</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {selectedWeekData.drivers
                  .sort((a, b) => (b.driver_payout || 0) - (a.driver_payout || 0))
                  .map((driver) => (
                    <TableRow key={driver.id}>
                      <TableCell className="font-medium">{driver.driver_email}</TableCell>
                      <TableCell className="text-right">{driver.trips_completed}</TableCell>
                      <TableCell className="text-right">${(driver.gross_fare || 0).toFixed(2)}</TableCell>
                      <TableCell className="text-right font-medium text-green-600">
                        ${(driver.driver_payout || 0).toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        ${(driver.platform_cut || 0).toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right text-xs text-muted-foreground">
                        {driver.calculated_date ? format(new Date(driver.calculated_date), 'MMM d, HH:mm') : '—'}
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}