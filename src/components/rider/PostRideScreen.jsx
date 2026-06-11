import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Star, CheckCircle2, Banknote, CreditCard } from 'lucide-react';
import TipSelector from '@/components/rider/TipSelector';
import { toast } from 'sonner';

export default function PostRideScreen({ ride, onDone }) {
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [comment, setComment] = useState('');
  const [tip, setTip] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const labels = ['', 'Poor', 'Fair', 'Good', 'Great', 'Excellent!'];

  const confirm = async () => {
    if (tip === null) { toast.error('Please select a tip amount (or $0)'); return; }
    setSubmitting(true);

    const finalFare = (ride.fare || 0) + tip;

    // Save rating + comment + payment to the Ride record
    await base44.entities.Ride.update(ride.id, {
      payment_status: 'paid',
      fare: finalFare,
      ...(rating > 0 ? { rider_rating: rating } : {}),
      ...(comment.trim() ? { rider_comment: comment.trim() } : {}),
    });

    // Update the driver's aggregate rating on their profile
    if (rating > 0 && ride.driver_email) {
      const profiles = await base44.entities.DriverProfile.filter({ user_email: ride.driver_email });
      if (profiles.length) {
        const dp = profiles[0];
        const totalRatings = (dp.total_ratings || 0) + 1;
        const newRating = ((dp.rating || 5) * (dp.total_ratings || 0) + rating) / totalRatings;
        await base44.entities.DriverProfile.update(dp.id, {
          rating: Math.round(newRating * 10) / 10,
          total_ratings: totalRatings,
        });
      }
    }

    toast.success('Thanks for riding with Dip Out!');
    onDone();
  };

  return (
    <div className="space-y-6">
      {/* Trip summary */}
      <div className="rounded-2xl border border-border bg-card p-4 text-sm space-y-2">
        <p className="text-xs text-muted-foreground uppercase tracking-widest font-semibold">Trip complete</p>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Fare</span>
          <span className="font-bold text-lg">${ride.fare?.toFixed(2)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Payment</span>
          <span className="flex items-center gap-1.5 font-medium capitalize">
            {ride.payment_method === 'cash'
              ? <><Banknote className="w-3.5 h-3.5" /> Cash</>
              : <><CreditCard className="w-3.5 h-3.5" /> Card</>}
          </span>
        </div>
      </div>

      {/* Star rating */}
      <div className="space-y-3">
        <p className="text-sm font-semibold text-center">How was your driver?</p>
        <div className="flex items-center justify-center gap-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              onMouseEnter={() => setHovered(star)}
              onMouseLeave={() => setHovered(0)}
              onClick={() => setRating(star)}
              className="transition-transform hover:scale-110 active:scale-95"
            >
              <Star
                className={`w-10 h-10 transition-colors ${
                  star <= (hovered || rating)
                    ? 'fill-primary text-primary'
                    : 'text-muted-foreground'
                }`}
              />
            </button>
          ))}
        </div>
        {rating > 0 && (
          <p className="text-center text-sm font-medium text-primary">{labels[rating]}</p>
        )}
      </div>

      {/* Comment */}
      <div className="space-y-2">
        <p className="text-sm font-semibold">Leave a comment <span className="text-muted-foreground font-normal">(optional)</span></p>
        <Textarea
          placeholder="e.g. Great driver, very friendly and on time!"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          maxLength={200}
          rows={3}
          className="resize-none"
        />
        {comment.length > 0 && (
          <p className="text-xs text-muted-foreground text-right">{comment.length}/200</p>
        )}
      </div>

      {/* Tip */}
      <TipSelector fare={ride.fare || 0} onTipChange={setTip} />

      {/* Confirm button */}
      {tip !== null && (
        <Button
          onClick={confirm}
          disabled={submitting}
          className="w-full h-12 rounded-xl font-semibold"
        >
          {ride.payment_method === 'cash'
            ? <><Banknote className="w-4 h-4 mr-2" /> Confirm cash · ${((ride.fare || 0) + tip).toFixed(2)}</>
            : <><CreditCard className="w-4 h-4 mr-2" /> Confirm card · ${((ride.fare || 0) + tip).toFixed(2)}</>}
          {tip > 0 && <span className="ml-1 opacity-70 text-xs">(+${tip.toFixed(2)} tip)</span>}
        </Button>
      )}
    </div>
  );
}