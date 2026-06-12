import React from 'react';
import { Bell, Smartphone, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';

export default function NotificationGuide({ onClose }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-card border border-border rounded-3xl max-w-md w-full p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Smartphone className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-display font-bold">Enable Notifications</h2>
              <p className="text-xs text-muted-foreground">Stay updated on your rides</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-accent rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4 mb-6">
          <div className="flex items-start gap-3 p-3 rounded-xl bg-accent/20">
            <Check className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium">Real-time ride updates</p>
              <p className="text-xs text-muted-foreground">Driver arrival, trip started, completed</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 rounded-xl bg-accent/20">
            <Check className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium">Promotional offers</p>
              <p className="text-xs text-muted-foreground">Surge alerts and discount codes</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 rounded-xl bg-accent/20">
            <Check className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium">Security alerts</p>
              <p className="text-xs text-muted-foreground">Account activity and safety notifications</p>
            </div>
          </div>
        </div>

        <div className="bg-muted/30 rounded-xl p-4 mb-6">
          <p className="text-xs text-muted-foreground mb-2">To enable notifications:</p>
          <ol className="text-sm space-y-2">
            <li className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-primary/20 text-primary text-xs font-bold flex items-center justify-center">1</span>
              Click "Allow" when prompted
            </li>
            <li className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-primary/20 text-primary text-xs font-bold flex items-center justify-center">2</span>
              Enable in browser settings if needed
            </li>
          </ol>
        </div>

        <Button 
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
          onClick={onClose}
        >
          Got it
        </Button>
      </motion.div>
    </motion.div>
  );
}