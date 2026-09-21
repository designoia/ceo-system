'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { AIBot, AIBotCategory } from '../types';
import { INITIAL_AI_BOTS } from './bot-catalog';

const STORAGE_KEYS = {
  FAVORITES: 'ceo_os_ai_favorites_v1',
  RECENTS: 'ceo_os_ai_recents_v1',
};

export interface BotUsageRecord {
  slug: string;
  lastUsedAt: string; // ISO string
}

export function formatRelativeTime(isoString?: string): string {
  if (!isoString) return 'Not used yet';
  try {
    const timestamp = new Date(isoString).getTime();
    if (Number.isNaN(timestamp)) return 'Recently';
    const diffSeconds = Math.floor((Date.now() - timestamp) / 1000);

    if (diffSeconds < 60) return 'Just now';
    if (diffSeconds < 3600) {
      const mins = Math.floor(diffSeconds / 60);
      return `${mins}m ago`;
    }
    if (diffSeconds < 86400) {
      const hours = Math.floor(diffSeconds / 3600);
      return hours === 1 ? '1 hour ago' : `${hours} hours ago`;
    }
    if (diffSeconds < 172800) return 'Yesterday';
    const days = Math.floor(diffSeconds / 86400);
    return `${days} days ago`;
  } catch {
    return 'Recently';
  }
}

export function useAIStore() {
  const [bots, setBots] = useState<AIBot[]>(INITIAL_AI_BOTS);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [recentUsages, setRecentUsages] = useState<BotUsageRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<AIBotCategory | 'all'>('all');
  const [isLoaded, setIsLoaded] = useState(false);

  // Load favorites and recents from localStorage on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const storedFavs = localStorage.getItem(STORAGE_KEYS.FAVORITES);
      if (storedFavs) {
        setFavorites(JSON.parse(storedFavs));
      } else {
        // Seed default favorites for a great first-run experience
        setFavorites(['strategy-creator', 'market-research', 'sop-creator']);
      }

      const storedRecents = localStorage.getItem(STORAGE_KEYS.RECENTS);
      if (storedRecents) {
        setRecentUsages(JSON.parse(storedRecents));
      } else {
        // Seed default recent timestamps
        const now = Date.now();
        setRecentUsages([
          { slug: 'market-research', lastUsedAt: new Date(now - 7200000).toISOString() }, // 2 hours ago
          { slug: 'strategy-creator', lastUsedAt: new Date(now - 86400000).toISOString() }, // Yesterday
          { slug: 'sop-creator', lastUsedAt: new Date(now - 259200000).toISOString() }, // 3 days ago
        ]);
      }
    } catch (e) {
      console.error('Failed to load AI bot state from localStorage', e);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Save favorites to localStorage
  useEffect(() => {
    if (!isLoaded || typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEYS.FAVORITES, JSON.stringify(favorites));
    } catch (e) {
      console.error('Failed to save favorites', e);
    }
  }, [favorites, isLoaded]);

  // Save recents to localStorage
  useEffect(() => {
    if (!isLoaded || typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEYS.RECENTS, JSON.stringify(recentUsages));
    } catch (e) {
      console.error('Failed to save recent usages', e);
    }
  }, [recentUsages, isLoaded]);

  // Optional: Try fetching remote bot configurations if Supabase is connected
  useEffect(() => {
    if (typeof window === 'undefined') return;
    fetch('/api/ai/bots')
      .then((res) => {
        if (res.ok) return res.json();
        return null;
      })
      .then((data) => {
        if (data?.bots && Array.isArray(data.bots) && data.bots.length > 0) {
          setBots(data.bots);
        }
      })
      .catch(() => {
        // Fallback gracefully to INITIAL_AI_BOTS
      });
  }, []);

  const toggleFavorite = useCallback((slug: string) => {
    setFavorites((prev) => {
      if (prev.includes(slug)) {
        return prev.filter((s) => s !== slug);
      } else {
        return [...prev, slug];
      }
    });
  }, []);

  const recordBotUsage = useCallback((slug: string) => {
    setRecentUsages((prev) => {
      const now = new Date().toISOString();
      const filtered = prev.filter((r) => r.slug !== slug);
      return [{ slug, lastUsedAt: now }, ...filtered].slice(0, 10);
    });
  }, []);

  const getBotBySlug = useCallback(
    (slug: string): AIBot | undefined => {
      const found = bots.find((b) => b.slug === slug);
      if (!found) return undefined;
      const recent = recentUsages.find((r) => r.slug === slug);
      return {
        ...found,
        isFavorite: favorites.includes(slug),
        lastUsedAt: recent?.lastUsedAt,
      };
    },
    [bots, favorites, recentUsages]
  );

  // Enriched bots list with favorite & last used metadata
  const enrichedBots = useMemo(() => {
    const recentMap = new Map(recentUsages.map((r) => [r.slug, r.lastUsedAt]));
    const favSet = new Set(favorites);

    return bots.map((bot) => ({
      ...bot,
      isFavorite: favSet.has(bot.slug),
      lastUsedAt: recentMap.get(bot.slug),
    }));
  }, [bots, favorites, recentUsages]);

  // Filtered bots based on search & category
  const filteredBots = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return enrichedBots.filter((bot) => {
      const matchesCategory = selectedCategory === 'all' || bot.category === selectedCategory;
      if (!matchesCategory) return false;

      if (!query) return true;

      const nameMatch = bot.name.toLowerCase().includes(query);
      const descMatch = bot.description.toLowerCase().includes(query);
      const catMatch = bot.category.toLowerCase().includes(query);
      const starterMatch = bot.conversationStarters.some((s) => s.toLowerCase().includes(query));

      return nameMatch || descMatch || catMatch || starterMatch;
    });
  }, [enrichedBots, searchQuery, selectedCategory]);

  // Favorite bots list
  const favoriteBots = useMemo(() => {
    return enrichedBots.filter((bot) => bot.isFavorite);
  }, [enrichedBots]);

  // Recently used bots list
  const recentBots = useMemo(() => {
    const recentSlugs = recentUsages.map((r) => r.slug);
    const botMap = new Map(enrichedBots.map((b) => [b.slug, b]));
    const result: AIBot[] = [];
    for (const slug of recentSlugs) {
      const found = botMap.get(slug);
      if (found) {
        result.push(found);
      }
    }
    return result.slice(0, 6);
  }, [enrichedBots, recentUsages]);

  // Category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: enrichedBots.length };
    for (const b of enrichedBots) {
      counts[b.category] = (counts[b.category] || 0) + 1;
    }
    return counts;
  }, [enrichedBots]);

  return {
    bots: enrichedBots,
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
    getBotBySlug,
    isLoaded,
  };
}
