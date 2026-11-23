import { useSyncExternalStore } from "react";
import type { FieldMode } from "./config";

const REDUCED = "(prefers-reduced-motion: reduce)";
const COARSE = "(pointer: coarse)";
const NARROW = "(max-width: 767px)";

function subscribe(onChange: () => void) {
  const lists = [REDUCED, COARSE, NARROW].map((q) => window.matchMedia(q));
  lists.forEach((m) => m.addEventListener("change", onChange));
  return () => lists.forEach((m) => m.removeEventListener("change", onChange));
}

function getSnapshot(): FieldMode {
  if (window.matchMedia(REDUCED).matches) return "static"; // one frame, no loop
  if (window.matchMedia(COARSE).matches || window.matchMedia(NARROW).matches)
    return "lite";
  return "full";
}

/** null on the server and during hydration: the static poster is what renders then. */
export function useFieldMode(): FieldMode | null {
  return useSyncExternalStore(subscribe, getSnapshot, () => null);
}
