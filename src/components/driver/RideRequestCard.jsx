import React from 'react';
import { MapPin, Navigation, Banknote, CreditCard, CheckCircle2, XCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

const statusColors = {
  completed: 'bg-green-500/15 text-green-400',
  cancelled: 'bg-destructive/15 text-destructive',
};

export default function RideRequestCard({ ride, onSelect, isHistory }) {
  const isHistoryMode = isHistory || ['completed', 'cancelled'].includes(ride.status);
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={() => !isHistoryMode && onSelect(ride)}
      className={cn(
        "rounded-2xl border border-border bg-card p-5 transition-all",
        isHistoryMode 
          ? 'cursor-default opacity-75' 
          : 'cursor-pointer hover:border-primary/50 hover:shadow-md'
      )}
    >
      {/* Header - Fare & Payment or Status */}
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-border">
        {isHistoryMode ? (
          <>
            <div>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Status</p>
              <div className="flex items-center gap-2 mt-0.5">
                {ride.status === 'completed' ? (
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                ) : (
                  <XCircle className="w-5 h-5 text-destructive" />
                )}
                <p className="text-lg font-bold capitalize">{ride.status}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Earned</p>
              <p className="text-lg font-semibold mt-0.5">${((ride.fare || 0) * 0.8).toFixed(2)}</p>
            </div>
          </>
        ) : (
          <>
            <div>
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Earnings</p>
              <p className="text-3xl font-bold text-primary">${((ride.fare || 0) * 0.8).toFixed(2)}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Distance</p>
              <p className="text-lg font-semibold mt-0.5">{ride.distance_km} mi</p>
            </div>
          </>
        )}
      </div>

      {/* Route Info */}
      <div className="space-y-3">
        <div className="flex items-start gap-3">
          <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
            <MapPin className="w-3.5 h-3.5 text-primary" />
          </div>
          <div className="flex-1">
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-0.5">Pickup</p>
            <p className="text-sm font-medium leading-snug line-clamp-2">{ride.pickup_address}</p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center shrink-0 mt-0.5">
            <Navigation className="w-3.5 h-3.5 text-muted-foreground" />
          </div>
          <div className="flex-1">
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-0.5">Drop-off</p>
            <p className="text-sm font-medium leading-snug line-clamp-2">{ride.dropoff_address}</p>
          </div>
        </div>
      </div>

      {/* Payment Method Badge or Status Badge */}
      <div className="mt-4 pt-3 border-t border-border">
        {isHistoryMode ? (
          <Badge className={cn(statusColors[ride.status], 'border-0 capitalize')}>
            {ride.status === 'completed' ? <CheckCircle2 className="w-3 h-3 mr-1" /> : <XCircle className="w-3 h-3 mr-1" />}
            {ride.status}
          </Badge>
        ) : (
          <Badge variant="outline" className="capitalize flex items-center gap-1.5">
            {ride.payment_method === 'cash' ? (
              <><Banknote className="w-3.5 h-3.5" /> Cash</>
            ) : (
              <><CreditCard className="w-3.5 h-3.5" /> Card</>
            )}
          </Badge>
        )}
      </div>
    </motion.div>
  );
}