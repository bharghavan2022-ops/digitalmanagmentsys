import { NextResponse } from "next/server";
import JSZip from "jszip";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { UnauthorizedError, ForbiddenError } from "@/lib/auth/rbac";
import { toErrorResponse } from "@/lib/api/error-response";

// Bundles every certificate the current volunteer holds into one ZIP,
// fetched from Supabase Storage at request time (nothing extra is stored -
// each PDF already lives at Certificate.pdfUrl).
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) throw new UnauthorizedError("Not signed in");
    if (user.role !== "VOLUNTEER") {
      throw new ForbiddenError("Only volunteers hold a certificate dossier");
    }

    const volunteer = await prisma.volunteerProfile.findUnique({ where: { userId: user.id } });
    if (!volunteer) {
      return NextResponse.json({ error: "Complete your volunteer profile first" }, { status: 400 });
    }

    const certificates = await prisma.certificate.findMany({ where: { volunteerId: volunteer.id } });
    if (certificates.length === 0) {
      return NextResponse.json({ error: "No certificates to bundle yet" }, { status: 400 });
    }

    const zip = new JSZip();
    const results = await Promise.allSettled(
      certificates.map(async (cert) => {
        const response = await fetch(cert.pdfUrl);
        if (!response.ok) throw new Error(`Fetch failed for ${cert.certificateNo}`);
        const bytes = await response.arrayBuffer();
        zip.file(`${cert.certificateNo}.pdf`, bytes);
      }),
    );

    const failures = results.filter((r): r is PromiseRejectedResult => r.status === "rejected");
    if (failures.length > 0) {
      console.error({ operation: "certificates.dossier", failureCount: failures.length });
    }
    if (failures.length === results.length) {
      return NextResponse.json({ error: "Could not fetch any certificate PDFs" }, { status: 502 });
    }

    const zipBytes = await zip.generateAsync({ type: "nodebuffer" });

    return new NextResponse(Buffer.from(zipBytes), {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="nss-certificates-${volunteer.nssId}.zip"`,
      },
    });
  } catch (error) {
    return toErrorResponse(error, "certificates.dossier");
  }
}
