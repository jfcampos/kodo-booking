"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { createInviteSchema } from "@/lib/validations/invite";
import { nanoid } from "nanoid";
import { addDays } from "date-fns";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    throw new Error("Unauthorized");
  }
  return session.user;
}

export async function createInviteLink(input: {
  role: "MEMBER" | "VIEWER";
  expiresInDays: number;
}) {
  await requireAdmin();
  const parsed = createInviteSchema.parse(input);

  const invite = await prisma.inviteLink.create({
    data: {
      role: parsed.role,
      token: nanoid(),
      expiresAt: addDays(new Date(), parsed.expiresInDays),
    },
  });

  return invite;
}

export async function listInviteLinks() {
  await requireAdmin();
  return prisma.inviteLink.findMany({
    orderBy: { createdAt: "desc" },
  });
}

export async function deleteInviteLink(id: string) {
  await requireAdmin();
  await prisma.inviteLink.delete({ where: { id } });
}
