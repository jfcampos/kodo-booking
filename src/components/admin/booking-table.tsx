"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { adminCancelBooking } from "@/lib/actions/bookings";
import { format } from "date-fns";
import { ChevronRight } from "lucide-react";

type Booking = {
  id: string;
  title: string;
  startTime: Date;
  endTime: Date;
  cancelled: boolean;
  room: { name: string };
  user: { name: string | null; email: string };
};

function sortByDate(a: Booking, b: Booking) {
  return new Date(b.startTime).getTime() - new Date(a.startTime).getTime();
}

export function BookingTable({ bookings }: { bookings: Booking[] }) {
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

  function renderSection(
    label: string,
    items: Booking[],
    colorClass: string,
    canCancel: boolean,
    defaultOpen: boolean,
  ) {
    if (items.length === 0) return null;
    return (
      <details open={defaultOpen} className="group">
        <summary className={`flex items-center gap-2 cursor-pointer select-none rounded-lg px-3 py-2 ${colorClass}`}>
          <ChevronRight className="h-4 w-4 transition-transform group-open:rotate-90" />
          <span className="font-semibold">{label}</span>
          <span className="text-sm opacity-70">({items.length})</span>
        </summary>
        <div className="space-y-2 mt-2">
          {items.map((b) => renderCard(b, canCancel))}
        </div>
      </details>
    );
  }

  return (
    <div className="space-y-4">
      {renderSection(t("active"), active, "bg-green-500/10 text-green-700 dark:text-green-400", true, true)}
      {renderSection(t("past"), past, "bg-muted text-muted-foreground", true, false)}
      {renderSection(t("cancelled"), cancelled, "bg-red-500/10 text-red-700 dark:text-red-400", false, false)}
    </div>
  );
}
