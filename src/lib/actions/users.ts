"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { Role } from "@prisma/client";
import { revalidatePath } from "next/cache";

async function requireAuth() {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");
  return session.user;
}

async function requireAdmin() {
  const user = await requireAuth();
  if (user.role !== "ADMIN") throw new Error("Unauthorized");
  return user;
}

export async function listUsers() {
  await requireAdmin();
  return prisma.user.findMany({
    select: { id: true, name: true, email: true, role: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });
}

export async function changeUserRole(userId: string, role: Role) {
  const admin = await requireAdmin();
  if (admin.id === userId) throw new Error("Cannot change your own role");
  await prisma.user.update({ where: { id: userId }, data: { role } });
}

export async function removeUser(userId: string) {
  const admin = await requireAdmin();
  if (admin.id === userId) throw new Error("Cannot remove yourself");
  await prisma.user.delete({ where: { id: userId } });
}

export async function updateMyName(name: string) {
  const user = await requireAuth();
  const trimmed = name.trim();
  if (!trimmed || trimmed.length > 100) throw new Error("Invalid name");
  await prisma.user.update({ where: { id: user.id }, data: { name: trimmed } });
  revalidatePath("/");
  revalidatePath("/settings");
}

export async function updateMyColor(color: string) {
  const user = await requireAuth();
  if (!/^#[0-9a-fA-F]{6}$/.test(color)) throw new Error("Invalid color");
  await prisma.user.update({ where: { id: user.id }, data: { color } });
  revalidatePath("/");
  revalidatePath("/settings");
}
