import { auth } from "@/lib/auth";
import { listRooms } from "@/lib/actions/rooms";
import { prisma } from "@/lib/prisma";
import { WeeklyCalendar } from "@/components/calendar/weekly-calendar";

export default async function HomePage() {
  const session = await auth();
  if (!session?.user) return null;

  const rooms = await listRooms();
  const settings = await prisma.appSettings.findUniqueOrThrow({
    where: { id: "default" },
  });

  if (rooms.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
        <p>No rooms available.</p>
        {session.user.role === "ADMIN" && (
          <p>
            Go to{" "}
            <a href="/admin/rooms" className="underline">
              Admin &rarr; Rooms
            </a>{" "}
            to add one.
          </p>
        )}
      </div>
    );
  }

  return (
    <WeeklyCalendar
      rooms={rooms}
      currentUserId={session.user.id}
      currentUserRole={session.user.role}
      granularityMinutes={settings.granularityMinutes}
      maxBookingDurationHours={settings.maxBookingDurationHours}
    />
  );
}
