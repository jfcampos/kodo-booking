"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createRoom, updateRoom } from "@/lib/actions/rooms";

type Room = { id: string; name: string; description: string | null } | null;

export function RoomFormDialog({
  room,
  trigger,
}: {
  room?: Room;
  trigger: React.ReactNode;
}) {
  const router = useRouter();
  const t = useTranslations("RoomForm");
  const tc = useTranslations("Common");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const isEdit = !!room;

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    try {
      const data = {
        name: formData.get("name") as string,
        description: (formData.get("description") as string) || undefined,
      };
      if (isEdit) {
        await updateRoom(room!.id, data);
      } else {
        await createRoom(data);
      }
      setOpen(false);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? t("editRoom") : t("addRoom")}</DialogTitle>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-3">
          <div>
            <Label>{tc("name")}</Label>
            <Input name="name" defaultValue={room?.name ?? ""} required />
          </div>
          <div>
            <Label>{tc("description")}</Label>
            <Input
              name="description"
              defaultValue={room?.description ?? ""}
            />
          </div>
          <Button type="submit" disabled={loading}>
            {loading ? tc("saving") : tc("save")}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
