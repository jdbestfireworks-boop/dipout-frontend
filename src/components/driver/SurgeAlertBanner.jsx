import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function SurgeAlertBanner({ driverEmail }) {
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    if (!driverEmail) return;
    
    // Load unread alerts
    loadAlerts();
    
    // Subscribe to new alerts
    const unsubscribe = base44.entities.DriverAlert.subscribe((event) => {
      if (event.type === 'create' && event.data.driver_email === driverEmail) {
        setAlerts((prev) => [event.data, ...prev]);
      }
      if (event.type === 'update' && event.data.driver_email === driverEmail) {
        setAlerts((prev) => prev.filter((a) => a.id !== event.id));
      }
    });
    
    return unsubscribe;
  }, [driverEmail]);

  const loadAlerts = async () => {
    const unread = await base44.entities.DriverAlert.filter({
      driver_email: driverEmail,
      read: false,
    }, '-created_date', 5);
    setAlerts(unread);
  };

  const dismissAlert = async (alert) => {
    await base44.entities.DriverAlert.update(alert.id, { read: true });
    setAlerts((prev) => prev.filter((a) => a.id !== alert.id));
  };

  if (alerts.length === 0) return null;

  return (
    <div className="space-y-2">
      <AnimatePresence>
        {alerts.map((alert) => (
          <motion.div
            key={alert.id}
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="rounded-2xl border border-primary/30 bg-primary/10 p-4 flex items-start gap-3"
          >
            <div className="w-9 h-9 rounded-xl bg-primary/20 flex items-center justify-center shrink-0">
              <Zap className="w-4 h-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm text-primary">High Demand Alert</p>
              <p className="text-sm text-foreground mt-0.5">{alert.message}</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => dismissAlert(alert)}
              className="h-8 w-8 shrink-0 text-primary hover:bg-primary/20"
            >
              <X className="w-4 h-4" />
            </Button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}