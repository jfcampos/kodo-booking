import { prisma } from "@/lib/prisma";
import { BookingTable } from "@/components/admin/booking-table";
import { getTranslations } from "next-intl/server";

export default async function AdminBookingsPage() {
  const [bookings, recurringBookings] = await Promise.all([
    prisma.booking.findMany({
      include: {
        room: { select: { name: true } },
        user: { select: { name: true, email: true } },
      },
      orderBy: { startTime: "desc" },
      take: 100,
    }),
    prisma.recurringBooking.findMany({
      include: {
        room: { select: { name: true } },
        user: { select: { name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const t = await getTranslations("AdminBookings");

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">{t("title")}</h1>
      <BookingTable bookings={bookings} recurringBookings={recurringBookings} />
    </div>
  );
}
