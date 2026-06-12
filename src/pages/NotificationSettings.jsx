import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Bell, BellOff, Smartphone, Mail, CheckCircle2, Loader2, AlertCircle, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

export default function NotificationSettings() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Notification preferences state
  const [preferences, setPreferences] = useState({
    ride_updates: true,
    driver_notifications: true,
    promotional_emails: false,
    receipt_emails: true,
  });
  
  // Phone number state
  const [phoneNumber, setPhoneNumber] = useState('');
  const [savingPhone, setSavingPhone] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
        if (currentUser.phone_number) setPhoneNumber(currentUser.phone_number);
        // Load existing preferences from user data
        if (currentUser.data?.notification_preferences) {
          setPreferences(currentUser.data.notification_preferences);
        }
      } catch (error) {
        console.error('Error loading user:', error);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const updatePreferencesMutation = useMutation({
    mutationFn: async (newPrefs) => {
      await base44.auth.updateMe({
        data: {
          notification_preferences: newPrefs,
        },
      });
      return newPrefs;
    },
    onSuccess: (newPrefs) => {
      setPreferences(newPrefs);
      queryClient.invalidateQueries({ queryKey: ['user'] });
      toast.success('Notification preferences updated');
    },
    onError: (error) => {
      toast.error('Failed to update preferences');
    },
  });

  const togglePreference = (key) => {
    const newPrefs = {
      ...preferences,
      [key]: !preferences[key],
    };
    setPreferences(newPrefs);
    updatePreferencesMutation.mutate(newPrefs);
  };
  
  const savePhoneNumber = async () => {
    setSavingPhone(true);
    try {
      await base44.auth.updateMe({
        phone_number: phoneNumber.trim(),
      });
      toast.success('Phone number updated');
      setUser({ ...user, phone_number: phoneNumber.trim() });
    } catch (error) {
      toast.error('Failed to update phone number');
    } finally {
      setSavingPhone(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-display font-bold">Notification Settings</h1>
          <p className="text-muted-foreground">
            Manage your notification preferences for Dip Out
          </p>
        </div>

        {/* Phone Number */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Phone className="w-6 h-6 text-primary" />
              <CardTitle>Phone Number</CardTitle>
            </div>
            <CardDescription>
              Add your phone number for ride coordination and driver contact
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Phone Number</label>
              <div className="flex gap-2">
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="(555) 123-4567"
                  className="flex-1 h-10 px-3 rounded-md border border-input bg-background text-sm"
                />
                <Button
                  onClick={savePhoneNumber}
                  disabled={savingPhone || !phoneNumber.trim()}
                  size="sm"
                >
                  {savingPhone ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save'}
                </Button>
              </div>
              {user?.phone_number && (
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-green-500" />
                  Current: {user.phone_number}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Mobile Push Notification Banner */}
        <Card className="border-primary/50 bg-primary/5">
          <CardHeader>
            <div className="flex items-center gap-3">
              <Smartphone className="w-6 h-6 text-primary" />
              <CardTitle>Mobile Push Notifications</CardTitle>
            </div>
            <CardDescription>
              Push notifications are coming soon to iOS and Android
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-xl bg-background border border-border">
              <div className="flex items-center gap-3">
                <Bell className="w-5 h-5 text-primary" />
                <div>
                  <p className="font-medium">Enable Push Notifications</p>
                  <p className="text-sm text-muted-foreground">
                    Get real-time alerts on your phone
                  </p>
                </div>
              </div>
              <Badge variant="outline" className="text-xs">
                Coming Soon
              </Badge>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <AlertCircle className="w-4 h-4" />
              <p>
                Your preferences are saved and will be applied when push notifications launch
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Email Notifications */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Mail className="w-6 h-6 text-primary" />
              <CardTitle>Email Notifications</CardTitle>
            </div>
            <CardDescription>
              Control which emails you receive from Dip Out
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Ride Updates */}
            <div className="flex items-center justify-between p-4 rounded-xl bg-background border border-border">
              <div className="flex items-center gap-3">
                <Bell className={`w-5 h-5 ${preferences.ride_updates ? 'text-primary' : 'text-muted-foreground'}`} />
                <div>
                  <p className="font-medium">Ride Status Updates</p>
                  <p className="text-sm text-muted-foreground">
                    Driver found, arriving, trip started/completed
                  </p>
                </div>
              </div>
              <Switch
                checked={preferences.ride_updates}
                onCheckedChange={() => togglePreference('ride_updates')}
              />
            </div>

            {/* Driver Notifications */}
            <div className="flex items-center justify-between p-4 rounded-xl bg-background border border-border">
              <div className="flex items-center gap-3">
                <Bell className={`w-5 h-5 ${preferences.driver_notifications ? 'text-primary' : 'text-muted-foreground'}`} />
                <div>
                  <p className="font-medium">Driver Notifications</p>
                  <p className="text-sm text-muted-foreground">
                    New ride requests, surge alerts, earnings updates
                  </p>
                </div>
              </div>
              <Switch
                checked={preferences.driver_notifications}
                onCheckedChange={() => togglePreference('driver_notifications')}
              />
            </div>

            {/* Receipt Emails */}
            <div className="flex items-center justify-between p-4 rounded-xl bg-background border border-border">
              <div className="flex items-center gap-3">
                <CheckCircle2 className={`w-5 h-5 ${preferences.receipt_emails ? 'text-primary' : 'text-muted-foreground'}`} />
                <div>
                  <p className="font-medium">Ride Receipts</p>
                  <p className="text-sm text-muted-foreground">
                    Email receipt after every completed ride
                  </p>
                </div>
              </div>
              <Switch
                checked={preferences.receipt_emails}
                onCheckedChange={() => togglePreference('receipt_emails')}
              />
            </div>

            {/* Promotional Emails */}
            <div className="flex items-center justify-between p-4 rounded-xl bg-background border border-border">
              <div className="flex items-center gap-3">
                <BellOff className={`w-5 h-5 ${preferences.promotional_emails ? 'text-primary' : 'text-muted-foreground'}`} />
                <div>
                  <p className="font-medium">Promotional Emails</p>
                  <p className="text-sm text-muted-foreground">
                    Special offers, discounts, and Dip Out news
                  </p>
                </div>
              </div>
              <Switch
                checked={preferences.promotional_emails}
                onCheckedChange={() => togglePreference('promotional_emails')}
              />
            </div>
          </CardContent>
        </Card>

        {/* Save Status */}
        {updatePreferencesMutation.isPending && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-center gap-2 text-sm text-muted-foreground"
          >
            <Loader2 className="w-4 h-4 animate-spin" />
            Saving preferences...
          </motion.div>
        )}

        {/* Back Button */}
        <Button
          variant="outline"
          onClick={() => navigate(-1)}
          className="w-full"
        >
          Back
        </Button>
      </div>
    </div>
  );
}