import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Star, Banknote, CreditCard, ThumbsUp, MessageSquare, CheckCircle2 } from 'lucide-react';
import TipSelector from '@/components/rider/TipSelector';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

export default function PostRideScreen({ ride, onDone }) {
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [comment, setComment] = useState('');
  const [tip, setTip] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [showComment, setShowComment] = useState(false);

  const labels = ['', 'Poor', 'Fair', 'Good', 'Great', 'Excellent!'];
  const emojis = ['', '😞', '😐', '🙂', '😊', '🌟'];

  const confirm = async () => {
    if (tip === null) { toast.error('Please select a tip amount (or $0)'); return; }
    if (rating === 0) { toast.error('Please rate your driver'); return; }
    
    const finalFare = (ride.fare || 0) + tip;

    try {
      setSubmitting(true);
      
      // Update ride with rating and tip (already paid at booking)
      await base44.entities.Ride.update(ride.id, {
        fare: finalFare,
        payment_status: 'paid',
        ...(rating > 0 ? { rider_rating: rating } : {}),
        ...(comment.trim() ? { rider_comment: comment.trim() } : {}),
      });

      // Update driver rating
      if (rating > 0 && ride.driver_email) {
        try {
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
        } catch (err) {
          console.error('Driver rating update error:', err);
        }
      }

      toast.success('Thanks for riding with Dip Out!');
      onDone();
    } catch (error) {
      console.error('Payment error:', error);
      toast.error('Payment failed - please try again');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Success banner */}
      <div className="rounded-2xl bg-primary/15 border-2 border-primary/30 p-4 text-center space-y-2">
        <CheckCircle2 className="w-8 h-8 mx-auto text-primary" />
        <h2 className="text-xl font-display font-bold text-primary">Trip Complete!</h2>
        <p className="text-sm text-muted-foreground">Rate your driver to help improve Dip Out</p>
      </div>

      {/* Trip summary */}
      <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground text-sm">Base Fare</span>
          <span className="font-bold text-2xl text-primary">${(ride.fare || 0).toFixed(2)}</span>
        </div>
        {tip > 0 && (
          <div className="flex items-center justify-between pt-2 border-t border-border">
            <span className="text-muted-foreground text-sm">Tip</span>
            <span className="font-semibold text-primary">+${tip.toFixed(2)}</span>
          </div>
        )}
        <div className="flex items-center justify-between pt-3 border-t border-border">
          <span className="text-muted-foreground text-sm">Total</span>
          <span className="font-bold text-2xl text-primary">${((ride.fare || 0) + (tip || 0)).toFixed(2)}</span>
        </div>
        <div className="flex items-center justify-between pt-2 border-t border-border">
          <span className="text-muted-foreground text-sm">Payment Method</span>
          <span className="flex items-center gap-2 font-semibold capitalize">
            <><CreditCard className="w-4 h-4 text-primary" /> Card</>
          </span>
        </div>
      </div>

      {/* Star rating - PROMINENT */}
      <div className="space-y-4 py-2">
        <div className="text-center space-y-1">
          <p className="text-lg font-bold">How was your ride?</p>
          <p className="text-sm text-muted-foreground">Tap to rate your driver</p>
        </div>
        <div className="flex items-center justify-center gap-3">
          {[1, 2, 3, 4, 5].map((star) => (
            <motion.button
              key={star}
              onMouseEnter={() => setHovered(star)}
              onMouseLeave={() => setHovered(0)}
              onClick={() => {
                setRating(star);
                if (star >= 3 && !showComment) setShowComment(true);
              }}
              whileHover={{ scale: 1.15 }}
              whileTap={{ scale: 0.95 }}
              className="transition-colors"
            >
              <div className="relative">
                <Star
                  className={`w-14 h-14 transition-all ${
                    star <= (hovered || rating)
                      ? 'fill-primary text-primary drop-shadow-lg'
                      : 'text-muted-foreground opacity-50'
                  }`}
                  strokeWidth={1.5}
                />
                {star <= (hovered || rating) && (
                  <span className="absolute -top-1 -right-1 text-2xl">
                    {emojis[star]}
                  </span>
                )}
              </div>
            </motion.button>
          ))}
        </div>
        {rating > 0 && (
          <motion.p 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center text-lg font-bold text-primary"
          >
            {emojis[rating]} {labels[rating]}
          </motion.p>
        )}
      </div>

      {/* Comment section - expands after rating */}
      {rating > 0 && (
        <motion.div 
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="space-y-3"
        >
          <button
            onClick={() => setShowComment(!showComment)}
            className="flex items-center gap-2 text-sm font-medium text-primary hover:underline mx-auto"
          >
            <MessageSquare className="w-4 h-4" />
            {showComment ? 'Hide comment' : 'Leave a comment (optional)'}
          </button>
          
          {showComment && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-2"
            >
              <Textarea
                placeholder="Share details about your experience... (clean car, friendly service, safe driving, etc.)"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                maxLength={200}
                rows={4}
                className="resize-none text-base"
              />
              {comment.length > 0 && (
                <p className="text-xs text-muted-foreground text-right">{comment.length}/200 characters</p>
              )}
            </motion.div>
          )}
        </motion.div>
      )}

      {/* Tip */}
      {rating > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-center justify-center">
            <ThumbsUp className="w-4 h-4 text-primary" />
            <p className="text-sm font-medium">Show appreciation with a tip</p>
          </div>
          <TipSelector fare={ride.fare || 0} onTipChange={setTip} />
        </div>
      )}

      {/* Confirm button */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Button
          onClick={confirm}
          disabled={submitting || rating === 0 || tip === null}
          className="w-full h-14 rounded-2xl font-bold text-lg bg-primary hover:bg-primary/90 shadow-lg shadow-primary/30 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {submitting ? (
            <><CheckCircle2 className="w-5 h-5 mr-2 animate-pulse" /> Processing...</>
          ) : (
            <><CheckCircle2 className="w-5 h-5 mr-2" /> Complete & Add Tip</>
          )}
          {tip > 0 && <span className="ml-2 text-xs opacity-80">(+${tip.toFixed(2)} tip)</span>}
        </Button>
        <p className="text-xs text-center text-muted-foreground mt-3">
          {rating === 0 ? 'Please rate your driver to continue' : 'Your feedback helps maintain quality standards'}
        </p>
      </motion.div>
    </motion.div>
  );
}