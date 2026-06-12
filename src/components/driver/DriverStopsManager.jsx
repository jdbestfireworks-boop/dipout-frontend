import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, MapPin, Navigation } from 'lucide-react';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function DriverStopsManager({ driverEmail, rideId, onClose }) {
  const [stops, setStops] = useState([]);
  const [newStop, setNewStop] = useState({
    address: '',
    stop_type: 'pickup',
    stop_number: 1,
  });

  const addStop = async () => {
    try {
      if (!newStop.address) {
        toast.error('Please enter an address');
        return;
      }

      const stop = {
        ...newStop,
        driver_email: driverEmail,
        ride_id: rideId || 'pending',
        completed: false,
      };

      await base44.entities.DriverStop.create(stop);
      setStops([...stops, stop]);
      setNewStop({ ...newStop, address: '', stop_number: stops.length + 2 });
      toast.success('Stop added!');
    } catch (error) {
      toast.error('Failed to add stop');
    }
  };

  const deleteStop = async (id) => {
    try {
      await base44.entities.DriverStop.delete(id);
      setStops(stops.filter(s => s.id !== id));
      toast.success('Stop removed');
    } catch (error) {
      toast.error('Failed to remove stop');
    }
  };

  const markComplete = async (id) => {
    try {
      await base44.entities.DriverStop.update(id, { completed: true });
      setStops(stops.map(s => s.id === id ? { ...s, completed: true } : s));
      toast.success('Stop marked complete');
    } catch (error) {
      toast.error('Failed to update stop');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-lg">Multi-Stop Route</h3>
        {onClose && (
          <Button variant="ghost" size="sm" onClick={onClose}>
            Done
          </Button>
        )}
      </div>

      {/* Add New Stop */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Add Stop</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <Label>Address</Label>
            <Input
              placeholder="Enter stop address"
              value={newStop.address}
              onChange={(e) => setNewStop({ ...newStop, address: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-2">
              <Label>Stop Type</Label>
              <Select
                value={newStop.stop_type}
                onValueChange={(value) => setNewStop({ ...newStop, stop_type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pickup">Pickup</SelectItem>
                  <SelectItem value="dropoff">Dropoff</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Stop #</Label>
              <Input
                type="number"
                min="1"
                value={newStop.stop_number}
                onChange={(e) => setNewStop({ ...newStop, stop_number: parseInt(e.target.value) })}
              />
            </div>
          </div>

          <Button onClick={addStop} className="w-full gap-2">
            <Plus className="w-4 h-4" /> Add Stop
          </Button>
        </CardContent>
      </Card>

      {/* Stops List */}
      <div className="space-y-2">
        {stops.map((stop) => (
          <div
            key={stop.id}
            className="flex items-center justify-between p-3 rounded-lg border border-border bg-card"
          >
            <div className="flex items-center gap-3 flex-1">
              {stop.stop_type === 'pickup' ? (
                <MapPin className="w-4 h-4 text-primary" />
              ) : (
                <Navigation className="w-4 h-4 text-muted-foreground" />
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <Badge variant={stop.stop_type === 'pickup' ? 'default' : 'secondary'} className="text-[10px]">
                    {stop.stop_type}
                  </Badge>
                  <span className="text-xs text-muted-foreground">Stop #{stop.stop_number}</span>
                </div>
                <p className="text-sm font-medium truncate">{stop.address}</p>
                {stop.completed && (
                  <Badge className="bg-green-500/15 text-green-400 border-0 text-[10px] mt-1">
                    Completed
                  </Badge>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1">
              {!stop.completed && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => markComplete(stop.id)}
                  className="text-xs h-8"
                >
                  Complete
                </Button>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => deleteStop(stop.id)}
                className="h-8 w-8"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ))}
        {stops.length === 0 && (
          <p className="text-center text-sm text-muted-foreground py-4">
            No stops added yet
          </p>
        )}
      </div>
    </div>
  );
}