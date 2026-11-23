import { createNoise3D, type NoiseFunction3D } from "simplex-noise";
import {
  FIELD,
  FIELD_SEED,
  MODES,
  particleCount,
  type LiveMode,
  type ModeConfig,
} from "./config";
import {
  CLUSTER_LIFETIME,
  RELEASE_AT,
  captureCluster,
  releaseCluster,
  stepCluster,
  type Cluster,
} from "./cluster";
import { SpatialGrid, nearestNeighbours } from "./grid";
import { generateLayout } from "./layout";
import { createParticles, type Particles } from "./particles";
import { mulberry32, smoothstep } from "./rng";

export type Rect = { x: number; y: number; w: number; h: number };
export type Ripple = { x: number; y: number; t0: number };
export type Pointer = {
  x: number;
  y: number;
  tx: number;
  ty: number;
  strength: number;
  inside: boolean;
};

const FL = FIELD.flow;
const HA = FIELD.halo;
const RI = FIELD.ripple;
const PU = FIELD.pull;
const CL = FIELD.cluster;

/**
 * The whole behaviour of the field, with no DOM access: fully deterministic, so it can
 * be unit-tested in Node. `engine.ts` drives it from requestAnimationFrame and
 * `render.ts` draws it.
 */
export class FieldSimulation {
  readonly mode: LiveMode;
  readonly cfg: ModeConfig;
  w = 0;
  h = 0;
  time = 0;
  frame = 0;
  /** Particles currently simulated and drawn (shrinks under adaptive quality). */
  n = 0;
  linksEnabled = true;
  p!: Particles;
  grid: SpatialGrid;
  nn = new Int32Array(0);
  nnD = new Float32Array(0);
  pointer: Pointer = { x: 0, y: 0, tx: 0, ty: 0, strength: 0, inside: false };
  ripples: Ripple[] = [];
  clusters: Cluster[] = [];
  quiet: Rect[] = [];
  /** Simulation time of the last user event (click / pointer entering). */
  lastEvent = 0;

  private noise: NoiseFunction3D = createNoise3D(mulberry32(FIELD_SEED ^ 0x9e37));
  private rng = mulberry32(FIELD_SEED + 7);

  constructor(mode: LiveMode, w: number, h: number) {
    this.mode = mode;
    this.cfg = MODES[mode];
    this.grid = new SpatialGrid(FIELD.linkDist, 1);
    this.resize(w, h);
  }

  resize(w: number, h: number) {
    this.w = w;
    this.h = h;
    const total = particleCount(this.mode, w, h);
    this.rng = mulberry32(FIELD_SEED + 7);
    this.p = createParticles(generateLayout(total, FIELD_SEED), total, w, h, this.rng);
    this.n = total;
    this.grid.resize(w, h, total);
    this.nn = new Int32Array(total * this.cfg.linkMax).fill(-1);
    this.nnD = new Float32Array(total * this.cfg.linkMax);
    this.ripples.length = 0;
    this.clusters.length = 0;
    this.refreshNeighbours();
  }

  setQuiet(rects: Rect[]) {
    this.quiet = rects;
  }

  setPointer(x: number, y: number) {
    const ptr = this.pointer;
    ptr.tx = x;
    ptr.ty = y;
    if (!ptr.inside) {
      this.lastEvent = this.time;
      if (ptr.strength < 0.01) {
        ptr.x = x;
        ptr.y = y;
      }
    }
    ptr.inside = true;
  }

  leavePointer() {
    this.pointer.inside = false;
  }

  /** Ripple, short attractive impulse, then a connected cluster that dissolves again. */
  click(x: number, y: number) {
    this.lastEvent = this.time;
    this.ripples.push({ x, y, t0: this.time });
    if (this.ripples.length > RI.max) this.ripples.shift();

    let live = 0;
    for (let i = 0; i < this.clusters.length; i++) if (!this.clusters[i].released) live++;
    if (live >= FIELD.maxClusters) {
      const oldest = this.clusters.find((c) => !c.released);
      if (oldest) {
        releaseCluster(oldest, this.p, this.rng);
        oldest.t0 = Math.min(oldest.t0, this.time - RELEASE_AT);
      }
    }
    const c = captureCluster(
      this.p,
      this.n,
      x,
      y,
      this.time,
      this.cfg.clusterMax,
      this.cfg.neighbours,
    );
    if (c) this.clusters.push(c);
  }

  /** Adaptive quality: fewer particles, no ambient links. Never scales back up. */
  degrade() {
    for (const c of this.clusters) releaseCluster(c, this.p, this.rng);
    this.n = Math.max(24, Math.floor(this.n * FIELD.quality.shrink));
    this.linksEnabled = false;
  }

  /** 1 = full brightness, lower close to the headline and CTAs. */
  quietAt(x: number, y: number): number {
    let m = 1;
    for (let i = 0; i < this.quiet.length; i++) {
      const r = this.quiet[i];
      const dx = Math.max(r.x - x, 0, x - (r.x + r.w));
      const dy = Math.max(r.y - y, 0, y - (r.y + r.h));
      const d = Math.sqrt(dx * dx + dy * dy);
      const v =
        FIELD.quietMin + (1 - FIELD.quietMin) * smoothstep(0, FIELD.quietFalloff, d);
      if (v < m) m = v;
    }
    return m;
  }

  /** True while anything beyond idle drift is going on (drives 60fps vs 30fps). */
  isActive() {
    return (
      this.pointer.inside ||
      this.pointer.strength > 0.02 ||
      this.ripples.length > 0 ||
      this.clusters.length > 0
    );
  }

  /** The invariant: nothing persists. Used by tests and the dev assertion. */
  isAtRest() {
    if (this.clusters.length || this.ripples.length) return false;
    const p = this.p;
    for (let i = 0; i < this.n; i++) {
      if (p.state[i] !== 0 || p.free[i] < 1 || p.flash[i] > 0.02 || p.boost[i] > 0.02)
        return false;
    }
    return true;
  }

  step(dt: number) {
    const { p, n } = this;
    const t = (this.time += dt);
    this.frame++;
    this.updatePointer(dt);

    // Cluster members follow their own forces and are released on schedule.
    for (let c = 0; c < this.clusters.length; c++) {
      const cl = this.clusters[c];
      if (cl.released) continue;
      const age = t - cl.t0;
      if (age >= RELEASE_AT) releaseCluster(cl, p, this.rng);
      else stepCluster(cl, p, age, dt);
    }

    const w = this.w;
    const h = this.h;
    const M = FIELD.wrapMargin;
    const ptr = this.pointer;
    const haloOn = this.cfg.halo && ptr.strength > 0.01;
    const R2 = HA.outer * HA.outer;
    const flashK = Math.exp(-dt / FIELD.flashDecay);
    const boostK = Math.exp(-dt / FIELD.boostDecay);
    const nR = this.ripples.length;
    const nC = this.clusters.length;

    for (let i = 0; i < n; i++) {
      p.flash[i] *= flashK;
      if (p.state[i] === 1) continue;
      p.boost[i] *= boostK;
      if (p.free[i] < 1) p.free[i] = Math.min(1, p.free[i] + dt / FIELD.freeRamp);

      const x = p.x[i];
      const y = p.y[i];
      const depth = p.depth[i];

      // Ambient drift: each particle relaxes towards the local flow velocity.
      const fx =
        this.noise(x * FL.scale, y * FL.scale, t * FL.timeScale) * FL.speed * depth;
      const fy =
        this.noise(x * FL.scale + 37.1, y * FL.scale + 11.7, t * FL.timeScale + 5.3) *
        FL.speed *
        depth;
      const relax = FL.relax * (0.2 + 0.8 * p.free[i]);
      let ax = (fx - p.vx[i]) * relax;
      let ay = (fy - p.vy[i]) * relax;

      // Cursor halo: attraction from the outer band, soft repulsion in the core, swirl.
      if (haloOn) {
        const dx = ptr.x - x;
        const dy = ptr.y - y;
        const d2 = dx * dx + dy * dy;
        if (d2 < R2 && d2 > 1) {
          const d = Math.sqrt(d2);
          const nx = dx / d;
          const ny = dy / d;
          const s = ptr.strength;
          const outer = 1 - d / HA.outer;
          let f = HA.attract * outer * Math.sqrt(outer) * s;
          if (d < HA.core) {
            const c = 1 - d / HA.core;
            f -= HA.repel * c * c * s;
          }
          const swirl = HA.swirl * outer * smoothstep(0, 30, d) * s * p.orbit[i];
          ax += nx * f - ny * swirl;
          ay += ny * f + nx * swirl;
        }
      }

      // Click ripple: an expanding ring nudges particles outward as it passes.
      for (let r = 0; r < nR; r++) {
        const rp = this.ripples[r];
        const age = t - rp.t0;
        if (age >= RI.duration) continue;
        const dx = x - rp.x;
        const dy = y - rp.y;
        const d = Math.sqrt(dx * dx + dy * dy) || 1;
        const delta = d - RI.speed * age;
        if (delta > 3 * RI.band || delta < -3 * RI.band) continue;
        const life = 1 - age / RI.duration;
        const wave = Math.exp(-(delta * delta) / (2 * RI.band * RI.band));
        ax += (dx / d) * RI.impulse * wave * life;
        ay += (dy / d) * RI.impulse * wave * life;
        const fl = RI.flash * wave * life;
        if (fl > p.flash[i]) p.flash[i] = fl;
      }

      // Short attractive impulse towards a fresh click.
      for (let c = 0; c < nC; c++) {
        const cl = this.clusters[c];
        const age = t - cl.t0;
        if (age >= PU.duration) continue;
        const dx = cl.cx - x;
        const dy = cl.cy - y;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d >= PU.radius || d < 1) continue;
        const f = PU.strength * (1 - d / PU.radius) * (1 - age / PU.duration);
        ax += (dx / d) * f;
        ay += (dy / d) * f;
      }

      p.vx[i] += ax * dt;
      p.vy[i] += ay * dt;
      let nx2 = x + p.vx[i] * dt;
      let ny2 = y + p.vy[i] * dt;
      if (nx2 < -M) nx2 += w + 2 * M;
      else if (nx2 > w + M) nx2 -= w + 2 * M;
      if (ny2 < -M) ny2 += h + 2 * M;
      else if (ny2 > h + M) ny2 -= h + 2 * M;
      p.x[i] = nx2;
      p.y[i] = ny2;
      p.rot[i] += p.spin[i] * dt;
    }

    // Drop finished events.
    for (let r = this.ripples.length - 1; r >= 0; r--) {
      if (t - this.ripples[r].t0 >= RI.duration) this.ripples.splice(r, 1);
    }
    for (let c = this.clusters.length - 1; c >= 0; c--) {
      if (t - this.clusters[c].t0 >= CLUSTER_LIFETIME && this.clusters[c].released)
        this.clusters.splice(c, 1);
    }

    if (this.linksEnabled && this.frame % this.cfg.linkEvery === 0)
      this.refreshNeighbours();
  }

  private updatePointer(dt: number) {
    const ptr = this.pointer;
    const target = ptr.inside && this.cfg.halo ? 1 : 0;
    const rate = target > ptr.strength ? 1 / HA.rampIn : 1 / HA.rampOut;
    if (ptr.strength < target) ptr.strength = Math.min(target, ptr.strength + rate * dt);
    else ptr.strength = Math.max(target, ptr.strength - rate * dt);
    const k = 1 - Math.exp(-14 * dt);
    ptr.x += (ptr.tx - ptr.x) * k;
    ptr.y += (ptr.ty - ptr.y) * k;
  }

  private refreshNeighbours() {
    const { p, n } = this;
    this.grid.rebuild(p.x, p.y, n);
    nearestNeighbours(
      this.grid,
      p.x,
      p.y,
      n,
      FIELD.linkDist,
      this.cfg.linkMax,
      this.nn,
      this.nnD,
    );
  }
}

/** Convenience for tests and the dev assertion: ripple/cluster constants in one place. */
export const TIMELINE = {
  release: RELEASE_AT,
  lifetime: CLUSTER_LIFETIME,
  converge: CL.converge,
} as const;
