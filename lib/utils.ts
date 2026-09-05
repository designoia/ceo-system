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
