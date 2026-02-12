import { z } from "zod";

export const createInviteSchema = z.object({
  role: z.enum(["MEMBER", "VIEWER"]),
  expiresInDays: z.number().min(1).max(30),
});

export type CreateInviteInput = z.infer<typeof createInviteSchema>;
