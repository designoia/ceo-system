import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatMinutes(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
}

export function formatTimer(secondsRemaining: number): string {
  const mins = Math.floor(secondsRemaining / 60);
  const secs = secondsRemaining % 60;
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

export function getTodayDateString(timezone: string = 'Asia/Kolkata'): string {
  try {
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    return formatter.format(new Date()); // Returns 'YYYY-MM-DD'
  } catch {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }
}

export function getFormattedDate(timezone: string = 'Asia/Kolkata'): string {
  try {
    const now = new Date();
    return now.toLocaleDateString("en-US", {
      timeZone: timezone,
      weekday: "long",
      day: "numeric",
      month: "long",
    });
  } catch {
    const now = new Date();
    return now.toLocaleDateString("en-US", {
      weekday: "long",
      day: "numeric",
      month: "long",
    });
  }
}

export function getGreeting(timezone: string = 'Asia/Kolkata'): string {
  try {
    const hourStr = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      hour: 'numeric',
      hour12: false,
    }).format(new Date());
    const hour = parseInt(hourStr, 10);
    if (hour >= 4 && hour < 12) return "GOOD MORNING 👋";
    if (hour >= 12 && hour < 17) return "GOOD AFTERNOON 👋";
    if (hour >= 17 && hour < 22) return "GOOD EVENING 👋";
    return "NIGHT EXECUTION 🌙";
  } catch {
    const hour = new Date().getHours();
    if (hour >= 4 && hour < 12) return "GOOD MORNING 👋";
    if (hour >= 12 && hour < 17) return "GOOD AFTERNOON 👋";
    if (hour >= 17 && hour < 22) return "GOOD EVENING 👋";
    return "NIGHT EXECUTION 🌙";
  }
}

export function calculateDaysOverdue(scheduledDate: string | undefined, todayStr: string): number {
  if (!scheduledDate) return 1;
  const sched = new Date(scheduledDate);
  const today = new Date(todayStr);
  const diff = Math.floor((today.getTime() - sched.getTime()) / (1000 * 3600 * 24));
  return Math.max(diff, 1);
}

export function getCurrentTimeString(timezone: string = 'Asia/Kolkata'): string {
  try {
    const formatter = new Intl.DateTimeFormat('en-GB', {
      timeZone: timezone,
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
    return formatter.format(new Date());
  } catch {
    const now = new Date();
    const h = String(now.getHours()).padStart(2, '0');
    const m = String(now.getMinutes()).padStart(2, '0');
    return `${h}:${m}`;
  }
}

export function parseTimeToMinutes(timeStr: string): number {
  if (!timeStr) return 0;
  const [hStr, mStr] = timeStr.split(':');
  const h = parseInt(hStr, 10) || 0;
  const m = parseInt(mStr, 10) || 0;
  return h * 60 + m;
}

export function calculateMinutesBetween(startTime: string, endTime: string): number {
  if (!startTime || !endTime) return 0;
  const startMins = parseTimeToMinutes(startTime);
  let endMins = parseTimeToMinutes(endTime);
  if (endMins === 0 && (startTime.startsWith('23') || startTime.startsWith('22'))) {
    // Midnight rollover e.g. 23:15 to 00:00 (midnight = 24:00 = 1440 mins)
    endMins = 1440;
  } else if (endMins < startMins) {
    // Crosses midnight
    endMins += 1440;
  }
  return Math.max(0, endMins - startMins);
}

export function formatTime12Hour(timeStr: string): string {
  if (!timeStr) return '';
  const [hStr, mStr] = timeStr.split(':');
  let h = parseInt(hStr, 10) || 0;
  const m = mStr || '00';
  const ampm = h >= 12 && h < 24 ? 'PM' : 'AM';
  h = h % 12;
  if (h === 0) h = 12;
  return `${h}:${m} ${ampm}`;
}

export function addMinutesToTime(startTime: string, minutesToAdd: number): string {
  if (!startTime) return '00:00';
  const startMins = parseTimeToMinutes(startTime);
  const totalMins = (startMins + minutesToAdd) % 1440;
  const h = Math.floor(totalMins / 60);
  const m = totalMins % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function formatMinutesToTime(totalMins: number): string {
  const normalized = ((totalMins % 1440) + 1440) % 1440;
  const h = Math.floor(normalized / 60);
  const m = normalized % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}


