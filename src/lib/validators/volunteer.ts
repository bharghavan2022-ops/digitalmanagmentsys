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

// Self-service fields a volunteer may edit on their own profile. Never
// includes status, isLead, or nssId - those are admin-only (see
// adminUpdateVolunteerSchema) and must never be reachable from this route.
export const selfUpdateVolunteerSchema = z.object({
  phone: z.string().min(7).max(20).optional(),
  bloodGroup: z.string().max(10).optional(),
  emergencyContactName: z.string().max(120).optional(),
  emergencyContactPhone: z.string().max(20).optional(),
  hostelRoom: z.string().max(80).optional(),
  languages: z.string().max(200).optional(),
  skills: z.string().max(300).optional(),
});

export type CreateVolunteerInput = z.infer<typeof createVolunteerSchema>;
export type UpdateVolunteerStatusInput = z.infer<typeof updateVolunteerStatusSchema>;
export type AdminUpdateVolunteerInput = z.infer<typeof adminUpdateVolunteerSchema>;
export type SelfUpdateVolunteerInput = z.infer<typeof selfUpdateVolunteerSchema>;
