import React from 'react';
import { Hand, MousePointer2, Zap, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function DriverSettingsModal({ onClose, swipeMode, setSwipeMode, autoAccept, setAutoAccept, maxDistance, setMaxDistance, onSave }) {
  return (
    <div className="space-y-6">

        {/* Content */}
        <div className="p-5 space-y-6">
          {/* Swipe Mode Toggle */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  {swipeMode ? <Hand className="w-5 h-5 text-primary" /> : <MousePointer2 className="w-5 h-5 text-primary" />}
                </div>
                <div>
                  <p className="font-semibold text-sm">Swipe to Accept/Decline</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {swipeMode ? 'Swipe gestures enabled' : 'Tap buttons only'}
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
                  <Zap className="w-5 h-5 text-green-500" />
                </div>
                <div>
                  <p className="font-semibold text-sm">Auto Accept Rides</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Automatically accept nearby rides
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
                <MapPin className="w-5 h-5 text-blue-500" />
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
          <div className="rounded-xl bg-muted/50 p-4 space-y-2 border border-border">
            <p className="text-xs font-semibold">💡 Tips:</p>
            <ul className="text-xs text-muted-foreground space-y-1 list-disc list-inside">
              <li>Use arrow keys (← →) when swipe mode is on</li>
              <li>Auto-accept works even with screen locked</li>
              <li>Shorter distance = more relevant rides</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 pt-4">
          <Button
            variant="outline"
            onClick={onClose}
            className="flex-1 h-11"
          >
            Cancel
          </Button>
          <Button
            onClick={onSave}
            className="flex-1 h-11 bg-primary text-primary-foreground font-semibold hover:opacity-90"
          >
            Save Settings
          </Button>
        </div>
    </div>
  );
}