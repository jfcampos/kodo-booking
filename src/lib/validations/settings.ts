import { z } from "zod";

export const settingsSchema = z.object({
  granularityMinutes: z.number().min(5).max(120),
  maxAdvanceDays: z.number().min(1).max(365),
  maxActiveBookings: z.number().min(1).max(50),
});

export type SettingsInput = z.infer<typeof settingsSchema>;
