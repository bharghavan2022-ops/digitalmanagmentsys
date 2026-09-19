import { prisma } from "@/lib/prisma";

export type PublicVolunteerCard = {
  fullName: string;
  nssId: string;
  department: string;
  status: string;
} | null;

/**
 * Backs the Digital ID QR code (see the profile page) - the QR encodes a
 * pointer to this record, never raw personal data, so the `select` here is
 * the actual security boundary: it must never grow to include email, phone,
 * or any other contact field, no matter who or what calls it.
 */
export async function getPublicVolunteerCard(volunteerId: string): Promise<PublicVolunteerCard> {
  return prisma.volunteerProfile.findUnique({
    where: { id: volunteerId },
    select: { fullName: true, nssId: true, department: true, status: true },
  });
}
