import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import {
  startOfWeek,
  endOfWeek,
  addWeeks,
  subWeeks,
  eachDayOfInterval,
  format,
} from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getWeekRange(date: Date) {
  const start = startOfWeek(date, { weekStartsOn: 1 });
  const end = endOfWeek(date, { weekStartsOn: 1 });
  return { start, end };
}

export function getWeekDays(date: Date) {
  const { start, end } = getWeekRange(date);
  return eachDayOfInterval({ start, end });
}

export function nextWeek(date: Date) {
  return addWeeks(date, 1);
}

export function prevWeek(date: Date) {
  return subWeeks(date, 1);
}

export function formatTime(date: Date) {
  return format(date, "HH:mm");
}

export function formatDayHeader(date: Date) {
  return format(date, "EEE d");
}

const ALARM_START = 1; // 1am
const ALARM_END = 8;   // 8am
export const ALARM_WARNING = "The security alarm will be armed between 1am and 8am.";

export function overlapsAlarmWindow(start: Date, end: Date): boolean {
  const startH = start.getHours() + start.getMinutes() / 60;
  const endH = end.getHours() + end.getMinutes() / 60;
  const sameDay = start.toDateString() === end.toDateString();

  if (sameDay) {
    return startH < ALARM_END && endH > ALARM_START;
  }
  // Crosses midnight: day 1 [startH,24] or day 2 [0,endH]
  return startH < ALARM_END || endH > ALARM_START;
}
