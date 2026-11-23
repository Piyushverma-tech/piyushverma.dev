import { FIELD, dprFor, type LiveMode } from "./config";
import { render } from "./render";
import { FieldSimulation, type Rect } from "./simulation";

declare global {
  interface Window {
    /** Exposed only with ?debug=field, for inspection and automated checks. */
    __field?: FieldSimulation;
  }
}

export type EngineOptions = {
  canvas: HTMLCanvasElement;
  host: HTMLElement;
  mode: LiveMode;
  /** Called once the first frame is on screen. */
  onReady?: () => void;
};

export type FieldEngine = { destroy: () => void };

// Clicks on these never trigger the field: buttons and links stay predictable.
const INTERACTIVE =
  "a, button, input, textarea, select, summary, [role=button], [data-no-field]";
const IGNORE_FRAMES = 90; // JIT warm-up is not a reason to lower quality

export function createFieldEngine({
  canvas,
  host,
  mode,
  onReady,
}: EngineOptions): FieldEngine {
  const ctx = canvas.getContext("2d");
  if (!ctx) return { destroy() {} };

  const debug = new URLSearchParams(window.location.search).get("debug") === "field";
  let sim: FieldSimulation | null = null;
  let dpr = 1;
  let raf = 0;
  let running = false;
  let last = 0;
  let inView = true;
  let destroyed = false;
  let readyFired = false;
  let measureTimer = 0;
  let checkedEvent = -1;
  let degrades = 0;

  // rolling work-time window for adaptive quality
  const work = new Float32Array(FIELD.quality.window);
  let workIdx = 0;
  let workCount = 0;
  let frames = 0;
  let fps = 0;

  function measureQuiet(rect: DOMRect): Rect[] {
    const out: Rect[] = [];
    host.querySelectorAll("[data-field-quiet]").forEach((el) => {
      const r = el.getBoundingClientRect();
      out.push({ x: r.left - rect.left, y: r.top - rect.top, w: r.width, h: r.height });
    });
    return out;
  }

  function measure() {
    const rect = canvas.getBoundingClientRect();
    if (rect.width < 2 || rect.height < 2 || !ctx) return;
    dpr = dprFor(mode, window.innerWidth, window.devicePixelRatio || 1);
    canvas.width = Math.round(rect.width * dpr);
    canvas.height = Math.round(rect.height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (!sim) {
      sim = new FieldSimulation(mode, rect.width, rect.height);
      if (debug) window.__field = sim;
    } else if (
      Math.abs(sim.w - rect.width) > 0.5 ||
      Math.abs(sim.h - rect.height) > 0.5
    ) {
      sim.resize(rect.width, rect.height);
    }
    sim.setQuiet(measureQuiet(rect));
    draw();
  }

  function scheduleMeasure() {
    window.clearTimeout(measureTimer);
    measureTimer = window.setTimeout(measure, 120);
  }

  function draw() {
    if (!sim || !ctx) return;
    const info = debug
      ? `${mode} n=${sim.n} fps=${fps.toFixed(0)} clusters=${sim.clusters.length} dpr=${dpr} work=${avgWork().toFixed(1)}ms${sim.linksEnabled ? "" : " (reduced)"}`
      : undefined;
    render(ctx, sim, info);
  }

  function avgWork() {
    if (!workCount) return 0;
    let s = 0;
    for (let i = 0; i < workCount; i++) s += work[i];
    return s / workCount;
  }

  function trackWork(ms: number) {
    work[workIdx] = ms;
    workIdx = (workIdx + 1) % work.length;
    workCount = Math.min(work.length, workCount + 1);
    frames++;
    if (frames > IGNORE_FRAMES && workCount === work.length && degrades < 2) {
      if (avgWork() > FIELD.quality.workMs && sim) {
        sim.degrade();
        degrades++;
        workCount = 0;
        workIdx = 0;
      }
    }
  }

  function frame(now: number) {
    raf = requestAnimationFrame(frame);
    if (!sim) return;
    // Quiet idle: 30fps. Interaction: full rate.
    const interval = sim.isActive() ? 0 : 1000 / sim.cfg.idleFps;
    if (now - last < interval - 1) return;
    const delta = now - last;
    const dt = Math.min(delta / 1000, 1 / 30);
    last = now;
    if (delta > 0) fps += (1000 / delta - fps) * 0.1;

    const t0 = performance.now();
    sim.step(dt);
    draw();
    trackWork(performance.now() - t0);

    if (!readyFired) {
      readyFired = true;
      onReady?.();
    }
    if (
      process.env.NODE_ENV !== "production" &&
      sim.time - sim.lastEvent > 4.2 &&
      checkedEvent !== sim.lastEvent
    ) {
      checkedEvent = sim.lastEvent;
      if (!sim.isAtRest()) console.warn("[field] not at rest 4s after the last event");
    }
  }

  // Hidden tab or hero scrolled away: stop the loop completely.
  function sync() {
    const shouldRun = inView && !document.hidden && !destroyed;
    if (shouldRun && !running) {
      running = true;
      last = performance.now(); // no time jump after a pause
      raf = requestAnimationFrame(frame);
    } else if (!shouldRun && running) {
      running = false;
      cancelAnimationFrame(raf);
    }
  }

  function local(e: PointerEvent) {
    const r = canvas.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  }

  const onMove = (e: PointerEvent) => {
    if (!sim || mode !== "full" || e.pointerType === "touch") return;
    const { x, y } = local(e);
    sim.setPointer(x, y);
  };
  const onLeave = () => sim?.leavePointer();
  const onDown = (e: PointerEvent) => {
    if (!sim || e.button !== 0) return;
    if ((e.target as Element | null)?.closest(INTERACTIVE)) return;
    const { x, y } = local(e);
    sim.click(x, y);
  };
  const onVisibility = () => sync();

  const io = new IntersectionObserver((entries) => {
    inView = entries[entries.length - 1]?.isIntersecting ?? true;
    sync();
  });
  const ro = new ResizeObserver(scheduleMeasure);

  host.addEventListener("pointermove", onMove);
  host.addEventListener("pointerleave", onLeave);
  host.addEventListener("pointercancel", onLeave);
  host.addEventListener("pointerdown", onDown);
  document.addEventListener("visibilitychange", onVisibility);
  io.observe(host);
  ro.observe(host);
  host.querySelectorAll("[data-field-quiet]").forEach((el) => ro.observe(el));

  measure();
  sync();

  return {
    destroy() {
      destroyed = true;
      running = false;
      cancelAnimationFrame(raf);
      window.clearTimeout(measureTimer);
      host.removeEventListener("pointermove", onMove);
      host.removeEventListener("pointerleave", onLeave);
      host.removeEventListener("pointercancel", onLeave);
      host.removeEventListener("pointerdown", onDown);
      document.removeEventListener("visibilitychange", onVisibility);
      io.disconnect();
      ro.disconnect();
      if (window.__field === sim) window.__field = undefined;
    },
  };
}
