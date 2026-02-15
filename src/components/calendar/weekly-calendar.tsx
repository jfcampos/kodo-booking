"use client";

import { useState, useEffect, useCallback } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RoomTabs } from "./room-tabs";
import { DayColumn } from "./day-column";
import { BookingDialog } from "./booking-dialog";
import { getWeekRange, getWeekDays, nextWeek, prevWeek } from "@/lib/utils";
import {
  getBookingsForWeek,
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
  const [dialogState, setDialogState] = useState<{
    open: boolean;
    mode: "create" | "view";
    startTime?: Date;
    endTime?: Date;
    booking?: Booking;
  }>({ open: false, mode: "create" });

  const { start: weekStart, end: weekEnd } = getWeekRange(currentDate);
  const days = getWeekDays(currentDate);

  const SLOT_HEIGHT_OPTIONS = [
    { value: "2", label: t("compact") },
    { value: "3", label: t("medium") },
    { value: "4", label: t("default") },
    { value: "5", label: t("tall") },
    { value: "6", label: t("extraTall") },
  ];

  const RESOLUTION_OPTIONS = [
    { value: "15", label: "15 min" },
    { value: "30", label: "30 min" },
    { value: "60", label: "1 hora" },
  ];

  const loadBookings = useCallback(async () => {
    if (!selectedRoomId) return;
    const data = await getBookingsForWeek(selectedRoomId, weekStart, weekEnd);
    setBookings(data as Booking[]);
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

    return bookings
      .filter((b) => {
        const start = new Date(b.startTime);
        const end = new Date(b.endTime);
        return start < dayEnd && end > dayStart;
      })
      .map((b) => {
        const start = new Date(b.startTime);
        const end = new Date(b.endTime);
        return {
          ...b,
          displayStart: start < dayStart ? dayStart : start,
          displayEnd: end > dayEnd ? dayEnd : end,
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

      <div className="flex items-center gap-4 text-sm">
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">{t("resolution")}</span>
          <Select
            value={String(displayGranularity)}
            onValueChange={(v) => {
              const val = Number(v);
              setDisplayGranularity(val);
              localStorage.setItem("cal-resolution", v);
            }}
          >
            <SelectTrigger className="w-24 h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {RESOLUTION_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">{t("zoom")}</span>
          <Select
            value={String(slotHeightRem)}
            onValueChange={(v) => {
              const val = Number(v);
              setSlotHeightRem(val);
              localStorage.setItem("cal-slot-height", v);
            }}
          >
            <SelectTrigger className="w-28 h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SLOT_HEIGHT_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex overflow-x-auto">
        <div className="w-14 flex-shrink-0">
          <div className="h-10 border-b" />
          {Array.from({ length: 24 * (60 / displayGranularity) }, (_, i) => {
            const totalMinutes = i * displayGranularity;
            const h = Math.floor(totalMinutes / 60);
            const m = totalMinutes % 60;
            return (
              <div
                key={i}
                style={{ height: `${slotHeightRem}rem` }}
                className="pr-2 text-right text-xs text-muted-foreground"
              >
                {m === 0 ? `${String(h).padStart(2, "0")}:00` : ""}
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
