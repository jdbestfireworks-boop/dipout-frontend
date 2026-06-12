import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, DollarSign, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function DriverPricingManager({ driverEmail, onClose }) {
  const [pricingConfigs, setPricingConfigs] = useState([]);
  const [newPricing, setNewPricing] = useState({
    base_multiplier: 1.0,
    day_of_week: 1,
    start_time: '09:00',
    end_time: '17:00',
    reason: '',
  });

  const addPricing = async () => {
    try {
      if (newPricing.base_multiplier < 0.5 || newPricing.base_multiplier > 3.0) {
        toast.error('Multiplier must be between 0.5 and 3.0');
        return;
      }

      const pricing = {
        ...newPricing,
        driver_email: driverEmail,
        active: true,
      };

      await base44.entities.DynamicPricing.create(pricing);
      setPricingConfigs([...pricingConfigs, pricing]);
      toast.success('Dynamic pricing added!');
    } catch (error) {
      toast.error('Failed to add pricing');
    }
  };

  const deletePricing = async (id) => {
    try {
      await base44.entities.DynamicPricing.delete(id);
      setPricingConfigs(pricingConfigs.filter(p => p.id !== id));
      toast.success('Pricing removed');
    } catch (error) {
      toast.error('Failed to remove pricing');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-lg">Dynamic Pricing</h3>
        {onClose && (
          <Button variant="ghost" size="sm" onClick={onClose}>
            Done
          </Button>
        )}
      </div>

      {/* Add New Pricing */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Set Custom Pricing</CardTitle>
          <CardDescription className="text-xs">
            Adjust your rates for specific time periods
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <Label>Price Multiplier</Label>
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-muted-foreground" />
              <Input
                type="number"
                step="0.1"
                min="0.5"
                max="3.0"
                value={newPricing.base_multiplier}
                onChange={(e) => setNewPricing({ ...newPricing, base_multiplier: parseFloat(e.target.value) })}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              1.0 = normal price, 1.5 = +50%, 2.0 = double
            </p>
          </div>

          <div className="space-y-2">
            <Label>Day</Label>
            <Select
              value={String(newPricing.day_of_week)}
              onValueChange={(value) => setNewPricing({ ...newPricing, day_of_week: Number(value) })}
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
                value={newPricing.start_time}
                onChange={(e) => setNewPricing({ ...newPricing, start_time: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>End Time</Label>
              <Input
                type="time"
                value={newPricing.end_time}
                onChange={(e) => setNewPricing({ ...newPricing, end_time: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Reason (optional)</Label>
            <Input
              placeholder="e.g., High demand, Weekend surge"
              value={newPricing.reason}
              onChange={(e) => setNewPricing({ ...newPricing, reason: e.target.value })}
            />
          </div>

          <Button onClick={addPricing} className="w-full gap-2">
            <Plus className="w-4 h-4" /> Add Pricing
          </Button>
        </CardContent>
      </Card>

      {/* Pricing List */}
      <div className="space-y-2">
        {pricingConfigs.map((pricing) => (
          <div
            key={pricing.id}
            className="flex items-center justify-between p-3 rounded-lg border border-border bg-card"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-primary" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-primary">{pricing.base_multiplier}x</span>
                  <Badge variant="outline" className="text-[10px]">
                    {days[pricing.day_of_week]}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  {pricing.start_time} - {pricing.end_time}
                </p>
                {pricing.reason && (
                  <p className="text-xs text-muted-foreground mt-1">{pricing.reason}</p>
                )}
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => deletePricing(pricing.id)}
              className="h-8 w-8"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        ))}
        {pricingConfigs.length === 0 && (
          <p className="text-center text-sm text-muted-foreground py-4">
            No custom pricing configured
          </p>
        )}
      </div>
    </div>
  );
}