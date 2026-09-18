"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";

const REFRESH_MS = 25_000; // Well under the 30s token TTL so the projector
// never shows an already-expired code.

export function LiveTokenProjector({ eventId }: { eventId: string }) {
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function refresh() {
      const response = await fetch(`/api/events/${eventId}/token`);
      if (cancelled) return;
      if (!response.ok) {
        setError("Could not refresh check-in token.");
        return;
      }
      const { token } = await response.json();
      const dataUrl = await QRCode.toDataURL(token, { margin: 1, width: 360 });
      if (!cancelled) {
        setQrDataUrl(dataUrl);
        setError(null);
      }
    }

    refresh();
    const interval = setInterval(refresh, REFRESH_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [eventId]);

  if (error) return <p className="text-red-400">{error}</p>;
  if (!qrDataUrl) return <p>Loading...</p>;

  // eslint-disable-next-line @next/next/no-img-element
  return <img src={qrDataUrl} alt="Rotating check-in QR code" width={360} height={360} />;
}
