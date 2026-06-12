import React from 'react';
import { MapPin, Plus, Trash2, Navigation } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import AddressAutocomplete from './AddressAutocomplete';

export default function MultiStopSelector({ 
  stops, 
  onAddStop, 
  onRemoveStop, 
  onUpdateStop,
  pickupAddress,
  dropoffAddress 
}) {
  return (
    <div className="space-y-3">
      {/* Pickup - Always first */}
      <div className="flex items-start gap-3 p-3 rounded-xl border border-border bg-card">
        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
          <MapPin className="w-4 h-4 text-primary" />
        </div>
        <div className="flex-1">
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-1">Pickup</p>
          <p className="text-sm font-medium">{pickupAddress || 'Not set'}</p>
        </div>
      </div>

      {/* Intermediate Stops */}
      {stops.map((stop, index) => (
        <div
          key={stop.id || index}
          className="flex items-start gap-3 p-3 rounded-xl border border-border bg-card"
        >
          <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center shrink-0 mt-0.5">
            <Navigation className="w-4 h-4 text-muted-foreground" />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                Stop {index + 1}
              </p>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onRemoveStop(index)}
                className="h-6 w-6 text-destructive hover:text-destructive"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </div>
            <AddressAutocomplete
              value={stop.address}
              onChange={(address, coords) => onUpdateStop(index, { address, ...coords })}
              placeholder="Enter stop address"
            />
            {stop.notes && (
              <p className="text-xs text-muted-foreground mt-1">{stop.notes}</p>
            )}
          </div>
        </div>
      ))}

      {/* Dropoff - Always last */}
      <div className="flex items-start gap-3 p-3 rounded-xl border border-border bg-card">
        <div className="w-8 h-8 rounded-full bg-destructive/10 flex items-center justify-center shrink-0 mt-0.5">
          <MapPin className="w-4 h-4 text-destructive" />
        </div>
        <div className="flex-1">
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-1">Dropoff</p>
          <p className="text-sm font-medium">{dropoffAddress || 'Not set'}</p>
        </div>
      </div>

      {/* Add Stop Button */}
      <Button
        variant="outline"
        onClick={onAddStop}
        className="w-full border-dashed border-2 hover:bg-accent/50"
      >
        <Plus className="w-4 h-4 mr-2" />
        Add Stop
      </Button>

      {/* Stop Count Summary */}
      {stops.length > 0 && (
        <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-muted/50">
          <p className="text-xs text-muted-foreground">
            {stops.length} additional stop{stops.length > 1 ? 's' : ''}
          </p>
          <Badge variant="outline" className="text-[10px]">
            +${(stops.length * 2.5).toFixed(2)} fare adjustment
          </Badge>
        </div>
      )}
    </div>
  );
}