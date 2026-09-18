import { z } from "zod";

export const createEventSchema = z
  .object({
    title: z.string().min(1).max(160),
    description: z.string().min(1),
    category: z.string().min(1).max(80),
    venueName: z.string().min(1).max(160),
    latitude: z.number().min(-90).max(90).optional(),
    longitude: z.number().min(-180).max(180).optional(),
    startTime: z.coerce.date(),
    endTime: z.coerce.date(),
    awardedHours: z.number().positive(),
    maxCapacity: z.number().int().positive().optional(),
  })
  .refine((data) => data.endTime > data.startTime, {
    message: "endTime must be after startTime",
    path: ["endTime"],
  });

export const registerForEventSchema = z.object({
  eventId: z.string().uuid(),
});

export type CreateEventInput = z.infer<typeof createEventSchema>;
export type RegisterForEventInput = z.infer<typeof registerForEventSchema>;
