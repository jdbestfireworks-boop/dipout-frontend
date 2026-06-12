import React from 'react';
import { Car } from 'lucide-react';
import { motion } from 'framer-motion';
import RideRequestCard from './RideRequestCard';

export default function RequestsView({ profile, requests, tripHistory, user, onSelectRide, onShowHistory }) {
  return (
    <motion.div
      key="requests"
      initial={{ opacity: 0, y: 10, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
    >
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-xl font-bold bg-gradient-to-r from-primary via-primary/90 to-primary/70 bg-clip-text text-transparent">
            {profile.status === 'offline'
              ? 'Go Online'
              : requests.length === 0
              ? 'No Rides'
              : 'Available Rides'}
          </h2>
          <p className="text-sm text-muted-foreground/80 mt-1">
            {profile.status === 'offline'
              ? 'Start earning today'
              : requests.length === 0
              ? 'Stay ready for requests'
              : `${requests.length} ride${requests.length > 1 ? 's' : ''} waiting`}
          </p>
        </div>
        {tripHistory.length > 0 && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onShowHistory}
            className="text-sm font-semibold px-4 py-2 rounded-xl bg-gradient-to-br from-card/80 to-card/40 border border-white/20 hover:border-primary/50 transition-all"
          >
            History ({tripHistory.length})
          </motion.button>
        )}
      </div>
      {profile.status === 'offline' ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-gradient-to-br from-card/90 via-card to-card/85 backdrop-blur-xl rounded-3xl border border-white/10 p-12 text-center shadow-xl"
        >
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-muted/80 to-muted/40 flex items-center justify-center mx-auto mb-5">
            <Car className="w-10 h-10 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-bold mb-2">You're Offline</h3>
          <p className="text-sm text-muted-foreground/80">
            Go online to start receiving ride requests and earning
          </p>
        </motion.div>
      ) : requests.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-gradient-to-br from-card/90 via-card to-card/85 backdrop-blur-xl rounded-3xl border border-white/10 p-12 text-center shadow-xl relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/15 to-primary/5 flex items-center justify-center mx-auto mb-5 relative">
            <Car className="w-10 h-10 text-primary" />
          </div>
          <h3 className="text-lg font-bold mb-2">No Rides Available</h3>
          <p className="text-sm text-muted-foreground/80">
            Stay online - new rides will appear here instantly
          </p>
        </motion.div>
      ) : (
        <div className="space-y-2.5">
          {requests.map((r, i) => (
            <motion.div
              key={r.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              whileHover={{ scale: 1.01 }}
            >
              <RideRequestCard ride={r} user={user} onSelect={() => onSelectRide(r)} />
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
}