import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Car, Smartphone, LayoutDashboard, LogOut, MessageCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { path: '/', label: 'Ride', icon: Smartphone },
  { path: '/driver', label: 'Drive', icon: Car },
  { path: '/chat', label: 'Chat', icon: MessageCircle },
  { path: '/admin', label: 'Admin', icon: LayoutDashboard },
];

export default function AppShell() {
  const location = useLocation();
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <header className="h-14 flex items-center justify-between px-4 md:px-6 border-b border-border bg-card/70 backdrop-blur-md z-[1100] relative">
        <Link to="/home" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
            <Car className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="font-display font-700 font-bold tracking-tight text-lg">Dip Out</span>
        </Link>
        <nav className="flex items-center gap-2">
          {navItems.map(({ path, label, icon: Icon }) => (
            <Link
              key={path}
              to={path}
              className={cn(
                'flex items-center gap-2 px-4 py-2.5 rounded-full text-base font-semibold transition-all hover:scale-105',
                location.pathname === path
                  ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/30'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent border border-border'
              )}
            >
              <Icon className="w-5 h-5" />
              <span className="hidden sm:inline">{label}</span>
            </Link>
          ))}
          <button
            onClick={() => base44.auth.logout()}
            className="ml-2 p-2.5 rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors border border-border"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </nav>
      </header>
      <main className="flex-1 relative">
        <Outlet />
      </main>
    </div>
  );
}