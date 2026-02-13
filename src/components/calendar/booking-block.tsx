"use client";

import { formatTime } from "@/lib/utils";

type BookingBlockProps = {
  title: string;
  userName: string;
  startTime: Date;
  endTime: Date;
  displayStart: Date;
  displayEnd: Date;
  isOwn: boolean;
  remPerHour: number;
  onClick: () => void;
};

export function BookingBlock({
  title,
  userName,
  startTime,
  endTime,
  displayStart,
  displayEnd,
  isOwn,
  remPerHour,
  onClick,
}: BookingBlockProps) {
  const startHour = displayStart.getHours() + displayStart.getMinutes() / 60;
  const duration =
    (displayEnd.getTime() - displayStart.getTime()) / (1000 * 60 * 60);

  return (
    <button
      onClick={onClick}
      aria-label={`${title} by ${userName}, ${formatTime(startTime)}\u2013${formatTime(endTime)}`}
      className={`absolute left-0 right-0 mx-1 rounded px-2 py-1 text-xs overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
        isOwn
          ? "bg-primary text-primary-foreground"
          : "bg-muted text-muted-foreground"
      }`}
      style={{
        top: `${startHour * remPerHour}rem`,
        height: `${duration * remPerHour}rem`,
      }}
    >
      <div className="font-medium truncate">{title}</div>
      <div className="truncate opacity-75">{userName}</div>
    </button>
  );
}
