import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import {
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  addWeeks,
  subWeeks,
  addMonths,
  subMonths,
  eachDayOfInterval,
  format,
  setDefaultOptions,
} from "date-fns";
import { es } from "date-fns/locale";

setDefaultOptions({ locale: es });

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

export function getMonthRange(date: Date) {
  const monthStart = startOfMonth(date);
  const monthEnd = endOfMonth(date);
  const start = startOfWeek(monthStart, { weekStartsOn: 1 });
  const end = endOfWeek(monthEnd, { weekStartsOn: 1 });
  return { start, end };
}

export function getMonthDays(date: Date) {
  const { start, end } = getMonthRange(date);
  return eachDayOfInterval({ start, end });
}

export function nextMonth(date: Date) {
  return addMonths(date, 1);
}

export function prevMonth(date: Date) {
  return subMonths(date, 1);
}

export function formatTime(date: Date) {
  return format(date, "HH:mm");
}

export function formatHourRange(start: Date, end: Date) {
  const fmt = (d: Date) =>
    d.getMinutes() === 0 ? `${d.getHours()}` : `${d.getHours()}:${String(d.getMinutes()).padStart(2, "0")}`;
  return `${fmt(start)}-${fmt(end)}h`;
}

export function contrastText(hex: string): string {
  const c = hex.replace("#", "");
  const r = parseInt(c.substring(0, 2), 16);
  const g = parseInt(c.substring(2, 4), 16);
  const b = parseInt(c.substring(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.55 ? "#000000" : "#ffffff";
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export function formatDayHeader(date: Date) {
  return capitalize(format(date, "EEE d"));
}

export function formatDayHeaderShortParts(date: Date) {
  return { day: capitalize(format(date, "EEEEE")), num: format(date, "d") };
}

const ALARM_START = 1; // 1am
const ALARM_END = 8;   // 8am

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
