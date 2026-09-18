import Link from "next/link";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 p-8 text-center">
      <h1 className="text-3xl font-bold tracking-tight">NSS Connect</h1>
      <p className="max-w-md text-muted-foreground">
        Digital management system for NSS volunteers, events, attendance and
        certificates.
      </p>
      <div className="flex gap-4">
        <Link href="/login" className="underline underline-offset-4">
          Log in
        </Link>
        <Link href="/register" className="underline underline-offset-4">
          Register
        </Link>
      </div>
    </main>
  );
}
