import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Car, CheckCircle, DollarSign, TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';

export default function DriverQuickActions({ profile, onToggleOnline, todayStats }) {
  const { trips = 0, earnings = 0, activeRide = null } = todayStats || {};
  const isOnline = profile?.status !== 'offline';

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="grid grid-cols-2 gap-3"
    >
      {/* Quick Status Toggle */}
      <motion.div
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className={`col-span-2 p-4 rounded-2xl border-2 transition-all ${
          isOnline
            ? 'bg-green-500/10 border-green-500/50'
            : 'bg-card border-border'
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full ${isOnline ? 'bg-green-500 animate-pulse' : 'bg-gray-500'}`} />
            <div>
              <p className="text-sm font-bold">{isOnline ? 'You\'re Online' : 'You\'re Offline'}</p>
              <p className="text-xs text-muted-foreground">{isOnline ? 'Receiving rides' : 'Not available'}</p>
            </div>
          </div>
          <Button
            size="sm"
            disabled={!!activeRide}
            variant={isOnline ? 'destructive' : 'default'}
            className="rounded-full px-5 text-xs font-bold"
            onClick={() => onToggleOnline(!isOnline)}
          >
            {isOnline ? 'GO OFFLINE' : 'GO ONLINE'}
          </Button>
        </div>
      </motion.div>

      {/* Today's Trips */}
      <motion.div
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="p-4 rounded-2xl border border-border bg-card/80 backdrop-blur-sm"
      >
        <div className="flex items-center gap-2 mb-2">
          <Car className="w-4 h-4 text-primary" />
          <span className="text-xs text-muted-foreground font-medium">Today's Trips</span>
        </div>
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-bold font-display">{trips}</span>
          <span className="text-xs text-muted-foreground">completed</span>
        </div>
      </motion.div>

      {/* Today's Earnings */}
      <motion.div
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="p-4 rounded-2xl border border-border bg-card/80 backdrop-blur-sm"
      >
        <div className="flex items-center gap-2 mb-2">
          <DollarSign className="w-4 h-4 text-green-500" />
          <span className="text-xs text-muted-foreground font-medium">Earnings</span>
        </div>
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-bold font-display text-green-500">${earnings.toFixed(2)}</span>
        </div>
      </motion.div>

      {/* Quick Stats - Only show when online */}
      {isOnline && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="col-span-2 p-3 rounded-xl bg-primary/10 border border-primary/30"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary" />
                <span className="text-xs font-semibold text-primary-foreground/90">
                  {activeRide ? 'Active ride in progress' : 'Available for rides'}
                </span>
              </div>
              {activeRide && (
                <Badge className="bg-primary text-primary-foreground text-[10px] font-bold">
                  <CheckCircle className="w-3 h-3 mr-1" />
                  BUSY
                </Badge>
              )}
            </div>
          </motion.div>
        </>
      )}
    </motion.div>
  );
}