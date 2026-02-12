"use client";

import { useState } from "react";
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
  createBooking,
  cancelBooking,
  editBooking,
} from "@/lib/actions/bookings";
import { formatTime } from "@/lib/utils";

type BookingDialogProps = {
  mode: "create" | "view";
  open: boolean;
  onOpenChange: (open: boolean) => void;
  roomId: string;
  startTime?: Date;
  endTime?: Date;
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
};

export function BookingDialog({
  mode,
  open,
  onOpenChange,
  roomId,
  startTime,
  endTime,
  booking,
  currentUserId,
  currentUserRole,
}: BookingDialogProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isOwn = booking?.user.id === currentUserId;
  const isAdmin = currentUserRole === "ADMIN";
  const canEdit = isOwn || isAdmin;
  const canCancel =
    canEdit && booking && new Date(booking.startTime) > new Date();

  async function handleCreate(formData: FormData) {
    setLoading(true);
    setError(null);
    try {
      await createBooking({
        title: formData.get("title") as string,
        notes: (formData.get("notes") as string) || undefined,
        roomId,
        startTime: startTime!,
        endTime: endTime!,
      });
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
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Booking</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            {startTime && formatTime(startTime)} &ndash;{" "}
            {endTime && formatTime(endTime)}
          </p>
          <form action={handleCreate} className="space-y-3">
            <div>
              <Label>Title</Label>
              <Input name="title" placeholder="Band practice" required />
            </div>
            <div>
              <Label>Notes (optional)</Label>
              <Input name="notes" placeholder="Any details..." />
            </div>
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
