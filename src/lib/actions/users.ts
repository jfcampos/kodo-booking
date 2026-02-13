"use server";

import { prisma } from "@/lib/prisma";
import { auth, IMPERSONATE_COOKIE } from "@/lib/auth";
import { Role } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

async function requireAuth() {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");
  return session.user;
}

/** Check real (non-impersonated) admin status via session + impersonatedBy */
async function requireAdmin() {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");
  // If impersonating, the real user is admin (session callback only sets impersonatedBy for admins)
  if ((session as any).impersonatedBy) return { ...session.user, id: (session as any).impersonatedBy as string };
  if (session.user.role !== "ADMIN") throw new Error("Unauthorized");
  return session.user;
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

export async function impersonateUser(userId: string) {
  const admin = await requireAdmin();
  if (userId === admin.id) throw new Error("Cannot impersonate yourself");
  const target = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
  const cookieStore = await cookies();
  cookieStore.set(IMPERSONATE_COOKIE, target.id, { httpOnly: true, path: "/" });
  revalidatePath("/");
}

export async function stopImpersonating() {
  const cookieStore = await cookies();
  cookieStore.delete(IMPERSONATE_COOKIE);
  revalidatePath("/");
}
