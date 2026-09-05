'use client';

import React from 'react';

export function CardSkeleton({ className = '' }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-2xl border border-border/60 bg-card/40 p-5 ${className}`}
    >
      <div className="flex items-center justify-between">
        <div className="h-4 w-24 rounded bg-muted/60" />
        <div className="h-4 w-12 rounded bg-muted/40" />
      </div>
      <div className="mt-4 h-6 w-3/4 rounded bg-muted/80" />
      <div className="mt-2 h-3 w-1/2 rounded bg-muted/40" />
    </div>
  );
}

export function TaskRowSkeleton() {
  return (
    <div className="animate-pulse flex items-center justify-between rounded-2xl border border-border/60 bg-card/40 p-4">
      <div className="flex items-center gap-3 flex-1">
        <div className="h-5 w-5 rounded-full bg-muted/60 shrink-0" />
        <div className="space-y-2 flex-1">
          <div className="flex items-center gap-2">
            <div className="h-3 w-14 rounded bg-muted/50" />
            <div className="h-3 w-10 rounded bg-muted/40" />
          </div>
          <div className="h-4 w-3/5 rounded bg-muted/70" />
        </div>
      </div>
      <div className="h-8 w-20 rounded-xl bg-muted/50 shrink-0" />
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Must win skeleton */}
      <div className="animate-pulse rounded-3xl border border-primary/20 bg-card/60 p-6 sm:p-8">
        <div className="h-4 w-32 rounded bg-primary/20 mb-4" />
        <div className="h-8 w-4/5 rounded bg-muted/80 mb-3" />
        <div className="h-4 w-1/2 rounded bg-muted/40 mb-6" />
        <div className="flex gap-3">
          <div className="h-10 w-28 rounded-xl bg-primary/30" />
          <div className="h-10 w-28 rounded-xl bg-muted/50" />
        </div>
      </div>

      {/* Grid skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
      </div>

      {/* Task list skeleton */}
      <div className="space-y-3">
        <div className="h-4 w-28 rounded bg-muted/60 mb-2" />
        <TaskRowSkeleton />
        <TaskRowSkeleton />
        <TaskRowSkeleton />
      </div>
    </div>
  );
}

export function TasksPageSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-4 w-28 rounded bg-primary/20" />
          <div className="h-8 w-48 rounded bg-muted/80" />
        </div>
        <div className="h-10 w-28 rounded-xl bg-primary/30" />
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="h-8 w-24 rounded-xl bg-muted/40 shrink-0" />
        ))}
      </div>

      <div className="space-y-3">
        <TaskRowSkeleton />
        <TaskRowSkeleton />
        <TaskRowSkeleton />
        <TaskRowSkeleton />
      </div>
    </div>
  );
}
