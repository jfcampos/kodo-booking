"use client";

import { useState, useEffect } from "react";
import { WeeklyCalendar } from "./weekly-calendar";
import { MonthlyCalendar } from "./monthly-calendar";

type CalendarViewProps = {
  rooms: { id: string; name: string }[];
  currentUserId: string;
  currentUserRole: string;
  granularityMinutes: number;
  maxBookingDurationHours: number;
};

export function CalendarView(props: CalendarViewProps) {
  const [viewMode, setViewMode] = useState<"weekly" | "monthly">(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem("cal-view-mode") as "weekly" | "monthly") || "weekly";
    }
    return "weekly";
  });

  useEffect(() => {
    function onStorage(e: StorageEvent) {
      if (e.key === "cal-view-mode" && e.newValue) {
        setViewMode(e.newValue as "weekly" | "monthly");
      }
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  if (viewMode === "monthly") {
    return <MonthlyCalendar {...props} />;
  }

  return <WeeklyCalendar {...props} />;
}
