import React from 'react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

export default function DriverOnlineStatus({ profile, onToggle, disabled }) {
  const isOnline = profile.status !== 'offline';

  return (
    <motion.div
      initial={{ scale: 0.98, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={`mb-6 p-5 rounded-2xl border-2 transition-all shadow-xl ${
        isOnline
          ? 'bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/50'
          : 'bg-gradient-to-br from-card/90 via-card to-card/85 backdrop-blur-xl border-white/10'
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div
              className={`w-4 h-4 rounded-full ${
                isOnline ? 'bg-green-500' : 'bg-gray-500'
              }`}
            />
            {isOnline && (
              <div className="absolute inset-0 w-4 h-4 rounded-full bg-green-500 animate-ping opacity-75" />
            )}
          </div>
          <div>
            <p className="font-bold text-sm">
              {isOnline ? 'Online & Available' : 'Offline'}
            </p>
            <p className="text-xs text-muted-foreground/80">
              {isOnline ? 'Receiving ride requests' : 'Tap to go online'}
            </p>
          </div>
        </div>
        <Button
          disabled={disabled}
          className={`rounded-full px-6 font-bold text-xs shadow-lg transition-all ${
            isOnline
              ? 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700'
              : 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700'
          }`}
          onClick={() => onToggle(!isOnline)}
        >
          {isOnline ? 'OFFLINE' : 'GO ONLINE'}
        </Button>
      </div>
    </motion.div>
  );
}