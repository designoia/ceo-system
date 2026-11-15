'use client';

import { getTodayDateString } from '@/lib/utils';
import { useStore } from '@/lib/store';

/** Today's date (YYYY-MM-DD) in the user's timezone. */
export function useToday() {
  const { settings } = useStore();
  return getTodayDateString(settings.timezone || 'Asia/Kolkata');
}
