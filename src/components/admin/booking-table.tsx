"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { adminCancelBooking } from "@/lib/actions/bookings";
import { format } from "date-fns";

type Booking = {
  id: string;
  title: string;
  startTime: Date;
  endTime: Date;
  cancelled: boolean;
  room: { name: string };
  user: { name: string | null; email: string };
};

export function BookingTable({ bookings }: { bookings: Booking[] }) {
  const router = useRouter();
  const t = useTranslations("AdminBookings");
  const tc = useTranslations("Common");
  const [loading, setLoading] = useState<string | null>(null);

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

  return (
    <div className="space-y-3">
      {bookings.map((b) => {
        const isCancelled = b.cancelled;
        const isPast = new Date(b.endTime) < new Date();
        const canCancel = !isCancelled;

        return (
          <div key={b.id} className="rounded-lg border p-3 space-y-1.5">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="font-medium truncate">{b.title}</p>
                <p className="text-sm text-muted-foreground truncate">
                  {b.user.name ?? b.user.email} &middot; {b.room.name}
                </p>
              </div>
              <Badge
                variant={isCancelled ? "secondary" : isPast ? "outline" : "default"}
                className="shrink-0"
              >
                {isCancelled ? t("cancelled") : isPast ? t("past") : t("active")}
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              {format(new Date(b.startTime), "d MMM HH:mm")} &ndash;{" "}
              {format(new Date(b.endTime), "HH:mm")}
            </p>
            {canCancel && (
              <Button
                variant="destructive"
                size="sm"
                className="w-full"
                onClick={() => handleCancel(b.id)}
                disabled={loading === b.id}
              >
                {tc("cancel")}
              </Button>
            )}
          </div>
        );
      })}
    </div>
  );
}
