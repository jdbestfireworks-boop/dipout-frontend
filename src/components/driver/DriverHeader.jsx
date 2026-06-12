import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Settings } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

export default function DriverHeader({ profile, onOpenSettings }) {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center justify-between mb-6"
    >
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(-1)}
          className="h-10 w-10 rounded-xl bg-gradient-to-br from-card/80 to-card/40 backdrop-blur-xl border border-white/10 hover:border-primary/40 transition-all"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-xl font-bold font-display bg-gradient-to-r from-primary via-primary/90 to-primary/70 bg-clip-text text-transparent">
            {profile.vehicle}
          </h1>
          <p className="text-xs text-muted-foreground/80">{profile.plate}</p>
        </div>
      </div>
      <Button
        variant="ghost"
        size="icon"
        onClick={onOpenSettings}
        className="h-10 w-10 rounded-xl bg-gradient-to-br from-card/80 to-card/40 backdrop-blur-xl border border-white/10 hover:border-primary/40 transition-all"
      >
        <Settings className="w-5 h-5" />
      </Button>
    </motion.div>
  );
}