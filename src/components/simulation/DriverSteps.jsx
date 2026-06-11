import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Navigation, CheckCircle2, Clock, Star, Car, User } from 'lucide-react';

export function DriverRequest({ earnings, pickup, dropoff }) {
  return (
    <div className="bg-card rounded-xl border-2 border-primary p-5 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">Earnings</p>
        <p className="text-2xl font-bold text-primary">{earnings}</p>
      </div>
      <div className="space-y-2">
        <div className="flex items-start gap-2">
          <MapPin className="w-4 h-4 text-primary mt-0.5" />
          <div>
            <p className="text-xs text-muted-foreground">Pickup</p>
            <p className="font-medium text-sm">{pickup}</p>
          </div>
        </div>
        <div className="flex items-start gap-2">
          <Navigation className="w-4 h-4 text-muted-foreground mt-0.5" />
          <div>
            <p className="text-xs text-muted-foreground">Drop-off</p>
            <p className="font-medium text-sm">{dropoff}</p>
          </div>
        </div>
      </div>
      <div className="flex gap-2">
        <Button className="flex-1" variant="outline">Decline</Button>
        <Button className="flex-1 bg-primary">Accept</Button>
      </div>
    </div>
  );
}

export function ActiveTrip({ status, fare, destination, distance }) {
  return (
    <div className="bg-card rounded-xl border border-border p-5 space-y-3">
      <div className="flex items-center justify-between">
        <Badge className="bg-primary/10 text-primary">
          <Clock className="w-3 h-3 mr-1" /> {status}
        </Badge>
        <p className="text-2xl font-bold text-primary">{fare}</p>
      </div>
      <div className="space-y-2">
        <div className="flex items-start gap-2">
          <Navigation className="w-4 h-4 text-primary mt-0.5" />
          <div>
            <p className="text-xs text-muted-foreground">To:</p>
            <p className="font-medium text-sm">{destination} ({distance})</p>
          </div>
        </div>
      </div>
      <Button className="w-full">
        <CheckCircle2 className="w-4 h-4 mr-2" /> Complete Trip
      </Button>
    </div>
  );
}

export function TripComplete({ earnings, rating }) {
  return (
    <div className="bg-card rounded-xl border border-border p-5 space-y-3">
      <div className="text-center space-y-2">
        <CheckCircle2 className="w-12 h-12 mx-auto text-green-500" />
        <div>
          <p className="text-3xl font-bold text-primary">{earnings}</p>
          <p className="text-sm text-muted-foreground">Your earnings (80%)</p>
        </div>
        <div className="flex items-center justify-center gap-2">
          <Star className="w-5 h-5 fill-primary text-primary" />
          <span className="font-semibold">{rating}</span>
        </div>
      </div>
    </div>
  );
}