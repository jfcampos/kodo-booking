"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { RoomTabs } from "./room-tabs";
import { DayColumn } from "./day-column";
import { BookingDialog } from "./booking-dialog";
import { getWeekRange, getWeekDays, nextWeek, prevWeek } from "@/lib/utils";
import {
  getBookingsForWeek,
  getRecurringBookingsForWeek,
} from "@/lib/actions/bookings";
import { format } from "date-fns";

type Room = { id: string; name: string };
type Booking = {
  id: string;
  title: string;
  notes: string | null;
  startTime: Date;
  endTime: Date;
  user: { id: string; name: string | null; email: string; color: string };
  isRecurring?: boolean;
  recurringBookingId?: string;
  occurrenceDate?: string;
};

type WeeklyCalendarProps = {
  rooms: Room[];
  currentUserId: string;
  currentUserRole: string;
  granularityMinutes: number;
  maxBookingDurationHours: number;
};

export function WeeklyCalendar({
  rooms,
  currentUserId,
  currentUserRole,
  granularityMinutes,
  maxBookingDurationHours,
}: WeeklyCalendarProps) {
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
  const [displayGranularity, setDisplayGranularity] = useState(() => {
    if (typeof window !== "undefined") {
      return Number(localStorage.getItem("cal-resolution")) || 60;
    }
    return 60;
  });
  const [visibleBlocks, setVisibleBlocks] = useState<string[]>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("cal-visible-blocks");
      if (stored) return stored.split(",");
    }
    return ["dawn", "day", "night"];
  });
  const [dialogState, setDialogState] = useState<{
    open: boolean;
    mode: "create" | "view";
    startTime?: Date;
    endTime?: Date;
    booking?: Booking;
  }>({ open: false, mode: "create" });

  // Consume pending nav date on mount (set by monthly view before switching)
  useEffect(() => {
    const pending = localStorage.getItem("cal-nav-date");
    if (pending) {
      setCurrentDate(new Date(pending));
      localStorage.removeItem("cal-nav-date");
    }
  }, []);

  // Sync settings from header CalendarSettings popover
  useEffect(() => {
    function onStorage(e: StorageEvent) {
      if (e.key === "cal-resolution" && e.newValue) {
        setDisplayGranularity(Number(e.newValue));
      }
      if (e.key === "cal-slot-height" && e.newValue) {
        setSlotHeightRem(Number(e.newValue));
      }
      if (e.key === "cal-visible-blocks" && e.newValue) {
        setVisibleBlocks(e.newValue.split(","));
      }
      if (e.key === "cal-nav-date" && e.newValue) {
        setCurrentDate(new Date(e.newValue));
        localStorage.removeItem("cal-nav-date");
      }
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  // Compute visible hour ranges from active blocks
  const BLOCK_RANGES: Record<string, [number, number]> = {
    dawn: [0, 8],
    day: [8, 16],
    night: [16, 24],
  };
  const visibleRanges = ["dawn", "day", "night"]
    .filter((b) => visibleBlocks.includes(b))
    .map((b) => BLOCK_RANGES[b]);
  const gridStartHour = visibleRanges[0]?.[0] ?? 0;
  const gridEndHour = visibleRanges[visibleRanges.length - 1]?.[1] ?? 24;

  const { start: weekStart, end: weekEnd } = getWeekRange(currentDate);
  const days = getWeekDays(currentDate);

  const loadBookings = useCallback(async () => {
    if (!selectedRoomId) return;
    const [regular, recurring] = await Promise.all([
      getBookingsForWeek(selectedRoomId, weekStart, weekEnd),
      getRecurringBookingsForWeek(selectedRoomId, weekStart, weekEnd),
    ]);
    setBookings([...(regular as Booking[]), ...(recurring as Booking[])]);
  }, [selectedRoomId, weekStart.getTime(), weekEnd.getTime()]);

  useEffect(() => {
    loadBookings();
  }, [loadBookings]);

  function handleSlotClick(date: Date, hour: number) {
    if (currentUserRole === "VIEWER") return;
    const startTime = new Date(date);
    startTime.setHours(Math.floor(hour), (hour % 1) * 60, 0, 0);
    setDialogState({ open: true, mode: "create", startTime });
  }

  function handleBookingClick(bookingId: string) {
    const booking = bookings.find((b) => b.id === bookingId);
    if (booking) {
      setDialogState({ open: true, mode: "view", booking });
    }
  }


  function getBookingSegmentsForDay(date: Date) {
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayEnd.getDate() + 1);

    const visibleStart = new Date(dayStart);
    visibleStart.setHours(gridStartHour, 0, 0, 0);
    const visibleEnd = new Date(dayStart);
    visibleEnd.setHours(gridEndHour, 0, 0, 0);

    return bookings
      .filter((b) => {
        const start = new Date(b.startTime);
        const end = new Date(b.endTime);
        return start < visibleEnd && end > visibleStart;
      })
      .map((b) => {
        const start = new Date(b.startTime);
        const end = new Date(b.endTime);
        return {
          ...b,
          displayStart: start < visibleStart ? visibleStart : start,
          displayEnd: end > visibleEnd ? visibleEnd : end,
        };
      });
  }

  return (
    <div className="space-y-4" role="region" aria-label={t("title")}>
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
          aria-label={t("prevWeek")}
          onClick={() => setCurrentDate(prevWeek(currentDate))}
        >
          {t("prevWeek")}
        </Button>
        <span className="font-medium">
          {format(weekStart, "d MMM")} &ndash;{" "}
          {format(weekEnd, "d MMM, yyyy")}
        </span>
        <Button
          variant="outline"
          size="sm"
          aria-label={t("nextWeek")}
          onClick={() => setCurrentDate(nextWeek(currentDate))}
        >
          {t("nextWeek")}
        </Button>
      </div>

      <div className="flex">
        <div className="w-9 sm:w-14 flex-shrink-0">
          <div className="h-10 border-b" />
          {Array.from({ length: (gridEndHour - gridStartHour) * (60 / displayGranularity) }, (_, i) => {
            const totalMinutes = (gridStartHour * 60) + i * displayGranularity;
            const h = Math.floor(totalMinutes / 60);
            const m = totalMinutes % 60;
            return (
              <div
                key={i}
                style={{ height: `${slotHeightRem}rem` }}
                className="pr-0.5 sm:pr-2 text-right text-[10px] sm:text-xs text-muted-foreground"
              >
                {m === 0 ? `${h}:00` : ""}
              </div>
            );
          })}
        </div>

        {days.map((day) => (
          <DayColumn
            key={day.toISOString()}
            date={day}
            bookings={getBookingSegmentsForDay(day)}
            currentUserId={currentUserId}
            displayGranularity={displayGranularity}
            slotHeightRem={slotHeightRem}
            gridStartHour={gridStartHour}
            gridEndHour={gridEndHour}
            onSlotClick={handleSlotClick}
            onBookingClick={handleBookingClick}
          />
        ))}
      </div>

      <BookingDialog
        mode={dialogState.mode}
        open={dialogState.open}
        onOpenChange={(open) => {
          setDialogState((s) => ({ ...s, open }));
          if (!open) loadBookings();
        }}
        roomId={selectedRoomId}
        startTime={dialogState.startTime}
        booking={dialogState.booking}
        currentUserId={currentUserId}
        currentUserRole={currentUserRole}
        granularityMinutes={granularityMinutes}
        maxBookingDurationHours={maxBookingDurationHours}
      />
    </div>
  );
}
