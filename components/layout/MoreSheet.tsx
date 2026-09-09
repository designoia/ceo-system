'use client';

import React from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { FolderKanban, Target, BarChart3, Settings, X } from 'lucide-react';
import { DESIGNOIA_MOTION } from '@/lib/motion';

const MORE_ITEMS = [
  { href: '/projects', label: 'Projects', icon: FolderKanban, desc: 'Initiatives & progress' },
  { href: '/goals', label: 'Goals', icon: Target, desc: '5-year plan & roadmap' },
  { href: '/reviews', label: 'Reviews', icon: BarChart3, desc: 'Weekly & monthly review' },
  { href: '/settings', label: 'Settings', icon: Settings, desc: 'Integrations & backup' },
];

export function MoreSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/50 md:hidden"
          />
          <motion.div
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.4 }}
            onDragEnd={(_, info) => {
              if (info.offset.y > 100 || info.velocity.y > 500) onClose();
            }}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={DESIGNOIA_MOTION.bottomSheet}
            className="fixed inset-x-0 bottom-0 z-50 surface-1 border-t border-border shadow-2xl rounded-t-2xl pb-[env(safe-area-inset-bottom,16px)] md:hidden"
          >
            <div className="flex justify-center pt-2.5 pb-1">
              <div className="h-1 w-9 rounded-full bg-border" />
            </div>
            <div className="flex items-center justify-between px-5 py-2">
              <span className="text-sm font-semibold text-foreground">More</span>
              <button onClick={onClose} className="rounded-md p-1.5 text-muted-foreground hover:bg-secondary">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="px-3 pb-4 space-y-1">
              {MORE_ITEMS.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onClose}
                    className="flex items-center gap-3 rounded-lg px-3 py-3 min-h-[44px] hover:bg-secondary transition-colors"
                  >
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-secondary text-foreground shrink-0">
                      <Icon className="h-4 w-4" />
                    </span>
                    <div className="min-w-0">
                      <div className="text-[13px] font-medium text-foreground">{item.label}</div>
                      <div className="text-[11px] text-muted-foreground truncate">{item.desc}</div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
