import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GenerateCertificateForm } from "./generate-certificate-form";

export default async function AdminCertificatesPage() {
  const user = await getCurrentUser();
  const [certificates, volunteers] = await Promise.all([
    prisma.certificate.findMany({
      include: { volunteer: { select: { fullName: true, nssId: true } } },
      orderBy: { issuedAt: "desc" },
      take: 25,
    }),
    prisma.volunteerProfile.findMany({
      where: { status: "ACTIVE" },
      select: { id: true, fullName: true, nssId: true },
      orderBy: { fullName: "asc" },
    }),
  ]);

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 p-8">
      <h1 className="text-2xl font-semibold">Certificates</h1>

      {user?.role === "COORDINATOR" && <GenerateCertificateForm volunteers={volunteers} />}

      <div className="flex flex-col gap-3">
        {certificates.map((cert) => (
          <Card key={cert.id}>
            <CardHeader>
              <CardTitle className="text-base">
                {cert.volunteer.fullName} ({cert.volunteer.nssId})
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              {cert.certificateNo}
            </CardContent>
          </Card>
        ))}
        {certificates.length === 0 && (
          <p className="text-sm text-muted-foreground">No certificates issued yet.</p>
        )}
      </div>
    </main>
  );
}
