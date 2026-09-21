'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  Sparkles,
  Send,
  Paperclip,
  Globe,
  Database,
  Star,
  Layers,
  Zap,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Info,
  Clock,
  Check,
} from 'lucide-react';
import { useAIStore } from '@/lib/ai/ai-store';
import { BotIcon } from '@/components/ai/BotIcon';
import { cn } from '@/lib/utils';
import { DESIGNOIA_MOTION } from '@/lib/motion';

export default function BotDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params?.slug as string;

  const { getBotBySlug, toggleFavorite, recordBotUsage, isLoaded } = useAIStore();
  const bot = getBotBySlug(slug);

  const [inputMessage, setInputMessage] = useState('');
  const [webSearchEnabled, setWebSearchEnabled] = useState(false);
  const [knowledgeEnabled, setKnowledgeEnabled] = useState(true);
  const [simulatedMessages, setSimulatedMessages] = useState<{ id: string; role: 'assistant' | 'user'; content: string; time: string }[]>([]);
  const [isCopied, setIsCopied] = useState(false);

  // Initialize toggles and usage record when bot loads
  useEffect(() => {
    if (bot) {
      setWebSearchEnabled(Boolean(bot.webSearchEnabled));
      setKnowledgeEnabled(Boolean(bot.knowledgeBaseEnabled));
      recordBotUsage(bot.slug);
    }
  }, [bot, recordBotUsage]);

  if (isLoaded && !bot) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary text-muted-foreground">
          <Info className="h-6 w-6" />
        </div>
        <h2 className="text-xl font-bold text-foreground">Bot Not Found</h2>
        <p className="text-sm text-muted-foreground max-w-sm">
          The requested AI assistant could not be found or has been deactivated.
        </p>
        <Link
          href="/ai"
          className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to AI Command Center</span>
        </Link>
      </div>
    );
  }

  if (!bot) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  const handleStarterClick = (prompt: string) => {
    setInputMessage(prompt);
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    const userText = inputMessage.trim();
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    setSimulatedMessages((prev) => [
      ...prev,
      { id: `user-${Date.now()}`, role: 'user', content: userText, time: timeStr },
    ]);
    setInputMessage('');
  };

  return (
    <div className="space-y-6 pb-12">
      {/* ==================================================================== */}
      {/* 1. TOP NAVIGATION & BOT HEADER */}
      {/* ==================================================================== */}
      <div className="flex items-center justify-between">
        <Link
          href="/ai"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to AI Command Center</span>
        </Link>

        <div className="flex items-center gap-2">
          <button
            onClick={() => toggleFavorite(bot.slug)}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors',
              bot.isFavorite
                ? 'border-amber-400/40 bg-amber-400/10 text-amber-400'
                : 'border-border bg-card text-muted-foreground hover:text-foreground'
            )}
          >
            <Star className={cn('h-3.5 w-3.5', bot.isFavorite && 'fill-amber-400')} />
            <span>{bot.isFavorite ? 'Favorited' : 'Favorite'}</span>
          </button>
        </div>
      </div>

      {/* Bot Identity Card Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-border bg-card/80 p-5 sm:p-6 backdrop-blur-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 border border-primary/20 text-primary">
              <BotIcon name={bot.icon} className="h-6 w-6" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight text-foreground">{bot.name}</h1>
                <span className="rounded-md bg-primary/10 border border-primary/20 px-2 py-0.5 text-[10px] font-semibold text-primary uppercase">
                  {bot.category}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground max-w-2xl">{bot.description}</p>
            </div>
          </div>

          {/* Quick Toggles: Web Research & CEO OS Knowledge */}
          <div className="flex flex-wrap items-center gap-2 sm:self-start">
            <button
              onClick={() => setKnowledgeEnabled(!knowledgeEnabled)}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors',
                knowledgeEnabled
                  ? 'border-primary/40 bg-primary/10 text-primary'
                  : 'border-border bg-secondary/50 text-muted-foreground hover:text-foreground'
              )}
              title="CEO OS workspace context integration"
            >
              <Database className="h-3.5 w-3.5" />
              <span>CEO OS Context</span>
              <span className={cn('h-1.5 w-1.5 rounded-full', knowledgeEnabled ? 'bg-primary' : 'bg-muted-foreground/40')} />
            </button>

            {bot.webSearchEnabled !== undefined && (
              <button
                onClick={() => setWebSearchEnabled(!webSearchEnabled)}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition-colors',
                  webSearchEnabled
                    ? 'border-cyan-400/40 bg-cyan-400/10 text-cyan-400'
                    : 'border-border bg-secondary/50 text-muted-foreground hover:text-foreground'
                )}
                title="Live web research capability"
              >
                <Globe className="h-3.5 w-3.5" />
                <span>Web Research</span>
                <span className={cn('h-1.5 w-1.5 rounded-full', webSearchEnabled ? 'bg-cyan-400' : 'bg-muted-foreground/40')} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* 2. MAIN WORKSPACE & SIDEBAR GRID */}
      {/* ==================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Main Conversation & Session Area (8 cols on desktop) */}
        <div className="lg:col-span-8 flex flex-col space-y-4">
          <div className="flex-1 rounded-2xl border border-border bg-card/50 p-5 min-h-[460px] flex flex-col justify-between backdrop-blur-sm">
            {/* Conversation Flow */}
            <div className="space-y-4">
              {/* Bot Welcome Message */}
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary/10 border border-primary/20 text-primary mt-1">
                  <BotIcon name={bot.icon} className="h-4 w-4" />
                </div>
                <div className="space-y-3 flex-1">
                  <div className="rounded-2xl rounded-tl-sm bg-secondary/70 border border-border p-4 text-sm text-foreground leading-relaxed whitespace-pre-line">
                    {bot.welcomeMessage}
                  </div>

                  {/* Conversation Starters */}
                  {bot.conversationStarters && bot.conversationStarters.length > 0 && (
                    <div className="space-y-2 pt-1">
                      <div className="text-[11px] font-medium text-muted-foreground flex items-center gap-1.5">
                        <Sparkles className="h-3.5 w-3.5 text-primary" />
                        <span>Suggested Conversation Starters:</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {bot.conversationStarters.map((starter, i) => (
                          <button
                            key={`starter-${i}`}
                            onClick={() => handleStarterClick(starter)}
                            className="rounded-xl border border-border bg-card/80 px-3 py-2 text-xs font-medium text-foreground hover:border-primary/50 hover:bg-primary/5 hover:text-primary transition-all text-left"
                          >
                            &ldquo;{starter}&rdquo;
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* User Sent Messages (Simulated Phase 1 Session) */}
              {simulatedMessages.map((msg) => (
                <div key={msg.id} className="flex items-start justify-end gap-3 pt-2">
                  <div className="rounded-2xl rounded-tr-sm bg-primary px-4 py-2.5 text-sm text-primary-foreground max-w-lg leading-relaxed shadow-sm">
                    {msg.content}
                    <div className="mt-1 text-[10px] text-primary-foreground/70 text-right">{msg.time}</div>
                  </div>
                </div>
              ))}

              {/* Execution Assistant Flow Notice */}
              <div className="rounded-xl border border-primary/20 bg-primary/5 p-3.5 text-xs text-muted-foreground flex items-start gap-3">
                <Info className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <span className="font-semibold text-foreground">CEO OS Execution Assistant</span>
                  <p className="text-[11px] leading-relaxed">
                    This assistant follows the <strong>Think → Analyze → Create → Review → Execute</strong> flow.
                    Outputs can generate native CEO OS Goals, Projects, and Tasks with your confirmation.
                  </p>
                </div>
              </div>
            </div>

            {/* Message Composer Shell */}
            <form onSubmit={handleSendMessage} className="mt-6 pt-4 border-t border-border/60">
              <div className="relative flex flex-col rounded-xl border border-border bg-background/90 p-2 focus-within:border-primary focus-within:ring-1 focus-within:ring-primary transition-colors">
                <textarea
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage(e);
                    }
                  }}
                  rows={3}
                  placeholder={`Ask ${bot.name} or type a prompt...`}
                  className="w-full resize-none bg-transparent px-2 py-1 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none"
                />

                <div className="flex items-center justify-between pt-2 px-1 border-t border-border/40">
                  <div className="flex items-center gap-1.5 text-muted-foreground text-xs">
                    <button
                      type="button"
                      title="Attach file or context"
                      className="rounded-lg p-1.5 hover:bg-secondary hover:text-foreground transition-colors"
                    >
                      <Paperclip className="h-4 w-4" />
                    </button>
                    <span className="text-[10px] text-muted-foreground/70 hidden sm:inline">
                      Press Enter to send, Shift+Enter for new line
                    </span>
                  </div>

                  <button
                    type="submit"
                    disabled={!inputMessage.trim()}
                    className={cn(
                      'inline-flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all',
                      inputMessage.trim()
                        ? 'bg-primary text-primary-foreground shadow-sm hover:bg-primary/90'
                        : 'bg-secondary text-muted-foreground cursor-not-allowed opacity-60'
                    )}
                  >
                    <span>Send</span>
                    <Send className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>

        {/* Desktop Right Sidebar: Bot Information & Capabilities (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          {/* Capabilities Card */}
          <div className="rounded-2xl border border-border bg-card/60 p-5 space-y-4 backdrop-blur-sm">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <Zap className="h-4 w-4 text-primary" />
              <span>Capabilities</span>
            </h3>

            {bot.capabilities && bot.capabilities.length > 0 ? (
              <ul className="space-y-2">
                {bot.capabilities.map((cap, i) => (
                  <li key={`cap-${i}`} className="flex items-start gap-2 text-xs text-foreground">
                    <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                    <span>{cap}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-muted-foreground">General business assistance</p>
            )}
          </div>

          {/* Available Output Actions Card */}
          <div className="rounded-2xl border border-border bg-card/60 p-5 space-y-4 backdrop-blur-sm">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <Layers className="h-4 w-4 text-primary" />
              <span>Available CEO OS Actions</span>
            </h3>

            {bot.outputActions && bot.outputActions.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {bot.outputActions.map((action, i) => (
                  <span
                    key={`act-${i}`}
                    className="inline-flex items-center rounded-md border border-border bg-secondary/60 px-2 py-1 text-[10px] font-mono font-medium text-foreground"
                  >
                    {action.replace(/_/g, ' ')}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">Standard text analysis</p>
            )}
          </div>

          {/* Example Use Cases Card */}
          {bot.exampleUseCases && bot.exampleUseCases.length > 0 && (
            <div className="rounded-2xl border border-border bg-card/60 p-5 space-y-3 backdrop-blur-sm">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <HelpCircle className="h-4 w-4 text-primary" />
                <span>Example Use Cases</span>
              </h3>
              <ul className="space-y-2">
                {bot.exampleUseCases.map((useCase, i) => (
                  <li key={`use-${i}`} className="text-xs text-muted-foreground leading-relaxed pl-2 border-l-2 border-primary/30">
                    {useCase}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
