import { describe, expect, it } from "vitest";
import { SpatialGrid, nearestNeighbours } from "./grid";
import { mulberry32 } from "./rng";

describe("nearestNeighbours", () => {
  it("matches a brute-force search", () => {
    const r = mulberry32(42);
    const n = 300;
    const W = 1000;
    const H = 600;
    const x = new Float32Array(n);
    const y = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      x[i] = r() * W;
      y[i] = r() * H;
    }
    const k = 2;
    const radius = 96;
    const grid = new SpatialGrid(radius, n);
    grid.resize(W, H, n);
    grid.rebuild(x, y, n);
    const out = new Int32Array(n * k);
    const outD = new Float32Array(n * k);
    nearestNeighbours(grid, x, y, n, radius, k, out, outD);

    for (let i = 0; i < n; i++) {
      const brute: { j: number; d: number }[] = [];
      for (let j = 0; j < n; j++) {
        if (j === i) continue;
        const d = (x[j] - x[i]) ** 2 + (y[j] - y[i]) ** 2;
        if (d < radius * radius) brute.push({ j, d });
      }
      brute.sort((a, b) => a.d - b.d);
      for (let s = 0; s < k; s++) {
        expect(out[i * k + s]).toBe(brute[s] ? brute[s].j : -1);
      }
    }
  });
});
