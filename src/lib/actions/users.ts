"use server";

import { prisma } from "@/lib/prisma";
import { auth, IMPERSONATE_COOKIE } from "@/lib/auth";
import { Role } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { getTranslations } from "next-intl/server";

async function requireAuth() {
  const t = await getTranslations("ServerErrors");
  const session = await auth();
  if (!session?.user) throw new Error(t("unauthorized"));
  return session.user;
}

/** Check real (non-impersonated) admin status via session + impersonatedBy */
async function requireAdmin() {
  const t = await getTranslations("ServerErrors");
  const session = await auth();
  if (!session?.user) throw new Error(t("unauthorized"));
  // If impersonating, the real user is admin (session callback only sets impersonatedBy for admins)
  if ((session as any).impersonatedBy) return { ...session.user, id: (session as any).impersonatedBy as string };
  if (session.user.role !== "ADMIN") throw new Error(t("unauthorized"));
  return session.user;
}

export async function listUsers() {
  await requireAdmin();
  return prisma.user.findMany({
    select: { id: true, name: true, email: true, role: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });
}

export async function changeUserRole(userId: string, role: Role): Promise<{ error: string } | void> {
  try {
    const t = await getTranslations("ServerErrors");
    const admin = await requireAdmin();
    if (admin.id === userId) return { error: t("cannotChangeOwnRole") };
    await prisma.user.update({ where: { id: userId }, data: { role } });
  } catch {
    return { error: "Unexpected error" };
  }
}

export async function getUserActiveBookingCount(userId: string) {
  await requireAdmin();
  const [bookings, recurring] = await Promise.all([
    prisma.booking.count({
      where: { userId, cancelled: false, endTime: { gt: new Date() } },
    }),
    prisma.recurringBooking.count({
      where: { userId, cancelled: false },
    }),
  ]);
  return bookings + recurring;
}

export async function removeUser(userId: string): Promise<{ error: string } | void> {
  try {
    const t = await getTranslations("ServerErrors");
    const admin = await requireAdmin();
    if (admin.id === userId) return { error: t("cannotRemoveSelf") };

    // Cancel all active bookings and recurring bookings
    await prisma.booking.updateMany({
      where: { userId, cancelled: false },
      data: { cancelled: true },
    });
    await prisma.recurringBooking.updateMany({
      where: { userId, cancelled: false },
      data: { cancelled: true },
    });

    await prisma.user.delete({ where: { id: userId } });
  } catch {
    return { error: "Unexpected error" };
  }
}

export async function updateMyName(name: string): Promise<{ error: string } | void> {
  try {
    const t = await getTranslations("ServerErrors");
    const user = await requireAuth();
    const trimmed = name.trim();
    if (!trimmed || trimmed.length > 100) return { error: t("invalidName") };
    await prisma.user.update({ where: { id: user.id }, data: { name: trimmed } });
    revalidatePath("/");
    revalidatePath("/settings");
  } catch {
    return { error: "Unexpected error" };
  }
}

export async function updateMyColor(color: string): Promise<{ error: string } | void> {
  try {
    const t = await getTranslations("ServerErrors");
    const user = await requireAuth();
    if (!/^#[0-9a-fA-F]{6}$/.test(color)) return { error: t("invalidColor") };
    await prisma.user.update({ where: { id: user.id }, data: { color } });
    revalidatePath("/");
    revalidatePath("/settings");
  } catch {
    return { error: "Unexpected error" };
  }
}

export async function impersonateUser(userId: string): Promise<{ error: string } | void> {
  try {
    const t = await getTranslations("ServerErrors");
    const admin = await requireAdmin();
    if (userId === admin.id) return { error: t("cannotImpersonateSelf") };
    const target = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
    const cookieStore = await cookies();
    cookieStore.set(IMPERSONATE_COOKIE, target.id, { httpOnly: true, path: "/" });
    revalidatePath("/");
  } catch {
    return { error: "Unexpected error" };
  }
}

export async function stopImpersonating() {
  const cookieStore = await cookies();
  cookieStore.delete(IMPERSONATE_COOKIE);
  revalidatePath("/");
}
