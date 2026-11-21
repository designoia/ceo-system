'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Check, Copy, LayoutPanelTop } from 'lucide-react';

/** How to put a "Today" widget and quick shortcuts on a phone home screen or a desktop. */
export function WidgetCard() {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/widget`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard blocked — the Open button still works */
    }
  };

  return (
    <section className="surface-1 rounded-2xl border border-border p-5" aria-label="Widget and shortcuts">
      <div className="mb-3 flex items-center gap-2">
        <LayoutPanelTop className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-bold">Today widget &amp; shortcuts</h3>
      </div>
      <p className="mb-3 text-sm text-muted-foreground">A small “Today” screen: tick tasks off and add new ones without opening the whole app. Pin it where you can reach it in one tap.</p>

      <div className="mb-4 flex flex-wrap gap-2">
        <Link href="/widget" className="flex min-h-[44px] items-center rounded-xl bg-primary px-4 text-sm font-bold text-primary-foreground">
          Open Today widget
        </Link>
        <button onClick={copy} className="flex min-h-[44px] items-center gap-2 rounded-xl border border-border px-4 text-sm font-semibold">
          {copied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
          {copied ? 'Link copied' : 'Copy link'}
        </button>
      </div>

      <div className="grid gap-4 text-[13px] leading-snug sm:grid-cols-2">
        <div>
          <div className="mb-1 font-bold">On your phone</div>
          <ol className="list-decimal space-y-1 pl-5 text-foreground/90">
            <li>Open the Today widget in Chrome.</li>
            <li>Tap ⋮ → <b>Add to Home screen</b>.</li>
            <li>Long-press the CEO OS icon for quick actions: <b>Add task</b>, <b>Today</b>, <b>Calendar</b>, <b>Tasks</b>.</li>
          </ol>
        </div>
        <div>
          <div className="mb-1 font-bold">On your computer</div>
          <ol className="list-decimal space-y-1 pl-5 text-foreground/90">
            <li>Open the Today widget in Chrome or Edge.</li>
            <li>⋮ → <b>Save and share → Create shortcut…</b> and tick <b>Open as window</b>. Pin it to the taskbar and keep it beside your work.</li>
            <li>If you installed the app, right-click its icon for the same quick actions.</li>
          </ol>
        </div>
      </div>
      <p className="mt-3 text-xs text-muted-foreground">Quick actions appear after the app updates; if you don’t see them, remove and add the home-screen icon again.</p>
    </section>
  );
}
