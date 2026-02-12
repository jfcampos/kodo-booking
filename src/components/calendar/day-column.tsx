"use client";

import { BookingBlock } from "./booking-block";
import { formatDayHeader } from "@/lib/utils";

type Booking = {
  id: string;
  title: string;
  startTime: Date;
  endTime: Date;
  displayStart: Date;
  displayEnd: Date;
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

  function formatSlotTime(hour: number, slotIdx: number) {
    const h = Math.floor(hour + (slotIdx * granularityMinutes) / 60);
    const m = (slotIdx * granularityMinutes) % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  }

  return (
    <div className="flex-1 min-w-[100px]" role="columnheader">
      <div
        className={`sticky top-0 z-10 border-b bg-background p-2 text-center text-sm font-medium ${
          isToday ? "text-primary" : ""
        }`}
      >
        {formatDayHeader(date)}
      </div>
      <div className="relative" role="group" aria-label={formatDayHeader(date)}>
        {hours.map((hour) =>
          Array.from({ length: slotsPerHour }, (_, slotIdx) => {
            const slotTime = formatSlotTime(hour, slotIdx);
            return (
              <div
                key={`${hour}-${slotIdx}`}
                role="button"
                tabIndex={0}
                aria-label={`Book ${formatDayHeader(date)} at ${slotTime}`}
                className="h-16 border-b border-r cursor-pointer hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                onClick={() =>
                  onSlotClick(
                    date,
                    hour + (slotIdx * granularityMinutes) / 60
                  )
                }
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onSlotClick(
                      date,
                      hour + (slotIdx * granularityMinutes) / 60
                    );
                  }
                }}
              />
            );
          })
        )}
        {bookings.map((booking) => (
          <BookingBlock
            key={`${booking.id}-${new Date(booking.displayStart).toISOString()}`}
            title={booking.title}
            userName={booking.user.name ?? "Unknown"}
            startTime={new Date(booking.startTime)}
            endTime={new Date(booking.endTime)}
            displayStart={new Date(booking.displayStart)}
            displayEnd={new Date(booking.displayEnd)}
            isOwn={booking.user.id === currentUserId}
            onClick={() => onBookingClick(booking.id)}
          />
        ))}
      </div>
    </div>
  );
}
