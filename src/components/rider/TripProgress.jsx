import React from 'react';
import { Flag, Car, Navigation, Star, Loader2, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';

const milestones = [
  { id: 'requested', label: 'Confirmed', icon: Flag, description: 'Finding a nearby driver' },
  { id: 'accepted', label: 'Driver Assigned', icon: Car, description: 'Driver is heading to pickup' },
  { id: 'in_progress', label: 'On Trip', icon: Navigation, description: 'Heading to your destination' },
  { id: 'completed', label: 'Completed', icon: Star, description: 'Thanks for riding with us' },
];

export default function TripProgress({ status }) {
  const currentIndex = milestones.findIndex(m => m.id === status);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden bg-gradient-to-br from-card/90 via-card to-card/85 backdrop-blur-2xl rounded-3xl border border-white/10 p-6 shadow-2xl"
    >
      <h3 className="text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-[0.15em] mb-6">Trip Progress</h3>
      
      <div className="relative">
        {/* Progress Line */}
        <div className="absolute left-5 top-2 bottom-2 w-1 bg-gradient-to-b from-primary/60 via-primary/30 to-muted-foreground/20 rounded-full overflow-hidden">
          <motion.div 
            initial={{ height: 0 }}
            animate={{ height: `${Math.min(100, (currentIndex / (milestones.length - 1)) * 100)}%` }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="w-full bg-gradient-to-b from-primary to-primary/40"
          />
        </div>
        
        {/* Milestone Nodes */}
        <div className="space-y-5">
          {milestones.map((milestone, index) => {
            const Icon = milestone.icon;
            const isActive = index === currentIndex;
            const isCompleted = index < currentIndex;
            const isPending = index > currentIndex;

            return (
              <motion.div 
                key={milestone.id}
                initial={{ opacity: 0, x: -15 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-start gap-4 relative"
              >
                <motion.div
                  animate={isActive ? { 
                    scale: [1, 1.15, 1],
                    boxShadow: ["0 0 0 0px rgba(234, 179, 8, 0.4)", "0 0 0 10px rgba(234, 179, 8, 0)", "0 0 0 0px rgba(234, 179, 8, 0)"]
                  } : {}}
                  transition={isActive ? { duration: 2, repeat: Infinity } : {}}
                  className={`
                    w-11 h-11 rounded-2xl flex items-center justify-center border-2 transition-all duration-300 shrink-0 z-10 shadow-lg backdrop-blur-sm
                    ${isActive ? 'bg-gradient-to-br from-primary via-primary to-primary/80 border-primary/40 text-primary-foreground scale-105' : ''}
                    ${isCompleted ? 'bg-gradient-to-br from-green-500 to-green-600 border-green-500/50 text-white' : ''}
                    ${isPending ? 'bg-card/50 backdrop-blur-xl border-white/10 text-muted-foreground/40' : ''}
                  `}
                >
                  {isCompleted ? (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 400 }}
                    >
                      <CheckCircle2 className="w-5 h-5" />
                    </motion.div>
                  ) : (
                    <Icon className="w-5 h-5" />
                  )}
                </motion.div>
                <div className="flex-1 pt-1.5">
                  <motion.p 
                    animate={{ x: isActive ? 4 : 0 }}
                    className={`font-semibold text-sm tracking-wide ${isActive || isCompleted ? 'text-foreground' : 'text-muted-foreground/50'}`}
                  >
                    {milestone.label}
                  </motion.p>
                  <p className="text-[10px] text-muted-foreground/50 mt-1 leading-relaxed">{milestone.description}</p>
                  {isActive && (
                    <motion.div 
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center gap-1.5 mt-2"
                    >
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
                      <span className="text-xs text-primary font-medium">In progress</span>
                    </motion.div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}