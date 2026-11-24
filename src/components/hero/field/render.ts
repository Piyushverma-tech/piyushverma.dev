import { CLUSTER_HUES, COLOR, FIELD } from "./config";
import { clusterEdgeAlpha, computeEdges } from "./cluster";
import { SHAPE } from "./layout";
import type { Particles } from "./particles";
import type { FieldSimulation } from "./simulation";

const TAU = Math.PI * 2;
const CL = FIELD.cluster;
const RI = FIELD.ripple;
const HA = FIELD.halo;
const PL = FIELD.pulse;
/** below this a particle counts as untinted (keep in step with the simulation's rest test) */
const TINT_MIN = 0.01;

// Reused between frames so drawing allocates nothing.
let linkBucket = new Int8Array(0);
let glowBucket = new Int8Array(0);

/**
 * Everything is batched: one path per (colour, alpha bucket) instead of one draw call
 * per particle. No shadowBlur, no filters, no gradients.
 */
export function render(
  ctx: CanvasRenderingContext2D,
  sim: FieldSimulation,
  debug?: string,
) {
  ctx.clearRect(0, 0, sim.w, sim.h);
  ctx.lineWidth = 1;
  if (sim.linksEnabled) drawLinks(ctx, sim);
  drawClusterEdges(ctx, sim);
  drawRipples(ctx, sim);
  drawParticles(ctx, sim);
  ctx.globalAlpha = 1;
  if (debug) {
    ctx.font = "11px ui-monospace, monospace";
    ctx.fillStyle = "#8A8F98";
    ctx.fillText(debug, 12, sim.h - 12);
  }
}

const filled = (sh: number) => sh === SHAPE.dot || sh === SHAPE.square;

/** Appends one particle's shape to the current path, scaled for its pulse. */
function trace(ctx: CanvasRenderingContext2D, p: Particles, i: number) {
  const x = p.x[i];
  const y = p.y[i];
  const s = p.size[i] * (1 + p.pulse[i] * PL.grow);
  const sh = p.shape[i];
  if (sh === SHAPE.dot) {
    ctx.moveTo(x + s, y);
    ctx.arc(x, y, s, 0, TAU);
    return;
  }
  const co = Math.cos(p.rot[i]) * s;
  const si = Math.sin(p.rot[i]) * s;
  if (sh === SHAPE.square) {
    ctx.moveTo(x - co + si, y - si - co);
    ctx.lineTo(x + co + si, y + si - co);
    ctx.lineTo(x + co - si, y + si + co);
    ctx.lineTo(x - co - si, y - si + co);
    ctx.closePath();
    return;
  }
  ctx.moveTo(x - co, y - si);
  ctx.lineTo(x + co, y + si);
  if (sh === SHAPE.plus) {
    ctx.moveTo(x + si, y - co);
    ctx.lineTo(x - si, y + co);
  }
}

/** One fill path and one stroke path for every particle in `bucket[i] === b`. */
function drawBatch(
  ctx: CanvasRenderingContext2D,
  p: Particles,
  n: number,
  bucket: Int8Array,
  b: number,
  colors: Uint8Array | null,
  c: number,
) {
  for (let pass = 0; pass < 2; pass++) {
    const fill = pass === 0;
    let any = false;
    ctx.beginPath();
    for (let i = 0; i < n; i++) {
      if (bucket[i] !== b || (colors && colors[i] !== c)) continue;
      if (filled(p.shape[i]) !== fill) continue;
      trace(ctx, p, i);
      any = true;
    }
    if (!any) continue;
    if (fill) ctx.fill();
    else ctx.stroke();
  }
}

function drawParticles(ctx: CanvasRenderingContext2D, sim: FieldSimulation) {
  const { p, n, w, h } = sim;
  const B = FIELD.alphaBuckets;
  const maxA = FIELD.maxAlpha;
  const fade = FIELD.edgeFade;
  const GB = PL.overlayBuckets;
  if (glowBucket.length < n) glowBucket = new Int8Array(n);

  for (let i = 0; i < n; i++) {
    const x = p.x[i];
    const y = p.y[i];
    const edge = Math.min(1, Math.max(0, Math.min(x, w - x, y, h - y) / fade));
    const q = sim.quietAt(x, y) * edge;
    const pu = p.pulse[i];
    glowBucket[i] = -1;
    // particles mid-way to a cluster hue are drawn one by one in drawTinted
    if (p.tint[i] > TINT_MIN) {
      p.bucket[i] = -1;
      continue;
    }
    const a = (p.alpha[i] + p.flash[i] + p.boost[i] + pu * PL.alpha) * q;
    p.bucket[i] = a < 0.02 ? -1 : Math.min(B - 1, Math.floor((a / maxA) * B));
    if (pu > PL.overlayMin) {
      const g = pu * q;
      glowBucket[i] = g < 0.03 ? -1 : Math.min(GB - 1, Math.floor(g * GB));
    }
  }

  for (let c = 0; c < 2; c++) {
    const col = c === 1 ? COLOR.cyan : COLOR.grey;
    ctx.fillStyle = col;
    ctx.strokeStyle = col;
    for (let b = 0; b < B; b++) {
      ctx.globalAlpha = ((b + 1) / B) * maxA;
      drawBatch(ctx, p, n, p.bucket, b, p.color, c);
    }
  }

  // The "charge": a brighter cyan copy over particles that are pulsing right now.
  ctx.fillStyle = COLOR.pulse;
  ctx.strokeStyle = COLOR.pulse;
  for (let b = 0; b < GB; b++) {
    ctx.globalAlpha = ((b + 1) / GB) * PL.overlay;
    drawBatch(ctx, p, n, glowBucket, b, null, 0);
  }

  drawTinted(ctx, sim);
}

/**
 * Particles in (or just out of) a cluster cross-fade from their own colour to the
 * cluster's hue. Only the few dozen cluster members, so one draw each is fine.
 */
function drawTinted(ctx: CanvasRenderingContext2D, sim: FieldSimulation) {
  const { p, n, w, h } = sim;
  const maxA = FIELD.maxAlpha;
  const fade = FIELD.edgeFade;
  for (let i = 0; i < n; i++) {
    const t = p.tint[i];
    if (t <= TINT_MIN) continue;
    const x = p.x[i];
    const y = p.y[i];
    const edge = Math.min(1, Math.max(0, Math.min(x, w - x, y, h - y) / fade));
    const a = Math.min(
      maxA,
      (p.alpha[i] + p.flash[i] + p.boost[i] + p.pulse[i] * PL.alpha) *
        sim.quietAt(x, y) *
        edge,
    );
    if (a < 0.02) continue;
    const fill = filled(p.shape[i]);
    for (let layer = 0; layer < 2; layer++) {
      const amount = layer === 0 ? 1 - t : t;
      if (amount * a < 0.015) continue;
      const col =
        layer === 0
          ? p.color[i] === 1
            ? COLOR.cyan
            : COLOR.grey
          : CLUSTER_HUES[p.hue[i]];
      ctx.globalAlpha = amount * a;
      ctx.fillStyle = col;
      ctx.strokeStyle = col;
      ctx.beginPath();
      trace(ctx, p, i);
      if (fill) ctx.fill();
      else ctx.stroke();
    }
  }
}

function drawLinks(ctx: CanvasRenderingContext2D, sim: FieldSimulation) {
  const { p, nn, n } = sim;
  const k = sim.cfg.linkMax;
  const LB = FIELD.linkBuckets;
  const dist = FIELD.linkDist;
  const ptr = sim.pointer;
  const haloOn = sim.cfg.halo && ptr.strength > 0.01;
  if (linkBucket.length < n * k) linkBucket = new Int8Array(n * k);

  for (let i = 0; i < n; i++) {
    for (let s = 0; s < k; s++) {
      const slot = i * k + s;
      linkBucket[slot] = -1;
      const j = nn[slot];
      if (j < 0 || j >= n || p.state[i] + p.state[j] > 0) continue;
      // each pair is drawn once: skip when the other end lists us and comes first
      if (j < i) {
        let listed = false;
        for (let t = 0; t < k; t++) if (nn[j * k + t] === i) listed = true;
        if (listed) continue;
      }
      const dx = p.x[j] - p.x[i];
      const dy = p.y[j] - p.y[i];
      const d = Math.sqrt(dx * dx + dy * dy);
      if (d >= dist) continue;
      const mx = p.x[i] + dx / 2;
      const my = p.y[i] + dy / 2;
      let a = (1 - d / dist) * (1 - d / dist) * FIELD.linkAlpha * sim.quietAt(mx, my);
      a *= 1 + PL.linkBoost * (p.pulse[i] + p.pulse[j]);
      if (haloOn) {
        const dd = Math.sqrt((mx - ptr.x) ** 2 + (my - ptr.y) ** 2);
        if (dd < HA.outer) {
          const t = 1 - dd / HA.outer;
          a *= 1 + t * Math.sqrt(t) * ptr.strength * HA.linkBoost;
        }
      }
      linkBucket[slot] =
        a < 0.004 ? -1 : Math.min(LB - 1, Math.floor((a / FIELD.linkMaxAlpha) * LB));
    }
  }

  ctx.strokeStyle = COLOR.link;
  for (let b = 0; b < LB; b++) {
    ctx.globalAlpha = ((b + 1) / LB) * FIELD.linkMaxAlpha;
    let any = false;
    ctx.beginPath();
    for (let i = 0; i < n; i++) {
      for (let s = 0; s < k; s++) {
        const slot = i * k + s;
        if (linkBucket[slot] !== b) continue;
        const j = nn[slot];
        ctx.moveTo(p.x[i], p.y[i]);
        ctx.lineTo(p.x[j], p.y[j]);
        any = true;
      }
    }
    if (any) ctx.stroke();
  }
}

// Edges near the headline/CTAs are dimmed by the same quiet-zone factor as particles,
// in three tiers so they can still be batched into three paths.
const EDGE_TIER_SCALE = [0.3, 0.65, 1];
const edgeTier = new Int8Array(512);

function drawClusterEdges(ctx: CanvasRenderingContext2D, sim: FieldSimulation) {
  const { p } = sim;
  for (let c = 0; c < sim.clusters.length; c++) {
    const cl = sim.clusters[c];
    const a = clusterEdgeAlpha(sim.time - cl.t0);
    if (a < 0.01) continue;
    ctx.strokeStyle = CLUSTER_HUES[cl.hue];
    computeEdges(cl, p, sim.cfg.neighbours);
    const edges = Math.min(cl.edgeCount, edgeTier.length);
    for (let e = 0; e < edges; e++) {
      const i = cl.members[cl.edges[e * 2]];
      const j = cl.members[cl.edges[e * 2 + 1]];
      const q = sim.quietAt((p.x[i] + p.x[j]) / 2, (p.y[i] + p.y[j]) / 2);
      edgeTier[e] = q < 0.45 ? 0 : q < 0.8 ? 1 : 2;
    }
    for (let tier = 0; tier < 3; tier++) {
      ctx.globalAlpha = a * CL.edgeAlpha * EDGE_TIER_SCALE[tier];
      let any = false;
      ctx.beginPath();
      for (let e = 0; e < edges; e++) {
        if (edgeTier[e] !== tier) continue;
        const i = cl.members[cl.edges[e * 2]];
        const j = cl.members[cl.edges[e * 2 + 1]];
        ctx.moveTo(p.x[i], p.y[i]);
        ctx.lineTo(p.x[j], p.y[j]);
        any = true;
      }
      if (any) ctx.stroke();
    }
  }
}

function drawRipples(ctx: CanvasRenderingContext2D, sim: FieldSimulation) {
  for (let r = 0; r < sim.ripples.length; r++) {
    const rp = sim.ripples[r];
    const age = sim.time - rp.t0;
    if (age >= RI.duration) continue;
    ctx.strokeStyle = CLUSTER_HUES[rp.hue];
    const life = 1 - age / RI.duration;
    ctx.globalAlpha = 0.3 * life * Math.sqrt(life);
    ctx.beginPath();
    ctx.arc(rp.x, rp.y, RI.speed * age, 0, TAU);
    ctx.stroke();
  }
}
