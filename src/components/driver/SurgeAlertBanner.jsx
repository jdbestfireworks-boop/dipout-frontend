import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Zap, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function SurgeAlertBanner({ driverEmail }) {
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    if (!driverEmail) return;

    // Load unread alerts
    base44.entities.DriverAlert.filter({ driver_email: driverEmail, read: false }, '-created_date', 5)
      .then(setAlerts);

    // Subscribe to new ones
    const unsub = base44.entities.DriverAlert.subscribe((event) => {
      if (event.type === 'create' && event.data.driver_email === driverEmail && !event.data.read) {
        setAlerts((prev) => [event.data, ...prev]);
      }
    });
    return unsub;
  }, [driverEmail]);

  const dismiss = async (alert) => {
    await base44.entities.DriverAlert.update(alert.id, { read: true });
    setAlerts((prev) => prev.filter((a) => a.id !== alert.id));
  };

  if (!alerts.length) return null;

  return (
    <div className="space-y-2">
      <AnimatePresence>
        {alerts.map((alert) => (
          <motion.div
            key={alert.id}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, x: 40 }}
            className="flex items-start gap-3 rounded-2xl border border-primary/40 bg-primary/10 px-4 py-3"
          >
            <Zap className="w-4 h-4 text-primary mt-0.5 shrink-0" />
            <p className="flex-1 text-sm font-medium text-foreground">{alert.message}</p>
            <button onClick={() => dismiss(alert)} className="text-muted-foreground hover:text-foreground shrink-0">
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}