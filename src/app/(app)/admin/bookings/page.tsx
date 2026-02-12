import { prisma } from "@/lib/prisma";
import { BookingTable } from "@/components/admin/booking-table";

export default async function AdminBookingsPage() {
  const bookings = await prisma.booking.findMany({
    include: {
      room: { select: { name: true } },
      user: { select: { name: true, email: true } },
    },
    orderBy: { startTime: "desc" },
    take: 100,
  });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">All Bookings</h1>
      <BookingTable bookings={bookings} />
    </div>
  );
}
