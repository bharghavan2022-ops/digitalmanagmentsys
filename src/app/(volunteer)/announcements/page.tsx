import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function VolunteerAnnouncementsPage() {
  const user = await getCurrentUser();
  const announcements = await prisma.announcement.findMany({
    where: { OR: [{ audience: null }, { audience: user!.role }] },
    orderBy: { createdAt: "desc" },
  });

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-4 p-8">
      <h1 className="text-2xl font-semibold">Announcements</h1>
      {announcements.length === 0 ? (
        <p className="text-sm text-muted-foreground">No announcements yet.</p>
      ) : (
        announcements.map((a) => (
          <Card key={a.id}>
            <CardHeader>
              <CardTitle className="text-base">{a.title}</CardTitle>
            </CardHeader>
            <CardContent className="text-sm">{a.body}</CardContent>
          </Card>
        ))
      )}
    </main>
  );
}
