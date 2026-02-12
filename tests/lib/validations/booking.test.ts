import { describe, it, expect } from "vitest";
import { bookingSchema } from "@/lib/validations/booking";

describe("bookingSchema", () => {
  it("accepts valid booking input", () => {
    const result = bookingSchema.safeParse({
      title: "Band practice",
      roomId: "room1",
      startTime: new Date("2026-03-01T10:00:00Z"),
      endTime: new Date("2026-03-01T11:00:00Z"),
    });
    expect(result.success).toBe(true);
  });

  it("rejects end time before start time", () => {
    const result = bookingSchema.safeParse({
      title: "Bad booking",
      roomId: "room1",
      startTime: new Date("2026-03-01T11:00:00Z"),
      endTime: new Date("2026-03-01T10:00:00Z"),
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty title", () => {
    const result = bookingSchema.safeParse({
      title: "",
      roomId: "room1",
      startTime: new Date("2026-03-01T10:00:00Z"),
      endTime: new Date("2026-03-01T11:00:00Z"),
    });
    expect(result.success).toBe(false);
  });
});
