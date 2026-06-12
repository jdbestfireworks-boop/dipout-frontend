import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { DollarSign, Save, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

export default function PricingControls() {
  const queryClient = useQueryClient();

  const { data: configs = [], isLoading } = useQuery({
    queryKey: ['pricing-config'],
    queryFn: () => base44.entities.PricingConfig.list(),
  });

  const activeConfig = configs.find(c => c.active);

  const defaultConfig = {
    base_fare: 3.0,
    per_mile_rate: 2.5,
    driver_commission: 0.8,
    min_fare: 5.0,
  };

  const current = activeConfig || defaultConfig;
  const [formData, setFormData] = useState(current);

  // Update formData when current changes
  useEffect(() => {
    setFormData(current);
  }, [current]);

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      if (activeConfig) {
        await base44.entities.PricingConfig.update(activeConfig.id, { 
          ...data,
          active: true 
        });
        return activeConfig;
      } else {
        return await base44.entities.PricingConfig.create({ 
          ...data, 
          name: 'Default Pricing',
          active: true 
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pricing-config'] });
      toast.success('Pricing updated successfully');
    },
  });

  const handleSave = () => {
    if (!formData) return;
    saveMutation.mutate(formData);
  };

  if (isLoading) {
    return (
      <div className="rounded-2xl border border-border bg-card p-6">
        <div className="flex items-center gap-2 text-muted-foreground">
          <DollarSign className="w-5 h-5 animate-pulse" />
          <span>Loading pricing settings...</span>
        </div>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-border bg-card p-6 space-y-5"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <DollarSign className="w-5 h-5 text-primary fill-primary" />
          </div>
          <div>
            <h3 className="font-bold text-lg">Pricing & Payments</h3>
            <p className="text-xs text-muted-foreground">Set base fares, rates, and driver commissions</p>
          </div>
        </div>
        {activeConfig && (
          <Badge className="bg-primary/10 text-primary border-0">Active</Badge>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="baseFare">Base Fare ($)</Label>
          <Input
            id="baseFare"
            type="number"
            step="0.1"
            value={formData.base_fare}
            onChange={(e) => setFormData({ ...formData, base_fare: parseFloat(e.target.value) || 0 })}
            className="h-11"
          />
          <p className="text-xs text-muted-foreground">Starting fare for every ride</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="perMile">Per Mile Rate ($)</Label>
          <Input
            id="perMile"
            type="number"
            step="0.1"
            value={formData.per_mile_rate}
            onChange={(e) => setFormData({ ...formData, per_mile_rate: parseFloat(e.target.value) || 0 })}
            className="h-11"
          />
          <p className="text-xs text-muted-foreground">Distance-based pricing</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="minFare">Minimum Fare ($)</Label>
          <Input
            id="minFare"
            type="number"
            step="0.1"
            value={formData.min_fare}
            onChange={(e) => setFormData({ ...formData, min_fare: parseFloat(e.target.value) || 0 })}
            className="h-11"
          />
          <p className="text-xs text-muted-foreground">Lowest possible ride cost</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="driverCommission">Driver Commission (%)</Label>
          <Input
            id="driverCommission"
            type="number"
            step="1"
            min="0"
            max="100"
            value={Math.round(formData.driver_commission * 100)}
            onChange={(e) => setFormData({ ...formData, driver_commission: (parseInt(e.target.value) || 0) / 100 })}
            className="h-11"
          />
          <p className="text-xs text-muted-foreground">Percentage paid to driver</p>
        </div>
      </div>

      <div className="flex items-center gap-3 pt-4 border-t border-border">
        <Button 
          onClick={handleSave} 
          disabled={saveMutation.isPending}
          className="flex-1 h-11"
        >
          {saveMutation.isPending ? (
            <><RotateCcw className="w-4 h-4 mr-2 animate-spin" /> Saving...</>
          ) : (
            <><Save className="w-4 h-4 mr-2" /> Save Pricing</>
          )}
        </Button>
      </div>

      {/* Preview */}
      <div className="bg-accent/30 rounded-xl p-4 space-y-2 text-sm">
        <p className="font-semibold text-xs uppercase text-muted-foreground mb-2">Example: 5 mile ride</p>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Base fare</span>
          <span className="font-medium">${formData.base_fare?.toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Distance (5 mi × ${formData.per_mile_rate?.toFixed(2)})</span>
          <span className="font-medium">${(5 * formData.per_mile_rate).toFixed(2)}</span>
        </div>
        <div className="flex justify-between pt-2 border-t border-border font-bold text-base">
          <span>Total Fare</span>
          <span className="text-primary">${Math.max(formData.base_fare + 5 * formData.per_mile_rate, formData.min_fare).toFixed(2)}</span>
        </div>
        <div className="flex justify-between pt-2 border-t border-border text-xs">
          <span className="text-muted-foreground">Driver earns ({Math.round(formData.driver_commission * 100)}%)</span>
          <span className="text-green-600 font-semibold">
            ${(Math.max(formData.base_fare + 5 * formData.per_mile_rate, formData.min_fare) * formData.driver_commission).toFixed(2)}
          </span>
        </div>
      </div>
    </motion.div>
  );
}