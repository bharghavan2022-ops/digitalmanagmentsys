import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function VerifyCertificatePage({
  params,
}: {
  params: { hash: string };
}) {
  const certificate = await prisma.certificate.findUnique({
    where: { verificationHash: params.hash },
    include: {
      volunteer: { select: { fullName: true, nssId: true } },
      event: { select: { title: true, startTime: true } },
    },
  });

  return (
    <main className="flex flex-1 items-center justify-center p-8">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{certificate ? "Certificate verified" : "Certificate not found"}</CardTitle>
        </CardHeader>
        <CardContent>
          {certificate ? (
            <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
              <dt className="text-muted-foreground">Certificate No.</dt>
              <dd>{certificate.certificateNo}</dd>
              <dt className="text-muted-foreground">Volunteer</dt>
              <dd>{certificate.volunteer.fullName}</dd>
              <dt className="text-muted-foreground">NSS ID</dt>
              <dd>{certificate.volunteer.nssId}</dd>
              <dt className="text-muted-foreground">Event</dt>
              <dd>{certificate.event?.title ?? "—"}</dd>
              <dt className="text-muted-foreground">Issued</dt>
              <dd>{certificate.issuedAt.toISOString().slice(0, 10)}</dd>
            </dl>
          ) : (
            <p className="text-sm text-muted-foreground">
              This verification link does not match any issued certificate.
            </p>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
