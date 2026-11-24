import { FIELD } from "./config";
import type { Particles } from "./particles";
import { smoothstep } from "./rng";

const CL = FIELD.cluster;

// Scratch for computeEdges so nothing is allocated per frame (k is at most 8).
const BEST_D = new Float32Array(8);

/** Total lifetime of a cluster including the edge fade-out. */
export const CLUSTER_LIFETIME = CL.converge + CL.hold + CL.fade;
export const RELEASE_AT = CL.converge + CL.hold;

export type Cluster = {
  cx: number;
  cy: number;
  t0: number;
  /** CLUSTER_HUES index this structure turns into */
  hue: number;
  members: Int32Array;
  ax: Float32Array;
  ay: Float32Array;
  released: boolean;
  /** k nearest members per member (member slots, -1 = none) */
  nn: Int32Array;
  /** edge list as member-slot pairs */
  edges: Int32Array;
  edgeCount: number;
};

/** The nearest idle particles around the click become the cluster. */
export function captureCluster(
  p: Particles,
  n: number,
  cx: number,
  cy: number,
  time: number,
  maxMembers: number,
  neighbours: number,
  hue: number,
): Cluster | null {
  const r2 = CL.captureRadius * CL.captureRadius;
  const cand: { i: number; d: number }[] = [];
  for (let i = 0; i < n; i++) {
    if (p.state[i] !== 0) continue;
    const dx = p.x[i] - cx;
    const dy = p.y[i] - cy;
    const d = dx * dx + dy * dy;
    if (d < r2) cand.push({ i, d });
  }
  if (cand.length < CL.minMembers) return null;
  cand.sort((a, b) => a.d - b.d);
  const m = Math.min(maxMembers, cand.length);
  const members = new Int32Array(m);
  for (let a = 0; a < m; a++) {
    members[a] = cand[a].i;
    p.state[cand[a].i] = 1;
    p.hue[cand[a].i] = hue;
  }
  return {
    cx,
    cy,
    t0: time,
    hue,
    members,
    ax: new Float32Array(m),
    ay: new Float32Array(m),
    released: false,
    nn: new Int32Array(m * neighbours).fill(-1),
    edges: new Int32Array(m * neighbours * 2),
    edgeCount: 0,
  };
}

/**
 * Members are pulled towards the click point while short-range repulsion between
 * neighbours spreads them to an even spacing: that evenly spaced, connected cluster
 * is the "temporary order".
 */
export function stepCluster(c: Cluster, p: Particles, age: number, dt: number) {
  const m = c.members.length;
  const ramp = smoothstep(0, 0.25, age);
  const s0 = CL.spacing;
  const s02 = s0 * s0;
  c.ax.fill(0);
  c.ay.fill(0);

  for (let a = 0; a < m; a++) {
    const i = c.members[a];
    c.ax[a] += (c.cx - p.x[i]) * CL.spring * ramp - p.vx[i] * CL.damping;
    c.ay[a] += (c.cy - p.y[i]) * CL.spring * ramp - p.vy[i] * CL.damping;
  }

  for (let a = 0; a < m; a++) {
    const i = c.members[a];
    for (let b = a + 1; b < m; b++) {
      const j = c.members[b];
      let dx = p.x[j] - p.x[i];
      let dy = p.y[j] - p.y[i];
      let d2 = dx * dx + dy * dy;
      if (d2 >= s02) continue;
      if (d2 < 0.25) {
        dx = a % 2 === 0 ? 0.5 : -0.5;
        dy = b % 2 === 0 ? 0.5 : -0.5;
        d2 = dx * dx + dy * dy;
      }
      const d = Math.sqrt(d2);
      const t = 1 - d / s0;
      const f = CL.repel * t * Math.sqrt(t);
      const fx = (dx / d) * f;
      const fy = (dy / d) * f;
      c.ax[a] -= fx;
      c.ay[a] -= fy;
      c.ax[b] += fx;
      c.ay[b] += fy;
    }
  }

  const boostTarget = CL.nodeBoost * smoothstep(0.2, 0.6, age);
  const boostK = 1 - Math.exp(-dt / 0.25);
  // Colour turns over while the structure forms, so it reads as one thing changing.
  const tintTarget = smoothstep(0.05, 0.5, age);
  const tintK = 1 - Math.exp(-dt / FIELD.tintAttack);
  for (let a = 0; a < m; a++) {
    const i = c.members[a];
    p.vx[i] += c.ax[a] * dt;
    p.vy[i] += c.ay[a] * dt;
    p.x[i] += p.vx[i] * dt;
    p.y[i] += p.vy[i] * dt;
    p.boost[i] += (boostTarget - p.boost[i]) * boostK;
    p.tint[i] += (tintTarget - p.tint[i]) * tintK;
    p.rot[i] += p.spin[i] * dt;
  }
}

/** Members go back to drifting: a small outward kick, independent motion ramps back. */
export function releaseCluster(c: Cluster, p: Particles, rng: () => number) {
  if (c.released) return;
  c.released = true;
  for (let a = 0; a < c.members.length; a++) {
    const i = c.members[a];
    p.state[i] = 0;
    p.free[i] = 0;
    const dx = p.x[i] - c.cx;
    const dy = p.y[i] - c.cy;
    const d = Math.sqrt(dx * dx + dy * dy) || 1;
    p.vx[i] += (dx / d) * CL.releaseKick + (rng() - 0.5) * 20;
    p.vy[i] += (dy / d) * CL.releaseKick + (rng() - 0.5) * 20;
  }
}

/** Edge opacity 0..1 over the cluster's life: fade in, hold, fade out. */
export function clusterEdgeAlpha(age: number): number {
  return (
    smoothstep(0.35, 0.65, age) * (1 - smoothstep(RELEASE_AT, CLUSTER_LIFETIME, age))
  );
}

/** Each member connects to its k nearest members. Cheap: members only (<= 36). */
export function computeEdges(c: Cluster, p: Particles, k: number) {
  const m = c.members.length;
  const nn = c.nn;
  nn.fill(-1);
  const bestD = BEST_D;
  for (let a = 0; a < m; a++) {
    bestD.fill(Infinity);
    const i = c.members[a];
    for (let b = 0; b < m; b++) {
      if (b === a) continue;
      const j = c.members[b];
      const dx = p.x[j] - p.x[i];
      const dy = p.y[j] - p.y[i];
      const d2 = dx * dx + dy * dy;
      if (d2 >= bestD[k - 1]) continue;
      let s = k - 1;
      while (s > 0 && d2 < bestD[s - 1]) {
        bestD[s] = bestD[s - 1];
        nn[a * k + s] = nn[a * k + s - 1];
        s--;
      }
      bestD[s] = d2;
      nn[a * k + s] = b;
    }
  }

  let e = 0;
  const maxLen2 = CL.maxEdgeLen * CL.maxEdgeLen;
  for (let a = 0; a < m; a++) {
    for (let s = 0; s < k; s++) {
      const b = nn[a * k + s];
      if (b < 0) continue;
      // skip the duplicate when the other end also lists us (draw once)
      let mutual = false;
      for (let t = 0; t < k; t++) if (nn[b * k + t] === a) mutual = true;
      if (mutual && b < a) continue;
      const i = c.members[a];
      const j = c.members[b];
      const dx = p.x[j] - p.x[i];
      const dy = p.y[j] - p.y[i];
      if (dx * dx + dy * dy > maxLen2) continue;
      c.edges[e * 2] = a;
      c.edges[e * 2 + 1] = b;
      e++;
    }
  }
  c.edgeCount = e;
}
