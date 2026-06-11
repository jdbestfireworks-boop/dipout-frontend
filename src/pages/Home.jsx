import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Car, MapPin, Shield, Play, Bell, Loader2, Zap, Sparkles } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function Home() {
  const [simulating, setSimulating] = useState(false);
  const [seeding, setSeeding] = useState(false);

  const toggleSimulation = async () => {
    setSimulating(true);
    try {
      const action = simulating ? 'stop' : 'start';
      const result = await base44.functions.invoke('toggleSimulation', { action });
      toast.success(result.data.message);
      
      if (action === 'start') {
        toast.info('AI rides created every 5 minutes - watch them appear in real-time!');
      } else {
        toast.info('Simulation stopped');
      }
      setSimulating(!simulating);
    } catch (error) {
      console.error('Simulation toggle error:', error);
      toast.error('Failed to toggle simulation');
    } finally {
      setSimulating(false);
    }
  };

  const seedDemoData = async () => {
    setSeeding(true);
    try {
      const result = await base44.functions.invoke('seedDemoData', {});
      toast.success(`Demo data loaded: ${result.data.stats.initial_rides} rides & ${result.data.stats.drivers} drivers`);
    } catch (error) {
      console.error('Seed data error:', error);
      toast.error('Failed to load demo data');
    } finally {
      setSeeding(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center px-6">
      {/* Logo */}
      <div className="w-32 h-32 rounded-full bg-gradient-to-br from-purple-900 to-purple-700 flex items-center justify-center shadow-2xl shadow-primary/40 mb-8 overflow-hidden border-4 border-primary/30">
        <img src="https://media.base44.com/images/public/6a2adf5a7f92459340d0efc2/925d1fd18_generated_image.png" alt="Dip Out Logo" className="w-28 h-28 object-contain" />
      </div>
      
      <h1 className="text-4xl font-display font-bold mb-3">
        Dip Out
      </h1>
      <p className="text-muted-foreground text-center mb-12 max-w-sm">
        Simple, affordable rides — Louisiana only.
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
        
        <div className="mt-4 space-y-3">
          <button
            onClick={toggleSimulation}
            disabled={simulating}
            className={`flex items-center justify-center gap-2 w-full px-6 py-4 rounded-2xl font-bold text-sm transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed ${
              simulating
                ? 'bg-red-500 hover:bg-red-600 text-white'
                : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:opacity-90 text-white'
            }`}
          >
            {simulating ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Stop Simulation</>
            ) : (
              <><Zap className="w-4 h-4" /> Start AI Simulation</>
            )}
          </button>

          <button
            onClick={seedDemoData}
            disabled={seeding}
            className="flex items-center justify-center gap-2 w-full px-6 py-3 rounded-xl border-2 border-primary/30 bg-primary/5 text-primary font-semibold text-sm hover:bg-primary/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {seeding ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Loading...</>
            ) : (
              <><Play className="w-4 h-4" /> Load Demo Data (5+ rides)</>
            )}
          </button>
        </div>

        <div className="mt-6 flex items-center justify-center gap-4 text-xs text-muted-foreground">
          <Link to="/rides" className="hover:text-primary transition-colors font-medium">Ride History</Link>
          <Link to="/simulation" className="hover:text-primary transition-colors font-medium flex items-center gap-1">
            <Sparkles className="w-3 h-3" /> How It Works
          </Link>
          <Link to="/notifications" className="hover:text-primary transition-colors font-medium flex items-center gap-1">
            <Bell className="w-3 h-3" /> Notifications
          </Link>
        </div>
      </div>
    </div>
  );
}