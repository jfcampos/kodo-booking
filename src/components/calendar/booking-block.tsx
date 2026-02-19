"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { formatTime, formatHourRange, overlapsAlarmWindow } from "@/lib/utils";
import { AlertTriangle, Repeat } from "lucide-react";

type BookingBlockProps = {
  title: string;
  userName: string;
  startTime: Date;
  endTime: Date;
  displayStart: Date;
  displayEnd: Date;
  isOwn: boolean;
  isRecurring?: boolean;
  userColor: string;
  remPerHour: number;
  gridStartHour: number;
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
  isRecurring,
  userColor,
  remPerHour,
  gridStartHour,
  onClick,
}: BookingBlockProps) {
  const t = useTranslations("BookingDialog");
  const tBlock = useTranslations("BookingBlock");
  const startHour = displayStart.getHours() + displayStart.getMinutes() / 60;
  const duration =
    (displayEnd.getTime() - displayStart.getTime()) / (1000 * 60 * 60);
  const hasAlarmWarning = overlapsAlarmWindow(startTime, endTime);
  const [showWarning, setShowWarning] = useState(false);

  return (
    <div
      className="absolute left-0 right-0 mx-1"
      style={{
        top: `${(startHour - gridStartHour) * remPerHour}rem`,
        height: `${duration * remPerHour}rem`,
      }}
    >
      <button
        onClick={onClick}
        aria-label={`${title} by ${userName}, ${formatTime(startTime)}\u2013${formatTime(endTime)}`}
        className={`h-full w-full rounded px-1 py-0.5 sm:px-2 sm:py-1 text-[10px] sm:text-xs overflow-hidden text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
          isOwn ? "ring-1 ring-foreground/20" : ""
        }`}
        style={{
          backgroundColor: userColor,
          color: "#fff",
        }}
      >
        <div className="font-medium truncate flex items-center gap-1">
          {isRecurring && <Repeat className="h-3 w-3 flex-shrink-0" />}
          {title}
        </div>
        <div className="truncate opacity-75">{formatHourRange(startTime, endTime)}</div>
        <div className="truncate opacity-75">{userName}</div>
      </button>
      {hasAlarmWarning && (
        <div className="absolute top-0.5 right-1 group">
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setShowWarning((v) => !v); }}
            className="text-yellow-300 hover:text-yellow-100 drop-shadow"
            aria-label={tBlock("alarmWarningLabel")}
          >
            <AlertTriangle className="h-3.5 w-3.5" />
          </button>
          <div className="absolute right-0 top-5 z-20 w-48 rounded bg-yellow-600 px-2 py-1 text-xs text-white shadow-lg opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity">
            {t("alarmWarning")}
          </div>
          {showWarning && (
            <div className="absolute right-0 top-5 z-20 w-48 rounded bg-yellow-600 px-2 py-1 text-xs text-white shadow-lg">
              {t("alarmWarning")}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
