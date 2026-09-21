'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Star, ArrowRight, Clock, ShieldCheck } from 'lucide-react';
import { AIBot, AIBotCategory } from '@/lib/types';
import { BotIcon } from './BotIcon';
import { formatRelativeTime } from '@/lib/ai/ai-store';
import { cn } from '@/lib/utils';
import { DESIGNOIA_MOTION } from '@/lib/motion';

const CATEGORY_COLORS: Record<
  AIBotCategory,
  { bg: string; text: string; border: string; glow: string }
> = {
  strategy: {
    bg: 'bg-indigo-500/10',
    text: 'text-indigo-400',
    border: 'border-indigo-500/25',
    glow: 'group-hover:border-indigo-500/40',
  },
  research: {
    bg: 'bg-cyan-500/10',
    text: 'text-cyan-400',
    border: 'border-cyan-500/25',
    glow: 'group-hover:border-cyan-500/40',
  },
  marketing: {
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-400',
    border: 'border-emerald-500/25',
    glow: 'group-hover:border-emerald-500/40',
  },
  sales: {
    bg: 'bg-amber-500/10',
    text: 'text-amber-400',
    border: 'border-amber-500/25',
    glow: 'group-hover:border-amber-500/40',
  },
  operations: {
    bg: 'bg-blue-500/10',
    text: 'text-blue-400',
    border: 'border-blue-500/25',
    glow: 'group-hover:border-blue-500/40',
  },
  finance: {
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-400',
    border: 'border-emerald-500/25',
    glow: 'group-hover:border-emerald-500/40',
  },
  automation: {
    bg: 'bg-purple-500/10',
    text: 'text-purple-400',
    border: 'border-purple-500/25',
    glow: 'group-hover:border-purple-500/40',
  },
};

interface BotCardProps {
  bot: AIBot;
  onToggleFavorite?: (slug: string) => void;
  onOpenBot?: (slug: string) => void;
  compact?: boolean;
}

export function BotCard({ bot, onToggleFavorite, onOpenBot, compact = false }: BotCardProps) {
  const colors = CATEGORY_COLORS[bot.category] || CATEGORY_COLORS.strategy;

  return (
    <motion.div
      whileHover={DESIGNOIA_MOTION.cardHover}
      transition={{ duration: 0.15 }}
      className={cn(
        'group relative flex flex-col justify-between rounded-xl border border-border bg-card/70 p-4 transition-all duration-200 hover:bg-card hover:shadow-lg',
        colors.glow
      )}
    >
      <div>
        {/* Header: Icon, Category & Favorite Toggle */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border transition-colors',
                colors.bg,
                colors.text,
                colors.border
              )}
            >
              <BotIcon name={bot.icon} className="h-5 w-5" />
            </div>

            <div>
              <h3 className="text-sm font-semibold text-foreground tracking-tight group-hover:text-primary transition-colors">
                {bot.name}
              </h3>
              <span
                className={cn(
                  'inline-block text-[10px] font-medium uppercase tracking-wider capitalize',
                  colors.text
                )}
              >
                {bot.category}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onToggleFavorite?.(bot.slug);
            }}
            title={bot.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
            className={cn(
              'rounded-lg p-1.5 transition-colors',
              bot.isFavorite
                ? 'text-amber-400 hover:bg-amber-400/10'
                : 'text-muted-foreground/50 hover:bg-accent hover:text-foreground'
            )}
            aria-label={`Favorite ${bot.name}`}
          >
            <Star className={cn('h-4 w-4', bot.isFavorite && 'fill-amber-400')} />
          </button>
        </div>

        {/* Short Description */}
        <p className="mt-3 text-xs leading-relaxed text-muted-foreground line-clamp-2">
          {bot.description}
        </p>

        {/* Starter Preview (if not compact) */}
        {!compact && bot.conversationStarters && bot.conversationStarters.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            <span className="text-[10px] text-muted-foreground/70 italic line-clamp-1">
              e.g. &ldquo;{bot.conversationStarters[0]}&rdquo;
            </span>
          </div>
        )}
      </div>

      {/* Footer: Status, Last Used & Open Button */}
      <div className="mt-4 pt-3 border-t border-border/50 flex items-center justify-between text-[11px]">
        <div className="flex items-center gap-2 text-muted-foreground">
          <span className="flex items-center gap-1 text-[10px] text-muted-foreground/80">
            <Clock className="h-3 w-3" />
            {formatRelativeTime(bot.lastUsedAt)}
          </span>
        </div>

        <Link
          href={`/ai/bots/${bot.slug}`}
          onClick={() => onOpenBot?.(bot.slug)}
          className="inline-flex items-center gap-1.5 rounded-lg bg-secondary/80 px-2.5 py-1 text-xs font-medium text-foreground transition-all hover:bg-primary hover:text-primary-foreground"
        >
          <span>Open Bot</span>
          <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>
    </motion.div>
  );
}
