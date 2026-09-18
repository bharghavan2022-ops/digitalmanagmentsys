import { z } from "zod";

export const createAnnouncementSchema = z.object({
  title: z.string().min(1).max(160),
  body: z.string().min(1),
  audience: z.enum(["VOLUNTEER", "COORDINATOR", "AUDITOR"]).optional(),
});

export type CreateAnnouncementInput = z.infer<typeof createAnnouncementSchema>;
