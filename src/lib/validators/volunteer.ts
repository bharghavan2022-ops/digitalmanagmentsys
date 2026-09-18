import { z } from "zod";

export const createVolunteerSchema = z.object({
  fullName: z.string().min(1).max(120),
  phone: z.string().min(7).max(20),
  department: z.string().min(1).max(80),
  yearOfStudy: z.number().int().min(1).max(6),
});

export const updateVolunteerStatusSchema = z.object({
  status: z.enum(["APPLIED", "ACTIVE", "INACTIVE", "ALUMNI"]),
});

export const adminUpdateVolunteerSchema = z
  .object({
    status: z.enum(["APPLIED", "ACTIVE", "INACTIVE", "ALUMNI"]).optional(),
    isLead: z.boolean().optional(),
  })
  .refine((data) => data.status !== undefined || data.isLead !== undefined, {
    message: "Provide at least one of status or isLead",
  });

export type CreateVolunteerInput = z.infer<typeof createVolunteerSchema>;
export type UpdateVolunteerStatusInput = z.infer<typeof updateVolunteerStatusSchema>;
export type AdminUpdateVolunteerInput = z.infer<typeof adminUpdateVolunteerSchema>;
