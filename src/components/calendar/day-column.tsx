"use client";

import { BookingBlock } from "./booking-block";
import { formatDayHeader, formatDayHeaderShortParts } from "@/lib/utils";

type Booking = {
  id: string;
  title: string;
  startTime: Date;
  endTime: Date;
  displayStart: Date;
  displayEnd: Date;
  user: { id: string; name: string | null; color: string };
  isRecurring?: boolean;
};

type DayColumnProps = {
  date: Date;
  bookings: Booking[];
  currentUserId: string;
  displayGranularity: number;
  slotHeightRem: number;
  onSlotClick: (date: Date, hour: number) => void;
  onBookingClick: (bookingId: string) => void;
};

export function DayColumn({
  date,
  bookings,
  currentUserId,
  displayGranularity,
  slotHeightRem,
  onSlotClick,
  onBookingClick,
}: DayColumnProps) {
  const totalSlots = 24 * (60 / displayGranularity);
  const isToday = new Date().toDateString() === date.toDateString();
  const remPerHour = slotHeightRem * (60 / displayGranularity);

  return (
    <div className="flex-1 min-w-0" role="columnheader">
      <div
        className={`sticky top-0 z-10 h-10 sm:h-10 flex items-center justify-center border-b px-0.5 text-xs sm:text-sm font-medium ${
          isToday ? "bg-primary/5" : "bg-background"
        }`}
      >
        {isToday ? (
          <>
            <span className="sm:hidden flex flex-col items-center leading-tight text-[10px] font-semibold text-primary">
              <span>{formatDayHeaderShortParts(date).day}</span>
              <span className="inline-flex items-center justify-center size-6 rounded-full bg-primary text-primary-foreground">
                {formatDayHeaderShortParts(date).num}
              </span>
            </span>
            <span className="hidden sm:inline-flex sm:items-center sm:justify-center sm:rounded-full sm:bg-primary sm:text-primary-foreground sm:px-2.5 sm:py-0.5 sm:text-sm sm:font-semibold">
              {formatDayHeader(date)}
            </span>
          </>
        ) : (
          <>
            <span className="sm:hidden flex flex-col items-center leading-tight text-[10px]">
              <span>{formatDayHeaderShortParts(date).day}</span>
              <span>{formatDayHeaderShortParts(date).num}</span>
            </span>
            <span className="hidden sm:inline">{formatDayHeader(date)}</span>
          </>
        )}
      </div>
      <div className={`relative ${isToday ? "bg-primary/5" : ""}`} role="group" aria-label={formatDayHeader(date)}>
        {Array.from({ length: totalSlots }, (_, i) => {
          const totalMinutes = i * displayGranularity;
          const h = Math.floor(totalMinutes / 60);
          const m = totalMinutes % 60;
          const slotTime = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
          const hour = totalMinutes / 60;
          return (
            <div
              key={i}
              role="button"
              tabIndex={0}
              aria-label={`Book ${formatDayHeader(date)} at ${slotTime}`}
              style={{ height: `${slotHeightRem}rem` }}
              className="border-b border-r cursor-pointer hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              onClick={() => onSlotClick(date, hour)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onSlotClick(date, hour);
                }
              }}
            />
          );
        })}
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
            isRecurring={booking.isRecurring}
            userColor={booking.user.color}
            remPerHour={remPerHour}
            onClick={() => onBookingClick(booking.id)}
          />
        ))}
      </div>
    </div>
  );
}
