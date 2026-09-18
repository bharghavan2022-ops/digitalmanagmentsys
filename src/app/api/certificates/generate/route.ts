import { randomBytes } from "crypto";
import { NextResponse, type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/auth/rbac";
import { toErrorResponse } from "@/lib/api/error-response";
import { generateCertificateSchema } from "@/lib/validators/certificate";
import { computeVerificationHash } from "@/lib/certificates/hash";
import { renderCertificatePdf } from "@/lib/certificates/generate";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: NextRequest) {
  try {
    const admin = await requireRole(["COORDINATOR"]);
    const body = generateCertificateSchema.parse(await request.json());

    const volunteer = await prisma.volunteerProfile.findUnique({
      where: { id: body.volunteerId },
    });
    if (!volunteer) return NextResponse.json({ error: "Volunteer not found" }, { status: 404 });

    const event = body.eventId
      ? await prisma.event.findUnique({ where: { id: body.eventId } })
      : null;

    const certificateNo = `CERT-${new Date().getFullYear()}-${randomBytes(4)
      .toString("hex")
      .toUpperCase()}`;
    const verificationHash = computeVerificationHash(certificateNo, volunteer.id);
    const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/verify/${verificationHash}`;

    const pdfBytes = await renderCertificatePdf({
      certificateNo,
      volunteerName: volunteer.fullName,
      nssId: volunteer.nssId,
      eventTitle: event?.title ?? "NSS Service",
      hoursAwarded: event ? Number(event.awardedHours) : Number(volunteer.totalHoursServed),
      issuedAt: new Date(),
      verificationUrl,
    });

    const supabaseAdmin = createAdminClient();
    const storagePath = `certificates/${certificateNo}.pdf`;
    const { error: uploadError } = await supabaseAdmin.storage
      .from("certificates")
      .upload(storagePath, Buffer.from(pdfBytes), { contentType: "application/pdf" });
    if (uploadError) throw uploadError;

    const {
      data: { publicUrl },
    } = supabaseAdmin.storage.from("certificates").getPublicUrl(storagePath);

    const certificate = await prisma.certificate.create({
      data: {
        certificateNo,
        volunteerId: volunteer.id,
        eventId: event?.id,
        verificationHash,
        pdfUrl: publicUrl,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId: admin.id,
        action: "CERTIFICATE_ISSUED",
        resourceType: "Certificate",
        resourceId: certificate.id,
        stateDiff: { volunteerId: volunteer.id, eventId: event?.id ?? null },
      },
    });

    return NextResponse.json(certificate, { status: 201 });
  } catch (error) {
    return toErrorResponse(error, "certificates.generate");
  }
}
