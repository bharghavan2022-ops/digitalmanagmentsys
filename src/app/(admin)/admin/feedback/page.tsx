import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function AdminFeedbackPage() {
  const feedback = await prisma.feedback.findMany({
    include: {
      volunteer: { select: { fullName: true, nssId: true } },
      event: { select: { title: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-4 p-8">
      <h1 className="text-2xl font-semibold">Event feedback</h1>
      {feedback.length === 0 ? (
        <p className="text-sm text-muted-foreground">No feedback submitted yet.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {feedback.map((f) => (
            <Card key={f.id}>
              <CardHeader>
                <CardTitle className="text-base">
                  {f.event.title} - {"★".repeat(f.rating)}
                  {"☆".repeat(5 - f.rating)}
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-1 text-sm">
                <span className="text-muted-foreground">
                  {f.volunteer.fullName} ({f.volunteer.nssId})
                </span>
                {f.message && <p>{f.message}</p>}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </main>
  );
}
