'use client';

import { useCallback, useEffect, useState } from 'react';

const KEY = 'ceo_os_calendar_filter';

/** Which calendar (business) is being viewed: 'ALL' = the combined view. Remembered between visits. */
export function useCalendarFilter(): [string, (v: string) => void] {
  const [filter, setFilterState] = useState('ALL');

  useEffect(() => {
    try {
      const saved = localStorage.getItem(KEY);
      if (saved) setFilterState(saved);
    } catch {
      /* storage unavailable */
    }
  }, []);

  const setFilter = useCallback((v: string) => {
    setFilterState(v);
    try {
      localStorage.setItem(KEY, v);
    } catch {
      /* storage unavailable */
    }
  }, []);

  return [filter, setFilter];
}
