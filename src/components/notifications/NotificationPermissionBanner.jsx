import React, { useState, useEffect } from 'react';
import { Bell, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

export default function NotificationPermissionBanner({ permission, onGrant }) {
  const [subscribed, setSubscribed] = useState(false);

  useEffect(() => {
    if (permission === 'granted') {
      setSubscribed(true);
    }
  }, [permission]);

  const requestPermission = async () => {
    if ('Notification' in window) {
      try {
        const accepted = await Notification.requestPermission();
        if (accepted === 'granted') {
          setSubscribed(true);
          if (onGrant) onGrant();
        } else {
          toast.info('Notifications disabled. You can enable them in browser settings.');
        }
      } catch (error) {
        console.error('Permission error:', error);
        toast.error('Failed to enable notifications');
      }
    }
  };

  if (permission === 'granted' && subscribed) {
    return null;
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-5"
    >
      <div className="relative overflow-hidden bg-gradient-to-br from-primary/8 via-primary/12 to-transparent backdrop-blur-xl rounded-3xl border border-white/10 p-5 shadow-2xl">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <motion.div 
              animate={permission !== 'granted' ? { scale: [1, 1.15, 1], rotate: [0, 5, -5, 0] } : {}}
              transition={{ duration: 2.5, repeat: Infinity }}
              className="w-11 h-11 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center shrink-0 shadow-lg"
            >
              {permission === 'granted' ? (
                <CheckCircle className="w-6 h-6 text-primary" />
              ) : (
                <Bell className="w-6 h-6 text-primary" />
              )}
            </motion.div>
            <div>
              <h3 className="font-semibold text-sm text-primary/90 tracking-wide">
                {permission === 'granted' ? 'Notifications Active' : 'Enable Ride Notifications'}
              </h3>
              <p className="text-[10px] text-muted-foreground/70 mt-1 leading-relaxed">
                {permission === 'granted' 
                  ? 'You\'ll receive real-time updates about your rides'
                  : 'Get instant alerts for ride status, driver arrival, and promotions'}
              </p>
            </div>
          </div>
          {permission !== 'granted' && (
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Button 
                size="sm" 
                onClick={requestPermission}
                className="bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary/80 text-primary-foreground text-xs px-5 h-9 rounded-xl shadow-lg shadow-primary/25"
              >
                Enable
              </Button>
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
}