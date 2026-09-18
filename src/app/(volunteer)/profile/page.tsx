import QRCode from "qrcode";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function ProfilePage() {
  const user = await getCurrentUser();
  const volunteer = await prisma.volunteerProfile.findUnique({ where: { userId: user!.id } });

  if (!volunteer) {
    return (
      <main className="mx-auto w-full max-w-md p-8">
        <p className="text-sm text-muted-foreground">Complete your registration to see your Digital ID.</p>
      </main>
    );
  }

  // Encodes a signed profile-snippet URL, not raw personal data - the QR
  // itself carries no PII, only a pointer a verifier resolves server-side.
  const profileUrl = `${process.env.NEXT_PUBLIC_APP_URL}/verify/profile/${volunteer.id}`;
  const qrDataUrl = await QRCode.toDataURL(profileUrl, { margin: 1, width: 220 });

  return (
    <main className="mx-auto flex w-full max-w-md flex-col gap-6 p-8">
      <Card>
        <CardHeader>
          <CardTitle>Digital NSS ID</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={qrDataUrl} alt="Digital ID QR code" width={220} height={220} />
          <dl className="grid w-full grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
            <dt className="text-muted-foreground">Name</dt>
            <dd>{volunteer.fullName}</dd>
            <dt className="text-muted-foreground">NSS ID</dt>
            <dd>{volunteer.nssId}</dd>
            <dt className="text-muted-foreground">Department</dt>
            <dd>{volunteer.department}</dd>
            <dt className="text-muted-foreground">Status</dt>
            <dd>{volunteer.status}</dd>
          </dl>
        </CardContent>
      </Card>
    </main>
  );
}
