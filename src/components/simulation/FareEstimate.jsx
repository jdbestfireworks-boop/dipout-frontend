import React from 'react';
import { Button } from '@/components/ui/button';
import { CreditCard, Banknote } from 'lucide-react';

export function FareEstimate({ fare, distance, onSelectPayment }) {
  return (
    <div className="bg-card rounded-xl border border-border p-5 space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-muted-foreground">Estimated Fare</p>
          <p className="text-3xl font-bold text-primary">{fare}</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground">Distance</p>
          <p className="text-lg font-semibold">{distance}</p>
        </div>
      </div>
      <div className="flex gap-2">
        <Button className="flex-1" variant="outline" onClick={() => onSelectPayment('card')}>
          <CreditCard className="w-4 h-4 mr-2" /> Card
        </Button>
        <Button className="flex-1" variant="outline" onClick={() => onSelectPayment('cash')}>
          <Banknote className="w-4 h-4 mr-2" /> Cash
        </Button>
      </div>
    </div>
  );
}