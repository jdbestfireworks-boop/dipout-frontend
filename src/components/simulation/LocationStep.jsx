import React from 'react';
import { MapPin, Navigation } from 'lucide-react';

export function LocationStep({ pickup, destination, showDestination = false }) {
  return (
    <div className="bg-card rounded-xl border border-border p-4 space-y-3">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
          <MapPin className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1">
          <p className="text-xs text-muted-foreground">Pickup</p>
          <p className="font-semibold">{pickup}</p>
        </div>
      </div>
      {showDestination && (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <Navigation className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1">
            <p className="text-xs text-muted-foreground">Destination</p>
            <p className="font-semibold">{destination}</p>
          </div>
        </div>
      )}
      {!showDestination && (
        <div className="flex items-center gap-3 opacity-50">
          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
            <Navigation className="w-5 h-5 text-muted-foreground" />
          </div>
          <div className="flex-1">
            <p className="text-xs text-muted-foreground">Destination</p>
            <p className="text-sm">Enter destination...</p>
          </div>
        </div>
      )}
    </div>
  );
}