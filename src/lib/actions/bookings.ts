"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { bookingSchema, editBookingSchema, recurringBookingSchema } from "@/lib/validations/booking";
import { revalidatePath } from "next/cache";
import { addDays } from "date-fns";
import { getTranslations } from "next-intl/server";

async function requireAuth() {
  const t = await getTranslations("ServerErrors");
  const session = await auth();
  if (!session?.user) throw new Error(t("unauthorized"));
  return session.user;
}

async function requireRole(roles: string[]) {
  const t = await getTranslations("ServerErrors");
  const user = await requireAuth();
  if (!roles.includes(user.role)) throw new Error(t("unauthorized"));
  return user;
}

async function getSettings() {
  return prisma.appSettings.findUniqueOrThrow({ where: { id: "default" } });
}

export async function createBooking(input: {
  title: string;
  notes?: string;
  roomId: string;
  startTime: Date;
  endTime: Date;
}): Promise<{ error: string } | { id: string }> {
  try {
    const t = await getTranslations("ServerErrors");
    const user = await requireAuth();
    if (user.role === "VIEWER")
      return { error: t("viewerCannotBook") };

    const parsed = bookingSchema.parse(input);
    const settings = await getSettings();

    // Validate granularity alignment
    const granMs = settings.granularityMinutes * 60 * 1000;
    if (
      parsed.startTime.getTime() % granMs !== 0 ||
      parsed.endTime.getTime() % granMs !== 0
    ) {
      return { error: t("timesNotAligned", { minutes: settings.granularityMinutes }) };
    }

    // Validate booking duration
    const durationMs = parsed.endTime.getTime() - parsed.startTime.getTime();
    const maxDurationMs = settings.maxBookingDurationHours * 60 * 60 * 1000;
    if (durationMs > maxDurationMs) {
      return { error: t("maxDurationExceeded", { hours: settings.maxBookingDurationHours }) };
    }

    // Validate advance window
    const maxDate = addDays(new Date(), settings.maxAdvanceDays);
    if (parsed.startTime > maxDate) {
      return { error: t("tooFarInAdvance", { days: settings.maxAdvanceDays }) };
    }

    // Validate start is in the future
    if (parsed.startTime <= new Date()) {
      return { error: t("cannotBookPast") };
    }

    // Check active bookings limit
    const activeCount = await prisma.booking.count({
      where: {
        userId: user.id,
        cancelled: false,
        endTime: { gt: new Date() },
      },
    });
    if (activeCount >= settings.maxActiveBookings) {
      return { error: t("maxActiveBookings", { count: settings.maxActiveBookings }) };
    }

    // Check for conflicts (overlapping bookings on same room)
    const conflict = await prisma.booking.findFirst({
      where: {
        roomId: parsed.roomId,
        cancelled: false,
        startTime: { lt: parsed.endTime },
        endTime: { gt: parsed.startTime },
      },
    });
    if (conflict)
      return { error: t("timeConflict") };

    // Check for blocked time ranges
    const blocked = await prisma.blockedTimeRange.findFirst({
      where: {
        roomId: parsed.roomId,
        startTime: { lt: parsed.endTime },
        endTime: { gt: parsed.startTime },
      },
    });
    if (blocked) return { error: t("timeBlocked") };

    // Check for recurring booking conflicts
    const bookingDayOfWeek = parsed.startTime.getDay();
    const bookingStartMin = parsed.startTime.getHours() * 60 + parsed.startTime.getMinutes();
    const bookingEndMin = parsed.endTime.getHours() * 60 + parsed.endTime.getMinutes();
    const bookingDateStr = parsed.startTime.toISOString().slice(0, 10);

    const recurringConflicts = await prisma.recurringBooking.findMany({
      where: {
        roomId: parsed.roomId,
        cancelled: false,
        dayOfWeek: bookingDayOfWeek,
        startMinutes: { lt: bookingEndMin },
        endMinutes: { gt: bookingStartMin },
      },
    });
    const hasRecurringConflict = recurringConflicts.some((rb) => {
      const exceptions = rb.exceptionDates as string[];
      return !exceptions.includes(bookingDateStr);
    });
    if (hasRecurringConflict) return { error: t("timeConflict") };

    const booking = await prisma.booking.create({
      data: {
        title: parsed.title,
        notes: parsed.notes,
        startTime: parsed.startTime,
        endTime: parsed.endTime,
        roomId: parsed.roomId,
        userId: user.id,
      },
    });

    revalidatePath("/");
    return { id: booking.id };
  } catch {
    return { error: "Unexpected error" };
  }
}

export async function cancelBooking(bookingId: string): Promise<{ error: string } | void> {
  try {
    const t = await getTranslations("ServerErrors");
    const user = await requireAuth();
    const booking = await prisma.booking.findUniqueOrThrow({
      where: { id: bookingId },
    });

    if (booking.userId !== user.id && user.role !== "ADMIN") {
      return { error: t("canOnlyCancelOwn") };
    }
    if (booking.startTime <= new Date()) {
      return { error: t("alreadyStarted") };
    }

    await prisma.booking.update({
      where: { id: bookingId },
      data: { cancelled: true },
    });

    revalidatePath("/");
  } catch {
    return { error: "Unexpected error" };
  }
}

export async function editBooking(
  bookingId: string,
  input: { title: string; notes?: string }
): Promise<{ error: string } | void> {
  try {
    const t = await getTranslations("ServerErrors");
    const user = await requireAuth();
    const parsed = editBookingSchema.parse(input);
    const booking = await prisma.booking.findUniqueOrThrow({
      where: { id: bookingId },
    });

    if (booking.userId !== user.id && user.role !== "ADMIN") {
      return { error: t("canOnlyEditOwn") };
    }
    if (booking.startTime <= new Date()) {
      return { error: t("cannotEditPast") };
    }

    await prisma.booking.update({
      where: { id: bookingId },
      data: { title: parsed.title, notes: parsed.notes },
    });

    revalidatePath("/");
    revalidatePath("/history");
  } catch {
    return { error: "Unexpected error" };
  }
}

export async function adminCancelBooking(bookingId: string): Promise<{ error: string } | void> {
  try {
    await requireRole(["ADMIN"]);
    await prisma.booking.update({
      where: { id: bookingId },
      data: { cancelled: true },
    });
    revalidatePath("/");
  } catch {
    return { error: "Unexpected error" };
  }
}

export async function getBookingsForWeek(
  roomId: string,
  weekStart: Date,
  weekEnd: Date
) {
  await requireAuth();
  return prisma.booking.findMany({
    where: {
      roomId,
      cancelled: false,
      startTime: { gte: weekStart },
      endTime: { lte: weekEnd },
    },
    include: { user: { select: { id: true, name: true, email: true, color: true } } },
    orderBy: { startTime: "asc" },
  });
}

export async function getBlockedRangesForWeek(
  roomId: string,
  weekStart: Date,
  weekEnd: Date
) {
  await requireAuth();
  return prisma.blockedTimeRange.findMany({
    where: {
      roomId,
      startTime: { lt: weekEnd },
      endTime: { gt: weekStart },
    },
    orderBy: { startTime: "asc" },
  });
}

export async function createRecurringBooking(input: {
  title: string;
  notes?: string;
  roomId: string;
  dayOfWeek: number;
  startMinutes: number;
  endMinutes: number;
}): Promise<{ error: string } | { id: string }> {
  try {
    const t = await getTranslations("ServerErrors");
    const user = await requireRole(["ADMIN"]);
    const parsed = recurringBookingSchema.parse(input);

    // Check for conflicts with other recurring bookings on same room/day/time
    const conflict = await prisma.recurringBooking.findFirst({
      where: {
        roomId: parsed.roomId,
        cancelled: false,
        dayOfWeek: parsed.dayOfWeek,
        startMinutes: { lt: parsed.endMinutes },
        endMinutes: { gt: parsed.startMinutes },
      },
    });
    if (conflict) return { error: t("recurringConflict") };

    const recurring = await prisma.recurringBooking.create({
      data: {
        title: parsed.title,
        notes: parsed.notes,
        dayOfWeek: parsed.dayOfWeek,
        startMinutes: parsed.startMinutes,
        endMinutes: parsed.endMinutes,
        roomId: parsed.roomId,
        userId: user.id,
      },
    });

    revalidatePath("/");
    return { id: recurring.id };
  } catch {
    return { error: "Unexpected error" };
  }
}

export async function getRecurringBookingsForWeek(
  roomId: string,
  weekStart: Date,
  weekEnd: Date
) {
  await requireAuth();

  const actives = await prisma.recurringBooking.findMany({
    where: { roomId, cancelled: false },
    include: { user: { select: { id: true, name: true, email: true, color: true } } },
  });

  // Generate virtual occurrences for each day in the week
  const occurrences: Array<{
    id: string;
    recurringBookingId: string;
    title: string;
    notes: string | null;
    startTime: Date;
    endTime: Date;
    isRecurring: true;
    occurrenceDate: string;
    user: { id: string; name: string | null; email: string; color: string };
  }> = [];

  const current = new Date(weekStart);
  while (current < weekEnd) {
    const dow = current.getDay();
    const dateStr = current.toISOString().slice(0, 10);

    for (const rb of actives) {
      if (rb.dayOfWeek !== dow) continue;
      const exceptions = rb.exceptionDates as string[];
      if (exceptions.includes(dateStr)) continue;

      const start = new Date(current);
      start.setHours(Math.floor(rb.startMinutes / 60), rb.startMinutes % 60, 0, 0);
      const end = new Date(current);
      end.setHours(Math.floor(rb.endMinutes / 60), rb.endMinutes % 60, 0, 0);

      occurrences.push({
        id: `recurring-${rb.id}-${dateStr}`,
        recurringBookingId: rb.id,
        title: rb.title,
        notes: rb.notes,
        startTime: start,
        endTime: end,
        isRecurring: true,
        occurrenceDate: dateStr,
        user: rb.user,
      });
    }

    current.setDate(current.getDate() + 1);
  }

  return occurrences;
}

export async function cancelRecurringOccurrence(id: string, dateStr: string): Promise<{ error: string } | void> {
  try {
    await requireRole(["ADMIN"]);

    const rb = await prisma.recurringBooking.findUniqueOrThrow({ where: { id } });
    const exceptions = rb.exceptionDates as string[];
    if (exceptions.includes(dateStr)) return;

    await prisma.recurringBooking.update({
      where: { id },
      data: { exceptionDates: [...exceptions, dateStr] },
    });

    revalidatePath("/");
  } catch {
    return { error: "Unexpected error" };
  }
}

export async function cancelRecurringSeries(id: string): Promise<{ error: string } | void> {
  try {
    await requireRole(["ADMIN"]);

    await prisma.recurringBooking.update({
      where: { id },
      data: { cancelled: true },
    });

    revalidatePath("/");
  } catch {
    return { error: "Unexpected error" };
  }
}

export async function getUserBookingHistory() {
  const user = await requireAuth();
  return prisma.booking.findMany({
    where: { userId: user.id },
    include: { room: { select: { name: true } } },
    orderBy: { startTime: "desc" },
  });
}
