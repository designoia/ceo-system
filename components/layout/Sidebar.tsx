'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  Home, 
  Target, 
  FolderKanban, 
  CheckSquare, 
  Clock, 
  BarChart3, 
  Settings,
  Sparkles
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useStore } from '@/lib/store';

const NAV_ITEMS = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/goals', label: 'Goals', icon: Target },
  { href: '/projects', label: 'Projects', icon: FolderKanban },
  { href: '/tasks', label: 'Tasks', icon: CheckSquare },
  { href: '/schedule', label: 'Schedule', icon: Clock },
  { href: '/reviews', label: 'Reviews', icon: BarChart3 },
];

export function Sidebar() {
  const pathname = usePathname();
  const { currentMonth, momentumStats } = useStore();

  return (
    <aside className="hidden md:flex h-screen w-64 flex-col border-r border-border bg-card/60 p-4 backdrop-blur-md shrink-0">
      {/* Brand Header */}
      <div className="flex items-center gap-3 px-3 py-3">
        <motion.div
          whileHover={{ rotate: 15, scale: 1.05 }}
          className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground font-bold shadow-sm"
        >
          <Sparkles className="h-5 w-5" />
        </motion.div>
        <div>
          <span className="font-bold text-foreground text-sm tracking-tight">CEO OS</span>
          <span className="block text-[11px] text-muted-foreground font-medium">5-Year Plan → Today</span>
        </div>
      </div>

      {/* Strategic Focus Pill */}
      {currentMonth && (
        <div className="mx-2 my-4 rounded-xl border border-primary/20 bg-primary/5 p-3">
          <div className="text-[10px] font-semibold tracking-wider text-primary uppercase">
            Month Focus • {currentMonth.yearMonth}
          </div>
          <div className="mt-1 text-xs font-medium text-foreground line-clamp-2">
            {currentMonth.focusTitle}
          </div>
        </div>
      )}

      {/* Main Navigation */}
      <nav className="flex-1 space-y-1 px-1">
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
                isActive
                  ? 'text-primary-foreground font-semibold shadow-sm'
                  : 'text-muted-foreground hover:bg-accent/60 hover:text-foreground'
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="sidebar-active-indicator"
                  className="absolute inset-0 rounded-xl bg-primary shadow-sm -z-10"
                  transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                />
              )}
              <Icon className="h-4 w-4 relative z-10" />
              <span className="relative z-10">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Momentum Badge & Settings */}
      <div className="border-t border-border pt-4 px-2 space-y-3">
        <div className="flex items-center justify-between rounded-xl bg-accent/50 px-3 py-2 text-xs">
          <span className="text-muted-foreground">Momentum</span>
          <span className="font-bold text-foreground flex items-center gap-1 font-mono">
            🔥 {momentumStats.currentStreak}d
            {momentumStats.bestStreak > 0 && (
              <span className="text-[10px] text-muted-foreground font-normal">
                (Best: {momentumStats.bestStreak}d)
              </span>
            )}
          </span>
        </div>

        <Link
          href="/settings"
          className={cn(
            'relative flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition-colors',
            pathname === '/settings'
              ? 'text-foreground font-semibold bg-accent'
              : 'text-muted-foreground hover:bg-accent hover:text-foreground'
          )}
        >
          <Settings className="h-4 w-4" />
          <span>Settings</span>
        </Link>
      </div>
    </aside>
  );
}
