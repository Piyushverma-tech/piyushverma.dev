import { describe, expect, it } from "vitest";
import { FieldSimulation, TIMELINE } from "./simulation";

const DT = 1 / 60;
const W = 1440;
const H = 800;

function run(sim: FieldSimulation, seconds: number) {
  const steps = Math.round(seconds / DT);
  for (let i = 0; i < steps; i++) sim.step(DT);
}

function nearestStats(sim: FieldSimulation, ids: Int32Array) {
  const p = sim.p;
  const d: number[] = [];
  for (let a = 0; a < ids.length; a++) {
    let best = Infinity;
    for (let b = 0; b < ids.length; b++) {
      if (a === b) continue;
      const i = ids[a];
      const j = ids[b];
      best = Math.min(best, Math.hypot(p.x[i] - p.x[j], p.y[i] - p.y[j]));
    }
    d.push(best);
  }
  const mean = d.reduce((s, v) => s + v, 0) / d.length;
  const sd = Math.sqrt(d.reduce((s, v) => s + (v - mean) ** 2, 0) / d.length);
  return { mean, cv: sd / mean };
}

describe("ambient", () => {
  it("stays finite and inside the wrap bounds", () => {
    const sim = new FieldSimulation("full", W, H);
    run(sim, 20);
    for (let i = 0; i < sim.n; i++) {
      expect(Number.isFinite(sim.p.x[i])).toBe(true);
      expect(sim.p.x[i]).toBeGreaterThan(-60);
      expect(sim.p.x[i]).toBeLessThan(W + 60);
      expect(sim.p.y[i]).toBeGreaterThan(-60);
      expect(sim.p.y[i]).toBeLessThan(H + 60);
    }
    expect(sim.isAtRest()).toBe(true);
  });

  it("uses hundreds of particles on desktop and fewer in lite mode", () => {
    expect(new FieldSimulation("full", W, H).n).toBeGreaterThanOrEqual(200);
    expect(new FieldSimulation("lite", 390, 700).n).toBeLessThanOrEqual(80);
  });
});

describe("cursor halo", () => {
  it("gathers particles around the pointer and keeps a soft core", () => {
    const base = new FieldSimulation("full", W, H);
    const halo = new FieldSimulation("full", W, H);
    const cx = 1000;
    const cy = 400;
    halo.setPointer(cx, cy);
    run(base, 6);
    run(halo, 6);

    const count = (sim: FieldSimulation, r: number) => {
      let c = 0;
      for (let i = 0; i < sim.n; i++)
        if (Math.hypot(sim.p.x[i] - cx, sim.p.y[i] - cy) < r) c++;
      return c;
    };
    const near = count(halo, 120);
    const ctrl = count(base, 120);
    const centre = count(halo, 14);
    console.log("halo within 120px:", near, "control:", ctrl, "within 14px:", centre);
    expect(near).toBeGreaterThan(ctrl + 3);
    expect(centre).toBeLessThanOrEqual(2);
  });

  it("releases back to ambient after the pointer leaves", () => {
    const sim = new FieldSimulation("full", W, H);
    sim.setPointer(900, 400);
    run(sim, 3);
    sim.leavePointer();
    run(sim, 1);
    expect(sim.pointer.strength).toBe(0);
    expect(sim.isActive()).toBe(false);
  });
});

describe("click: ripple, cluster, dissolve", () => {
  it("forms an evenly spaced connected cluster, then returns to rest", () => {
    const sim = new FieldSimulation("full", W, H);
    run(sim, 2);
    sim.click(1000, 400);
    expect(sim.clusters.length).toBe(1);
    const members = sim.clusters[0].members;
    expect(members.length).toBeGreaterThanOrEqual(12);

    run(sim, 1.4);
    const stats = nearestStats(sim, members);
    console.log(
      "members:",
      members.length,
      "mean NN:",
      stats.mean.toFixed(1),
      "CV:",
      stats.cv.toFixed(2),
    );
    expect(stats.mean).toBeGreaterThan(18);
    expect(stats.mean).toBeLessThan(40);
    expect(stats.cv).toBeLessThan(0.4);

    // never "stuck": must be fully at rest within 3.5s of the click
    let restAt = -1;
    for (let t = 1.4; t <= 5; t += DT) {
      sim.step(DT);
      if (restAt < 0 && t > TIMELINE.release && sim.isAtRest()) restAt = t;
    }
    console.log("at rest after click:", restAt.toFixed(2), "s");
    expect(restAt).toBeGreaterThan(0);
    expect(restAt).toBeLessThanOrEqual(3.5);
  });

  it("caps concurrent clusters", () => {
    const sim = new FieldSimulation("full", W, H);
    run(sim, 1);
    sim.click(400, 300);
    sim.click(900, 300);
    sim.click(1200, 500);
    const live = sim.clusters.filter((c) => !c.released).length;
    expect(live).toBeLessThanOrEqual(2);
  });

  it("lite mode builds smaller clusters", () => {
    const sim = new FieldSimulation("lite", 390, 700);
    run(sim, 1);
    sim.click(200, 300);
    expect(sim.clusters[0]?.members.length ?? 0).toBeLessThanOrEqual(16);
  });
});
