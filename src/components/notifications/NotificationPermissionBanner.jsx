import React, { useState, useEffect } from 'react';
import { Bell, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function NotificationPermissionBanner({ permission, onGrant }) {
  const [subscribed, setSubscribed] = useState(false);

  useEffect(() => {
    if (permission === 'granted') {
      setSubscribed(true);
    }
  }, [permission]);

  const requestPermission = async () => {
    if ('Notification' in window) {
      try {
        const accepted = await Notification.requestPermission();
        if (accepted === 'granted') {
          setSubscribed(true);
          if (onGrant) onGrant();
        } else {
          toast.info('Notifications disabled. You can enable them in browser settings.');
        }
      } catch (error) {
        console.error('Permission error:', error);
        toast.error('Failed to enable notifications');
      }
    }
  };

  if (permission === 'granted' && subscribed) {
    return null;
  }

  return (
    <div className="bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 rounded-2xl p-4 mb-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            {permission === 'granted' ? (
              <CheckCircle className="w-5 h-5 text-primary" />
            ) : (
              <Bell className="w-5 h-5 text-primary" />
            )}
          </div>
          <div>
            <h3 className="font-semibold text-sm">
              {permission === 'granted' ? 'Notifications Active' : 'Enable Ride Notifications'}
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {permission === 'granted' 
                ? 'You\'ll receive real-time updates about your rides'
                : 'Get instant alerts for ride status, driver arrival, and promotions'}
            </p>
          </div>
        </div>
        {permission !== 'granted' && (
          <Button 
            size="sm" 
            onClick={requestPermission}
            className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs px-4 h-8"
          >
            Enable
          </Button>
        )}
      </div>
    </div>
  );
}