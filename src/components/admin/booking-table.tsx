"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  const [loading, setLoading] = useState<string | null>(null);

  async function handleCancel(id: string) {
    if (!confirm("Cancel this booking?")) return;
    setLoading(id);
    try {
      await adminCancelBooking(id);
      router.refresh();
    } finally {
      setLoading(null);
    }
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Title</TableHead>
          <TableHead>Room</TableHead>
          <TableHead>User</TableHead>
          <TableHead>Time</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {bookings.map((b) => (
          <TableRow key={b.id}>
            <TableCell>{b.title}</TableCell>
            <TableCell>{b.room.name}</TableCell>
            <TableCell>{b.user.name ?? b.user.email}</TableCell>
            <TableCell className="text-xs">
              {format(new Date(b.startTime), "MMM d HH:mm")} &ndash;{" "}
              {format(new Date(b.endTime), "HH:mm")}
            </TableCell>
            <TableCell>
              <Badge
                variant={
                  b.cancelled
                    ? "secondary"
                    : new Date(b.endTime) < new Date()
                      ? "outline"
                      : "default"
                }
              >
                {b.cancelled
                  ? "Cancelled"
                  : new Date(b.endTime) < new Date()
                    ? "Past"
                    : "Active"}
              </Badge>
            </TableCell>
            <TableCell>
              {!b.cancelled && new Date(b.startTime) > new Date() && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleCancel(b.id)}
                  disabled={loading === b.id}
                >
                  Cancel
                </Button>
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
