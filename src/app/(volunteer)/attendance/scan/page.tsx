"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Status = "idle" | "scanning" | "checking-in" | "success" | "error";

export default function AttendanceScanPage() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [message, setMessage] = useState<string>("");

  useEffect(() => {
    let stream: MediaStream | null = null;
    let cancelled = false;
    let rafId: number;

    async function start() {
      if (!("BarcodeDetector" in window)) {
        setStatus("error");
        setMessage("This browser can't scan QR codes. Use a Chromium-based browser.");
        return;
      }

      stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      if (cancelled || !videoRef.current) return;
      videoRef.current.srcObject = stream;
      await videoRef.current.play();
      setStatus("scanning");

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const detector = new (window as any).BarcodeDetector({ formats: ["qr_code"] });

      const tick = async () => {
        if (cancelled || !videoRef.current) return;
        try {
          const codes = await detector.detect(videoRef.current);
          if (codes.length > 0) {
            await handleToken(codes[0].rawValue as string);
            return;
          }
        } catch {
          // Detection can throw on a frame with no readable code - ignore
          // and keep scanning.
        }
        rafId = requestAnimationFrame(tick);
      };
      rafId = requestAnimationFrame(tick);
    }

    async function handleToken(token: string) {
      setStatus("checking-in");

      // The token's own first segment is the eventId it was issued for
      // (see issueCheckInToken); the server re-validates this match, so a
      // tampered value is simply rejected there.
      const eventId = token.split(".")[0];
      if (!eventId) {
        setStatus("error");
        setMessage("Scanned code is not a valid check-in QR.");
        return;
      }

      const position = await new Promise<GeolocationPosition | null>((resolve) =>
        navigator.geolocation.getCurrentPosition(resolve, () => resolve(null), {
          timeout: 5000,
        }),
      );

      const response = await fetch("/api/attendance/check-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId,
          token,
          latitude: position?.coords.latitude,
          longitude: position?.coords.longitude,
        }),
      });

      if (cancelled) return;
      if (response.ok) {
        setStatus("success");
        setMessage("Attendance verified.");
      } else {
        const body = await response.json().catch(() => ({}));
        setStatus("error");
        setMessage(body.error ?? "Check-in failed.");
      }
    }

    start();

    return () => {
      cancelled = true;
      cancelAnimationFrame(rafId);
      stream?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  return (
    <main className="mx-auto flex w-full max-w-md flex-col gap-4 p-8">
      <Card>
        <CardHeader>
          <CardTitle>Scan check-in QR</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <video ref={videoRef} className="w-full rounded-md bg-black" muted playsInline />
          <p className="text-sm text-muted-foreground">
            {status === "scanning" && "Point your camera at the projected QR code."}
            {status === "checking-in" && "Verifying..."}
            {status === "success" && message}
            {status === "error" && message}
          </p>
          {status === "success" && (
            <Button onClick={() => window.location.reload()}>Scan again</Button>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
