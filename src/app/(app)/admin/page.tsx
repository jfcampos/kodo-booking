import { prisma } from "@/lib/prisma";

export default async function AdminDashboardPage() {
  const [userCount, roomCount, activeBookings] = await Promise.all([
    prisma.user.count(),
    prisma.room.count({ where: { disabled: false } }),
    prisma.booking.count({
      where: { cancelled: false, endTime: { gt: new Date() } },
    }),
  ]);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Admin Dashboard</h1>
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-lg border p-4">
          <div className="text-2xl font-bold">{userCount}</div>
          <div className="text-sm text-muted-foreground">Users</div>
        </div>
        <div className="rounded-lg border p-4">
          <div className="text-2xl font-bold">{roomCount}</div>
          <div className="text-sm text-muted-foreground">Active Rooms</div>
        </div>
        <div className="rounded-lg border p-4">
          <div className="text-2xl font-bold">{activeBookings}</div>
          <div className="text-sm text-muted-foreground">Active Bookings</div>
        </div>
      </div>
    </div>
  );
}
