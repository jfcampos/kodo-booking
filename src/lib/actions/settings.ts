"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { settingsSchema } from "@/lib/validations/settings";
import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";

export async function getSettings() {
  return prisma.appSettings.findUniqueOrThrow({ where: { id: "default" } });
}

export async function updateSettings(input: {
  granularityMinutes: number;
  maxAdvanceDays: number;
  maxActiveBookings: number;
  maxBookingDurationHours: number;
}): Promise<{ error: string } | void> {
  try {
    const t = await getTranslations("ServerErrors");
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN")
      return { error: t("unauthorized") };

    const parsed = settingsSchema.parse(input);
    await prisma.appSettings.update({
      where: { id: "default" },
      data: parsed,
    });

    revalidatePath("/");
    revalidatePath("/admin/settings");
  } catch {
    return { error: "Unexpected error" };
  }
}
