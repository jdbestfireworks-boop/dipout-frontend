import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { User, Car } from 'lucide-react';

export default function ScenarioSelector({ scenarios, activeScenario, onSelect }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {Object.entries(scenarios).map(([key, scenario]) => (
        <button
          key={key}
          onClick={() => onSelect(key)}
          className={`p-6 rounded-2xl border-2 transition-all text-left space-y-3 ${
            activeScenario === key
              ? 'border-primary bg-primary/10'
              : 'border-border bg-card hover:border-primary/50'
          }`}
        >
          <scenario.icon className={`w-8 h-8 ${activeScenario === key ? 'text-primary' : 'text-muted-foreground'}`} />
          <div>
            <h3 className="font-bold text-lg">{scenario.title}</h3>
            <p className="text-sm text-muted-foreground">{scenario.steps.length} steps</p>
          </div>
        </button>
      ))}
    </div>
  );
}