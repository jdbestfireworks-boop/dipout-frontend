import React, { useState } from 'react';
import { Star } from 'lucide-react';

export default function DriverRating({ onRatingSelect }) {
  const [hovered, setHovered] = useState(0);
  const [selected, setSelected] = useState(0);

  const choose = (val) => {
    setSelected(val);
    onRatingSelect(val);
  };

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-muted-foreground uppercase tracking-widest">Rate your driver</p>
      <div className="flex items-center justify-center gap-2">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            onMouseEnter={() => setHovered(star)}
            onMouseLeave={() => setHovered(0)}
            onClick={() => choose(star)}
            className="transition-transform hover:scale-110"
          >
            <Star
              className={`w-9 h-9 transition-colors ${
                star <= (hovered || selected)
                  ? 'fill-primary text-primary'
                  : 'text-muted-foreground'
              }`}
            />
          </button>
        ))}
      </div>
      {selected > 0 && (
        <p className="text-center text-sm text-muted-foreground">
          {['', 'Poor', 'Fair', 'Good', 'Great', 'Excellent!'][selected]}
        </p>
      )}
    </div>
  );
}