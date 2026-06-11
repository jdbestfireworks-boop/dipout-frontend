import React from 'react';
import { Flag, Car, Navigation, Star, Loader2, CheckCircle2 } from 'lucide-react';

const milestones = [
  { id: 'requested', label: 'Confirmed', icon: Flag, description: 'Finding a driver' },
  { id: 'accepted', label: 'Driver Assigned', icon: Car, description: 'Heading to pickup' },
  { id: 'in_progress', label: 'On Trip', icon: Navigation, description: 'Heading to destination' },
  { id: 'completed', label: 'Completed', icon: Star, description: 'Trip complete' },
];

export default function TripProgress({ status }) {
  const currentIndex = milestones.findIndex(m => m.id === status);

  return (
    <div className="bg-card rounded-2xl border border-border p-5">
      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-4">Trip Status</h3>
      
      <div className="relative">
        {/* Progress Line */}
        <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-border">
          <div 
            className="bg-primary transition-all duration-500"
            style={{ height: `${Math.min(100, (currentIndex / (milestones.length - 1)) * 100)}%` }}
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
              <div key={milestone.id} className="flex items-start gap-4 relative">
                <div
                  className={`
                    w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 shrink-0 z-10
                    ${isActive ? 'bg-primary border-primary text-primary-foreground shadow-lg shadow-primary/30 scale-105' : ''}
                    ${isCompleted ? 'bg-primary border-primary text-primary-foreground' : ''}
                    ${isPending ? 'bg-background border-border text-muted-foreground' : ''}
                  `}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="w-5 h-5" />
                  ) : (
                    <Icon className="w-5 h-5" />
                  )}
                </div>
                <div className="flex-1 pt-1">
                  <p className={`font-semibold text-sm ${isActive || isCompleted ? 'text-foreground' : 'text-muted-foreground'}`}>
                    {milestone.label}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">{milestone.description}</p>
                  {isActive && (
                    <div className="flex items-center gap-1.5 mt-1.5">
                      <Loader2 className="w-3 h-3 animate-spin text-primary" />
                      <span className="text-xs text-primary font-medium">In progress</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}