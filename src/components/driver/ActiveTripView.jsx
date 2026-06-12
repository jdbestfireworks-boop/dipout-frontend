import React from 'react';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import ActiveTripCard from './ActiveTripCard';

export default function ActiveTripView({ ride, user, onStartTrip, onCompleteTrip, onCancelRide }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
    >
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-xl font-bold bg-gradient-to-r from-primary via-primary/90 to-primary/70 bg-clip-text text-transparent">
            Active Trip
          </h2>
          <p className="text-sm text-muted-foreground/80 mt-1">Focus on the road ahead</p>
        </div>
        <Badge className="bg-gradient-to-r from-primary/20 to-primary/10 text-primary border-primary/30 capitalize font-semibold text-sm px-4 py-2 rounded-full shadow-lg">
          {ride.status.replace('_', ' ')}
        </Badge>
      </div>
      <ActiveTripCard
        ride={ride}
        user={user}
        onStartTrip={onStartTrip}
        onCompleteTrip={onCompleteTrip}
        onCancelRide={onCancelRide}
      />
    </motion.div>
  );
}