import React from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Car, Smartphone, LayoutDashboard, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { path: '/', label: 'Ride', icon: Smartphone },
  { path: '/driver', label: 'Drive', icon: Car },
  { path: '/admin', label: 'Admin', icon: LayoutDashboard },
];

export default function AppShell() {
  const location = useLocation();
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <header className="h-14 flex items-center justify-between px-4 md:px-6 border-b border-border bg-card/70 backdrop-blur-md z-[1100] relative">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
            <Car className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="font-display font-700 font-bold tracking-tight text-lg">Velo</span>
        </div>
        <nav className="flex items-center gap-1">
          {navItems.map(({ path, label, icon: Icon }) => (
            <Link
              key={path}
              to={path}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm transition-colors',
                location.pathname === path
                  ? 'bg-primary text-primary-foreground font-semibold'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent'
              )}
            >
              <Icon className="w-4 h-4" />
              <span className="hidden sm:inline">{label}</span>
            </Link>
          ))}
          <button
            onClick={() => base44.auth.logout()}
            className="ml-2 p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
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