'use client';

import React, { useEffect, useState } from 'react';

/**
 * Draws its children in the browser only.
 *
 * Everything inside a page depends on data saved on this device and on today's date, so a pre-built
 * (server) copy is always wrong — it shows the build day's date, greeting and "today". Rendering after
 * mount avoids React's hydration mismatch errors and a flash of stale dates.
 */
export function ClientOnly({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return <div className="min-h-[60vh]" aria-busy="true" />;
  return <>{children}</>;
}
