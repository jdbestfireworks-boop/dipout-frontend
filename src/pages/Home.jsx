import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Car, MapPin, Shield, Bell, ArrowRight, Sun, Moon } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import InstallModal from '@/components/InstallModal';

export default function Home() {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [installPrompt, setInstallPrompt] = useState(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);
  const [installModal, setInstallModal] = useState(null); // 'android' | 'ios'
  const [darkMode, setDarkMode] = useState(() => {
    // Check localStorage first, then system preference
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('dipout-theme');
      if (saved !== null) return saved === 'dark';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false; // Default to light mode
  });

  useEffect(() => {
    base44.auth.isAuthenticated().then(setIsLoggedIn);
    base44.auth.me().then(u => setIsAdmin(u?.role === 'admin')).catch(() => {});
  }, []);

  // Theme toggle effect with localStorage persistence
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('dipout-theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('dipout-theme', 'light');
    }
  }, [darkMode]);

  // Debug: Log theme state on mount
  useEffect(() => {
    console.log('Theme initialized:', darkMode ? 'dark' : 'light');
    const saved = localStorage.getItem('dipout-theme');
    console.log('Saved theme:', saved);
  }, []);

  // Listen for system theme changes (works on iOS 13+ and Android 10+)
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e) => {
      // Only auto-switch if user hasn't manually set a preference
      const saved = localStorage.getItem('dipout-theme');
      if (!saved) {
        setDarkMode(e.matches);
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
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
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-primary/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-primary/15 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-5 py-16">

        {/* Theme Toggle */}
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            console.log('Toggling theme from:', darkMode ? 'dark' : 'light');
            setDarkMode(!darkMode);
          }}
          className="absolute top-6 right-6 p-3 rounded-full bg-gradient-to-br from-card/90 to-card/60 dark:from-primary/20 dark:to-primary/10 backdrop-blur-xl border-2 border-border/50 dark:border-primary/30 hover:border-primary/60 transition-all shadow-lg hover:shadow-primary/30 z-50 touch-manipulation cursor-pointer"
          title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          style={{ WebkitTapHighlightColor: 'transparent', WebkitTouchCallout: 'none' }}
        >
          {darkMode ? (
            <Sun className="w-7 h-7 text-primary" />
          ) : (
            <Moon className="w-7 h-7 text-foreground" />
          )}
        </motion.button>

        {/* Logo */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, type: 'spring' }}
          className="mb-8"
        >
          <div className="w-28 h-28 rounded-3xl bg-gradient-to-br from-primary via-amber-300 to-primary flex items-center justify-center shadow-2xl shadow-primary/50 overflow-hidden ring-4 ring-primary/20">
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent" />
            <img
              src="https://media.base44.com/images/public/6a2adf5a7f92459340d0efc2/925d1fd18_generated_image.png"
              alt="Dip Out"
              className="w-22 h-22 object-contain relative z-10"
            />
          </div>
        </motion.div>

        <motion.div
          initial={{ y: 16, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.15, duration: 0.4 }}
          className="text-center mb-10"
        >
          <h1 className="text-6xl font-display font-bold tracking-tight mb-3 bg-gradient-to-r from-primary via-amber-300 to-primary bg-clip-text text-transparent">Dip Out</h1>
          <p className="text-muted-foreground text-lg font-light">Simple, affordable rides — Louisiana only.</p>
        </motion.div>

        {/* Main CTAs */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.25, duration: 0.4 }}
          className="w-full max-w-xs space-y-3"
        >
          {!isLoggedIn ? (
            <>
              <Link
                to="/login"
                className="group relative flex items-center justify-between w-full px-10 py-6 rounded-2xl bg-gradient-to-r from-primary via-amber-300 to-primary text-primary-foreground font-bold text-xl hover:shadow-2xl hover:shadow-primary/40 active:scale-[0.98] transition-all overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                <div className="flex items-center gap-4 relative z-10">
                  <MapPin className="w-7 h-7" />
                  Login
                </div>
                <ArrowRight className="w-6 h-6 opacity-70 group-hover:translate-x-1 transition-transform relative z-10" />
              </Link>

              <Link
                to="/register/rider"
                className="group flex items-center justify-between w-full px-10 py-6 rounded-2xl border-2 border-primary/50 bg-gradient-to-r from-primary/15 to-primary/5 backdrop-blur-sm text-primary font-bold text-xl hover:border-primary hover:bg-primary/20 hover:shadow-lg hover:shadow-primary/20 active:scale-[0.98] transition-all"
              >
                <div className="flex items-center gap-4">
                  <Car className="w-7 h-7" />
                  Sign Up to Ride
                </div>
                <ArrowRight className="w-6 h-6 opacity-70 group-hover:translate-x-1 transition-transform" />
              </Link>
            </>
          ) : (
            <>
              <Link
                to="/rider"
                onClick={handleBookRideClick}
                className="group relative flex items-center justify-between w-full px-10 py-6 rounded-2xl bg-gradient-to-r from-primary via-amber-300 to-primary text-primary-foreground font-bold text-xl hover:shadow-2xl hover:shadow-primary/40 active:scale-[0.98] transition-all overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                <div className="flex items-center gap-4 relative z-10">
                  <MapPin className="w-7 h-7" />
                  Book a Ride
                </div>
                <ArrowRight className="w-6 h-6 opacity-70 group-hover:translate-x-1 transition-transform relative z-10" />
              </Link>

              <Link
                to="/driver"
                onClick={handleDrive}
                className="group flex items-center justify-between w-full px-10 py-6 rounded-2xl border-2 border-primary/50 bg-gradient-to-r from-primary/15 to-primary/5 backdrop-blur-sm text-foreground font-bold text-xl hover:border-primary hover:bg-primary/20 hover:shadow-lg hover:shadow-primary/20 active:scale-[0.98] transition-all"
              >
                <div className="flex items-center gap-4">
                  <Car className="w-7 h-7 text-primary" />
                  Drive with Dip Out
                </div>
                <ArrowRight className="w-6 h-6 opacity-40 group-hover:translate-x-1 transition-transform" />
              </Link>
            </>
          )}

          {isAdmin && (
            <Link
              to="/admin"
              className="group flex items-center justify-between w-full px-8 py-5 rounded-2xl border border-border bg-card/40 backdrop-blur-sm text-muted-foreground font-semibold text-base hover:border-border/80 hover:text-foreground active:scale-[0.98] transition-all"
            >
              <div className="flex items-center gap-3">
                <Shield className="w-5 h-5" />
                Admin Dashboard
              </div>
              <ArrowRight className="w-5 h-5 opacity-30 group-hover:translate-x-1 transition-transform" />
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
                  className="px-5 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-bold hover:opacity-90 transition-opacity"
                >
                  Install
                </button>
                <button onClick={() => setShowInstallBanner(false)} className="p-2 text-muted-foreground hover:text-foreground">
                  ✕
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Download App section */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="w-full max-w-xs mt-6 space-y-2"
        >
          <p className="text-center text-xs text-muted-foreground font-medium">Download the App</p>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setInstallModal('rider')}
              className="flex flex-col items-center gap-2 px-5 py-5 rounded-2xl border border-border bg-card/60 hover:border-primary/50 hover:bg-card active:scale-[0.97] transition-all"
            >
              <MapPin className="w-8 h-8 text-primary" />
              <span className="text-sm font-semibold">Rider App</span>
              <span className="text-xs text-muted-foreground">Book rides</span>
            </button>

            <button
              onClick={() => setInstallModal('driver')}
              className="flex flex-col items-center gap-2 px-5 py-5 rounded-2xl border border-border bg-card/60 hover:border-primary/50 hover:bg-card active:scale-[0.97] transition-all"
            >
              <Car className="w-8 h-8 text-primary" />
              <span className="text-sm font-semibold">Driver App</span>
              <span className="text-xs text-muted-foreground">Earn money</span>
            </button>
          </div>
        </motion.div>

        {/* Footer links */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="flex flex-col items-center gap-3 mt-8 text-xs"
        >
          <div className="flex items-center gap-5 text-muted-foreground">
            <button
              onClick={() => {
                if (!isLoggedIn) {
                  toast.info('Please login to view ride history');
                  navigate('/login');
                } else {
                  navigate('/rides');
                }
              }}
              className="hover:text-primary transition-colors cursor-pointer"
            >
              Ride History
            </button>
            <button
              onClick={() => {
                if (!isLoggedIn) {
                  toast.info('Please login to access settings');
                  navigate('/login');
                } else {
                  navigate('/notifications');
                }
              }}
              className="hover:text-primary transition-colors flex items-center gap-1 cursor-pointer"
            >
              <Bell className="w-3 h-3" /> Settings
            </button>
          </div>
          <Link to="/register/rider" className="text-primary font-semibold hover:underline">
            Create Rider Account
          </Link>
        </motion.div>
      </div>
      <InstallModal
        platform={installModal}
        onClose={() => setInstallModal(null)}
        onInstall={installPrompt ? handleInstall : null}
      />
    </div>
  );
}