import React, { useEffect, useState, useRef } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Car, Smartphone, LogOut, LayoutDashboard, Bell, User, ChevronDown, Shield, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { path: '/rider', label: 'Ride', icon: Smartphone },
  { path: '/driver', label: 'Drive', icon: Car },
];

export default function AppShell() {
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    base44.auth.me().then(u => {
      setUser(u);
      setIsAdmin(u?.role === 'admin');
    }).catch(() => {});
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col w-full">
      <header className="h-14 flex items-center justify-between px-3 sm:px-4 md:px-8 border-b border-border/60 bg-background/80 backdrop-blur-xl sticky top-0 z-[1100] w-full">
        <Link to="/" className="flex items-center gap-2 sm:gap-2.5 hover:opacity-80 transition-opacity">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-gradient-to-br from-primary to-amber-300 flex items-center justify-center shadow-md shadow-primary/40">
            <Car className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary-foreground" />
          </div>
          <span className="font-display font-bold text-base sm:text-lg tracking-tight bg-gradient-to-r from-primary to-amber-300 bg-clip-text text-transparent">Dip Out</span>
        </Link>

        <nav className="flex items-center gap-0.5 sm:gap-1">
          {navItems.map(({ path, label, icon: Icon }) => {
            const active = location.pathname === path || location.pathname.startsWith(path + '/');
            return (
              <Link
                key={path}
                to={path}
                className={cn(
                  'flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all',
                  active
                    ? 'bg-primary text-primary-foreground shadow shadow-primary/20'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                )}
              >
                <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span className="hidden lg:inline">{label}</span>
              </Link>
            );
          })}
          {isAdmin && (
            <Link
              to="/admin"
              className={cn(
                'flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all',
                location.pathname.startsWith('/admin')
                  ? 'bg-primary text-primary-foreground shadow shadow-primary/20'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent'
              )}
            >
              <LayoutDashboard className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="hidden lg:inline">Admin</span>
            </Link>
          )}
          <div className="w-px h-4 sm:h-5 bg-border mx-1" />
          <Link
            to="/register/rider"
            className="hidden lg:flex items-center gap-2 px-3 sm:px-4 py-2 rounded-xl bg-primary text-primary-foreground text-xs sm:text-sm font-bold hover:opacity-90 transition-opacity shadow-md shadow-primary/20"
          >
            <Car className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            Sign Up to Ride
            <ArrowRight className="w-3 h-3 sm:w-3.5 sm:h-3.5 opacity-70" />
          </Link>
          <Link
            to="/notifications"
            title="Notification Settings"
            className="p-1.5 sm:p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          >
            <Bell className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </Link>

          {/* Profile dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen(o => !o)}
              className="flex items-center gap-1.5 pl-1 pr-2 py-1 rounded-xl hover:bg-accent transition-colors"
            >
              <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary">
                {user?.full_name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || '?'}
              </div>
              <ChevronDown className={cn('w-3.5 h-3.5 text-muted-foreground transition-transform', dropdownOpen && 'rotate-180')} />
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 top-full mt-2 w-60 rounded-2xl border border-border bg-card shadow-xl shadow-black/30 z-50 overflow-hidden">
                {/* User info */}
                <div className="px-4 py-3 border-b border-border">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-sm font-bold text-primary shrink-0">
                      {user?.full_name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || '?'}
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-sm truncate">{user?.full_name || 'User'}</p>
                      <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
                      {isAdmin && (
                        <span className="inline-flex items-center gap-1 mt-0.5 text-[10px] font-semibold text-primary">
                          <Shield className="w-3 h-3" /> Admin
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Links */}
                <div className="p-1.5 space-y-0.5">
                  <Link
                    to="/notifications"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm hover:bg-accent transition-colors w-full"
                  >
                    <Bell className="w-4 h-4 text-muted-foreground" />
                    Notification Settings
                  </Link>
                  <Link
                    to="/rides"
                    onClick={() => setDropdownOpen(false)}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm hover:bg-accent transition-colors w-full"
                  >
                    <Car className="w-4 h-4 text-muted-foreground" />
                    Ride History
                  </Link>
                  {isAdmin && (
                    <Link
                      to="/admin"
                      onClick={() => setDropdownOpen(false)}
                      className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm hover:bg-accent transition-colors w-full"
                    >
                      <LayoutDashboard className="w-4 h-4 text-muted-foreground" />
                      Admin Dashboard
                    </Link>
                  )}
                </div>

                {/* Logout */}
                <div className="p-1.5 border-t border-border">
                  <button
                    onClick={() => base44.auth.logout()}
                    className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-destructive hover:bg-destructive/10 transition-colors w-full"
                  >
                    <LogOut className="w-4 h-4" />
                    Log out
                  </button>
                </div>
              </div>
            )}
          </div>
        </nav>
      </header>

      <main className="flex-1 relative w-full">
        <Outlet />
      </main>
    </div>
  );
}