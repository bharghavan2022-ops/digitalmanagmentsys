import { describe, it, expect, afterEach } from "vitest";
import { ensureWebSocketShim } from "@/lib/supabase/websocket-shim";

describe("ensureWebSocketShim", () => {
  const original = globalThis.WebSocket;

  afterEach(() => {
    if (original === undefined) {
      // @ts-expect-error - deliberately restoring the "unset" state
      delete globalThis.WebSocket;
    } else {
      globalThis.WebSocket = original;
    }
  });

  it("defines a WebSocket constructor when none exists", () => {
    // @ts-expect-error - deliberately unsetting for the test
    delete globalThis.WebSocket;

    ensureWebSocketShim();

    expect(typeof globalThis.WebSocket).toBe("function");
  });

  it("never overwrites a real WebSocket implementation", () => {
    class RealWebSocket {}
    // @ts-expect-error - test double
    globalThis.WebSocket = RealWebSocket;

    ensureWebSocketShim();

    expect(globalThis.WebSocket).toBe(RealWebSocket);
  });
});
