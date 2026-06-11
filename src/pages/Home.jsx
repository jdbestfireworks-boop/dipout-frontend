import React from 'react';
import { Link } from 'react-router-dom';
import { Car, Smartphone, Apple, Play, Star, MapPin, Zap, Shield } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Hero */}
      <section className="flex flex-col items-center justify-center text-center px-6 pt-20 pb-16 max-w-2xl mx-auto space-y-6">
        <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center shadow-lg shadow-primary/30">
          <Car className="w-8 h-8 text-primary-foreground" />
        </div>
        <h1 className="text-5xl font-display font-bold tracking-tight">
          Get there with <span className="text-primary">Dip Out</span>
        </h1>
        <p className="text-lg text-muted-foreground max-w-md">
          Fast, affordable rides at your fingertips. Or earn money on your own schedule as a driver.
        </p>

        {/* App download buttons */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2 w-full sm:w-auto">
          <a
            href="https://apps.apple.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 px-6 py-3.5 rounded-2xl bg-foreground text-background font-semibold hover:opacity-90 transition-opacity"
          >
            <Apple className="w-5 h-5 shrink-0" />
            <div className="text-left">
              <p className="text-[10px] opacity-70 leading-none">Download on the</p>
              <p className="text-sm leading-tight">App Store</p>
            </div>
          </a>
          <a
            href="https://play.google.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 px-6 py-3.5 rounded-2xl bg-foreground text-background font-semibold hover:opacity-90 transition-opacity"
          >
            <Play className="w-5 h-5 shrink-0 fill-background" />
            <div className="text-left">
              <p className="text-[10px] opacity-70 leading-none">Get it on</p>
              <p className="text-sm leading-tight">Google Play</p>
            </div>
          </a>
        </div>

        {/* Or use web app */}
        <p className="text-sm text-muted-foreground">
          Or use the web app —{' '}
          <Link to="/" className="text-primary hover:underline font-medium">Book a ride</Link>
          {' '}·{' '}
          <Link to="/driver" className="text-primary hover:underline font-medium">Start driving</Link>
        </p>
      </section>

      {/* Feature highlights */}
      <section className="max-w-3xl mx-auto px-6 pb-20 grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { icon: Zap, title: 'Instant matching', desc: 'Get paired with a nearby driver in seconds.' },
          { icon: Shield, title: 'Safe & reliable', desc: 'Every ride is tracked with safety features built in.' },
          { icon: Star, title: 'AI-powered pricing', desc: 'Dynamic fares that are always fair and transparent.' },
        ].map(({ icon: Icon, title, desc }) => (
          <div key={title} className="rounded-2xl border border-border bg-card p-5 space-y-2">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
              <Icon className="w-4 h-4 text-primary" />
            </div>
            <p className="font-semibold text-sm">{title}</p>
            <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
          </div>
        ))}
      </section>
    </div>
  );
}