import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

function linkedInAddToProfileUrl(cert: {
  certificateNo: string;
  verificationHash: string;
  issuedAt: Date;
  eventTitle: string;
}) {
  const params = new URLSearchParams({
    startTask: "CERTIFICATION_NAME",
    name: cert.eventTitle,
    organizationName: "National Service Scheme",
    issueYear: String(cert.issuedAt.getUTCFullYear()),
    issueMonth: String(cert.issuedAt.getUTCMonth() + 1),
    certId: cert.certificateNo,
    certUrl: `${process.env.NEXT_PUBLIC_APP_URL}/verify/${cert.verificationHash}`,
  });
  return `https://www.linkedin.com/profile/add?${params.toString()}`;
}

export default async function CertificatesPage() {
  const user = await getCurrentUser();
  const volunteer = await prisma.volunteerProfile.findUnique({ where: { userId: user!.id } });
  const certificates = volunteer
    ? await prisma.certificate.findMany({
        where: { volunteerId: volunteer.id },
        include: { event: { select: { title: true } } },
        orderBy: { issuedAt: "desc" },
      })
    : [];

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-4 p-8">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold">My certificates</h1>
        {certificates.length > 0 && (
          <Button asChild variant="outline" size="sm">
            <a href="/api/certificates/dossier">Download all (ZIP)</a>
          </Button>
        )}
      </div>
      {certificates.length === 0 ? (
        <p className="text-sm text-muted-foreground">No certificates issued yet.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {certificates.map((cert) => (
            <Card key={cert.id}>
              <CardHeader>
                <CardTitle className="text-base">{cert.event?.title ?? "NSS Service"}</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-2 text-sm">
                <span className="text-muted-foreground">{cert.certificateNo}</span>
                <div className="flex gap-3">
                  <a
                    href={cert.pdfUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="underline underline-offset-4"
                  >
                    Download PDF
                  </a>
                  <a
                    href={linkedInAddToProfileUrl({
                      certificateNo: cert.certificateNo,
                      verificationHash: cert.verificationHash,
                      issuedAt: cert.issuedAt,
                      eventTitle: cert.event?.title ?? "NSS Community Service",
                    })}
                    target="_blank"
                    rel="noreferrer"
                    className="underline underline-offset-4"
                  >
                    Add to LinkedIn
                  </a>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </main>
  );
}
