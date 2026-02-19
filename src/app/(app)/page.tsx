import { auth } from "@/lib/auth";
import { listRooms } from "@/lib/actions/rooms";
import { prisma } from "@/lib/prisma";
import { CalendarView } from "@/components/calendar/calendar-view";
import { getTranslations } from "next-intl/server";

export default async function HomePage() {
  const session = await auth();
  if (!session?.user) return null;

  const rooms = await listRooms();
  const settings = await prisma.appSettings.findUniqueOrThrow({
    where: { id: "default" },
  });

  if (rooms.length === 0) {
    const t = await getTranslations("Calendar");
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
        <p>{t("noRooms")}</p>
        {session.user.role === "ADMIN" && (
          <p>
            {t.rich("noRoomsAdmin", {
              link: (chunks) => (
                <a href="/admin/rooms" className="underline">
                  {chunks}
                </a>
              ),
            })}
          </p>
        )}
      </div>
    );
  }

  return (
    <CalendarView
      rooms={rooms}
      currentUserId={session.user.id}
      currentUserRole={session.user.role}
      granularityMinutes={settings.granularityMinutes}
      maxBookingDurationHours={settings.maxBookingDurationHours}
    />
  );
}
