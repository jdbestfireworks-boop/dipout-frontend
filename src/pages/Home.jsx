import React from 'react';
import { Link } from 'react-router-dom';
import { Car, MapPin, Shield } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center px-6">
      {/* Logo */}
      <div className="w-20 h-20 rounded-3xl bg-primary flex items-center justify-center shadow-2xl shadow-primary/40 mb-8">
        <Car className="w-10 h-10 text-primary-foreground" />
      </div>
      
      <h1 className="text-4xl font-display font-bold mb-3">
        Dip Out
      </h1>
      <p className="text-muted-foreground text-center mb-12 max-w-sm">
        Simple, affordable rides — anytime, anywhere.
      </p>

      {/* Main CTAs */}
      <div className="w-full max-w-sm space-y-3">
        <Link
          to="/rider"
          className="flex items-center justify-center gap-3 w-full px-6 py-5 rounded-2xl bg-primary text-primary-foreground font-bold text-lg hover:opacity-90 transition-opacity shadow-lg shadow-primary/30"
        >
          <MapPin className="w-6 h-6" /> Book a Ride
        </Link>
        <Link
          to="/driver"
          className="flex items-center justify-center gap-3 w-full px-6 py-5 rounded-2xl border-2 border-primary/50 bg-primary/5 text-primary font-bold text-lg hover:bg-primary/10 transition-all"
        >
          <Car className="w-6 h-6" /> Drive
        </Link>
        
        <Link
          to="/admin"
          className="flex items-center justify-center gap-3 w-full px-6 py-5 rounded-2xl border-2 border-border bg-card text-foreground font-bold text-lg hover:border-primary/50 transition-all"
        >
          <Shield className="w-6 h-6" /> Admin Login
        </Link>
        
        <div className="mt-6 flex items-center justify-center gap-6 text-xs text-muted-foreground">
          <Link to="/rides" className="hover:text-primary transition-colors font-medium">Ride History</Link>
        </div>
      </div>
    </div>
  );
}