import Link from "next/link";
import { Logo } from "@/components/shared/logo";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 p-8 text-center">
      <Logo className="scale-125" />
      <p className="max-w-md text-muted-foreground">
        Digital management system for NSS volunteers, events, attendance and
        certificates. <span className="font-medium">Not Me But You.</span>
      </p>
      <div className="flex gap-4">
        <Button asChild>
          <Link href="/login">Log in</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/register">Register</Link>
        </Button>
      </div>
    </main>
  );
}
