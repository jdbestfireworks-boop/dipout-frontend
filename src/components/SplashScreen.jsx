import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function SplashScreen({ onComplete }) {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    // Phase 1: Logo scale in (0-800ms)
    const timer1 = setTimeout(() => setPhase(1), 800);
    
    // Phase 2: Glow pulse and rotate (800ms-2000ms)
    const timer2 = setTimeout(() => setPhase(2), 2000);
    
    // Phase 3: Tagline fade in (2000ms-3000ms)
    const timer3 = setTimeout(() => setPhase(3), 3000);
    
    // Phase 4: Fade out splash (3000ms-3500ms)
    const timer4 = setTimeout(() => {
      onComplete();
    }, 3500);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
    };
  }, [onComplete]);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-background via-background to-accent/5"
      >
        {/* Animated background glow */}
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ 
            scale: phase >= 1 ? 1.2 : 0.5,
            opacity: phase >= 1 ? 0.3 : 0,
          }}
          transition={{ duration: 1.2, ease: "easeOut" }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/30 rounded-full blur-[120px]"
        />
        
        {/* Secondary glow */}
        <motion.div
          initial={{ scale: 0.3, opacity: 0 }}
          animate={{ 
            scale: phase >= 2 ? 1.5 : 0.3,
            opacity: phase >= 2 ? 0.2 : 0,
          }}
          transition={{ duration: 1.5, ease: "easeOut", delay: 0.3 }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-amber-300/25 rounded-full blur-[100px]"
        />

        {/* Logo container */}
        <motion.div
          initial={{ scale: 0, opacity: 0, rotate: -180 }}
          animate={{ 
            scale: phase >= 1 ? 1 : 0,
            opacity: phase >= 1 ? 1 : 0,
            rotate: phase >= 1 ? 0 : -180
          }}
          transition={{ 
            scale: { duration: 0.8, type: "spring", bounce: 0.4 },
            opacity: { duration: 0.5 },
            rotate: { duration: 0.8, ease: "easeOut" }
          }}
          className="relative z-10"
        >
          {/* Rotating ring */}
          <motion.div
            animate={{ rotate: phase >= 1 ? 360 : 0 }}
            transition={{ duration: 3, ease: "linear", repeat: Infinity }}
            className="absolute inset-0 -m-4 rounded-3xl border-2 border-primary/30"
          />
          
          {/* Logo */}
          <motion.div
            animate={{ 
              scale: phase >= 2 ? [1, 1.05, 1] : 1,
            }}
            transition={{ 
              duration: 1.5, 
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="w-48 h-48 rounded-3xl bg-gradient-to-br from-primary via-amber-300 to-primary flex items-center justify-center shadow-2xl shadow-primary/50 overflow-hidden ring-4 ring-primary/20"
          >
            <img
              src="https://media.base44.com/images/public/6a2adf5a7f92459340d0efc2/9207258c1_generated_image.png"
              alt="Dip Out - Cartoon Driver and Rider"
              className="w-full h-full object-cover"
            />
          </motion.div>
        </motion.div>

        {/* Text content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ 
            opacity: phase >= 3 ? 1 : 0,
            y: phase >= 3 ? 0 : 20
          }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="absolute bottom-1/4 left-1/2 -translate-x-1/2 text-center z-10"
        >
          <motion.h1
            initial={{ opacity: 0, x: -20 }}
            animate={{ 
              opacity: phase >= 3 ? 1 : 0,
              x: phase >= 3 ? 0 : -20
            }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-5xl font-display font-bold tracking-tight mb-2 bg-gradient-to-r from-primary via-amber-300 to-primary bg-clip-text text-transparent"
          >
            Dip Out
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0, x: 20 }}
            animate={{ 
              opacity: phase >= 3 ? 1 : 0,
              x: phase >= 3 ? 0 : 20
            }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="text-muted-foreground text-lg font-light"
          >
            Simple, affordable rides — Louisiana only
          </motion.p>
        </motion.div>

        {/* Loading indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: phase >= 1 ? 1 : 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="absolute bottom-1/4 left-1/2 -translate-x-1/2 z-10"
        >
          <div className="flex items-center gap-2 mt-8">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                animate={{ 
                  scale: [1, 1.3, 1],
                  opacity: [0.5, 1, 0.5]
                }}
                transition={{ 
                  duration: 1, 
                  repeat: Infinity,
                  delay: i * 0.2
                }}
                className="w-2 h-2 rounded-full bg-primary"
              />
            ))}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}