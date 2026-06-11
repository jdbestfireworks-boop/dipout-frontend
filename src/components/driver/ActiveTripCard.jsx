import React from 'react';
import { MapPin, Navigation, ExternalLink, Banknote, CreditCard, Phone, MessageCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import RideChat from '@/components/ride/RideChat';

function mapsLink(address) {
  return `https://maps.google.com/?q=${encodeURIComponent(address)}`;
}

function dirLink(from, to) {
  return `https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(from)}&destination=${encodeURIComponent(to)}`;
}

export default function ActiveTripCard({ 
  ride, 
  user, 
  onStartTrip, 
  onCompleteTrip 
}) {
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Current Trip</h2>
        <Badge className="capitalize bg-primary/10 text-primary border-primary/20">
          {ride.status.replace('_', ' ')}
        </Badge>
      </div>

      {/* Rider Info Card */}
      <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
        <div className="flex items-center gap-3 pb-3 border-b border-border">
          <div className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <Phone className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1">
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Rider</p>
            <p className="font-semibold text-base">{ride.rider_email}</p>
          </div>
        </div>

        {/* Chat & Contact */}
        <RideChat
          ride={ride}
          myEmail={user?.email}
          myRole="driver"
          otherEmail={ride.rider_email}
          driverPhone={ride.driver_phone}
          riderPhone={ride.rider_phone}
        />

        {/* Fare & Payment */}
        <div className="flex items-center justify-between pt-2">
          <div>
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Total Fare</p>
            <p className="text-2xl font-bold text-primary">${ride.fare?.toFixed(2)}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Payment</p>
            <Badge variant="outline" className="capitalize flex items-center gap-1.5 mt-1">
              {ride.payment_method === 'cash' ? (
                <><Banknote className="w-3.5 h-3.5" /> Cash</>
              ) : (
                <><CreditCard className="w-3.5 h-3.5" /> Card</>
              )}
            </Badge>
          </div>
        </div>
      </div>

      {/* Route Info Card */}
      <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
            <MapPin className="w-4 h-4 text-primary" />
          </div>
          <div className="flex-1">
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-1">Pickup Location</p>
            <p className="text-sm font-medium leading-snug">{ride.pickup_address}</p>
            <a
              href={mapsLink(ride.pickup_address)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-primary mt-2 hover:underline font-medium"
            >
              Open in Maps <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>

        <div className="border-t border-border" />

        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0 mt-0.5">
            <Navigation className="w-4 h-4 text-muted-foreground" />
          </div>
          <div className="flex-1">
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-1">Destination</p>
            <p className="text-sm font-medium leading-snug">{ride.dropoff_address}</p>
            <a
              href={mapsLink(ride.dropoff_address)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-primary mt-2 hover:underline font-medium"
            >
              Open in Maps <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>

        {/* Full Directions Button */}
        <a
          href={dirLink(ride.pickup_address, ride.dropoff_address)}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full py-3.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-opacity shadow-lg shadow-primary/20"
        >
          <Navigation className="w-4 h-4" /> Get Full Directions
        </a>
      </div>

      {/* Action Buttons */}
      {ride.status === 'accepted' && (
        <button
          onClick={onStartTrip}
          className="w-full h-14 rounded-2xl bg-secondary text-secondary-foreground font-semibold text-base hover:bg-secondary/80 transition-all shadow-sm"
        >
          Start Trip - Rider Picked Up
        </button>
      )}

      {ride.status === 'in_progress' && (
        <button
          onClick={onCompleteTrip}
          className="w-full h-14 rounded-2xl bg-primary text-primary-foreground font-semibold text-base hover:opacity-90 transition-all shadow-lg shadow-primary/20"
        >
          Complete Trip
        </button>
      )}
    </div>
  );
}