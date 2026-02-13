"use client";

import { useState, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  createBooking,
  createRecurringBooking,
  cancelBooking,
  editBooking,
} from "@/lib/actions/bookings";
import { formatTime, overlapsAlarmWindow, ALARM_WARNING } from "@/lib/utils";
import { AlertTriangle } from "lucide-react";

type BookingDialogProps = {
  mode: "create" | "view";
  open: boolean;
  onOpenChange: (open: boolean) => void;
  roomId: string;
  startTime?: Date;
  booking?: {
    id: string;
    title: string;
    notes: string | null;
    startTime: Date;
    endTime: Date;
    user: { id: string; name: string | null };
  };
  currentUserId: string;
  currentUserRole: string;
  granularityMinutes: number;
  maxBookingDurationHours: number;
};

export function BookingDialog({
  mode,
  open,
  onOpenChange,
  roomId,
  startTime,
  booking,
  currentUserId,
  currentUserRole,
  granularityMinutes,
  maxBookingDurationHours,
}: BookingDialogProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedStartTime, setSelectedStartTime] = useState<string>("");
  const [selectedEndTime, setSelectedEndTime] = useState<string>("");
  const [recurrenceWeeks, setRecurrenceWeeks] = useState<string>("0");

  // yyyy-mm-dd in local time for the date input
  const defaultDateStr = useMemo(() => {
    if (!startTime) return "";
    const y = startTime.getFullYear();
    const m = String(startTime.getMonth() + 1).padStart(2, "0");
    const d = String(startTime.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }, [startTime]);

  const activeDate = selectedDate || defaultDateStr;

  const { startTimeOptions, snappedStartIso } = useMemo(() => {
    if (!activeDate) return { startTimeOptions: [], snappedStartIso: "" };
    const options: { value: string; label: string }[] = [];
    const granMs = granularityMinutes * 60 * 1000;
    const [y, m, d] = activeDate.split("-").map(Number);
    const dayStart = new Date(y, m - 1, d, 0, 0, 0, 0);
    const slotsPerDay = Math.floor((24 * 60) / granularityMinutes);
    let snapped = "";
    const clickedMs = startTime?.getTime() ?? 0;
    for (let i = 0; i < slotsPerDay; i++) {
      const slot = new Date(dayStart.getTime() + i * granMs);
      const iso = slot.toISOString();
      options.push({ value: iso, label: formatTime(slot) });
      if (!snapped && slot.getTime() >= clickedMs) {
        snapped = iso;
      }
    }
    // If date changed from clicked day, default to first slot
    const fallback = options[0]?.value || "";
    return { startTimeOptions: options, snappedStartIso: snapped || fallback };
  }, [activeDate, startTime, granularityMinutes]);

  const resolvedStartTime =
    selectedStartTime ? new Date(selectedStartTime)
    : snappedStartIso ? new Date(snappedStartIso)
    : startTime;

  const endTimeOptions = useMemo(() => {
    if (!resolvedStartTime) return [];
    const options: { value: string; label: string }[] = [];
    const maxMs = maxBookingDurationHours * 60 * 60 * 1000;
    const granMs = granularityMinutes * 60 * 1000;
    const slots = Math.floor(maxMs / granMs);
    for (let i = 1; i <= slots; i++) {
      const end = new Date(resolvedStartTime.getTime() + i * granMs);
      options.push({
        value: end.toISOString(),
        label: formatTime(end),
      });
    }
    return options;
  }, [resolvedStartTime, granularityMinutes, maxBookingDurationHours]);

  const isOwn = booking?.user.id === currentUserId;
  const isAdmin = currentUserRole === "ADMIN";
  const canEdit = isOwn || isAdmin;
  const canCancel =
    canEdit && booking && new Date(booking.startTime) > new Date();

  const defaultEndTimeIndex = useMemo(() => {
    if (endTimeOptions.length === 0) return 0;
    const defaultDurationMs = 2 * 60 * 60 * 1000;
    const granMs = granularityMinutes * 60 * 1000;
    const targetIndex = Math.round(defaultDurationMs / granMs) - 1;
    return Math.min(targetIndex, endTimeOptions.length - 1);
  }, [endTimeOptions, granularityMinutes]);

  const resolvedEndTime =
    selectedEndTime ? new Date(selectedEndTime)
    : endTimeOptions.length > 0 ? new Date(endTimeOptions[defaultEndTimeIndex].value)
    : undefined;

  async function handleCreate(formData: FormData) {
    if (!resolvedStartTime || !resolvedEndTime) return;
    setLoading(true);
    setError(null);
    try {
      const base = {
        title: formData.get("title") as string,
        notes: (formData.get("notes") as string) || undefined,
        roomId,
        startTime: resolvedStartTime,
        endTime: resolvedEndTime,
      };
      const weeks = Number(recurrenceWeeks);
      if (weeks > 0) {
        await createRecurringBooking({ ...base, recurrenceWeeks: weeks });
      } else {
        await createBooking(base);
      }
      onOpenChange(false);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to create booking"
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleCancel() {
    if (!booking || !confirm("Cancel this booking?")) return;
    setLoading(true);
    try {
      await cancelBooking(booking.id);
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to cancel");
    } finally {
      setLoading(false);
    }
  }

  async function handleEdit(formData: FormData) {
    if (!booking) return;
    setLoading(true);
    setError(null);
    try {
      await editBooking(booking.id, {
        title: formData.get("title") as string,
        notes: (formData.get("notes") as string) || undefined,
      });
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to edit");
    } finally {
      setLoading(false);
    }
  }

  if (mode === "create") {
    return (
      <Dialog open={open} onOpenChange={(v) => {
        if (!v) { setSelectedDate(""); setSelectedStartTime(""); setSelectedEndTime(""); setRecurrenceWeeks("0"); }
        onOpenChange(v);
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Booking</DialogTitle>
          </DialogHeader>
          <form action={handleCreate} className="space-y-3">
            <div>
              <Label>Date</Label>
              <Input
                type="date"
                value={activeDate}
                onChange={(e) => {
                  setSelectedDate(e.target.value);
                  setSelectedStartTime("");
                  setSelectedEndTime("");
                }}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Start Time</Label>
                <Select
                  value={selectedStartTime || snappedStartIso}
                  onValueChange={(v) => { setSelectedStartTime(v); setSelectedEndTime(""); }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select start time" />
                  </SelectTrigger>
                  <SelectContent>
                    {startTimeOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>End Time</Label>
                <Select
                  value={selectedEndTime || endTimeOptions[defaultEndTimeIndex]?.value || ""}
                  onValueChange={setSelectedEndTime}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select end time" />
                  </SelectTrigger>
                  <SelectContent>
                    {endTimeOptions.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            {resolvedStartTime && resolvedEndTime && overlapsAlarmWindow(resolvedStartTime, resolvedEndTime) && (
              <div className="flex items-center gap-2 text-yellow-600 dark:text-yellow-500">
                <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                <span className="text-sm">{ALARM_WARNING}</span>
              </div>
            )}
            <div>
              <Label>Title</Label>
              <Input name="title" placeholder="Band practice" required />
            </div>
            <div>
              <Label>Notes (optional)</Label>
              <Input name="notes" placeholder="Any details..." />
            </div>
            {isAdmin && (
              <div>
                <Label>Repeat Weekly</Label>
                <Select value={recurrenceWeeks} onValueChange={setRecurrenceWeeks}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">No repeat</SelectItem>
                    {Array.from({ length: 12 }, (_, i) => (
                      <SelectItem key={i + 2} value={String(i + 2)}>
                        {i + 2} weeks
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "Booking..." : "Book"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{booking?.title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-2 text-sm">
          <p>
            {booking && formatTime(new Date(booking.startTime))} &ndash;{" "}
            {booking && formatTime(new Date(booking.endTime))}
          </p>
          <p>Booked by: {booking?.user.name ?? "Unknown"}</p>
          {booking?.notes && <p>Notes: {booking.notes}</p>}
        </div>
        {canEdit && (
          <form action={handleEdit} className="space-y-3 border-t pt-3">
            <div>
              <Label>Title</Label>
              <Input name="title" defaultValue={booking?.title} required />
            </div>
            <div>
              <Label>Notes</Label>
              <Input name="notes" defaultValue={booking?.notes ?? ""} />
            </div>
            <Button
              type="submit"
              disabled={loading}
              variant="outline"
              className="w-full"
            >
              Save Changes
            </Button>
          </form>
        )}
        {error && <p className="text-sm text-destructive">{error}</p>}
        {canCancel && (
          <Button
            variant="destructive"
            onClick={handleCancel}
            disabled={loading}
            className="w-full"
          >
            Cancel Booking
          </Button>
        )}
      </DialogContent>
    </Dialog>
  );
}
