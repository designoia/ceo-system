'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, Sparkles, Star, History, Filter, Bot, Layers } from 'lucide-react';
import { useAIStore } from '@/lib/ai/ai-store';
import { BotCard } from '@/components/ai/BotCard';
import { AIBotCategory } from '@/lib/types';
import { cn } from '@/lib/utils';
import { DESIGNOIA_MOTION } from '@/lib/motion';

const CATEGORIES: { id: AIBotCategory | 'all'; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'strategy', label: 'Strategy' },
  { id: 'research', label: 'Research' },
  { id: 'marketing', label: 'Marketing' },
  { id: 'sales', label: 'Sales' },
  { id: 'operations', label: 'Operations' },
  { id: 'finance', label: 'Finance' },
  { id: 'automation', label: 'Automation' },
];

export default function AICommandCenterPage() {
  const {
    filteredBots,
    favoriteBots,
    recentBots,
    categoryCounts,
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    toggleFavorite,
    recordBotUsage,
  } = useAIStore();

  const isFilteringOrSearching = searchQuery.trim().length > 0 || selectedCategory !== 'all';

  return (
    <div className="space-y-8 pb-12">
      {/* ==================================================================== */}
      {/* 1. EXECUTIVE HERO HEADER */}
      {/* ==================================================================== */}
      <div className="relative overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-card/90 via-card/60 to-primary/5 p-6 sm:p-8 backdrop-blur-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Your AI Business Team</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              AI Command Center
            </h1>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Specialized AI assistants for strategy, research, marketing, sales and operations.
              Turn high-level vision into concrete execution inside CEO OS.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 rounded-xl border border-border bg-card/60 px-4 py-2.5 text-xs">
              <Layers className="h-4 w-4 text-primary" />
              <div className="flex flex-col">
                <span className="font-semibold text-foreground">{categoryCounts.all || 33} Bots</span>
                <span className="text-[10px] text-muted-foreground">7 Categories</span>
              </div>
            </div>
          </div>
        </div>

        {/* Search & Category Filter Bar */}
        <div className="mt-6 space-y-4 pt-4 border-t border-border/60">
          {/* Search Input */}
          <div className="relative max-w-xl">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search AI bots, capabilities, or starter prompts..."
              className="w-full rounded-xl border border-border bg-background/80 py-2.5 pl-10 pr-10 text-sm text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
                aria-label="Clear search"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto pb-1">
            {CATEGORIES.map((cat) => {
              const count = categoryCounts[cat.id] ?? 0;
              const isSelected = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all',
                    isSelected
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'bg-card/70 border border-border/80 text-muted-foreground hover:bg-accent hover:text-foreground'
                  )}
                >
                  <span>{cat.label}</span>
                  <span
                    className={cn(
                      'rounded-full px-1.5 py-0.2 text-[10px] font-mono',
                      isSelected ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-secondary text-muted-foreground'
                    )}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 2. FAVORITES SECTION (Shown when not actively searching/filtering) */}
      {/* ==================================================================== */}
      {!isFilteringOrSearching && favoriteBots.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
              <h2>My Favorites</h2>
              <span className="rounded-md bg-secondary px-2 py-0.5 text-[10px] text-muted-foreground font-mono">
                {favoriteBots.length}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {favoriteBots.map((bot) => (
              <BotCard
                key={`fav-${bot.id}`}
                bot={bot}
                onToggleFavorite={toggleFavorite}
                onOpenBot={recordBotUsage}
              />
            ))}
          </div>
        </section>
      )}

      {/* ==================================================================== */}
      {/* 3. RECENTLY USED SECTION (Shown when not actively searching/filtering) */}
      {/* ==================================================================== */}
      {!isFilteringOrSearching && recentBots.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <History className="h-4 w-4 text-primary" />
              <h2>Recently Used</h2>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {recentBots.slice(0, 3).map((bot) => (
              <BotCard
                key={`recent-${bot.id}`}
                bot={bot}
                compact
                onToggleFavorite={toggleFavorite}
                onOpenBot={recordBotUsage}
              />
            ))}
          </div>
        </section>
      )}

      {/* ==================================================================== */}
      {/* 4. ALL SPECIALIZED BOTS CATALOG */}
      {/* ==================================================================== */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <Bot className="h-4 w-4 text-primary" />
            <h2>
              {isFilteringOrSearching
                ? `Results (${filteredBots.length})`
                : 'All Specialized Assistants'}
            </h2>
          </div>

          {isFilteringOrSearching && (
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('all');
              }}
              className="text-xs text-primary hover:underline"
            >
              Reset filters
            </button>
          )}
        </div>

        {filteredBots.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-16 text-center">
            <Bot className="h-10 w-10 text-muted-foreground/40 mb-3" />
            <h3 className="text-base font-semibold text-foreground">No matching bots found</h3>
            <p className="mt-1 text-xs text-muted-foreground max-w-sm">
              Try searching with a different term, clear your filters, or browse all categories.
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('all');
              }}
              className="mt-4 rounded-lg bg-secondary px-4 py-2 text-xs font-medium text-foreground hover:bg-accent transition-colors"
            >
              Clear Search & Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredBots.map((bot) => (
              <BotCard
                key={bot.id}
                bot={bot}
                onToggleFavorite={toggleFavorite}
                onOpenBot={recordBotUsage}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
