import React from 'react';
import { Car, Banknote, CreditCard, MapPin, Navigation, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';

function mapsLink(address) {
  return `https://maps.google.com/?q=${encodeURIComponent(address)}`;
}

export default function RideRequestModal({ ride, onAccept, onDecline }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        className="rounded-2xl border border-border bg-card w-full max-w-md shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="p-5 border-b border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Car className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="text-xl font-bold">New Ride Request</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Tap accept to claim this ride</p>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          {/* Earnings */}
          <div className="rounded-xl bg-muted/50 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Your Earnings</p>
                <p className="text-3xl font-bold text-primary mt-1">${((ride.fare || 0) * 0.8).toFixed(2)}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Total Fare</p>
                <p className="text-xl font-semibold mt-1">${ride.fare?.toFixed(2)}</p>
              </div>
            </div>
          </div>

          {/* Route */}
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                <MapPin className="w-4 h-4 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-0.5">Pickup</p>
                <p className="text-sm font-medium leading-snug">{ride.pickup_address}</p>
                <a
                  href={mapsLink(ride.pickup_address)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-primary mt-1 hover:underline font-medium"
                >
                  Open in Maps ↗
                </a>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0 mt-0.5">
                <Navigation className="w-4 h-4 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-0.5">Drop-off</p>
                <p className="text-sm font-medium leading-snug">{ride.dropoff_address}</p>
                <a
                  href={mapsLink(ride.dropoff_address)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-primary mt-1 hover:underline font-medium"
                >
                  Open in Maps ↗
                </a>
              </div>
            </div>
          </div>

          {/* Payment Method */}
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="capitalize flex items-center gap-1.5">
              {ride.payment_method === 'cash' ? (
                <><Banknote className="w-3.5 h-3.5" /> Cash</>
              ) : (
                <><CreditCard className="w-3.5 h-3.5" /> Card</>
              )}
            </Badge>
            <span className="text-xs text-muted-foreground">{ride.distance_km} miles</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-5 pt-0 flex gap-3">
          <Button
            variant="outline"
            onClick={onDecline}
            className="flex-1 h-12 border-2 hover:bg-destructive/10 hover:border-destructive hover:text-destructive"
          >
            <X className="w-4 h-4 mr-2" />
            Decline
          </Button>
          <Button
            onClick={onAccept}
            className="flex-1 h-12 bg-primary text-primary-foreground font-semibold hover:opacity-90 shadow-lg shadow-primary/20"
          >
            Accept Ride
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}