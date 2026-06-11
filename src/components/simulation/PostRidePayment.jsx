import React from 'react';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Star } from 'lucide-react';

export function PostRidePayment({ fare, paymentMethod, onConfirm }) {
  return (
    <div className="bg-card rounded-xl border border-border p-5 space-y-3">
      <div className="flex items-center justify-center gap-2 mb-3">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star key={star} className="w-8 h-8 fill-primary text-primary" />
        ))}
      </div>
      <div className="text-center">
        <p className="text-2xl font-bold text-primary">{fare}</p>
        <p className="text-sm text-muted-foreground">Payment: {paymentMethod}</p>
      </div>
      <Button className="w-full" onClick={onConfirm}>
        <CheckCircle2 className="w-4 h-4 mr-2" /> Confirm & Pay
      </Button>
    </div>
  );
}