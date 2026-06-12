import React, { useState, useEffect } from 'react';
import { Car, Banknote, CreditCard, MapPin, Navigation, X, Check, Hand, MousePointer2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { toast } from 'sonner';

function mapsLink(address) {
  return `https://maps.google.com/?q=${encodeURIComponent(address)}`;
}

export default function RideRequestModal({ ride, onAccept, onDecline, swipeMode = true }) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-15, 15]);
  const opacity = useTransform(x, [-200, -150, 0, 150, 200], [0.5, 1, 1, 1, 0.5]);
  
  const [showAcceptOverlay, setShowAcceptOverlay] = useState(false);
  const [showDeclineOverlay, setShowDeclineOverlay] = useState(false);

  const handleDragEnd = async (_, info) => {
    const threshold = 100;
    
    if (info.offset.x > threshold) {
      // Swiped right - Accept
      setShowAcceptOverlay(true);
      await new Promise(resolve => setTimeout(resolve, 300));
      onAccept();
    } else if (info.offset.x < -threshold) {
      // Swiped left - Decline
      setShowDeclineOverlay(true);
      await new Promise(resolve => setTimeout(resolve, 300));
      onDecline();
    }
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!swipeMode) return;
      if (e.key === 'ArrowRight') {
        animate(x, 200, { duration: 0.3 });
        setTimeout(() => onAccept(), 300);
      } else if (e.key === 'ArrowLeft') {
        animate(x, -200, { duration: 0.3 });
        setTimeout(() => onDecline(), 300);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [swipeMode, onAccept, onDecline, x]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onDecline()}
    >
      {/* Swipe Overlays */}
      {showAcceptOverlay && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          className="absolute top-20 right-10 z-50 bg-green-500 text-white px-6 py-3 rounded-2xl font-bold text-2xl shadow-2xl rotate-12"
        >
          <Check className="w-8 h-8 inline mr-2" />
          ACCEPTED!
        </motion.div>
      )}
      
      {showDeclineOverlay && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          className="absolute top-20 left-10 z-50 bg-red-500 text-white px-6 py-3 rounded-2xl font-bold text-2xl shadow-2xl -rotate-12"
        >
          <X className="w-8 h-8 inline mr-2" />
          DECLINED!
        </motion.div>
      )}

      {/* Mode Toggle - Hidden since mode is now controlled by settings */}

      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 20 }}
        drag={swipeMode ? 'x' : false}
        dragConstraints={swipeMode ? { left: 0, right: 0 } : undefined}
        dragElastic={swipeMode ? 0.7 : 0}
        onDragEnd={swipeMode ? handleDragEnd : undefined}
        style={swipeMode ? { x, rotate, opacity } : undefined}
        className="rounded-2xl border border-border bg-card w-full max-w-md shadow-2xl overflow-hidden relative"
      >
        {/* Swipe Instructions */}
        {swipeMode && (
          <div className="absolute top-0 left-0 right-0 z-10 pointer-events-none">
            <div className="flex justify-between px-6 pt-4">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="text-red-500/50 text-xs font-bold"
              >
                ← SWIPE LEFT
              </motion.div>
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="text-green-500/50 text-xs font-bold"
              >
                SWIPE RIGHT →
              </motion.div>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="p-5 border-b border-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Car className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="text-xl font-bold">New Ride Request</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {swipeMode ? 'Swipe → to accept, ← to decline' : 'Tap accept to claim this ride'}
                </p>
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

        {/* Action Buttons - Always visible, but swipe is optional */}
        <div className="p-5 pt-0 flex gap-3">
          <Button
            variant="outline"
            onClick={onDecline}
            className="flex-1 h-12 border-2 hover:bg-destructive/10 hover:border-destructive hover:text-destructive transition-colors"
          >
            <X className="w-4 h-4 mr-2" />
            Decline
          </Button>
          <Button
            onClick={onAccept}
            className="flex-1 h-12 bg-primary text-primary-foreground font-semibold hover:opacity-90 shadow-lg shadow-primary/20 transition-opacity"
          >
            <Check className="w-4 h-4 mr-2" />
            Accept
          </Button>
        </div>

        {/* Keyboard Shortcuts Hint */}
        {swipeMode && (
          <div className="px-5 pb-3 text-center">
            <p className="text-[10px] text-muted-foreground">
              ⌨️ Arrow keys: ← decline, → accept
            </p>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}