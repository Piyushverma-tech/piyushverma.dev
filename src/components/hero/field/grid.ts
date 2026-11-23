/**
 * Uniform grid (cell size = link distance). Neighbour queries only look at the 3x3
 * cells around a particle, so connections are O(n) instead of O(n²).
 */
export class SpatialGrid {
  readonly cell: number;
  cols = 1;
  rows = 1;
  head = new Int32Array(1);
  next: Int32Array;

  constructor(cell: number, capacity: number) {
    this.cell = cell;
    this.next = new Int32Array(capacity);
  }

  resize(w: number, h: number, capacity: number) {
    this.cols = Math.max(1, Math.ceil(w / this.cell));
    this.rows = Math.max(1, Math.ceil(h / this.cell));
    this.head = new Int32Array(this.cols * this.rows);
    if (this.next.length < capacity) this.next = new Int32Array(capacity);
  }

  cx(x: number) {
    const c = Math.floor(x / this.cell);
    return c < 0 ? 0 : c >= this.cols ? this.cols - 1 : c;
  }

  cy(y: number) {
    const c = Math.floor(y / this.cell);
    return c < 0 ? 0 : c >= this.rows ? this.rows - 1 : c;
  }

  rebuild(x: Float32Array, y: Float32Array, n: number) {
    this.head.fill(-1);
    for (let i = 0; i < n; i++) {
      const c = this.cy(y[i]) * this.cols + this.cx(x[i]);
      this.next[i] = this.head[c];
      this.head[c] = i;
    }
  }
}

/**
 * For each of the first `n` particles, the `k` nearest others within `radius`.
 * Writes indices into `out` (n*k, -1 = none) and squared distances into `outD`.
 */
export function nearestNeighbours(
  grid: SpatialGrid,
  x: Float32Array,
  y: Float32Array,
  n: number,
  radius: number,
  k: number,
  out: Int32Array,
  outD: Float32Array,
) {
  const r2 = radius * radius;
  for (let i = 0; i < n; i++) {
    const base = i * k;
    for (let s = 0; s < k; s++) {
      out[base + s] = -1;
      outD[base + s] = r2;
    }
    const xi = x[i];
    const yi = y[i];
    const c0 = grid.cx(xi);
    const r0 = grid.cy(yi);
    for (let gy = Math.max(0, r0 - 1); gy <= Math.min(grid.rows - 1, r0 + 1); gy++) {
      for (let gx = Math.max(0, c0 - 1); gx <= Math.min(grid.cols - 1, c0 + 1); gx++) {
        for (let j = grid.head[gy * grid.cols + gx]; j !== -1; j = grid.next[j]) {
          if (j === i) continue;
          const dx = x[j] - xi;
          const dy = y[j] - yi;
          const d2 = dx * dx + dy * dy;
          if (d2 >= outD[base + k - 1]) continue;
          // insertion into the sorted short list
          let s = k - 1;
          while (s > 0 && d2 < outD[base + s - 1]) {
            outD[base + s] = outD[base + s - 1];
            out[base + s] = out[base + s - 1];
            s--;
          }
          outD[base + s] = d2;
          out[base + s] = j;
        }
      }
    }
  }
}
