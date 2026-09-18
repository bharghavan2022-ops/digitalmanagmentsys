import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/session";
import { markAnnouncementsSeen } from "@/lib/announcements/mark-seen";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CreateAnnouncementForm } from "./create-announcement-form";

export default async function AdminAnnouncementsPage() {
  const user = await getCurrentUser();
  const announcements = await prisma.announcement.findMany({ orderBy: { createdAt: "desc" } });
  await markAnnouncementsSeen(user!.id);

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-6 p-8">
      <h1 className="text-2xl font-semibold">Announcements</h1>

      {user?.role === "COORDINATOR" && <CreateAnnouncementForm />}

      <div className="flex flex-col gap-3">
        {announcements.map((a) => (
          <Card key={a.id}>
            <CardHeader>
              <CardTitle className="text-base">{a.title}</CardTitle>
            </CardHeader>
            <CardContent className="text-sm">
              <p>{a.body}</p>
              <p className="mt-1 text-muted-foreground">Audience: {a.audience ?? "Everyone"}</p>
            </CardContent>
          </Card>
        ))}
        {announcements.length === 0 && (
          <p className="text-sm text-muted-foreground">No announcements yet.</p>
        )}
      </div>
    </main>
  );
}
