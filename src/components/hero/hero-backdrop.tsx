import { FieldPoster } from "./field-poster";
import { HeroField } from "./hero-field";

// The bottom of the field fades out so it never bleeds into "Selected work".
const FADE_BOTTOM = "linear-gradient(to bottom, #000 62%, transparent 100%)";
// The poster is dimmer on the headline side, like the live field's quiet zone.
const QUIET_LEFT = "linear-gradient(90deg, rgb(0 0 0 / 0.55) 0%, #000 40%)";

/**
 * Hero background. Server component: the poster is plain HTML (no client payload copy),
 * so LCP is the headline, never the canvas. `HeroField` (client) only owns the canvas and
 * flips `data-live` on this wrapper once the first frame is drawn; CSS does the cross-fade.
 */
export function HeroBackdrop() {
  return (
    <div
      aria-hidden
      data-field-mode="pending"
      className="group pointer-events-none absolute inset-0 -z-10"
      style={{ maskImage: FADE_BOTTOM, WebkitMaskImage: FADE_BOTTOM }}
    >
      <div
        className="absolute inset-0 transition-opacity duration-500 group-data-[live=true]:opacity-0"
        style={{ maskImage: QUIET_LEFT, WebkitMaskImage: QUIET_LEFT }}
      >
        <FieldPoster />
      </div>
      <HeroField />
    </div>
  );
}
