import React from 'react';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

export default function DriverOnlineStatus({ profile, onToggleOnline, hasActiveRide }) {
  const isOnline = profile.status !== 'offline';
  const disabled = hasActiveRide;

  const handleToggle = async () => {
    if (disabled) return;
    onToggleOnline(!isOnline);
  };

  return (
    <motion.div
      initial={{ scale: 0.98, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={`mb-6 p-6 rounded-2xl border-2 transition-all shadow-xl ${
        isOnline
          ? 'bg-gradient-to-br from-green-500/15 to-green-500/5 border-green-500/50'
          : 'bg-gradient-to-br from-card/90 via-card to-card/85 backdrop-blur-xl border-white/20'
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div
              className={`w-5 h-5 rounded-full ${
                isOnline ? 'bg-green-500' : 'bg-gray-500'
              }`}
            />
            {isOnline && (
              <div className="absolute inset-0 w-5 h-5 rounded-full bg-green-500 animate-ping opacity-75" />
            )}
          </div>
          <div>
            <p className="font-bold text-base">
              {isOnline ? 'Online & Available' : 'Offline'}
            </p>
            <p className="text-sm text-muted-foreground/80">
              {isOnline ? 'Receiving ride requests now' : 'Tap button to start earning'}
            </p>
          </div>
        </div>
        <Button
          disabled={disabled}
          className={`rounded-xl px-8 font-bold text-sm shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
            isOnline
              ? 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700'
              : 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700'
          }`}
          onClick={handleToggle}
        >
          {isOnline ? 'GO OFFLINE' : 'GO ONLINE'}
        </Button>
      </div>
    </motion.div>
  );
}