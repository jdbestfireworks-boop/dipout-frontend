import React from 'react';
import { X } from 'lucide-react';

const steps = {
  android: [
    { icon: '🌐', text: 'Open this page in Chrome on your Android device' },
    { icon: '⋮', text: 'Tap the 3-dot menu in the top-right corner' },
    { icon: '➕', text: 'Tap "Add to Home screen"' },
    { icon: '✅', text: 'Tap "Add" to confirm — done!' },
  ],
  ios: [
    { icon: '🧭', text: 'Open this page in Safari on your iPhone or iPad' },
    { icon: '□↑', text: 'Tap the Share button at the bottom of the screen' },
    { icon: '➕', text: 'Scroll down and tap "Add to Home Screen"' },
    { icon: '✅', text: 'Tap "Add" — the app icon appears on your home screen!' },
  ],
};

export default function InstallModal({ platform, onClose, onInstall }) {
  if (!platform) return null;
  const isAndroid = platform === 'android';
  const list = steps[platform];

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
            <span className="text-3xl">{isAndroid ? '🤖' : '🍎'}</span>
            <div>
              <p className="font-display font-bold text-base">
                {isAndroid ? 'Install on Android' : 'Install on iPhone / iPad'}
              </p>
              <p className="text-xs text-muted-foreground">
                {isAndroid ? 'Chrome or Edge' : 'Safari required'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-accent transition-colors">
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        {/* Steps */}
        <div className="px-5 pb-2 space-y-3">
          {list.map((step, i) => (
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

        {/* CTA */}
        <div className="p-5 pt-3">
          {isAndroid && onInstall ? (
            <button
              onClick={() => { onInstall(); onClose(); }}
              className="w-full py-3 rounded-2xl bg-primary text-primary-foreground font-bold text-sm hover:opacity-90 active:scale-[0.98] transition-all"
            >
              Install Now
            </button>
          ) : (
            <button
              onClick={onClose}
              className="w-full py-3 rounded-2xl border border-border text-sm font-semibold hover:bg-accent transition-colors"
            >
              Got it
            </button>
          )}
        </div>
      </div>
    </div>
  );
}