'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { Home, CheckSquare, Clock, MoreHorizontal, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useStore } from '@/lib/store';
import { DESIGNOIA_MOTION } from '@/lib/motion';
import { MoreSheet } from '@/components/layout/MoreSheet';
import { useCloseOnRouteChange } from '@/lib/hooks/useCloseOnRouteChange';

const NAV_ITEMS = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/tasks', label: 'Tasks', icon: CheckSquare },
];

const NAV_ITEMS_RIGHT = [
  { href: '/schedule', label: 'Schedule', icon: Clock },
];

export function MobileNav() {
  const pathname = usePathname();
  const { setCommandPaletteOpen } = useStore();
  const [moreOpen, setMoreOpen] = useState(false);
  useCloseOnRouteChange(moreOpen, () => setMoreOpen(false));

  const renderLink = (item: (typeof NAV_ITEMS)[number]) => {
    const isActive = pathname === item.href;
    const Icon = item.icon;
    return (
      <Link
        key={item.href}
        href={item.href}
        className={cn(
          'relative flex flex-col items-center justify-center gap-1 rounded-xl py-1 px-2.5 min-h-[44px] min-w-[44px] text-[11px] font-medium transition-colors',
          isActive ? 'text-primary font-semibold' : 'text-muted-foreground hover:text-foreground'
        )}
      >
        {isActive && (
          <motion.div
            layoutId="mobile-nav-active-pill"
            className="absolute inset-0 rounded-xl bg-primary/10 -z-10"
            transition={DESIGNOIA_MOTION.navActive}
          />
        )}
        <motion.div animate={{ scale: isActive ? 1.08 : 1 }} transition={{ duration: 0.18 }}>
          <Icon className={cn('h-5 w-5', isActive && 'stroke-[2.5]')} />
        </motion.div>
        <span>{item.label}</span>
      </Link>
    );
  };

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 z-40 flex h-16 items-center justify-around border-t border-border bg-background/95 px-2 pb-[env(safe-area-inset-bottom,0px)] backdrop-blur-lg md:hidden">
        {NAV_ITEMS.map(renderLink)}

        {/* Fastest capture: opens the command palette focused for instant task/idea entry */}
        <motion.button
          whileTap={DESIGNOIA_MOTION.buttonPress}
          onClick={() => setCommandPaletteOpen(true)}
          className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg"
          aria-label="Quick capture"
        >
          <Plus className="h-5 w-5" />
        </motion.button>

        {NAV_ITEMS_RIGHT.map(renderLink)}

        <button
          onClick={() => setMoreOpen(true)}
          className={cn(
            'relative flex flex-col items-center justify-center gap-1 rounded-xl py-1 px-2.5 min-h-[44px] min-w-[44px] text-[11px] font-medium transition-colors',
            moreOpen ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
          )}
        >
          <MoreHorizontal className="h-5 w-5" />
          <span>More</span>
        </button>
      </nav>

      <MoreSheet open={moreOpen} onClose={() => setMoreOpen(false)} />
    </>
  );
}
