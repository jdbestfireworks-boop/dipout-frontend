import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Navigation, Banknote, CreditCard, Clock, X } from 'lucide-react';
import { motion } from 'framer-motion';

export default function RideRequestModal({ ride, onAccept, onDecline }) {
  if (!ride) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[2000] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-card border border-border rounded-2xl max-w-md w-full overflow-hidden shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <MapPin className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="font-semibold text-sm">New Ride Request</p>
              <p className="text-xs text-muted-foreground">Expires in 30 seconds</p>
            </div>
          </div>
          <button onClick={onDecline} className="p-2 hover:bg-accent rounded-full transition-colors">
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        {/* Fare + Payment */}
        <div className="p-4 bg-primary/5 border-b border-border">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Fare</span>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold text-primary">${ride.fare?.toFixed(2)}</span>
              <Badge variant="outline" className="flex items-center gap-1">
                {ride.payment_method === 'cash'
                  ? <><Banknote className="w-3 h-3" /> Cash</>
                  : <><CreditCard className="w-3 h-3" /> Card</>
                }
              </Badge>
            </div>
          </div>
          <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
            <span>{ride.distance_km} km</span>
            {ride.surge_multiplier > 1 && (
              <Badge className="bg-accent text-accent-foreground border-0">
                {ride.surge_multiplier}x surge
              </Badge>
            )}
          </div>
        </div>

        {/* Route */}
        <div className="p-4 space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center shrink-0 mt-0.5">
              <MapPin className="w-3 h-3 text-primary-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground mb-0.5">Pickup</p>
              <p className="font-medium text-sm truncate">{ride.pickup_address}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-6 h-6 rounded-full bg-secondary border border-border flex items-center justify-center shrink-0 mt-0.5">
              <Navigation className="w-3 h-3 text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground mb-0.5">Drop-off</p>
              <p className="font-medium text-sm truncate">{ride.dropoff_address}</p>
            </div>
          </div>
          {ride.scheduled_for && (
            <div className="flex items-center gap-2 text-xs text-primary bg-primary/5 p-2 rounded-lg">
              <Clock className="w-3.5 h-3.5" />
              Scheduled: {new Intl.DateTimeFormat('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }).format(new Date(ride.scheduled_for))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="p-4 border-t border-border grid grid-cols-2 gap-3">
          <Button variant="outline" onClick={onDecline} className="h-11 rounded-xl font-semibold">
            Decline
          </Button>
          <Button onClick={onAccept} className="h-11 rounded-xl font-semibold bg-primary hover:bg-primary/90">
            Accept Ride
          </Button>
        </div>
      </motion.div>
    </div>
  );
}