"use client";

import { useEffect, useRef } from "react";
import type { FieldEngine } from "./field/engine";
import { useFieldMode } from "./field/use-field-mode";

/**
 * Owns the canvas. After first paint and when the browser is idle it loads the engine
 * (a small lazy chunk) and cross-fades from the server poster to the live field.
 * Reduced-motion users keep the poster and never download the engine.
 * State is exposed as data attributes on the backdrop (`data-field-mode`, `data-live`).
 */
export function HeroField() {
  const mode = useFieldMode();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const backdrop = canvas?.parentElement;
    if (!canvas || !backdrop) return;
    backdrop.dataset.fieldMode = mode ?? "pending";
    if (!mode || mode === "static") return;
    const host = canvas.closest<HTMLElement>("[data-field-host]") ?? backdrop;

    let cancelled = false;
    let engine: FieldEngine | undefined;

    const start = () => {
      import("./field/engine").then(({ createFieldEngine }) => {
        if (cancelled) return;
        engine = createFieldEngine({
          canvas,
          host,
          mode,
          onReady: () => {
            if (!cancelled) backdrop.dataset.live = "true";
          },
        });
      });
    };

    const idle =
      typeof window.requestIdleCallback === "function"
        ? window.requestIdleCallback(start, { timeout: 1200 })
        : window.setTimeout(start, 200);

    return () => {
      cancelled = true;
      if (typeof window.cancelIdleCallback === "function")
        window.cancelIdleCallback(idle);
      else window.clearTimeout(idle);
      engine?.destroy();
      delete backdrop.dataset.live;
    };
  }, [mode]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 h-full w-full opacity-0 transition-opacity duration-500 group-data-[live=true]:opacity-100"
    />
  );
}
