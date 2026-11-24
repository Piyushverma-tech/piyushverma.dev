/**
 * Every tunable for the hero field lives here (CLAUDE.md §6).
 * Distances are CSS px, times are seconds, accelerations px/s².
 */

export type FieldMode = "full" | "lite" | "static";
export type LiveMode = Exclude<FieldMode, "static">;

/** Same seed on server (poster) and client (engine) => identical starting layout. */
export const FIELD_SEED = 0x2f6a1d;
export const POSTER_COUNT = 120;

/** Resting particles: tiny grey and muted cyan. No glow, no gradients. */
export const COLOR = {
  grey: "#A8AEB8",
  cyan: "#62B7C9",
  link: "#66D3EB",
  /** brief "charge" highlight drawn over a pulsing particle */
  pulse: "#9BE7F7",
} as const;

/**
 * Each click's structure takes one of these, then dissolves back to the particles'
 * own grey/cyan. Muted, similar lightness, spread around the wheel so neighbouring
 * clicks never look alike. Order is irrelevant: hues are dealt from a shuffled bag.
 */
export const CLUSTER_HUES = [
  "#E8A94B", // amber
  "#A08CF5", // violet
  "#E8789A", // rose
  "#5FD3A1", // mint
  "#6F9BFF", // blue
  "#C3D95C", // lime
] as const;

/** Resting alpha range. Shared by the layout, the server poster and the tests. */
export const ALPHA = { min: 0.2, span: 0.3 } as const;

export const FIELD = {
  // Rendering
  alphaBuckets: 8,
  maxAlpha: 0.8,
  linkBuckets: 6,
  linkMaxAlpha: 0.4,
  wrapMargin: 24,
  edgeFade: 40,

  // Connections between neighbours
  linkDist: 170,
  linkAlpha: 0.16,

  // Quiet zone: particles near the headline/CTAs are dimmed
  quietMin: 0.3,
  quietFalloff: 100,

  // Ambient drift (simplex flow field)
  flow: { scale: 0.0016, timeScale: 0.06, speed: 9, relax: 1.4 },

  // Cursor halo: magnetic attraction in the outer band, soft repulsion in the core,
  // plus a swirl with a random direction per particle so they keep swapping places
  halo: {
    outer: 200,
    core: 94,
    attract: 110,
    repel: 420,
    swirl: 90,
    rampIn: 0.35,
    rampOut: 0.5,
    linkBoost: 1,
  },

  // Click ripple
  ripple: { speed: 520, duration: 0.7, band: 28, impulse: 1800, flash: 0.35, max: 4 },

  // Random "charge" pulses while floating: a particle flashes, its links light up, and
  // sometimes the pulse hops to a linked neighbour. Brightness and size only, no glow.
  pulse: {
    gapMin: 5, // seconds between a particle's pulses
    gapMax: 20,
    peakMin: 0.7, // intensity at the instant of the pulse (0..1)
    decay: 0.9, // seconds (exponential)
    alpha: 0.45, // extra particle alpha at intensity 1
    grow: 0.6, // extra size at intensity 1 (x0.8)
    overlay: 0.9, // alpha of the bright overlay at intensity 1
    overlayBuckets: 4,
    overlayMin: 0.12, // below this intensity the overlay is skipped
    linkBoost: 1.8, // link alpha multiplier per unit of endpoint intensity
    chain: 0.35, // chance a pulse hops to a linked neighbour
    chainDelay: 0.16,
  },

  // Short-lived attractive impulse on click
  pull: { radius: 80, duration: 0.25, strength: 900 },

  // The temporary structure
  cluster: {
    captureRadius: 260,
    minMembers: 5,
    converge: 0.6,
    hold: 1.6,
    fade: 0.4,
    spacing: 56,
    spring: 4,
    damping: 7,
    repel: 1400,
    edgeAlpha: 0.45,
    maxEdgeLen: 84,
    nodeBoost: 0.35,
    releaseKick: 40,
  },
  maxClusters: 2,

  // Time constants
  flashDecay: 0.35,
  tintAttack: 0.18, // seconds: how fast a captured particle takes the cluster hue
  tintDecay: 0.3, // seconds: how fast a released particle returns to its own colour
  boostDecay: 0.4,
  freeRamp: 1.0,

  // Adaptive quality: average step+draw time over `window` frames
  quality: { window: 60, workMs: 8, shrink: 0.75 },
} as const;

export type ModeConfig = {
  density: number; // px² per particle
  min: number;
  max: number;
  dprCap: number;
  idleFps: number;
  halo: boolean;
  clusterMax: number;
  neighbours: number; // cluster edges per node
  linkEvery: number; // recompute neighbour lists every Nth frame
  linkMax: number; // max ambient links per particle
};

export const MODES: Record<LiveMode, ModeConfig> = {
  full: {
    density: 2000,
    min: 140,
    max: 560,
    dprCap: 2,
    idleFps: 30,
    halo: true,
    clusterMax: 56,
    neighbours: 3,
    linkEvery: 1,
    linkMax: 2,
  },
  lite: {
    density: 9000,
    min: 60,
    max: 80,
    dprCap: 1.5,
    idleFps: 30,
    halo: false,
    clusterMax: 16,
    neighbours: 2,
    linkEvery: 3,
    linkMax: 1,
  },
};

export function particleCount(mode: LiveMode, w: number, h: number): number {
  const c = MODES[mode];
  return Math.max(c.min, Math.min(c.max, Math.round((w * h) / c.density)));
}

export function dprFor(mode: LiveMode, cssWidth: number, deviceDpr: number): number {
  const cap = cssWidth > 2560 ? Math.min(MODES[mode].dprCap, 1.5) : MODES[mode].dprCap;
  return Math.max(1, Math.min(deviceDpr, cap));
}
