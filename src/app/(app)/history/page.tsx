import { getUserBookingHistory } from "@/lib/actions/bookings";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

export default async function HistoryPage() {
  const bookings = await getUserBookingHistory();

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">My Booking History</h1>
      {bookings.length === 0 ? (
        <p className="text-muted-foreground">No bookings yet.</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Room</TableHead>
              <TableHead>Time</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {bookings.map((b) => (
              <TableRow key={b.id}>
                <TableCell>{b.title}</TableCell>
                <TableCell>{b.room.name}</TableCell>
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
                        : "Upcoming"}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
