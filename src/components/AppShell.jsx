import React, { useEffect, useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Car, Smartphone, LogOut, LayoutDashboard, Bell } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { path: '/rider', label: 'Ride', icon: Smartphone },
  { path: '/driver', label: 'Drive', icon: Car },
];

export default function AppShell() {
  const location = useLocation();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    base44.auth.me().then(u => setIsAdmin(u?.role === 'admin')).catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <header className="h-14 flex items-center justify-between px-4 md:px-8 border-b border-border/60 bg-background/80 backdrop-blur-xl sticky top-0 z-[1100]">
        <Link to="/" className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
          <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center shadow-sm shadow-primary/30">
            <Car className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="font-display font-bold text-lg tracking-tight">Dip Out</span>
        </Link>

        <nav className="flex items-center gap-1">
          {navItems.map(({ path, label, icon: Icon }) => {
            const active = location.pathname === path || location.pathname.startsWith(path + '/');
            return (
              <Link
                key={path}
                to={path}
                className={cn(
                  'flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-semibold transition-all',
                  active
                    ? 'bg-primary text-primary-foreground shadow shadow-primary/20'
                    : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                )}
              >
                <Icon className="w-4 h-4" />
                <span className="hidden sm:inline">{label}</span>
              </Link>
            );
          })}
          {isAdmin && (
            <Link
              to="/admin"
              className={cn(
                'flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-semibold transition-all',
                location.pathname.startsWith('/admin')
                  ? 'bg-primary text-primary-foreground shadow shadow-primary/20'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent'
              )}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span className="hidden sm:inline">Admin</span>
            </Link>
          )}
          <div className="w-px h-5 bg-border mx-1" />
          <Link
            to="/notifications"
            title="Notification Settings"
            className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          >
            <Bell className="w-4 h-4" />
          </Link>
          <button
            onClick={() => base44.auth.logout()}
            className="p-2 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
            title="Log out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </nav>
      </header>

      <main className="flex-1 relative">
        <Outlet />
      </main>
    </div>
  );
}