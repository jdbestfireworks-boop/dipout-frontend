import React, { useState } from 'react';
import { Input } from '@/components/ui/input';

const PERCENT_OPTIONS = [10, 15, 20, 25];

export default function TipSelector({ fare, onTipChange }) {
  const [selected, setSelected] = useState(null); // percent or 'custom'
  const [customAmount, setCustomAmount] = useState('');

  const selectPercent = (pct) => {
    setSelected(pct);
    setCustomAmount('');
    onTipChange(Math.round(fare * (pct / 100) * 100) / 100);
  };

  const selectNone = () => {
    setSelected(0);
    setCustomAmount('');
    onTipChange(0);
  };

  const handleCustom = (val) => {
    setSelected('custom');
    setCustomAmount(val);
    const num = parseFloat(val);
    onTipChange(isNaN(num) || num < 0 ? 0 : Math.round(num * 100) / 100);
  };

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-muted-foreground uppercase tracking-widest">Add a tip</p>
      <div className="grid grid-cols-5 gap-2">
        <button
          onClick={selectNone}
          className={`py-2.5 rounded-xl border-2 text-sm font-semibold transition-all ${
            selected === 0 ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-card text-muted-foreground hover:border-primary/50'
          }`}
        >
          None
        </button>
        {PERCENT_OPTIONS.map((pct) => (
          <button
            key={pct}
            onClick={() => selectPercent(pct)}
            className={`py-2.5 rounded-xl border-2 text-sm font-semibold transition-all ${
              selected === pct ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-card text-muted-foreground hover:border-primary/50'
            }`}
          >
            {pct}%
          </button>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <span className="text-muted-foreground text-sm font-medium">$</span>
        <Input
          type="number"
          min="0"
          step="0.50"
          placeholder="Custom amount"
          value={customAmount}
          onChange={(e) => handleCustom(e.target.value)}
          className="h-10 rounded-xl"
        />
      </div>
      {selected !== null && selected !== 0 && (
        <p className="text-xs text-muted-foreground text-right">
          Tip: ${selected === 'custom' ? (parseFloat(customAmount) || 0).toFixed(2) : (fare * selected / 100).toFixed(2)}
        </p>
      )}
    </div>
  );
}