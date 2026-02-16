"use client";

import { useState, useMemo } from "react";
import { useTranslations } from "next-intl";
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
  cancelRecurringOccurrence,
  cancelRecurringSeries,
} from "@/lib/actions/bookings";
import { formatTime, overlapsAlarmWindow } from "@/lib/utils";
import { AlertTriangle, Repeat } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

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
    isRecurring?: boolean;
    recurringBookingId?: string;
    occurrenceDate?: string;
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
  const t = useTranslations("BookingDialog");
  const tc = useTranslations("Common");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedStartTime, setSelectedStartTime] = useState<string>("");
  const [selectedEndTime, setSelectedEndTime] = useState<string>("");
  const [isRecurringWeekly, setIsRecurringWeekly] = useState(false);

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
      const title = formData.get("title") as string;
      const notes = (formData.get("notes") as string) || undefined;
      if (isRecurringWeekly) {
        const dayOfWeek = resolvedStartTime.getDay();
        const startMinutes = resolvedStartTime.getHours() * 60 + resolvedStartTime.getMinutes();
        const endMinutes = resolvedEndTime.getHours() * 60 + resolvedEndTime.getMinutes();
        await createRecurringBooking({ title, notes, roomId, dayOfWeek, startMinutes, endMinutes });
      } else {
        await createBooking({ title, notes, roomId, startTime: resolvedStartTime, endTime: resolvedEndTime });
      }
      onOpenChange(false);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : t("failedToCreate")
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleCancel() {
    if (!booking || !confirm(t("confirmCancel"))) return;
    setLoading(true);
    try {
      await cancelBooking(booking.id);
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("failedToCancel"));
    } finally {
      setLoading(false);
    }
  }

  async function handleCancelOccurrence() {
    if (!booking?.recurringBookingId || !booking?.occurrenceDate) return;
    setLoading(true);
    try {
      await cancelRecurringOccurrence(booking.recurringBookingId, booking.occurrenceDate);
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("failedToCancel"));
    } finally {
      setLoading(false);
    }
  }

  async function handleCancelSeries() {
    if (!booking?.recurringBookingId || !confirm(t("confirmCancelSeries"))) return;
    setLoading(true);
    try {
      await cancelRecurringSeries(booking.recurringBookingId);
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("failedToCancel"));
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
      setError(err instanceof Error ? err.message : t("failedToEdit"));
    } finally {
      setLoading(false);
    }
  }

  if (mode === "create") {
    return (
      <Dialog open={open} onOpenChange={(v) => {
        if (!v) { setSelectedDate(""); setSelectedStartTime(""); setSelectedEndTime(""); setIsRecurringWeekly(false); }
        onOpenChange(v);
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("newBooking")}</DialogTitle>
          </DialogHeader>
          <form action={handleCreate} className="space-y-3">
            <div>
              <Label>{t("date")}</Label>
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
                <Label>{t("startTime")}</Label>
                <Select
                  value={selectedStartTime || snappedStartIso}
                  onValueChange={(v) => { setSelectedStartTime(v); setSelectedEndTime(""); }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t("selectStartTime")} />
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
                <Label>{t("endTime")}</Label>
                <Select
                  value={selectedEndTime || endTimeOptions[defaultEndTimeIndex]?.value || ""}
                  onValueChange={setSelectedEndTime}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={t("selectEndTime")} />
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
                <span className="text-sm">{t("alarmWarning")}</span>
              </div>
            )}
            <div>
              <Label>{t("title")}</Label>
              <Input name="title" placeholder={t("titlePlaceholder")} required />
            </div>
            <div>
              <Label>{t("notes")}</Label>
              <Input name="notes" placeholder={t("notesPlaceholder")} />
            </div>
            {isAdmin && (
              <div className="flex items-center gap-2">
                <Checkbox
                  id="recurring-weekly"
                  checked={isRecurringWeekly}
                  onCheckedChange={(checked) => setIsRecurringWeekly(checked === true)}
                />
                <Label htmlFor="recurring-weekly">{t("recurringWeekly")}</Label>
              </div>
            )}
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? t("booking") : t("book")}
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
          <DialogTitle className="flex items-center gap-2">
            {booking?.title}
            {booking?.isRecurring && (
              <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                <Repeat className="h-3 w-3" />
                {t("recurring")}
              </span>
            )}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-2 text-sm">
          <p>
            {booking && formatTime(new Date(booking.startTime))} &ndash;{" "}
            {booking && formatTime(new Date(booking.endTime))}
          </p>
          <p>{t("bookedBy", { name: booking?.user.name ?? tc("unknown") })}</p>
          {booking?.notes && <p>{t("notesLabel", { notes: booking.notes })}</p>}
        </div>
        {canEdit && !booking?.isRecurring && (
          <form action={handleEdit} className="space-y-3 border-t pt-3">
            <div>
              <Label>{t("title")}</Label>
              <Input name="title" defaultValue={booking?.title} required />
            </div>
            <div>
              <Label>{tc("description")}</Label>
              <Input name="notes" defaultValue={booking?.notes ?? ""} />
            </div>
            <Button
              type="submit"
              disabled={loading}
              variant="outline"
              className="w-full"
            >
              {t("saveChanges")}
            </Button>
          </form>
        )}
        {error && <p className="text-sm text-destructive">{error}</p>}
        {booking?.isRecurring && isAdmin && (
          <div className="space-y-2 border-t pt-3">
            <Button
              variant="outline"
              onClick={handleCancelOccurrence}
              disabled={loading}
              className="w-full"
            >
              {t("cancelThisDate")}
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancelSeries}
              disabled={loading}
              className="w-full"
            >
              {t("cancelEntireSeries")}
            </Button>
          </div>
        )}
        {canCancel && !booking?.isRecurring && (
          <Button
            variant="destructive"
            onClick={handleCancel}
            disabled={loading}
            className="w-full"
          >
            {t("cancelBooking")}
          </Button>
        )}
      </DialogContent>
    </Dialog>
  );
}
