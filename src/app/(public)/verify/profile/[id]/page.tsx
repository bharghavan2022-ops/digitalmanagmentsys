import { getPublicVolunteerCard } from "@/lib/volunteers/public-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function VerifyProfilePage({ params }: { params: { id: string } }) {
  const volunteer = await getPublicVolunteerCard(params.id);

  return (
    <main className="flex flex-1 items-center justify-center p-8">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{volunteer ? "Verified NSS volunteer" : "Not found"}</CardTitle>
        </CardHeader>
        <CardContent>
          {volunteer ? (
            <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
              <dt className="text-muted-foreground">Name</dt>
              <dd>{volunteer.fullName}</dd>
              <dt className="text-muted-foreground">NSS ID</dt>
              <dd>{volunteer.nssId}</dd>
              <dt className="text-muted-foreground">Department</dt>
              <dd>{volunteer.department}</dd>
              <dt className="text-muted-foreground">Status</dt>
              <dd>{volunteer.status}</dd>
            </dl>
          ) : (
            <p className="text-sm text-muted-foreground">
              This QR code does not match any NSS volunteer record.
            </p>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
