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
};

export function WeeklyCalendar({
  rooms,
  currentUserId,
  currentUserRole,
  granularityMinutes,
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
    const endTime = new Date(
      startTime.getTime() + granularityMinutes * 60 * 1000
    );
    setDialogState({ open: true, mode: "create", startTime, endTime });
  }

  function handleBookingClick(bookingId: string) {
    const booking = bookings.find((b) => b.id === bookingId);
    if (booking) {
      setDialogState({ open: true, mode: "view", booking });
    }
  }

  function getBookingsForDay(date: Date) {
    return bookings.filter((b) => {
      const bookingDate = new Date(b.startTime).toDateString();
      return bookingDate === date.toDateString();
    });
  }

  return (
    <div className="space-y-4">
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
            bookings={getBookingsForDay(day)}
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
        endTime={dialogState.endTime}
        booking={dialogState.booking}
        currentUserId={currentUserId}
        currentUserRole={currentUserRole}
        granularityMinutes={granularityMinutes}
      />
    </div>
  );
}
