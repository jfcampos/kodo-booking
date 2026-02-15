import { prisma } from "@/lib/prisma";
import { getTranslations } from "next-intl/server";

export default async function AdminDashboardPage() {
  const [userCount, roomCount, activeBookings] = await Promise.all([
    prisma.user.count(),
    prisma.room.count({ where: { disabled: false } }),
    prisma.booking.count({
      where: { cancelled: false, endTime: { gt: new Date() } },
    }),
  ]);

  const t = await getTranslations("Admin");

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">{t("dashboard")}</h1>
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-lg border p-4">
          <div className="text-2xl font-bold">{userCount}</div>
          <div className="text-sm text-muted-foreground">{t("users")}</div>
        </div>
        <div className="rounded-lg border p-4">
          <div className="text-2xl font-bold">{roomCount}</div>
          <div className="text-sm text-muted-foreground">{t("activeRooms")}</div>
        </div>
        <div className="rounded-lg border p-4">
          <div className="text-2xl font-bold">{activeBookings}</div>
          <div className="text-sm text-muted-foreground">{t("activeBookings")}</div>
        </div>
      </div>
    </div>
  );
}
