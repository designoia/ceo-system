'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { Home, CheckSquare, Clock, FolderKanban, MoreHorizontal, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useStore } from '@/lib/store';

const MOBILE_ITEMS = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/tasks', label: 'Tasks', icon: CheckSquare },
  { href: '/schedule', label: 'Schedule', icon: Clock },
  { href: '/projects', label: 'Projects', icon: FolderKanban },
  { href: '/reviews', label: 'Reviews', icon: MoreHorizontal },
];

export function MobileNav() {
  const pathname = usePathname();
  const { setQuickAddOpen } = useStore();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 flex h-16 items-center justify-around border-t border-border bg-background/95 px-2 pb-[env(safe-area-inset-bottom,0px)] backdrop-blur-lg md:hidden">
      {MOBILE_ITEMS.map((item, idx) => {
        const isActive = pathname === item.href;
        const Icon = item.icon;

        return (
          <React.Fragment key={item.href}>
            {idx === 2 && (
              <motion.button
                whileTap={{ scale: 0.9 }}
                whileHover={{ scale: 1.05 }}
                onClick={() => setQuickAddOpen(true)}
                className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg active:scale-95 transition-transform"
                title="Quick Add Task"
                aria-label="Quick Add Task"
              >
                <Plus className="h-5 w-5" />
              </motion.button>
            )}

            <Link
              href={item.href}
              className={cn(
                'relative flex flex-col items-center justify-center gap-1 rounded-xl py-1 px-2.5 min-h-[44px] min-w-[44px] text-[11px] font-medium transition-colors',
                isActive
                  ? 'text-primary font-bold'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {isActive && (
                <motion.div
                  layoutId="mobile-nav-active-pill"
                  className="absolute inset-0 rounded-xl bg-primary/10 -z-10"
                  transition={{ type: 'spring', stiffness: 450, damping: 30 }}
                />
              )}

              <motion.div
                animate={{ scale: isActive ? 1.08 : 1 }}
                transition={{ duration: 0.2 }}
              >
                <Icon className={cn('h-5 w-5', isActive && 'stroke-[2.5]')} />
              </motion.div>
              <span>{item.label}</span>
            </Link>
          </React.Fragment>
        );
      })}
    </nav>
  );
}
