import React from 'react';
import { motion } from 'framer-motion';
import { MapPin, Navigation, CreditCard, Banknote, Clock, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function RidePreview({ quote, pickupAddress, dropoffAddress, paymentMethod, scheduledFor, onConfirm, onCancel }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onCancel}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-card border border-border rounded-3xl p-6 max-w-md w-full space-y-5"
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-display font-bold">Confirm Your Ride</h2>
          <button onClick={onCancel} className="p-2 hover:bg-accent rounded-full transition-colors">
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* Route Preview */}
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shrink-0">
              <MapPin className="w-4 h-4 text-primary-foreground" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-muted-foreground">Pickup</p>
              <p className="font-medium text-sm">{pickupAddress || 'N/A'}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-secondary border border-border flex items-center justify-center shrink-0">
              <Navigation className="w-4 h-4 text-muted-foreground" />
            </div>
            <div className="flex-1">
              <p className="text-xs text-muted-foreground">Drop-off</p>
              <p className="font-medium text-sm">{dropoffAddress || 'N/A'}</p>
            </div>
          </div>
        </div>

        {/* Schedule */}
        {scheduledFor && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground bg-accent/50 p-3 rounded-xl">
            <Clock className="w-4 h-4 text-primary" />
            <span>Scheduled: {new Intl.DateTimeFormat('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }).format(new Date(scheduledFor))}</span>
          </div>
        )}

        {/* Fare Summary */}
        <div className="border-t border-border pt-4 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Base fare</span>
            <span className="font-medium">${quote?.baseFare.toFixed(2) || '0.00'}</span>
          </div>
          {quote?.surgeMultiplier > 1 && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Surge ({quote.surgeMultiplier}x)</span>
              <span className="font-medium text-primary">+${((quote?.fare || 0) - (quote?.baseFare || 0)).toFixed(2)}</span>
            </div>
          )}
          <div className="border-t border-border pt-2 flex items-center justify-between">
            <span className="font-semibold">Total</span>
            <span className="font-bold text-lg text-primary">${quote?.fare.toFixed(2) || '0.00'}</span>
          </div>
        </div>

        {/* Payment */}
        <div className="flex items-center justify-between bg-accent/50 p-3 rounded-xl">
          <span className="text-sm text-muted-foreground">Payment</span>
          <Badge variant="outline" className="capitalize flex items-center gap-1">
            {paymentMethod === 'cash' ? <><Banknote className="w-3 h-3" /> Cash</> : <><CreditCard className="w-3 h-3" /> Card</>}
          </Badge>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <Button variant="outline" onClick={onCancel} className="flex-1 h-12">
            Back
          </Button>
          <Button onClick={onConfirm} className="flex-1 h-12 font-semibold">
            Confirm Ride
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}