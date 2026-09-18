import { z } from "zod";

export const checkInSchema = z.object({
  eventId: z.string().uuid(),
  token: z.string().min(1),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
});

export type CheckInInput = z.infer<typeof checkInSchema>;
