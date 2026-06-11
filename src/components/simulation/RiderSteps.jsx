import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Navigation, Clock, ChevronRight, Car, User, Star, CheckCircle2, Zap, CreditCard, Banknote, Loader2, Phone, MessageCircle } from 'lucide-react';

export function LocationInput({ pickup, destination }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3 p-3 rounded-xl border border-border bg-card">
        <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
          <MapPin className="w-5 h-5 text-blue-500" />
        </div>
        <div className="flex-1">
          <p className="text-xs text-muted-foreground">Pickup</p>
          <p className="font-semibold">{pickup}</p>
        </div>
      </div>
      <div className="flex items-center gap-3 p-3 rounded-xl border border-border bg-card">
        <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center">
          <Navigation className="w-5 h-5 text-green-500" />
        </div>
        <div className="flex-1">
          <p className="text-xs text-muted-foreground">Destination</p>
          <p className="font-semibold">{destination}</p>
        </div>
      </div>
    </div>
  );
}

export function RideRequest({ fare, distance, surge }) {
  return (
    <div className="bg-card rounded-xl border border-border p-5 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-muted-foreground">Estimated Fare</p>
          <p className="text-3xl font-bold text-primary">{fare}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground">Distance</p>
          <p className="text-lg font-semibold">{distance}</p>
        </div>
      </div>
      {surge > 1 && (
        <Badge className="bg-orange-500/10 text-orange-500">
          {surge}x Surge Pricing
        </Badge>
      )}
      <div className="flex gap-2">
        <Button className="flex-1" variant="outline">Card</Button>
        <Button className="flex-1" variant="outline">Cash</Button>
      </div>
    </div>
  );
}

export function FindingDriver() {
  return (
    <div className="bg-card rounded-xl border border-border p-6 text-center space-y-4">
      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto animate-pulse">
        <Car className="w-8 h-8 text-primary" />
      </div>
      <div>
        <p className="font-bold text-lg">Finding your driver...</p>
        <p className="text-sm text-muted-foreground">Broadcasting to nearby drivers</p>
      </div>
    </div>
  );
}

export function DriverAssigned({ name, rating, vehicle, plate, eta }) {
  return (
    <div className="bg-card rounded-xl border border-border p-5 space-y-3">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
          <User className="w-6 h-6 text-primary" />
        </div>
        <div className="flex-1">
          <p className="font-semibold">{name} • {rating}★</p>
          <p className="text-sm text-muted-foreground">{vehicle} • {plate}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground">Arriving in</p>
          <p className="font-bold text-primary">{eta}</p>
        </div>
      </div>
      <div className="flex gap-2">
        <Button className="flex-1" variant="outline" size="sm">Call</Button>
        <Button className="flex-1" variant="outline" size="sm">Message</Button>
      </div>
    </div>
  );
}

export function TripInProgress({ destination, distance, fare }) {
  return (
    <div className="bg-card rounded-xl border border-border p-5 space-y-3">
      <div className="flex items-center justify-between">
        <Badge className="bg-primary/10 text-primary">
          <Clock className="w-3 h-3 mr-1" /> In Progress
        </Badge>
        <p className="text-2xl font-bold text-primary">{fare}</p>
      </div>
      <div className="space-y-2">
        <div className="flex items-start gap-2">
          <Navigation className="w-4 h-4 text-primary mt-0.5" />
          <div className="flex-1">
            <p className="text-xs text-muted-foreground">To:</p>
            <p className="font-medium">{destination}</p>
            <p className="text-sm text-muted-foreground">{distance}</p>
          </div>
        </div>
      </div>
      <Button className="w-full">
        <ChevronRight className="w-4 h-4 mr-2" /> Navigate
      </Button>
    </div>
  );
}