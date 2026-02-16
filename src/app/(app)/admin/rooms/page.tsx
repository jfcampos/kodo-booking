import { listRooms, toggleRoomDisabled } from "@/lib/actions/rooms";
import { RoomFormDialog } from "@/components/admin/room-form";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getTranslations } from "next-intl/server";

export default async function AdminRoomsPage() {
  const rooms = await listRooms(true);
  const t = await getTranslations("AdminRooms");
  const tc = await getTranslations("Common");

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        <RoomFormDialog trigger={<Button>{t("addRoom")}</Button>} />
      </div>
      <div className="space-y-3">
        {rooms.map((room) => (
          <div key={room.id} className="rounded-lg border p-3 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="font-medium truncate">{room.name}</p>
                {room.description && (
                  <p className="text-sm text-muted-foreground truncate">{room.description}</p>
                )}
              </div>
              <Badge variant={room.disabled ? "secondary" : "default"} className="shrink-0">
                {room.disabled ? t("disabled") : t("active")}
              </Badge>
            </div>
            <div className="flex gap-2">
              <RoomFormDialog
                room={room}
                trigger={
                  <Button variant="outline" size="sm" className="flex-1">
                    {tc("edit")}
                  </Button>
                }
              />
              <form
                className="flex-1"
                action={async () => {
                  "use server";
                  await toggleRoomDisabled(room.id);
                }}
              >
                <Button variant="outline" size="sm" type="submit" className="w-full">
                  {room.disabled ? t("enable") : t("disable")}
                </Button>
              </form>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
