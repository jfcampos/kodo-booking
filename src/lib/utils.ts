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
