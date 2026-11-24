import { describe, expect, it } from "vitest";
import { ALPHA, FIELD_SEED } from "./config";
import { generateLayout } from "./layout";

describe("generateLayout", () => {
  it("is deterministic and prefix-stable (poster matches the live field)", () => {
    const a = generateLayout(110, FIELD_SEED);
    const b = generateLayout(280, FIELD_SEED);
    for (let i = 0; i < 110; i++) {
      expect(b.nx[i]).toBe(a.nx[i]);
      expect(b.ny[i]).toBe(a.ny[i]);
      expect(b.shape[i]).toBe(a.shape[i]);
      expect(b.color[i]).toBe(a.color[i]);
    }
  });

  it("keeps values in range and weights density to the right", () => {
    const L = generateLayout(2000, FIELD_SEED);
    let cyan = 0;
    let right = 0;
    for (let i = 0; i < L.count; i++) {
      expect(L.nx[i]).toBeGreaterThanOrEqual(0);
      expect(L.nx[i]).toBeLessThanOrEqual(1);
      expect(L.alpha[i]).toBeGreaterThanOrEqual(ALPHA.min);
      expect(L.alpha[i]).toBeLessThanOrEqual(ALPHA.min + ALPHA.span);
      cyan += L.color[i];
      if (L.nx[i] > 0.5) right++;
    }
    expect(cyan / L.count).toBeGreaterThan(0.25);
    expect(cyan / L.count).toBeLessThan(0.35);
    expect(right / L.count).toBeGreaterThan(0.6);
  });
});
