"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { RoomTabs } from "./room-tabs";
import {
  getMonthRange,
  getMonthDays,
  nextMonth,
  prevMonth,
  formatHourRange,
  contrastText,
} from "@/lib/utils";
import {
  getBookingsForWeek,
  getRecurringBookingsForWeek,
} from "@/lib/actions/bookings";
import { format, isSameMonth, isToday, isBefore, startOfDay } from "date-fns";

type Room = { id: string; name: string };
type Booking = {
  id: string;
  title: string;
  startTime: Date;
  endTime: Date;
  user: { id: string; name: string | null; email: string; color: string };
};

type MonthlyCalendarProps = {
  rooms: Room[];
  currentUserId: string;
  currentUserRole: string;
  granularityMinutes: number;
  maxBookingDurationHours: number;
};

const DAY_LABELS = ["L", "M", "X", "J", "V", "S", "D"];

export function MonthlyCalendar({
  rooms,
  currentUserId,
  currentUserRole,
  granularityMinutes,
  maxBookingDurationHours,
}: MonthlyCalendarProps) {
  const t = useTranslations("Calendar");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedRoomId, setSelectedRoomId] = useState(rooms[0]?.id ?? "");
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [slotHeightRem, setSlotHeightRem] = useState(() => {
    if (typeof window !== "undefined") {
      return Number(localStorage.getItem("cal-slot-height")) || 3;
    }
    return 3;
  });

  useEffect(() => {
    function onStorage(e: StorageEvent) {
      if (e.key === "cal-slot-height" && e.newValue) {
        setSlotHeightRem(Number(e.newValue));
      }
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const { start: gridStart, end: gridEnd } = getMonthRange(currentDate);
  const days = getMonthDays(currentDate);

  const loadBookings = useCallback(async () => {
    if (!selectedRoomId) return;
    const [regular, recurring] = await Promise.all([
      getBookingsForWeek(selectedRoomId, gridStart, gridEnd),
      getRecurringBookingsForWeek(selectedRoomId, gridStart, gridEnd),
    ]);
    setBookings([...(regular as Booking[]), ...(recurring as Booking[])]);
  }, [selectedRoomId, gridStart.getTime(), gridEnd.getTime()]);

  useEffect(() => {
    loadBookings();
  }, [loadBookings]);

  function getBookingsForDay(date: Date) {
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayEnd.getDate() + 1);

    return bookings.filter((b) => {
      const start = new Date(b.startTime);
      const end = new Date(b.endTime);
      return start < dayEnd && end > dayStart;
    });
  }

  function handleDayClick(date: Date) {
    localStorage.setItem("cal-nav-date", date.toISOString());
    window.dispatchEvent(
      new StorageEvent("storage", {
        key: "cal-nav-date",
        newValue: date.toISOString(),
      })
    );
    localStorage.setItem("cal-view-mode", "weekly");
    window.dispatchEvent(
      new StorageEvent("storage", {
        key: "cal-view-mode",
        newValue: "weekly",
      })
    );
  }

  const weeks: Date[][] = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }

  return (
    <div className="space-y-4" role="region" aria-label={t("monthlyTitle")}>
      {rooms.length > 1 && (
        <RoomTabs
          rooms={rooms}
          selectedRoomId={selectedRoomId}
          onSelect={setSelectedRoomId}
        />
      )}

      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          size="sm"
          aria-label={t("prevMonth")}
          onClick={() => setCurrentDate(prevMonth(currentDate))}
        >
          {t("prevMonth")}
        </Button>
        <span className="font-medium capitalize">
          {format(currentDate, "MMMM yyyy")}
        </span>
        <Button
          variant="outline"
          size="sm"
          aria-label={t("nextMonth")}
          onClick={() => setCurrentDate(nextMonth(currentDate))}
        >
          {t("nextMonth")}
        </Button>
      </div>

      <div className="border rounded-lg overflow-hidden">
        {/* Day-of-week header */}
        <div className="grid grid-cols-7 border-b bg-muted/50">
          {DAY_LABELS.map((label) => (
            <div
              key={label}
              className="text-center text-xs font-medium text-muted-foreground py-2"
            >
              {label}
            </div>
          ))}
        </div>

        {/* Week rows */}
        {weeks.map((week, wi) => (
          <div key={wi} className="grid grid-cols-7 border-b last:border-b-0">
            {week.map((day) => {
              const dayBookings = getBookingsForDay(day);
              const inMonth = isSameMonth(day, currentDate);
              const today = isToday(day);
              const isPast = isBefore(day, startOfDay(new Date())) && !today;

              return (
                <button
                  key={day.toISOString()}
                  type="button"
                  onClick={() => handleDayClick(day)}
                  style={{ minHeight: `${slotHeightRem * 2.5}rem` }}
                  className={`relative p-1 sm:p-2 border-r last:border-r-0 transition-colors hover:bg-muted/50 flex flex-col items-center ${
                    !inMonth || isPast ? "opacity-40" : ""
                  } ${today ? "bg-primary/5" : ""}`}
                >
                  <span
                    className={`text-xs sm:text-sm font-medium ${
                      today
                        ? "bg-primary text-primary-foreground rounded-full w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center"
                        : ""
                    }`}
                  >
                    {format(day, "d")}
                  </span>

                  {/* Booking indicators */}
                  <div className="mt-1 space-y-0.5 w-full">
                    {/* Mobile: dots */}
                    <div className="flex gap-0.5 flex-wrap sm:hidden">
                      {dayBookings.slice(0, 5).map((b) => (
                        <div
                          key={b.id}
                          className="w-1.5 h-1.5 rounded-full"
                          style={{ backgroundColor: b.user.color }}
                        />
                      ))}
                      {dayBookings.length > 5 && (
                        <span className="text-[8px] text-muted-foreground">
                          +{dayBookings.length - 5}
                        </span>
                      )}
                    </div>

                    {/* Desktop: circle + time + title */}
                    <div className="hidden sm:flex sm:flex-col sm:gap-0.5">
                      {dayBookings.slice(0, 3).map((b) => (
                        <div
                          key={b.id}
                          className="flex items-center gap-1 text-[10px] leading-tight truncate text-left"
                        >
                          <span
                            className="w-2 h-2 rounded-full flex-shrink-0"
                            style={{ backgroundColor: b.user.color }}
                          />
                          <span className="text-muted-foreground">{formatHourRange(new Date(b.startTime), new Date(b.endTime))}</span>
                          <span className="truncate">{b.title}</span>
                        </div>
                      ))}
                      {dayBookings.length > 3 && (
                        <span className="text-[10px] text-muted-foreground text-left">
                          +{dayBookings.length - 3}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
