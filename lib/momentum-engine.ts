import { Task, MomentumStats } from './types';
import { getTodayDateString } from './utils';

const MILESTONES = [1, 3, 7, 14, 30, 60, 100];

/**
 * Converts a UTC timestamp (or ISO string) to a YYYY-MM-DD date string in the given timezone.
 */
export function getDateStringInTimezone(isoDateString: string, timezone: string = 'Asia/Kolkata'): string {
  try {
    const date = new Date(isoDateString);
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    return formatter.format(date); // outputs YYYY-MM-DD
  } catch {
    return isoDateString.split('T')[0];
  }
}

/**
 * Calculates previous day date string given a YYYY-MM-DD.
 */
function getPreviousDayDateString(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number);
  const d = new Date(Date.UTC(year, month - 1, day));
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().split('T')[0];
}

/**
 * Calculates consecutive days between two YYYY-MM-DD strings.
 */
function isConsecutiveDay(earlierDateStr: string, laterDateStr: string): boolean {
  return getPreviousDayDateString(laterDateStr) === earlierDateStr;
}

/**
 * Real, data-driven Momentum calculation from legitimate task completion timestamps.
 */
export function calculateMomentum(tasks: Task[], timezone: string = 'Asia/Kolkata'): MomentumStats {
  // 1. Filter legitimate completed tasks (non-deleted, valid completedAt)
  const qualifyingTasks = tasks.filter(t => t.status === 'DONE' && t.completedAt && !t.isDeleted);

  if (qualifyingTasks.length === 0) {
    return {
      currentStreak: 0,
      bestStreak: 0,
      completedDates: [],
      todayCompletedCount: 0,
      completedToday: false,
      qualifyingDaysCount: 0,
      totalCompletedTasks: 0,
      isMilestone: false,
    };
  }

  // 2. Extract unique completed calendar dates in user's timezone
  const dateSet = new Set<string>();
  qualifyingTasks.forEach(t => {
    if (t.completedAt) {
      dateSet.add(getDateStringInTimezone(t.completedAt, timezone));
    }
  });

  const sortedDates = Array.from(dateSet).sort(); // chronological: oldest to newest
  const todayStr = getTodayDateString(timezone);
  const yesterdayStr = getPreviousDayDateString(todayStr);

  const todayCompletedCount = qualifyingTasks.filter(t => 
    t.completedAt && getDateStringInTimezone(t.completedAt, timezone) === todayStr
  ).length;
  const completedToday = todayCompletedCount > 0;

  // 3. Calculate Current Streak
  let currentStreak = 0;
  const dateLookup = new Set(sortedDates);

  if (dateLookup.has(todayStr)) {
    // Current streak ending today
    currentStreak = 1;
    let checkDate = getPreviousDayDateString(todayStr);
    while (dateLookup.has(checkDate)) {
      currentStreak++;
      checkDate = getPreviousDayDateString(checkDate);
    }
  } else if (dateLookup.has(yesterdayStr)) {
    // Current streak ending yesterday (today still active, streak intact)
    currentStreak = 1;
    let checkDate = getPreviousDayDateString(yesterdayStr);
    while (dateLookup.has(checkDate)) {
      currentStreak++;
      checkDate = getPreviousDayDateString(checkDate);
    }
  } else {
    // No activity today or yesterday -> Streak is 0
    currentStreak = 0;
  }

  // 4. Calculate Best Streak (All-Time Longest Consecutive Sequence)
  let bestStreak = 0;
  if (sortedDates.length > 0) {
    let currentRun = 1;
    bestStreak = 1;

    for (let i = 1; i < sortedDates.length; i++) {
      if (isConsecutiveDay(sortedDates[i - 1], sortedDates[i])) {
        currentRun++;
        if (currentRun > bestStreak) {
          bestStreak = currentRun;
        }
      } else {
        currentRun = 1;
      }
    }
  }

  // Best streak must always be at least current streak
  bestStreak = Math.max(bestStreak, currentStreak);

  // 5. Milestone detection
  const isMilestone = MILESTONES.includes(currentStreak) && todayCompletedCount > 0;

  return {
    currentStreak,
    bestStreak,
    completedDates: sortedDates,
    todayCompletedCount,
    completedToday,
    qualifyingDaysCount: sortedDates.length,
    totalCompletedTasks: qualifyingTasks.length,
    isMilestone,
    milestoneDays: isMilestone ? currentStreak : undefined,
    milestoneValue: isMilestone ? currentStreak : null,
  };
}
