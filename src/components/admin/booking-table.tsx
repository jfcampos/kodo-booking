"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { adminCancelBooking, cancelRecurringSeries } from "@/lib/actions/bookings";
import { format } from "date-fns";
import { ChevronRight, Repeat } from "lucide-react";

type Booking = {
  id: string;
  title: string;
  startTime: Date;
  endTime: Date;
  cancelled: boolean;
  room: { name: string };
  user: { name: string | null; email: string };
};

type RecurringBooking = {
  id: string;
  title: string;
  dayOfWeek: number;
  startMinutes: number;
  endMinutes: number;
  cancelled: boolean;
  room: { name: string };
  user: { name: string | null; email: string };
};

function sortByDate(a: Booking, b: Booking) {
  return new Date(b.startTime).getTime() - new Date(a.startTime).getTime();
}

const DAY_NAMES = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

function formatMinutes(m: number) {
  const h = Math.floor(m / 60);
  const min = m % 60;
  return `${h}:${String(min).padStart(2, "0")}`;
}

export function BookingTable({
  bookings,
  recurringBookings,
}: {
  bookings: Booking[];
  recurringBookings: RecurringBooking[];
}) {
  const router = useRouter();
  const t = useTranslations("AdminBookings");
  const tc = useTranslations("Common");
  const [loading, setLoading] = useState<string | null>(null);

  const { active, past, cancelled } = useMemo(() => {
    const now = new Date();
    const active: Booking[] = [];
    const past: Booking[] = [];
    const cancelled: Booking[] = [];

    for (const b of bookings) {
      if (b.cancelled) {
        cancelled.push(b);
      } else if (new Date(b.endTime) < now) {
        past.push(b);
      } else {
        active.push(b);
      }
    }

    active.sort(sortByDate);
    past.sort(sortByDate);
    cancelled.sort(sortByDate);

    return { active, past, cancelled };
  }, [bookings]);

  const { activeRecurring, cancelledRecurring } = useMemo(() => {
    const activeRecurring: RecurringBooking[] = [];
    const cancelledRecurring: RecurringBooking[] = [];
    for (const r of recurringBookings) {
      if (r.cancelled) cancelledRecurring.push(r);
      else activeRecurring.push(r);
    }
    return { activeRecurring, cancelledRecurring };
  }, [recurringBookings]);

  async function handleCancel(id: string) {
    if (!confirm(t("confirmCancel"))) return;
    setLoading(id);
    try {
      const result = await adminCancelBooking(id);
      if (result && "error" in result) return;
      router.refresh();
    } finally {
      setLoading(null);
    }
  }

  async function handleCancelRecurring(id: string) {
    if (!confirm(t("confirmCancel"))) return;
    setLoading(id);
    try {
      const result = await cancelRecurringSeries(id);
      if (result && "error" in result) return;
      router.refresh();
    } finally {
      setLoading(null);
    }
  }

  function renderCard(b: Booking, canCancel: boolean) {
    return (
      <div key={b.id} className="rounded-lg border p-3 flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className="font-medium truncate">{b.title}</p>
          <p className="text-sm text-muted-foreground truncate">
            {b.user.name ?? b.user.email} &middot; {b.room.name}
          </p>
          <p className="text-xs text-muted-foreground">
            {format(new Date(b.startTime), "d MMM HH:mm")} &ndash;{" "}
            {format(new Date(b.endTime), "HH:mm")}
          </p>
        </div>
        {canCancel && (
          <Button
            variant="ghost"
            size="sm"
            className="shrink-0 text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={() => handleCancel(b.id)}
            disabled={loading === b.id}
          >
            {tc("cancel")}
          </Button>
        )}
      </div>
    );
  }

  function renderRecurringCard(r: RecurringBooking, canCancel: boolean) {
    return (
      <div key={r.id} className="rounded-lg border p-3 flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className="font-medium truncate flex items-center gap-1.5">
            <Repeat className="h-3.5 w-3.5 text-primary shrink-0" />
            {r.title}
          </p>
          <p className="text-sm text-muted-foreground truncate">
            {r.user.name ?? r.user.email} &middot; {r.room.name}
          </p>
          <p className="text-xs text-muted-foreground">
            {DAY_NAMES[r.dayOfWeek]} {formatMinutes(r.startMinutes)} &ndash; {formatMinutes(r.endMinutes)}
          </p>
        </div>
        {canCancel && (
          <Button
            variant="ghost"
            size="sm"
            className="shrink-0 text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={() => handleCancelRecurring(r.id)}
            disabled={loading === r.id}
          >
            {tc("cancel")}
          </Button>
        )}
      </div>
    );
  }

  function renderSection(
    label: string,
    colorClass: string,
    defaultOpen: boolean,
    children: React.ReactNode,
    count: number,
  ) {
    if (count === 0) return null;
    return (
      <details open={defaultOpen} className="group">
        <summary className={`flex items-center gap-2 cursor-pointer select-none rounded-lg px-3 py-2 ${colorClass}`}>
          <ChevronRight className="h-4 w-4 transition-transform group-open:rotate-90" />
          <span className="font-semibold">{label}</span>
          <span className="text-sm opacity-70">({count})</span>
        </summary>
        <div className="space-y-2 mt-2">
          {children}
        </div>
      </details>
    );
  }

  return (
    <div className="space-y-4">
      {renderSection(
        t("active"),
        "bg-green-500/10 text-green-700 dark:text-green-400",
        true,
        <>
          {activeRecurring.map((r) => renderRecurringCard(r, true))}
          {active.map((b) => renderCard(b, true))}
        </>,
        active.length + activeRecurring.length,
      )}
      {renderSection(
        t("past"),
        "bg-muted text-muted-foreground",
        false,
        <>{past.map((b) => renderCard(b, true))}</>,
        past.length,
      )}
      {renderSection(
        t("cancelled"),
        "bg-red-500/10 text-red-700 dark:text-red-400",
        false,
        <>
          {cancelledRecurring.map((r) => renderRecurringCard(r, false))}
          {cancelled.map((b) => renderCard(b, false))}
        </>,
        cancelled.length + cancelledRecurring.length,
      )}
    </div>
  );
}
