"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Logo } from "@/components/shared/logo";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [unconfirmedEmail, setUnconfirmedEmail] = useState<string | null>(null);
  const [resendState, setResendState] = useState<"idle" | "sending" | "sent">("idle");

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setUnconfirmedEmail(null);
    setResendState("idle");

    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });

    setLoading(false);
    if (signInError) {
      // Supabase's own message here ("Email not confirmed") leaves someone
      // stuck with no way forward if their original confirmation email
      // never arrived or expired - offer to resend it instead of just
      // showing that message.
      if (signInError.message.toLowerCase().includes("confirm")) {
        setUnconfirmedEmail(email);
      } else {
        setError(signInError.message);
      }
      return;
    }
    router.push("/post-login");
    router.refresh();
  }

  async function handleResend() {
    if (!unconfirmedEmail) return;
    setResendState("sending");
    const supabase = createClient();
    await supabase.auth.resend({ type: "signup", email: unconfirmedEmail });
    setResendState("sent");
  }

  return (
    <main className="flex flex-1 items-center justify-center p-8">
      <Card className="w-full max-w-sm">
        <CardHeader className="flex flex-col items-center gap-3">
          <Logo />
          <CardTitle>Log in</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            {unconfirmedEmail && (
              <div className="text-sm text-destructive">
                <p>Confirm your email before logging in.</p>
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={resendState !== "idle"}
                  className="underline underline-offset-2 disabled:no-underline"
                >
                  {resendState === "sent"
                    ? "Confirmation email resent"
                    : resendState === "sending"
                      ? "Resending..."
                      : "Resend confirmation email"}
                </button>
              </div>
            )}
            <Button type="submit" disabled={loading}>
              {loading ? "Signing in..." : "Sign in"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
