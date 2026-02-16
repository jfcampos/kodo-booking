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

export const recurringBookingSchema = z
  .object({
    title: z.string().min(1, "Title is required").max(200),
    notes: z.string().max(1000).optional(),
    roomId: z.string().min(1),
    dayOfWeek: z.number().int().min(0).max(6),
    startMinutes: z.number().int().min(0).max(1439),
    endMinutes: z.number().int().min(1).max(1440),
  })
  .refine((d) => d.endMinutes > d.startMinutes, {
    message: "End time must be after start time",
  });

export type BookingInput = z.infer<typeof bookingSchema>;
export type EditBookingInput = z.infer<typeof editBookingSchema>;
export type RecurringBookingInput = z.infer<typeof recurringBookingSchema>;
