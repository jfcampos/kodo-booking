import { z } from "zod";

export const roomSchema = z.object({
  name: z.string().min(1, "Room name is required").max(100),
  description: z.string().max(500).optional(),
});

export const blockedTimeRangeSchema = z
  .object({
    roomId: z.string().min(1),
    startTime: z.coerce.date(),
    endTime: z.coerce.date(),
    reason: z.string().max(200).optional(),
  })
  .refine((d) => d.endTime > d.startTime, {
    message: "End time must be after start time",
  });

export type RoomInput = z.infer<typeof roomSchema>;
export type BlockedTimeRangeInput = z.infer<typeof blockedTimeRangeSchema>;
