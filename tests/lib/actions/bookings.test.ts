import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    booking: {
      findFirst: vi.fn(),
      findUniqueOrThrow: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
    blockedTimeRange: {
      findFirst: vi.fn(),
    },
    appSettings: {
      findUniqueOrThrow: vi.fn(),
    },
  },
}));

vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import {
  createBooking,
  cancelBooking,
  editBooking,
} from "@/lib/actions/bookings";

const defaultSettings = {
  granularityMinutes: 30,
  maxAdvanceDays: 14,
  maxActiveBookings: 3,
  maxBookingDurationHours: 8,
};

// Helper: create a future date aligned to 30-min granularity, N days from now
function futureSlot(daysFromNow: number, hour: number, minute: 0 | 30 = 0) {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  d.setHours(hour, minute, 0, 0);
  return d;
}

describe("createBooking", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (auth as any).mockResolvedValue({
      user: { id: "user1", role: "MEMBER" },
    });
    (prisma.appSettings.findUniqueOrThrow as any).mockResolvedValue(
      defaultSettings
    );
    (prisma.booking.count as any).mockResolvedValue(0);
    (prisma.blockedTimeRange.findFirst as any).mockResolvedValue(null);
  });

  it("prevents overlapping bookings on the same room", async () => {
    (prisma.booking.findFirst as any).mockResolvedValue({ id: "existing" });

    const start = futureSlot(2, 10);
    const end = futureSlot(2, 11);

    await expect(
      createBooking({
        title: "Overlap test",
        roomId: "room1",
        startTime: start,
        endTime: end,
      })
    ).rejects.toThrow("timeConflict");
  });

  it("creates booking when no conflict exists", async () => {
    (prisma.booking.findFirst as any).mockResolvedValue(null);
    (prisma.booking.create as any).mockResolvedValue({
      id: "new1",
      title: "Band practice",
    });

    const start = futureSlot(2, 10);
    const end = futureSlot(2, 11);

    const result = await createBooking({
      title: "Band practice",
      roomId: "room1",
      startTime: start,
      endTime: end,
    });

    expect(result).toHaveProperty("id");
    expect(prisma.booking.create).toHaveBeenCalled();
  });

  it("rejects viewers", async () => {
    (auth as any).mockResolvedValue({
      user: { id: "user2", role: "VIEWER" },
    });

    await expect(
      createBooking({
        title: "Test",
        roomId: "room1",
        startTime: futureSlot(2, 10),
        endTime: futureSlot(2, 11),
      })
    ).rejects.toThrow("viewerCannotBook");
  });

  it("rejects when blocked time range exists", async () => {
    (prisma.booking.findFirst as any).mockResolvedValue(null);
    (prisma.blockedTimeRange.findFirst as any).mockResolvedValue({
      id: "blocked1",
    });

    await expect(
      createBooking({
        title: "Blocked test",
        roomId: "room1",
        startTime: futureSlot(2, 10),
        endTime: futureSlot(2, 11),
      })
    ).rejects.toThrow("timeBlocked");
  });

  it("rejects when max active bookings reached", async () => {
    (prisma.booking.count as any).mockResolvedValue(3);
    (prisma.booking.findFirst as any).mockResolvedValue(null);

    await expect(
      createBooking({
        title: "Over limit",
        roomId: "room1",
        startTime: futureSlot(2, 10),
        endTime: futureSlot(2, 11),
      })
    ).rejects.toThrow("maxActiveBookings");
  });
});

describe("cancelBooking", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (auth as any).mockResolvedValue({
      user: { id: "user1", role: "MEMBER" },
    });
  });

  it("cancels own future booking", async () => {
    const future = new Date(Date.now() + 86400000);
    (prisma.booking.findUniqueOrThrow as any).mockResolvedValue({
      id: "b1",
      userId: "user1",
      startTime: future,
    });
    (prisma.booking.update as any).mockResolvedValue({});

    await cancelBooking("b1");
    expect(prisma.booking.update).toHaveBeenCalledWith({
      where: { id: "b1" },
      data: { cancelled: true },
    });
  });

  it("rejects cancelling someone else's booking", async () => {
    (prisma.booking.findUniqueOrThrow as any).mockResolvedValue({
      id: "b2",
      userId: "other",
      startTime: new Date(Date.now() + 86400000),
    });

    await expect(cancelBooking("b2")).rejects.toThrow("canOnlyCancelOwn");
  });
});

describe("editBooking", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (auth as any).mockResolvedValue({
      user: { id: "user1", role: "MEMBER" },
    });
  });

  it("edits own future booking title", async () => {
    const future = new Date(Date.now() + 86400000);
    (prisma.booking.findUniqueOrThrow as any).mockResolvedValue({
      id: "b1",
      userId: "user1",
      startTime: future,
    });
    (prisma.booking.update as any).mockResolvedValue({});

    await editBooking("b1", { title: "Updated title" });
    expect(prisma.booking.update).toHaveBeenCalledWith({
      where: { id: "b1" },
      data: { title: "Updated title", notes: undefined },
    });
  });
});
