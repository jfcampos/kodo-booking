"use client";

import { BookingBlock } from "./booking-block";
import { formatDayHeader } from "@/lib/utils";

type Booking = {
  id: string;
  title: string;
  startTime: Date;
  endTime: Date;
  user: { id: string; name: string | null };
};

type DayColumnProps = {
  date: Date;
  bookings: Booking[];
  currentUserId: string;
  granularityMinutes: number;
  onSlotClick: (date: Date, hour: number) => void;
  onBookingClick: (bookingId: string) => void;
};

export function DayColumn({
  date,
  bookings,
  currentUserId,
  granularityMinutes,
  onSlotClick,
  onBookingClick,
}: DayColumnProps) {
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const slotsPerHour = 60 / granularityMinutes;
  const isToday = new Date().toDateString() === date.toDateString();

  return (
    <div className="flex-1 min-w-0">
      <div
        className={`sticky top-0 z-10 border-b bg-background p-2 text-center text-sm font-medium ${
          isToday ? "text-primary" : ""
        }`}
      >
        {formatDayHeader(date)}
      </div>
      <div className="relative">
        {hours.map((hour) =>
          Array.from({ length: slotsPerHour }, (_, slotIdx) => (
            <div
              key={`${hour}-${slotIdx}`}
              className="h-16 border-b border-r cursor-pointer hover:bg-muted/50"
              onClick={() =>
                onSlotClick(
                  date,
                  hour + (slotIdx * granularityMinutes) / 60
                )
              }
            />
          ))
        )}
        {bookings.map((booking) => (
          <BookingBlock
            key={booking.id}
            title={booking.title}
            userName={booking.user.name ?? "Unknown"}
            startTime={new Date(booking.startTime)}
            endTime={new Date(booking.endTime)}
            isOwn={booking.user.id === currentUserId}
            onClick={() => onBookingClick(booking.id)}
          />
        ))}
      </div>
    </div>
  );
}
