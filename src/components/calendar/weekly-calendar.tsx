"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
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
  user: { id: string; name: string | null; email: string };
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
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedRoomId, setSelectedRoomId] = useState(rooms[0]?.id ?? "");
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [dialogState, setDialogState] = useState<{
    open: boolean;
    mode: "create" | "view";
    startTime?: Date;
    endTime?: Date;
    booking?: Booking;
  }>({ open: false, mode: "create" });

  const { start: weekStart, end: weekEnd } = getWeekRange(currentDate);
  const days = getWeekDays(currentDate);

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
    <div className="space-y-4" role="region" aria-label="Weekly calendar">
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
          aria-label="Previous week"
          onClick={() => setCurrentDate(prevWeek(currentDate))}
        >
          Prev
        </Button>
        <span className="font-medium">
          {format(weekStart, "MMM d")} &ndash;{" "}
          {format(weekEnd, "MMM d, yyyy")}
        </span>
        <Button
          variant="outline"
          size="sm"
          aria-label="Next week"
          onClick={() => setCurrentDate(nextWeek(currentDate))}
        >
          Next
        </Button>
      </div>

      <div className="flex overflow-x-auto">
        <div className="w-14 flex-shrink-0">
          <div className="h-10 border-b" />
          {Array.from({ length: 24 }, (_, i) => (
            <div
              key={i}
              className="h-16 pr-2 text-right text-xs text-muted-foreground"
            >
              {String(i).padStart(2, "0")}:00
            </div>
          ))}
        </div>

        {days.map((day) => (
          <DayColumn
            key={day.toISOString()}
            date={day}
            bookings={getBookingSegmentsForDay(day)}
            currentUserId={currentUserId}
            granularityMinutes={granularityMinutes}
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
