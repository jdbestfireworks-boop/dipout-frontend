import React, { useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPin, Navigation, Banknote, CreditCard, X, Bell } from 'lucide-react';
import { motion } from 'framer-motion';

export default function RideRequestModal({ ride, onAccept, onDecline }) {
  const audioRef = useRef(null);

  useEffect(() => {
    // Play notification sound when modal opens
    if (audioRef.current) {
      audioRef.current.play().catch(() => {
        // Silent fail if audio autoplay is blocked
        console.log('Audio autoplay blocked');
      });
    }
  }, []);

  if (!ride) return null;

  return (
    <>
      {/* Hidden audio element for notification sound */}
      <audio
        ref={audioRef}
        src="https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3"
        preload="auto"
      />
      
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onDecline}
      >
        {/* Modal */}
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="bg-card border border-border rounded-3xl p-6 max-w-md w-full shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header with bell icon */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center animate-pulse">
                <Bell className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-display font-bold">New Ride Request!</h2>
                <p className="text-xs text-muted-foreground">Customer is waiting</p>
              </div>
            </div>
            <button
              onClick={onDecline}
              className="w-8 h-8 rounded-full hover:bg-accent flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Fare badge */}
          <div className="bg-primary/10 border border-primary/20 rounded-2xl p-4 mb-4 flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Your earnings</span>
            <span className="text-3xl font-bold text-primary">
              ${((ride.fare || 0) * 0.8).toFixed(2)}
            </span>
          </div>

          {/* Ride details */}
          <div className="space-y-3 mb-5">
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-primary mt-0.5 shrink-0" />
              <div className="flex-1">
                <p className="text-xs text-muted-foreground mb-0.5">Pickup</p>
                <p className="font-medium text-sm">{ride.pickup_address}</p>
              </div>
            </div>
            <div className="border-t border-border" />
            <div className="flex items-start gap-3">
              <Navigation className="w-5 h-5 text-muted-foreground mt-0.5 shrink-0" />
              <div className="flex-1">
                <p className="text-xs text-muted-foreground mb-0.5">Drop-off</p>
                <p className="font-medium text-sm">{ride.dropoff_address}</p>
              </div>
            </div>
            <div className="border-t border-border" />
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Distance</span>
              <span className="font-semibold">{ride.distance_km} mi</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Total fare</span>
              <span className="font-bold">${ride.fare?.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Payment</span>
              <Badge variant="outline" className="capitalize flex items-center gap-1">
                {ride.payment_method === 'cash'
                  ? <><Banknote className="w-3 h-3" /> Cash</>
                  : <><CreditCard className="w-3 h-3" /> Card</>
                }
              </Badge>
            </div>
          </div>

          {/* Action buttons */}
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              onClick={onDecline}
              className="h-12 rounded-xl font-semibold border-destructive text-destructive hover:bg-destructive/10"
            >
              Decline
            </Button>
            <Button
              onClick={onAccept}
              className="h-12 rounded-xl font-semibold bg-primary hover:bg-primary/90"
            >
              Accept Ride
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </>
  );
}