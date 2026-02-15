import { listRooms, toggleRoomDisabled } from "@/lib/actions/rooms";
import { RoomFormDialog } from "@/components/admin/room-form";
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
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{tc("name")}</TableHead>
            <TableHead>{tc("description")}</TableHead>
            <TableHead>{tc("status")}</TableHead>
            <TableHead>{tc("actions")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rooms.map((room) => (
            <TableRow key={room.id}>
              <TableCell className="font-medium">{room.name}</TableCell>
              <TableCell>{room.description ?? "\u2014"}</TableCell>
              <TableCell>
                <Badge variant={room.disabled ? "secondary" : "default"}>
                  {room.disabled ? t("disabled") : t("active")}
                </Badge>
              </TableCell>
              <TableCell className="flex gap-2">
                <RoomFormDialog
                  room={room}
                  trigger={
                    <Button variant="outline" size="sm">
                      {tc("edit")}
                    </Button>
                  }
                />
                <form
                  action={async () => {
                    "use server";
                    await toggleRoomDisabled(room.id);
                  }}
                >
                  <Button variant="outline" size="sm" type="submit">
                    {room.disabled ? t("enable") : t("disable")}
                  </Button>
                </form>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
