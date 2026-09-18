import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { toErrorResponse } from "@/lib/api/error-response";

// Public, unauthenticated verification endpoint. Returns only the minimal
// safe-to-disclose fields - never volunteer contact details.
export async function GET(_request: Request, { params }: { params: { hash: string } }) {
  try {
    const certificate = await prisma.certificate.findUnique({
      where: { verificationHash: params.hash },
      include: {
        volunteer: { select: { fullName: true, nssId: true } },
        event: { select: { title: true, startTime: true } },
      },
    });

    if (!certificate) {
      return NextResponse.json({ valid: false }, { status: 404 });
    }

    return NextResponse.json({
      valid: true,
      certificateNo: certificate.certificateNo,
      issuedAt: certificate.issuedAt,
      volunteerName: certificate.volunteer.fullName,
      nssId: certificate.volunteer.nssId,
      eventTitle: certificate.event?.title ?? null,
    });
  } catch (error) {
    return toErrorResponse(error, "certificates.verify");
  }
}
