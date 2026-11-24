import { FIELD } from "./config";
import type { Layout } from "./layout";

/** Struct-of-arrays store: typed arrays only, nothing allocated per frame. */
export type Particles = {
  count: number;
  x: Float32Array;
  y: Float32Array;
  vx: Float32Array;
  vy: Float32Array;
  /** resting alpha */
  alpha: Float32Array;
  size: Float32Array;
  rot: Float32Array;
  spin: Float32Array;
  depth: Float32Array;
  /** transient brightness from a passing ripple */
  flash: Float32Array;
  /** brightness while part of a cluster */
  boost: Float32Array;
  /** 0..1: "charge" pulse intensity, decays exponentially */
  pulse: Float32Array;
  /** simulation time of this particle's next pulse */
  pulseAt: Float32Array;
  /** 0..1: how far the particle has moved from its own colour to its cluster's hue */
  tint: Float32Array;
  /** CLUSTER_HUES index of the cluster that last captured it */
  hue: Uint8Array;
  /** 0..1: how much of its independent motion a particle has regained after release */
  free: Float32Array;
  color: Uint8Array;
  shape: Uint8Array;
  /** 0 idle, 1 captured by a cluster */
  state: Uint8Array;
  /** swirl direction around the cursor: +1 or -1 */
  orbit: Int8Array;
  /** scratch: alpha bucket for this frame, -1 = hidden */
  bucket: Int8Array;
};

export function createParticles(
  layout: Layout,
  count: number,
  w: number,
  h: number,
  rng: () => number,
): Particles {
  const p: Particles = {
    count,
    x: new Float32Array(count),
    y: new Float32Array(count),
    vx: new Float32Array(count),
    vy: new Float32Array(count),
    alpha: new Float32Array(count),
    size: new Float32Array(count),
    rot: new Float32Array(count),
    spin: new Float32Array(count),
    depth: new Float32Array(count),
    flash: new Float32Array(count),
    boost: new Float32Array(count),
    pulse: new Float32Array(count),
    pulseAt: new Float32Array(count),
    tint: new Float32Array(count),
    hue: new Uint8Array(count),
    free: new Float32Array(count).fill(1),
    color: new Uint8Array(count),
    shape: new Uint8Array(count),
    state: new Uint8Array(count),
    orbit: new Int8Array(count),
    bucket: new Int8Array(count),
  };
  for (let i = 0; i < count; i++) {
    p.x[i] = layout.nx[i] * w;
    p.y[i] = layout.ny[i] * h;
    p.alpha[i] = layout.alpha[i];
    p.size[i] = layout.size[i];
    p.rot[i] = layout.rot[i];
    p.spin[i] = (rng() - 0.5) * 0.5;
    p.depth[i] = layout.depth[i];
    p.color[i] = layout.color[i];
    p.shape[i] = layout.shape[i];
    p.orbit[i] = rng() < 0.5 ? 1 : -1;
  }
  // Drawn after the loop so the sequence above (spin, orbit) is unchanged. Spread over
  // the first gap so the field never starts with everything dark, or all lit at once.
  for (let i = 0; i < count; i++) p.pulseAt[i] = rng() * FIELD.pulse.gapMax;
  return p;
}
