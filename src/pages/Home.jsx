import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Car, MapPin, Shield, Bell, ArrowRight } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

export default function Home() {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [installPrompt, setInstallPrompt] = useState(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);

  useEffect(() => {
    base44.auth.isAuthenticated().then(setIsLoggedIn);
    base44.auth.me().then(u => setIsAdmin(u?.role === 'admin')).catch(() => {});
  }, []);

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setInstallPrompt(e);
      setShowInstallBanner(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!installPrompt) return;
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === 'accepted') setShowInstallBanner(false);
    setInstallPrompt(null);
  };

  const handleBookRide = (e) => {
    if (!isLoggedIn) {
      e.preventDefault();
      toast.info('Please sign in to book a ride');
      navigate('/login');
    }
  };

  const handleDrive = (e) => {
    if (!isLoggedIn) {
      e.preventDefault();
      navigate('/register/driver');
    }
  };

  const handleBookRideClick = (e) => {
    if (!isLoggedIn) {
      e.preventDefault();
      navigate('/register/rider');
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground overflow-hidden relative">
      {/* Background glow blobs */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-purple-900/20 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-5 py-16">

        {/* Logo */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, type: 'spring' }}
          className="mb-6"
        >
          <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-primary to-amber-400 flex items-center justify-center shadow-2xl shadow-primary/40 overflow-hidden">
            <img
              src="https://media.base44.com/images/public/6a2adf5a7f92459340d0efc2/925d1fd18_generated_image.png"
              alt="Dip Out"
              className="w-20 h-20 object-contain"
            />
          </div>
        </motion.div>

        <motion.div
          initial={{ y: 16, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.15, duration: 0.4 }}
          className="text-center mb-10"
        >
          <h1 className="text-5xl font-display font-bold tracking-tight mb-2">Dip Out</h1>
          <p className="text-muted-foreground text-base">Simple, affordable rides — Louisiana only.</p>
        </motion.div>

        {/* Main CTAs */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.25, duration: 0.4 }}
          className="w-full max-w-xs space-y-3"
        >
          <Link
            to="/rider"
            onClick={handleBookRideClick}
            className="group flex items-center justify-between w-full px-6 py-4 rounded-2xl bg-primary text-primary-foreground font-bold text-base hover:opacity-90 active:scale-[0.98] transition-all shadow-lg shadow-primary/30"
          >
            <div className="flex items-center gap-3">
              <MapPin className="w-5 h-5" />
              Book a Ride
            </div>
            <ArrowRight className="w-4 h-4 opacity-70 group-hover:translate-x-1 transition-transform" />
          </Link>

          <Link
            to="/driver"
            onClick={handleDrive}
            className="group flex items-center justify-between w-full px-6 py-4 rounded-2xl border border-border bg-card/60 backdrop-blur-sm text-foreground font-bold text-base hover:border-primary/50 hover:bg-card active:scale-[0.98] transition-all"
          >
            <div className="flex items-center gap-3">
              <Car className="w-5 h-5 text-primary" />
              Drive with Dip Out
            </div>
            <ArrowRight className="w-4 h-4 opacity-40 group-hover:translate-x-1 transition-transform" />
          </Link>

          {isAdmin && (
            <Link
              to="/admin"
              className="group flex items-center justify-between w-full px-6 py-4 rounded-2xl border border-border bg-card/40 backdrop-blur-sm text-muted-foreground font-semibold text-sm hover:border-border/80 hover:text-foreground active:scale-[0.98] transition-all"
            >
              <div className="flex items-center gap-3">
                <Shield className="w-4 h-4" />
                Admin Dashboard
              </div>
              <ArrowRight className="w-4 h-4 opacity-30 group-hover:translate-x-1 transition-transform" />
            </Link>
          )}


        </motion.div>

        {/* Install App banner */}
        {showInstallBanner && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-xs mt-4"
          >
            <div className="flex items-center justify-between gap-3 px-4 py-3 rounded-2xl border border-primary/30 bg-primary/10">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-primary/20 flex items-center justify-center shrink-0">
                  <span className="text-base">📲</span>
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-foreground leading-none">Install Dip Out</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Add to home screen</p>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={handleInstall}
                  className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-bold hover:opacity-90 transition-opacity"
                >
                  Install
                </button>
                <button onClick={() => setShowInstallBanner(false)} className="p-1.5 text-muted-foreground hover:text-foreground">
                  ✕
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Install App section */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="w-full max-w-xs mt-6 space-y-2"
        >
          <p className="text-center text-xs text-muted-foreground font-medium">Install the App</p>
          <div className="grid grid-cols-2 gap-2">
            {/* Android / Chrome install */}
            <button
              onClick={installPrompt ? handleInstall : () => {
                alert('To install on Android:\n1. Open this page in Chrome\n2. Tap the menu (⋮)\n3. Tap "Add to Home screen"');
              }}
              className="flex flex-col items-center gap-1.5 px-3 py-3 rounded-2xl border border-border bg-card/60 hover:border-primary/50 hover:bg-card active:scale-[0.97] transition-all"
            >
              <span className="text-2xl">🤖</span>
              <span className="text-xs font-semibold">Android</span>
              <span className="text-[10px] text-muted-foreground">Chrome / Edge</span>
            </button>

            {/* iOS install */}
            <button
              onClick={() => alert('To install on iPhone/iPad:\n1. Open this page in Safari\n2. Tap the Share button (□↑)\n3. Tap "Add to Home Screen"')}
              className="flex flex-col items-center gap-1.5 px-3 py-3 rounded-2xl border border-border bg-card/60 hover:border-primary/50 hover:bg-card active:scale-[0.97] transition-all"
            >
              <span className="text-2xl">🍎</span>
              <span className="text-xs font-semibold">iPhone / iPad</span>
              <span className="text-[10px] text-muted-foreground">Safari</span>
            </button>
          </div>
        </motion.div>

        {/* Footer links */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="flex items-center gap-5 mt-6 text-xs text-muted-foreground"
        >
          <Link to="/rides" className="hover:text-primary transition-colors">Ride History</Link>
          <Link to="/notifications" className="hover:text-primary transition-colors flex items-center gap-1">
            <Bell className="w-3 h-3" /> Settings
          </Link>
        </motion.div>
      </div>
    </div>
  );
}