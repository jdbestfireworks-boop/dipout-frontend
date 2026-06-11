import React from 'react';
import { Button } from '@/components/ui/button';
import { User, Phone, MessageCircle, Car } from 'lucide-react';

export function DriverAssigned({ driverName, rating, vehicle, plate, eta }) {
  return (
    <div className="bg-card rounded-xl border border-border p-5 space-y-3">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
          <User className="w-6 h-6 text-primary" />
        </div>
        <div className="flex-1">
          <p className="font-semibold">{driverName} • {rating}★</p>
          <p className="text-sm text-muted-foreground">{vehicle} • {plate}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground">Arriving in</p>
          <p className="font-bold text-primary">{eta}</p>
        </div>
      </div>
      <div className="flex gap-2">
        <Button className="flex-1" variant="outline" size="sm">
          <Phone className="w-4 h-4 mr-2" /> Call
        </Button>
        <Button className="flex-1" variant="outline" size="sm">
          <MessageCircle className="w-4 h-4 mr-2" /> Message
        </Button>
      </div>
    </div>
  );
}