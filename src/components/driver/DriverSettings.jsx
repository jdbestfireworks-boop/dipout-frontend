import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function DriverSettings({ onClose }) {
  const [swipeMode, setSwipeMode] = useState(true);
  const [autoAccept, setAutoAccept] = useState(false);
  const [maxDistance, setMaxDistance] = useState(10);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const me = await base44.auth.me();
      const profiles = await base44.entities.DriverProfile.filter({ user_email: me.email });
      
      if (profiles.length > 0) {
        const profile = profiles[0];
        // Load from profile metadata or use defaults
        setSwipeMode(profile.swipe_mode ?? true);
        setAutoAccept(profile.auto_accept ?? false);
        setMaxDistance(profile.max_accept_distance ?? 10);
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      const me = await base44.auth.me();
      const profiles = await base44.entities.DriverProfile.filter({ user_email: me.email });
      
      if (profiles.length > 0) {
        await base44.entities.DriverProfile.update(profiles[0].id, {
          swipe_mode: swipeMode,
          auto_accept: autoAccept,
          max_accept_distance: maxDistance,
        });
      }
      
      toast.success('Settings saved!');
      onClose();
    } catch (error) {
      console.error('Failed to save settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="rounded-2xl border border-border bg-card w-full max-w-md shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-border flex items-center justify-between">
          <h3 className="text-xl font-bold">Driver Settings</h3>
          <button onClick={onClose} className="p-2 hover:bg-accent rounded-lg transition-colors">
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-6">
          {/* Swipe Mode Toggle */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <span className="text-xl">👆</span>
                </div>
                <div>
                  <p className="font-semibold text-sm">Swipe to Accept/Decline</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Swipe right to accept, left to decline rides
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSwipeMode(!swipeMode)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  swipeMode ? 'bg-primary' : 'bg-gray-400'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    swipeMode ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Auto Accept Toggle */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center">
                  <span className="text-xl">⚡</span>
                </div>
                <div>
                  <p className="font-semibold text-sm">Auto Accept Rides</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Automatically accept rides within your range
                  </p>
                </div>
              </div>
              <button
                onClick={() => setAutoAccept(!autoAccept)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  autoAccept ? 'bg-green-500' : 'bg-gray-400'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    autoAccept ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Max Distance Slider */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                <span className="text-xl">📍</span>
              </div>
              <div className="flex-1">
                <p className="font-semibold text-sm">Max Accept Distance</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Only auto-accept rides within {maxDistance} miles
                </p>
              </div>
            </div>
            <div className="px-2">
              <input
                type="range"
                min="1"
                max="50"
                value={maxDistance}
                onChange={(e) => setMaxDistance(Number(e.target.value))}
                className="w-full h-2 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
              />
              <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                <span>1 mi</span>
                <span className="font-semibold text-primary">{maxDistance} mi</span>
                <span>50 mi</span>
              </div>
            </div>
          </div>

          {/* Info Box */}
          <div className="rounded-xl bg-muted/50 p-4 space-y-2">
            <p className="text-xs font-semibold">💡 Pro Tips:</p>
            <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
              <li>Use arrow keys (← →) to swipe when modal is open</li>
              <li>Auto-accept works even when phone is locked</li>
              <li>Shorter max distance = more relevant rides</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-border flex gap-3">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1 h-11"
          >
            Cancel
          </Button>
          <Button
            onClick={saveSettings}
            disabled={saving}
            className="flex-1 h-11 bg-primary text-primary-foreground font-semibold"
          >
            {saving ? 'Saving...' : 'Save Settings'}
          </Button>
        </div>
      </div>
    </div>
  );
}

import { Button } from '@/components/ui/button';