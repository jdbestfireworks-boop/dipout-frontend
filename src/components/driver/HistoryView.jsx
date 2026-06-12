import React from 'react';
import { Car } from 'lucide-react';
import { motion } from 'framer-motion';
import RideRequestCard from './RideRequestCard';

export default function HistoryView({ tripHistory, user, onBack }) {
  return (
    <motion.div
      key="history"
      initial={{ opacity: 0, y: 10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
    >
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-xl font-bold bg-gradient-to-r from-primary via-primary/90 to-primary/70 bg-clip-text text-transparent">
            Trip History
          </h2>
          <p className="text-sm text-muted-foreground/80 mt-1">
            {tripHistory.length} {tripHistory.length === 1 ? 'trip' : 'trips'} recorded
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onBack}
          className="text-sm font-semibold px-5 py-2.5 rounded-xl bg-gradient-to-br from-card/80 to-card/40 border border-white/20 hover:border-primary/50 transition-all"
        >
          Back
        </motion.button>
      </div>
      {tripHistory.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-gradient-to-br from-card/90 via-card to-card/85 backdrop-blur-xl rounded-3xl border border-white/10 p-12 text-center shadow-xl"
        >
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center mx-auto mb-4">
            <Car className="w-8 h-8 text-primary" />
          </div>
          <p className="text-sm text-muted-foreground font-medium">No trips yet</p>
          <p className="text-xs text-muted-foreground/60 mt-1">Complete your first ride to see history</p>
        </motion.div>
      ) : (
        <div className="space-y-2.5">
          {tripHistory.map((r, i) => (
            <motion.div
              key={r.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <RideRequestCard ride={r} user={user} onSelect={() => {}} isHistory />
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
}