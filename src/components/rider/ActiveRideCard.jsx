import React from 'react';
import { MapPin, Navigation, ExternalLink, Car, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import RideChat from '@/components/ride/RideChat';

function mapsLink(address) {
  return `https://maps.google.com/?q=${encodeURIComponent(address)}`;
}

export default function ActiveRideCard({ 
  ride, 
  user, 
  gpsEnabled, 
  onToggleGps,
  onCancelRide,
  onCompleteTrip,
  onBookNewRide,
  onInitiateCancel
}) {

  return (
    <>
      <div className="bg-card rounded-2xl border border-border p-5 space-y-4 shadow-sm">
        {/* Status Header */}
        <div className="flex items-center gap-3 pb-3 border-b border-border">
          <div className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <Car className="w-6 h-6 text-primary" />
          </div>
          <div className="flex-1">
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Your Driver</p>
            <p className="font-semibold text-base">{ride.driver_email || 'Finding driver...'}</p>
          </div>
        </div>

        {/* Chat & Contact */}
        <RideChat
          ride={ride}
          myEmail={user?.email}
          myRole="rider"
          otherEmail={ride.driver_email}
          driverPhone={ride.driver_phone}
          riderPhone={user?.phone_number}
        />

        {/* GPS Toggle */}
        <div className="rounded-xl border border-border p-3.5 flex items-center justify-between bg-muted/30">
          <div className="flex items-center gap-3">
            <div className={`w-2.5 h-2.5 rounded-full ${gpsEnabled ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
            <div>
              <p className="text-sm font-medium">GPS Location Sharing</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {gpsEnabled ? 'Your driver can see your real-time location' : 'Location is hidden from driver'}
              </p>
            </div>
          </div>
          <button
            onClick={onToggleGps}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              gpsEnabled ? 'bg-primary' : 'bg-gray-400'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                gpsEnabled ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {/* Route Info */}
        <div className="space-y-4 pt-1">
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
                className="inline-flex items-center gap-1 text-xs text-primary mt-1.5 hover:underline font-medium"
              >
                Open in Maps <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

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
                className="inline-flex items-center gap-1 text-xs text-primary mt-1.5 hover:underline font-medium"
              >
                Open in Maps <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>

        {/* Fare Summary */}
        <div className="pt-3 border-t border-border flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Total Fare</p>
            <p className="text-2xl font-bold text-primary">${ride.fare?.toFixed(2)}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Payment</p>
            <p className="text-sm font-medium capitalize">{ride.payment_method}</p>
          </div>
        </div>

        {/* Action Buttons */}
        {['requested', 'accepted'].includes(ride.status) && (
          <Button 
            variant="ghost" 
            onClick={onInitiateCancel}
            className="w-full text-destructive hover:bg-destructive/10 h-11"
          >
            <AlertTriangle className="w-4 h-4 mr-2" />
            Cancel Ride
          </Button>
        )}

        {ride.status === 'in_progress' && (
          <Button 
            variant="outline" 
            onClick={onCompleteTrip}
            className="w-full h-11"
          >
            Mark Trip as Completed
          </Button>
        )}

        {ride.status === 'cancelled' && (
          <Button 
            variant="outline" 
            onClick={onBookNewRide}
            className="w-full h-11"
          >
            Book Another Ride
          </Button>
        )}
      </div>
    </>
  );
}