import React, { useState } from 'react';
import { Plus, Trash2, MapPin, Navigation } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import AddressAutocomplete from './AddressAutocomplete';

export default function StopsManager({ 
  stops, 
  onAddStop, 
  onRemoveStop, 
  onUpdateStop,
  pickupAddress,
  dropoffAddress 
}) {
  const [showAddStop, setShowAddStop] = useState(false);
  const [newStopAddress, setNewStopAddress] = useState('');
  const [newStopCoords, setNewStopCoords] = useState(null);

  const addStop = () => {
    if (!newStopAddress || !newStopCoords) return;
    
    onAddStop({
      address: newStopAddress,
      lat: newStopCoords.lat,
      lng: newStopCoords.lng,
    });
    setNewStopAddress('');
    setNewStopCoords(null);
    setShowAddStop(false);
  };

  return (
    <div className="space-y-3">
      {/* Stops List */}
      {stops.length > 0 && (
        <div className="space-y-2">
          {stops.map((stop, index) => (
            <div
              key={index}
              className="flex items-center gap-3 p-3 rounded-xl border border-border bg-muted/30"
            >
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <MapPin className="w-4 h-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-0.5">
                  Stop #{index + 1}
                </p>
                <p className="text-sm font-medium truncate">{stop.address}</p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onRemoveStop(index)}
                className="h-8 w-8 shrink-0 text-destructive hover:text-destructive"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Add Stop Section */}
      {showAddStop ? (
        <div className="space-y-3 p-4 rounded-xl border border-border bg-card">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold">Add Stop</p>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setShowAddStop(false);
                setNewStopAddress('');
                setNewStopCoords(null);
              }}
              className="h-6 text-xs"
            >
              Cancel
            </Button>
          </div>
          
          <AddressAutocomplete
            placeholder="Enter stop address"
            value={newStopAddress}
            onChange={(val, coords) => {
              setNewStopAddress(val);
              setNewStopCoords(coords);
            }}
          />
          
          <Button
            onClick={addStop}
            disabled={!newStopAddress || !newStopCoords}
            className="w-full"
            size="sm"
          >
            <Plus className="w-4 h-4 mr-2" /> Add Stop
          </Button>
        </div>
      ) : (
        <Button
          variant="outline"
          onClick={() => setShowAddStop(true)}
          className="w-full border-dashed"
          size="sm"
        >
          <Plus className="w-4 h-4 mr-2" /> Add Intermediate Stop
        </Button>
      )}

      {/* Stop Count Badge */}
      {stops.length > 0 && (
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{stops.length} stop{stops.length > 1 ? 's' : ''} added</span>
          <Badge variant="outline" className="text-[10px]">
            +${(stops.length * 2.5).toFixed(2)} stop fee
          </Badge>
        </div>
      )}
    </div>
  );
}