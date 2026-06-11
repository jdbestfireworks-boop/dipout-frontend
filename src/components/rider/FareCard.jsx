import React from 'react';
import { motion } from 'framer-motion';
import { Sparkles, TrendingUp } from 'lucide-react';

export default function FareCard({ quote, distanceKm }) {
  if (!quote) return null;
  const surgeUp = quote.surgeMultiplier > 1.05;
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-border bg-secondary/60 p-4 space-y-2"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-muted-foreground uppercase tracking-widest">
          <Sparkles className="w-3.5 h-3.5 text-primary" /> AI Dynamic Fare
        </div>
        {surgeUp && (
          <span className="flex items-center gap-1 text-xs font-semibold text-primary">
            <TrendingUp className="w-3.5 h-3.5" /> {quote.surgeMultiplier}x surge
          </span>
        )}
      </div>
      <div className="flex items-baseline gap-3">
        <span className="text-3xl font-display font-bold">${quote.fare.toFixed(2)}</span>
        <span className="text-sm text-muted-foreground">
          {distanceKm.toFixed(1)} km · base ${quote.baseFare.toFixed(2)} × {quote.surgeMultiplier}
        </span>
      </div>
      <p className="text-sm text-muted-foreground leading-relaxed">{quote.reason}</p>
    </motion.div>
  );
}