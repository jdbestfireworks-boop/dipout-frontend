import React from 'react';
import { Car, DollarSign } from 'lucide-react';
import { motion } from 'framer-motion';

export default function DriverStats({ trips, earnings, hasActiveRide }) {
  if (hasActiveRide) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="grid grid-cols-2 gap-4 mb-6"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="p-5 rounded-2xl border border-border bg-gradient-to-br from-card/90 via-card to-card/85 backdrop-blur-xl shadow-lg"
      >
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
            <Car className="w-5 h-5 text-primary" />
          </div>
          <span className="text-sm text-muted-foreground font-semibold">Trips Today</span>
        </div>
        <p className="text-3xl font-bold font-display">{trips}</p>
      </motion.div>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
        className="p-5 rounded-2xl border border-border bg-gradient-to-br from-card/90 via-card to-card/85 backdrop-blur-xl shadow-lg"
      >
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500/20 to-green-500/10 flex items-center justify-center">
            <DollarSign className="w-5 h-5 text-green-500" />
          </div>
          <span className="text-sm text-muted-foreground font-semibold">Earned Today</span>
        </div>
        <p className="text-3xl font-bold font-display text-green-500">${earnings.toFixed(2)}</p>
      </motion.div>
    </motion.div>
  );
}