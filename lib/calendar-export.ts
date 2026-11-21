/**
 * "Add to calendar": turn a task into a calendar entry for the phone's calendar app or Google Calendar.
 * Tasks have a day but no time, so they become all-day events.
 */

export interface CalendarEntryInput {
  title: string;
  /** YYYY-MM-DD */
  date: string;
  notes?: string;
  checklist?: string[];
  calendarName?: string;
  /** Stable id so re-importing the same task updates it instead of duplicating it. */
  uid: string;
}

const compact = (ymd: string) => ymd.replace(/-/g, '');

/** The day after `ymd` (all-day events end the day AFTER they start). */
export function nextDay(ymd: string): string {
  const [y, m, d] = ymd.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + 1));
  return `${dt.getUTCFullYear()}-${String(dt.getUTCMonth() + 1).padStart(2, '0')}-${String(dt.getUTCDate()).padStart(2, '0')}`;
}

export function describeEntry(e: CalendarEntryInput): string {
  const lines: string[] = [];
  if (e.notes?.trim()) lines.push(e.notes.trim());
  if (e.checklist && e.checklist.length > 0) {
    lines.push('', 'Checklist:', ...e.checklist.map((c) => `- ${c}`));
  }
  if (e.calendarName) lines.push('', `Calendar: ${e.calendarName}`);
  lines.push('', 'Added from CEO OS');
  return lines.join('\n').trim();
}

export function googleCalendarUrl(e: CalendarEntryInput): string {
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: e.title,
    dates: `${compact(e.date)}/${compact(nextDay(e.date))}`,
    details: describeEntry(e),
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

const escapeIcs = (s: string) => s.replace(/\\/g, '\\\\').replace(/;/g, '\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');

/** RFC 5545 says lines over 75 octets are folded onto a continuation line that starts with one space. */
function fold(line: string): string {
  const enc = new TextEncoder();
  if (enc.encode(line).length <= 75) return line;
  const out: string[] = [];
  let cur = '';
  let curBytes = 0;
  let limit = 75;
  for (const ch of Array.from(line)) {
    const b = enc.encode(ch).length;
    if (curBytes + b > limit) {
      out.push(cur);
      cur = '';
      curBytes = 0;
      limit = 74; // continuation lines carry a leading space
    }
    cur += ch;
    curBytes += b;
  }
  out.push(cur);
  return out.join('\r\n ');
}

export function buildIcs(e: CalendarEntryInput, now: Date = new Date()): string {
  const stamp = now.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//CEO OS//Tasks//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${e.uid}@ceo-os`,
    `DTSTAMP:${stamp}`,
    `DTSTART;VALUE=DATE:${compact(e.date)}`,
    `DTEND;VALUE=DATE:${compact(nextDay(e.date))}`,
    `SUMMARY:${escapeIcs(e.title)}`,
    `DESCRIPTION:${escapeIcs(describeEntry(e))}`,
    'TRANSP:TRANSPARENT',
    'END:VEVENT',
    'END:VCALENDAR',
  ];
  return lines.map(fold).join('\r\n') + '\r\n';
}

export const icsFileName = (title: string) => `${title.replace(/[^\w\- ]+/g, '').trim().replace(/\s+/g, '-').slice(0, 40) || 'task'}.ics`;

/** Browser-only: hands the .ics to the phone/desktop, which offers to open it in the calendar app. */
export function downloadIcs(e: CalendarEntryInput): void {
  const blob = new Blob([buildIcs(e)], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = icsFileName(e.title);
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
