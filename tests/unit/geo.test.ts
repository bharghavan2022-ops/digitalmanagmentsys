import { describe, expect, it } from "vitest";
import { haversineDistanceMeters } from "@/lib/attendance/geo";

describe("haversineDistanceMeters", () => {
  it("returns ~0 for identical coordinates", () => {
    const point = { latitude: 12.9716, longitude: 77.5946 };
    expect(haversineDistanceMeters(point, point)).toBeCloseTo(0, 3);
  });

  it("matches a known distance between two cities within 1%", () => {
    // Bengaluru to Chennai, ~290km great-circle distance.
    const bengaluru = { latitude: 12.9716, longitude: 77.5946 };
    const chennai = { latitude: 13.0827, longitude: 80.2707 };
    const distanceKm = haversineDistanceMeters(bengaluru, chennai) / 1000;
    expect(distanceKm).toBeGreaterThan(287);
    expect(distanceKm).toBeLessThan(293);
  });
});
