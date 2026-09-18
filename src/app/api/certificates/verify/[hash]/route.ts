import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { toErrorResponse } from "@/lib/api/error-response";
import { checkRateLimit, clientIpFrom } from "@/lib/api/rate-limit";

const RATE_LIMIT = 20;
const RATE_WINDOW_MS = 60_000;

// Public, unauthenticated verification endpoint. Returns only the minimal
// safe-to-disclose fields - never volunteer contact details. Rate-limited
// per PROJECT_CONTEXT.md §2 since it takes no auth and is open to anyone
// with a guessable-length hash.
export async function GET(request: Request, { params }: { params: { hash: string } }) {
  try {
    const { allowed, retryAfterSeconds } = checkRateLimit(
      `verify:${clientIpFrom(request)}`,
      RATE_LIMIT,
      RATE_WINDOW_MS,
    );
    if (!allowed) {
      return NextResponse.json(
        { error: "Too many requests, please try again shortly" },
        { status: 429, headers: { "Retry-After": String(retryAfterSeconds) } },
      );
    }

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
