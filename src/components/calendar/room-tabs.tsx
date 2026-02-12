"use client";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

type Room = { id: string; name: string };

export function RoomTabs({
  rooms,
  selectedRoomId,
  onSelect,
}: {
  rooms: Room[];
  selectedRoomId: string;
  onSelect: (roomId: string) => void;
}) {
  return (
    <Tabs value={selectedRoomId} onValueChange={onSelect}>
      <TabsList>
        {rooms.map((room) => (
          <TabsTrigger key={room.id} value={room.id}>
            {room.name}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
