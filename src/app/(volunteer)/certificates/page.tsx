import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

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
      <h1 className="text-2xl font-semibold">My certificates</h1>
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
                <a
                  href={cert.pdfUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="underline underline-offset-4"
                >
                  Download PDF
                </a>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </main>
  );
}
