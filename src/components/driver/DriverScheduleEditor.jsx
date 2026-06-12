import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Clock, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function DriverScheduleEditor({ driverEmail, onClose }) {
  const [schedules, setSchedules] = useState([]);
  const [newSchedule, setNewSchedule] = useState({
    day_of_week: 1,
    start_time: '09:00',
    end_time: '17:00',
  });

  const addSchedule = async () => {
    try {
      const schedule = {
        ...newSchedule,
        driver_email: driverEmail,
        active: true,
      };
      await base44.entities.DriverSchedule.create(schedule);
      setSchedules([...schedules, schedule]);
      toast.success('Schedule added!');
    } catch (error) {
      toast.error('Failed to add schedule');
    }
  };

  const deleteSchedule = async (id) => {
    try {
      await base44.entities.DriverSchedule.delete(id);
      setSchedules(schedules.filter(s => s.id !== id));
      toast.success('Schedule removed');
    } catch (error) {
      toast.error('Failed to remove schedule');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-lg">Work Schedule</h3>
        {onClose && (
          <Button variant="ghost" size="sm" onClick={onClose}>
            Done
          </Button>
        )}
      </div>

      {/* Add New Schedule */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Add Availability</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <Label>Day</Label>
            <Select
              value={String(newSchedule.day_of_week)}
              onValueChange={(value) => setNewSchedule({ ...newSchedule, day_of_week: Number(value) })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {days.map((day, idx) => (
                  <SelectItem key={idx} value={String(idx)}>{day}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-2">
              <Label>Start Time</Label>
              <Input
                type="time"
                value={newSchedule.start_time}
                onChange={(e) => setNewSchedule({ ...newSchedule, start_time: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>End Time</Label>
              <Input
                type="time"
                value={newSchedule.end_time}
                onChange={(e) => setNewSchedule({ ...newSchedule, end_time: e.target.value })}
              />
            </div>
          </div>

          <Button onClick={addSchedule} className="w-full gap-2">
            <Plus className="w-4 h-4" /> Add Schedule
          </Button>
        </CardContent>
      </Card>

      {/* Schedule List */}
      <div className="space-y-2">
        {schedules.map((schedule) => (
          <div
            key={schedule.id}
            className="flex items-center justify-between p-3 rounded-lg border border-border bg-card"
          >
            <div className="flex items-center gap-3">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">{days[schedule.day_of_week]}</p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Clock className="w-3 h-3" />
                  {schedule.start_time} - {schedule.end_time}
                </div>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => deleteSchedule(schedule.id)}
              className="h-8 w-8"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        ))}
        {schedules.length === 0 && (
          <p className="text-center text-sm text-muted-foreground py-4">
            No schedules added yet
          </p>
        )}
      </div>
    </div>
  );
}