import { ScheduleEntry, SmartTimeSlot, Task } from '@/lib/types';
import { parseTimeToMinutes, formatMinutesToTime, calculateMinutesBetween } from '@/lib/utils';

export interface ConflictCheckResult {
  hasConflict: boolean;
  overlappingEntries: ScheduleEntry[];
  conflictMessage?: string;
}

/**
 * Check if a proposed start and end time on a given date conflicts with existing schedule entries / calendar events
 */
export function checkScheduleConflict(
  date: string,
  startTime: string,
  endTime: string,
  existingEntries: ScheduleEntry[],
  excludeEntryId?: string
): ConflictCheckResult {
  const startMin = parseTimeToMinutes(startTime);
  const endMin = parseTimeToMinutes(endTime);
  // Handle cross-midnight end time (e.g. 23:15 to 00:00)
  const effectiveEndMin = endMin <= startMin ? endMin + 1440 : endMin;

  const dayEntries = existingEntries.filter(
    (e) => e.date === date && (!excludeEntryId || e.id !== excludeEntryId) && e.status !== 'CANCELLED'
  );

  const overlapping: ScheduleEntry[] = [];

  for (const entry of dayEntries) {
    const eStart = parseTimeToMinutes(entry.plannedStartTime);
    const eEnd = parseTimeToMinutes(entry.plannedEndTime);
    const effectiveEEnd = eEnd <= eStart ? eEnd + 1440 : eEnd;

    // Standard interval overlap check: startA < endB && endA > startB
    if (startMin < effectiveEEnd && effectiveEndMin > eStart) {
      overlapping.push(entry);
    }
  }

  if (overlapping.length > 0) {
    const titles = overlapping.map((o) => `"${o.title}" (${o.plannedStartTime}–${o.plannedEndTime})`).join(', ');
    return {
      hasConflict: true,
      overlappingEntries: overlapping,
      conflictMessage: `Overlaps with ${titles}`,
    };
  }

  return {
    hasConflict: false,
    overlappingEntries: [],
  };
}

/**
 * Find Smart Free Slots for scheduling a task on a given date
 * Considers external commitments (School, Tuition, Appointments), CEO Block, and buffer.
 */
export function findSmartFreeSlots(
  date: string,
  task: Task,
  existingEntries: ScheduleEntry[],
  ceoBlockStart: string = '23:15',
  ceoBlockEnd: string = '00:00',
  dailyCapacityMinutes: number = 45
): SmartTimeSlot[] {
  const duration = task.estimatedMinutes || 45;
  const slots: SmartTimeSlot[] = [];

  // Filter active entries for this date
  const dayEntries = existingEntries
    .filter((e) => e.date === date && e.status !== 'CANCELLED')
    .map((e) => ({
      start: parseTimeToMinutes(e.plannedStartTime),
      end: (() => {
        const em = parseTimeToMinutes(e.plannedEndTime);
        const sm = parseTimeToMinutes(e.plannedStartTime);
        return em <= sm ? em + 1440 : em;
      })(),
      entry: e,
    }))
    .sort((a, b) => a.start - b.start);

  // Candidate standard windows to evaluate:
  // 1. CEO Block: 23:15 - 00:00 (1395 - 1440 min)
  // 2. Evening Prime: 18:30 - 19:15 / 19:15 - 20:00 (1110 - 1200 min)
  // 3. Late Night Focus: 22:30 - 23:15 (1350 - 1395 min)
  // 4. Afternoon Free Slot: 16:30 - 17:15 (990 - 1035 min)

  const candidateStarts = [
    { time: ceoBlockStart, label: '★ CEO Work Block (Recommended)', isCeoBlock: true },
    { time: '22:30', label: 'Late Evening Focus' },
    { time: '19:00', label: 'Evening Free Window' },
    { time: '18:30', label: 'Pre-Dinner Window' },
    { time: '12:00', label: 'Midday Block' },
    { time: '09:00', label: 'Morning Slot' },
  ];

  for (const cand of candidateStarts) {
    const cStartMin = parseTimeToMinutes(cand.time);
    const cEndMin = (cStartMin + duration) % 1440;
    const cEndTime = formatMinutesToTime(cEndMin);
    const effectiveEndMin = cStartMin + duration;

    // Check if overlaps any existing entry
    let hasOverlap = false;
    let overlapName = '';
    for (const de of dayEntries) {
      if (cStartMin < de.end && effectiveEndMin > de.start) {
        hasOverlap = true;
        overlapName = de.entry.title;
        break;
      }
    }

    if (!hasOverlap) {
      const isRec = Boolean(cand.isCeoBlock || (task.isMustWin && cand.time === ceoBlockStart));
      slots.push({
        id: `slot-${date}-${cand.time}`,
        date,
        startTime: cand.time,
        endTime: cEndTime,
        durationMinutes: duration,
        label: cand.label,
        isRecommended: isRec,
      });
    }
  }

  // If no standard candidate was completely free, search intervals between scheduled entries
  if (slots.length === 0) {
    let cursor = 8 * 60; // start 08:00 AM
    const endOfDay = 24 * 60; // 00:00 midnight

    for (const de of dayEntries) {
      if (de.start - cursor >= duration + 15) { // 15 min buffer
        const sTime = formatMinutesToTime(cursor + 10);
        const eTime = formatMinutesToTime((cursor + 10 + duration) % 1440);
        slots.push({
          id: `slot-gap-${date}-${sTime}`,
          date,
          startTime: sTime,
          endTime: eTime,
          durationMinutes: duration,
          label: 'Free Gap Window',
          isRecommended: slots.length === 0,
        });
      }
      cursor = Math.max(cursor, de.end);
    }

    if (endOfDay - cursor >= duration) {
      const sTime = formatMinutesToTime(cursor);
      const eTime = formatMinutesToTime((cursor + duration) % 1440);
      slots.push({
        id: `slot-gap-${date}-${sTime}`,
        date,
        startTime: sTime,
        endTime: eTime,
        durationMinutes: duration,
        label: 'End of Day Window',
        isRecommended: slots.length === 0,
      });
    }
  }

  // Ensure at least 1 recommended slot
  if (slots.length > 0 && !slots.some((s) => s.isRecommended)) {
    slots[0].isRecommended = true;
  }

  return slots.slice(0, 4);
}
