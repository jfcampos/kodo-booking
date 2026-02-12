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

export default async function AdminRoomsPage() {
  const rooms = await listRooms(true);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Rooms</h1>
        <RoomFormDialog trigger={<Button>Add Room</Button>} />
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rooms.map((room) => (
            <TableRow key={room.id}>
              <TableCell className="font-medium">{room.name}</TableCell>
              <TableCell>{room.description ?? "\u2014"}</TableCell>
              <TableCell>
                <Badge variant={room.disabled ? "secondary" : "default"}>
                  {room.disabled ? "Disabled" : "Active"}
                </Badge>
              </TableCell>
              <TableCell className="flex gap-2">
                <RoomFormDialog
                  room={room}
                  trigger={
                    <Button variant="outline" size="sm">
                      Edit
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
                    {room.disabled ? "Enable" : "Disable"}
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
