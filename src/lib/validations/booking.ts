import { z } from "zod";

export const bookingSchema = z
  .object({
    title: z.string().min(1, "Title is required").max(200),
    notes: z.string().max(1000).optional(),
    roomId: z.string().min(1),
    startTime: z.coerce.date(),
    endTime: z.coerce.date(),
  })
  .refine((d) => d.endTime > d.startTime, {
    message: "End time must be after start time",
  });

export const editBookingSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  notes: z.string().max(1000).optional(),
});

export type BookingInput = z.infer<typeof bookingSchema>;
export type EditBookingInput = z.infer<typeof editBookingSchema>;
