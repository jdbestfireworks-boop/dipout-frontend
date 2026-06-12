import React from 'react';
import { X, MapPin, Car } from 'lucide-react';

const config = {
  rider: {
    label: 'Rider App',
    subtitle: 'Book rides on the go',
    Icon: MapPin,
    color: 'text-primary',
    bg: 'bg-primary/10',
  },
  driver: {
    label: 'Driver App',
    subtitle: 'Earn money driving',
    Icon: Car,
    color: 'text-primary',
    bg: 'bg-primary/10',
  },
};

const androidSteps = [
  { icon: '🌐', text: 'Open this page in Chrome on your Android device' },
  { icon: '⋮', text: 'Tap the 3-dot menu in the top-right corner' },
  { icon: '➕', text: 'Tap "Add to Home screen"' },
  { icon: '✅', text: 'Tap "Add" to confirm — done!' },
];

const iosSteps = [
  { icon: '🧭', text: 'Open this page in Safari on your iPhone or iPad' },
  { icon: '□↑', text: 'Tap the Share button at the bottom of the screen' },
  { icon: '➕', text: 'Scroll down and tap "Add to Home Screen"' },
  { icon: '✅', text: 'Tap "Add" — the app icon appears on your home screen!' },
];

function StepList({ steps }) {
  return (
    <div className="space-y-3">
      {steps.map((step, i) => (
        <div key={i} className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 text-base">
            {step.icon}
          </div>
          <div className="flex-1 pt-1">
            <span className="text-xs font-semibold text-primary mr-1.5">Step {i + 1}</span>
            <span className="text-sm text-foreground">{step.text}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function InstallModal({ platform, onClose, onInstall }) {
  const [os, setOs] = React.useState(null); // 'android' | 'ios'

  React.useEffect(() => {
    if (!platform) setOs(null);
  }, [platform]);

  if (!platform) return null;
  const { label, subtitle, Icon, color, bg } = config[platform];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-sm rounded-3xl border border-border bg-card shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <div className="flex items-center gap-3">
            <div className={`w-11 h-11 rounded-2xl ${bg} flex items-center justify-center`}>
              <Icon className={`w-5 h-5 ${color}`} />
            </div>
            <div>
              <p className="font-display font-bold text-base">{label}</p>
              <p className="text-xs text-muted-foreground">{subtitle}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-accent transition-colors">
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        {/* OS picker or steps */}
        {!os ? (
          <div className="px-5 pb-5 space-y-3">
            <p className="text-sm text-muted-foreground">Choose your device:</p>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setOs('android')}
                className="flex flex-col items-center gap-2 px-3 py-4 rounded-2xl border border-border hover:border-primary/50 hover:bg-accent transition-all"
              >
                <span className="text-3xl">🤖</span>
                <span className="text-sm font-semibold">Android</span>
                <span className="text-[10px] text-muted-foreground">Chrome / Edge</span>
              </button>
              <button
                onClick={() => setOs('ios')}
                className="flex flex-col items-center gap-2 px-3 py-4 rounded-2xl border border-border hover:border-primary/50 hover:bg-accent transition-all"
              >
                <span className="text-3xl">🍎</span>
                <span className="text-sm font-semibold">iPhone / iPad</span>
                <span className="text-[10px] text-muted-foreground">Safari</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="px-5 pb-2">
            <StepList steps={os === 'android' ? androidSteps : iosSteps} />
          </div>
        )}

        {/* Footer */}
        {os && (
          <div className="p-5 pt-3 flex gap-2">
            <button
              onClick={() => setOs(null)}
              className="flex-1 py-3 rounded-2xl border border-border text-sm font-semibold hover:bg-accent transition-colors"
            >
              ← Back
            </button>
            {os === 'android' && onInstall ? (
              <button
                onClick={() => { onInstall(); onClose(); }}
                className="flex-1 py-3 rounded-2xl bg-primary text-primary-foreground font-bold text-sm hover:opacity-90 transition-all"
              >
                Install Now
              </button>
            ) : (
              <button
                onClick={onClose}
                className="flex-1 py-3 rounded-2xl bg-primary text-primary-foreground font-bold text-sm hover:opacity-90 transition-all"
              >
                Got it ✓
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}