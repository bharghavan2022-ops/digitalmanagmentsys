import { z } from "zod";

export const createFeedbackSchema = z.object({
  eventId: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  message: z.string().max(2000).optional(),
});

export type CreateFeedbackInput = z.infer<typeof createFeedbackSchema>;
