"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { roomSchema, blockedTimeRangeSchema } from "@/lib/validations/room";
import { revalidatePath } from "next/cache";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    throw new Error("Unauthorized");
  }
  return session.user;
}

export async function createRoom(input: {
  name: string;
  description?: string;
}) {
  await requireAdmin();
  const parsed = roomSchema.parse(input);
  const room = await prisma.room.create({ data: parsed });
  revalidatePath("/admin/rooms");
  revalidatePath("/");
  return room;
}

export async function updateRoom(
  id: string,
  input: { name: string; description?: string }
) {
  await requireAdmin();
  const parsed = roomSchema.parse(input);
  const room = await prisma.room.update({ where: { id }, data: parsed });
  revalidatePath("/admin/rooms");
  revalidatePath("/");
  return room;
}

export async function toggleRoomDisabled(id: string) {
  await requireAdmin();
  const room = await prisma.room.findUniqueOrThrow({ where: { id } });
  await prisma.room.update({
    where: { id },
    data: { disabled: !room.disabled },
  });
  revalidatePath("/admin/rooms");
  revalidatePath("/");
}

export async function listRooms(includeDisabled = false) {
  const where = includeDisabled ? {} : { disabled: false };
  return prisma.room.findMany({ where, orderBy: { createdAt: "asc" } });
}

export async function createBlockedTimeRange(input: {
  roomId: string;
  startTime: Date;
  endTime: Date;
  reason?: string;
}) {
  await requireAdmin();
  const parsed = blockedTimeRangeSchema.parse(input);
  const blocked = await prisma.blockedTimeRange.create({ data: parsed });
  revalidatePath("/");
  return blocked;
}

export async function deleteBlockedTimeRange(id: string) {
  await requireAdmin();
  await prisma.blockedTimeRange.delete({ where: { id } });
  revalidatePath("/");
}
