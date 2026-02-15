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
import { getTranslations } from "next-intl/server";

export default async function HistoryPage() {
  const bookings = await getUserBookingHistory();
  const t = await getTranslations("History");
  const tc = await getTranslations("Common");

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">{t("title")}</h1>
      {bookings.length === 0 ? (
        <p className="text-muted-foreground">{t("noBookings")}</p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{tc("title")}</TableHead>
              <TableHead>{tc("room")}</TableHead>
              <TableHead>{tc("time")}</TableHead>
              <TableHead>{tc("status")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {bookings.map((b) => (
              <TableRow key={b.id}>
                <TableCell>{b.title}</TableCell>
                <TableCell>{b.room.name}</TableCell>
                <TableCell className="text-xs">
                  {format(new Date(b.startTime), "d MMM HH:mm")} &ndash;{" "}
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
                      ? t("cancelled")
                      : new Date(b.endTime) < new Date()
                        ? t("past")
                        : t("upcoming")}
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
