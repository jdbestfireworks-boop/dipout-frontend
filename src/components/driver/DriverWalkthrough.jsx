import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Car, ToggleRight, Bell, CheckCircle2, ArrowRight, X } from 'lucide-react';

const STEPS = [
  {
    icon: Car,
    iconColor: 'text-primary',
    iconBg: 'bg-primary/15',
    title: "Welcome to Driver Hub! 🎉",
    description: "You're approved and ready to earn. Let's take a quick 30-second tour so you know exactly how it works.",
    highlight: null,
  },
  {
    icon: ToggleRight,
    iconColor: 'text-green-400',
    iconBg: 'bg-green-500/15',
    title: "Go Online to Start Earning",
    description: 'Tap the "GO ONLINE" button at the top of the screen. Riders nearby will immediately be able to book you. Go offline anytime to stop receiving requests.',
    highlight: 'The big GO ONLINE button is right at the top — tap it when you\'re ready to drive.',
  },
  {
    icon: Bell,
    iconColor: 'text-primary',
    iconBg: 'bg-primary/15',
    title: "New Ride Requests",
    description: "When a rider books you, a popup appears with the pickup location, fare, and distance. You have a few seconds to accept or decline before it moves on.",
    highlight: 'Allow notifications so you never miss a request — even when the app is in the background.',
  },
  {
    icon: CheckCircle2,
    iconColor: 'text-green-400',
    iconBg: 'bg-green-500/15',
    title: "Complete Rides & Get Paid",
    description: "Head to pickup → tap \"Rider Picked Up\" → drive to dropoff → tap \"Complete Trip\". You keep 80% of every fare. Earnings are tracked in your dashboard.",
    highlight: 'GPS auto-detects arrivals when location is enabled — no manual tapping needed!',
  },
];

const STORAGE_KEY = 'dipout_driver_walkthrough_done';

export default function DriverWalkthrough() {
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    const done = localStorage.getItem(STORAGE_KEY);
    if (!done) setVisible(true);
  }, []);

  const dismiss = () => {
    localStorage.setItem(STORAGE_KEY, '1');
    setVisible(false);
  };

  const next = () => {
    if (step < STEPS.length - 1) {
      setStep(step + 1);
    } else {
      dismiss();
    }
  };

  if (!visible) return null;

  const current = STEPS[step];
  const Icon = current.icon;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-4"
      >
        <motion.div
          key={step}
          initial={{ opacity: 0, y: 30, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.97 }}
          transition={{ duration: 0.25 }}
          className="bg-card border border-border rounded-3xl w-full max-w-sm p-6 space-y-5 relative"
        >
          {/* Close */}
          <button
            onClick={dismiss}
            className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Step dots */}
          <div className="flex gap-1.5 justify-center">
            {STEPS.map((_, i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === step ? 'w-6 bg-primary' : i < step ? 'w-3 bg-primary/40' : 'w-3 bg-secondary'
                }`}
              />
            ))}
          </div>

          {/* Icon */}
          <div className={`w-16 h-16 rounded-2xl ${current.iconBg} flex items-center justify-center mx-auto`}>
            <Icon className={`w-8 h-8 ${current.iconColor}`} />
          </div>

          {/* Text */}
          <div className="text-center space-y-2">
            <h3 className="text-xl font-display font-bold">{current.title}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{current.description}</p>
          </div>

          {/* Highlight tip */}
          {current.highlight && (
            <div className="bg-primary/8 border border-primary/20 rounded-xl px-4 py-3 flex gap-2.5">
              <span className="text-primary text-base mt-0.5">💡</span>
              <p className="text-xs text-muted-foreground leading-relaxed">{current.highlight}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            {step > 0 && (
              <Button variant="outline" onClick={() => setStep(step - 1)} className="flex-1 h-11 rounded-xl">
                Back
              </Button>
            )}
            <Button onClick={next} className="flex-1 h-11 rounded-xl font-bold gap-1.5">
              {step === STEPS.length - 1 ? (
                <><CheckCircle2 className="w-4 h-4" /> Let's Go!</>
              ) : (
                <>Next <ArrowRight className="w-4 h-4" /></>
              )}
            </Button>
          </div>

          <p className="text-center text-[11px] text-muted-foreground">
            {step + 1} of {STEPS.length}
          </p>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}