import React from 'react';
import { BarChart3, Car, Users, Settings, Activity, ExternalLink, ShieldCheck, MapPin, TrendingUp, HardDrive, DollarSign, Bot, AlertTriangle, Bell, UserCog, BrainCircuit } from 'lucide-react';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { id: 'overview',     label: 'Overview',        icon: Activity },
  { id: 'rides',        label: 'Ride History',    icon: Car },
  { id: 'drivers',      label: 'Driver Management', icon: Users },
  { id: 'performance',  label: 'Performance',     icon: TrendingUp },
  { id: 'earnings',     label: 'Earnings',        icon: DollarSign },
  { id: 'reports',      label: 'Monthly Reports', icon: BarChart3 },
  { id: 'system-alerts', label: 'System Alerts',  icon: Bell },
  { id: 'users',        label: 'User Management', icon: UserCog },
  { id: 'analytics',    label: 'Advanced Analytics', icon: BrainCircuit },
  { id: 'alerts',       label: 'Driver Alerts',   icon: AlertTriangle },
  { id: 'ai',           label: 'AI Assistant',    icon: Bot },
  { id: 'map',          label: 'Driver Map',      icon: MapPin },
  { id: 'revenue',      label: 'Revenue',         icon: BarChart3 },
  { id: 'settings',     label: 'Settings',        icon: Settings },
  { id: 'migrate',      label: 'Migrate Data',    icon: HardDrive, external: true },
  { id: 'test',         label: 'Test Suite',      icon: ShieldCheck, external: true },
];

export default function AdminSidebar({ tab, setTab, pendingCount }) {
  return (
    <aside className="w-56 shrink-0 hidden lg:flex flex-col bg-card border-r border-border min-h-screen sticky top-0">
      {/* Brand */}
      <div className="px-5 py-6 border-b border-border">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary to-amber-400 flex items-center justify-center shrink-0 shadow-lg shadow-primary/30">
            <span className="text-primary-foreground font-bold text-xs">DO</span>
          </div>
          <div>
            <p className="font-display font-bold text-sm leading-none bg-gradient-to-r from-primary to-amber-300 bg-clip-text text-transparent">Dip Out</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">Admin Console</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {NAV_ITEMS.map(({ id, label, icon: Icon, external }) => {
          const isActive = tab === id;
          if (external) {
            const href = id === 'test' ? '/admin/test' : id === 'migrate' ? '/admin/migrate' : '/admin/test';
            return (
              <a
                key={id}
                href={href}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
                  'text-muted-foreground hover:text-foreground hover:bg-accent'
                )}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {label}
              </a>
            );
          }
          return (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
                isActive
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground hover:bg-accent'
              )}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {label}
              {id === 'drivers' && pendingCount > 0 && (
                <span className="ml-auto w-5 h-5 rounded-full bg-yellow-500 text-background text-[10px] font-bold flex items-center justify-center">
                  {pendingCount}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-3 pb-4">
        <a
          href="#"
          className="flex items-center gap-2 px-3 py-2 text-xs text-muted-foreground hover:text-foreground rounded-lg hover:bg-accent transition-colors"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          View Live App
        </a>
      </div>
    </aside>
  );
}