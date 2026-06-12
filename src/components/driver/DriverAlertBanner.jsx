import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Bell, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

export default function DriverAlertBanner({ driverEmail }) {
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    if (!driverEmail) return;

    // Load unread alerts on mount
    base44.entities.DriverAlert.filter({ driver_email: driverEmail, read: false }, '-created_date', 10)
      .then(setAlerts);

    // Subscribe to new alerts in real-time
    const unsubscribe = base44.entities.DriverAlert.subscribe((event) => {
      if (event.type === 'create' && event.data?.driver_email === driverEmail && !event.data?.read) {
        setAlerts((prev) => [event.data, ...prev]);
        toast(event.data.message, {
          icon: '🔔',
          duration: 5000,
        });
      }
    });

    return unsubscribe;
  }, [driverEmail]);

  const dismiss = async (alert) => {
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
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, x: 40 }}
            className="flex items-start gap-3 p-3.5 rounded-2xl border border-primary/30 bg-primary/10"
          >
            <div className="w-8 h-8 rounded-xl bg-primary/20 flex items-center justify-center shrink-0 mt-0.5">
              <Bell className="w-4 h-4 text-primary" />
            </div>
            <p className="flex-1 text-sm font-medium leading-snug">{alert.message}</p>
            <button
              onClick={() => dismiss(alert)}
              className="text-muted-foreground hover:text-foreground transition-colors shrink-0 mt-0.5"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}