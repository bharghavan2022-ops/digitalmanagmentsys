import { z } from "zod";

export const generateCertificateSchema = z.object({
  volunteerId: z.string().uuid(),
  eventId: z.string().uuid().optional(),
});

export type GenerateCertificateInput = z.infer<typeof generateCertificateSchema>;
