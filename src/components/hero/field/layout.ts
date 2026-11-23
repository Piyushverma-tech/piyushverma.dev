import { mulberry32, smoothstep } from "./rng";

export const SHAPE = { dot: 0, square: 1, tick: 2, plus: 3 } as const;

export type Layout = {
  count: number;
  /** Normalised 0..1 positions so the layout works at any size. */
  nx: Float32Array;
  ny: Float32Array;
  color: Uint8Array; // 0 grey, 1 cyan
  shape: Uint8Array;
  /** dot radius / square half-size / tick half-length / plus half-size, in px */
  size: Float32Array;
  alpha: Float32Array;
  rot: Float32Array;
  depth: Float32Array;
};

/**
 * Deterministic layout. Prefix-stable: the first N particles are identical whatever
 * `count` is, so the server-rendered poster matches the live field's first frame.
 * Density is weighted to the right ~60% so the headline side stays quiet.
 */
export function generateLayout(count: number, seed: number): Layout {
  const r = mulberry32(seed);
  const L: Layout = {
    count,
    nx: new Float32Array(count),
    ny: new Float32Array(count),
    color: new Uint8Array(count),
    shape: new Uint8Array(count),
    size: new Float32Array(count),
    alpha: new Float32Array(count),
    rot: new Float32Array(count),
    depth: new Float32Array(count),
  };

  for (let i = 0; i < count; i++) {
    let nx = 0;
    let ny = 0;
    for (let tries = 0; tries < 12; tries++) {
      nx = r();
      ny = r();
      if (r() < 0.3 + 0.7 * smoothstep(0.2, 0.65, nx)) break;
    }
    const s = r();
    const shape =
      s < 0.5 ? SHAPE.dot : s < 0.8 ? SHAPE.square : s < 0.95 ? SHAPE.tick : SHAPE.plus;

    L.nx[i] = nx;
    L.ny[i] = ny;
    L.color[i] = r() < 0.3 ? 1 : 0;
    L.shape[i] = shape;
    L.size[i] =
      shape === SHAPE.dot
        ? 1 + r()
        : shape === SHAPE.square
          ? 1.5 + r()
          : shape === SHAPE.tick
            ? 3 + 2 * r()
            : 2 + r();
    L.alpha[i] = 0.1 + 0.18 * r();
    L.rot[i] = r() * Math.PI;
    L.depth[i] = 0.4 + 0.6 * r();
  }
  return L;
}
