import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminReportsPage() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-4 p-8">
      <h1 className="text-2xl font-semibold">Reports</h1>
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Volunteer hours roster</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-3">
          <Button asChild>
            <a href="/api/reports/export">Download CSV</a>
          </Button>
          <Button asChild variant="outline">
            <a href="/api/reports/export?format=xlsx">Download XLSX</a>
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
