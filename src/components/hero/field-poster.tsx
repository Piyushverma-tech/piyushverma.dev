import { COLOR, FIELD_SEED, POSTER_COUNT } from "./field/config";
import { SHAPE, generateLayout } from "./field/layout";

// Links are computed once at build time for an assumed 1440x800 hero. They are faint
// and only decorative, so a different real aspect ratio just changes their length a bit.
const ASSUMED_W = 1440;
const ASSUMED_H = 800;
const LINK_MAX = 70; // px: shorter than the live field so the poster stays airy

const pct = (v: number) => `${(v * 100).toFixed(1)}%`;

// Shapes are grouped by (colour, opacity tier) so each element carries only its
// geometry. That keeps the markup small, and it is serialised twice (HTML + RSC payload).
const TIERS = [0.12, 0.17, 0.22, 0.27];
const tierOf = (alpha: number) =>
  Math.min(
    TIERS.length - 1,
    Math.max(0, Math.floor(((alpha - 0.1) / 0.18) * TIERS.length)),
  );

/**
 * Static version of the field: same seeded layout as the live engine, so the canvas
 * cross-fades in over identical positions. It is also the whole experience for
 * `prefers-reduced-motion` users and when JavaScript is off. Zero client JS.
 * (Rotation is dropped: it would cost bytes and is invisible at these opacities.)
 */
export function FieldPoster() {
  const L = generateLayout(POSTER_COUNT, FIELD_SEED);

  const links: { a: number; b: number; t: number }[] = [];
  for (let i = 0; i < L.count; i++) {
    let best = -1;
    let bestD: number = LINK_MAX;
    for (let j = 0; j < L.count; j++) {
      if (j === i) continue;
      const d = Math.hypot(
        (L.nx[j] - L.nx[i]) * ASSUMED_W,
        (L.ny[j] - L.ny[i]) * ASSUMED_H,
      );
      if (d < bestD) {
        bestD = d;
        best = j;
      }
    }
    if (best > i)
      links.push({ a: i, b: best, t: (1 - bestD / LINK_MAX) ** 2 > 0.3 ? 1 : 0 });
  }

  return (
    <svg
      aria-hidden="true"
      focusable="false"
      width="100%"
      height="100%"
      className="absolute inset-0 h-full w-full"
    >
      {[0, 1].map((t) => (
        <g key={`l${t}`} stroke={COLOR.link} strokeOpacity={t === 1 ? 0.12 : 0.06}>
          {links
            .filter((l) => l.t === t)
            .map((l) => (
              <line
                key={`${l.a}-${l.b}`}
                x1={pct(L.nx[l.a])}
                y1={pct(L.ny[l.a])}
                x2={pct(L.nx[l.b])}
                y2={pct(L.ny[l.b])}
              />
            ))}
        </g>
      ))}

      {[0, 1].flatMap((color) =>
        TIERS.map((opacity, tier) => (
          <g
            key={`${color}-${tier}`}
            fill={color === 1 ? COLOR.cyan : COLOR.grey}
            fillOpacity={opacity}
          >
            {Array.from({ length: L.count }, (_, i) => i)
              .filter((i) => L.color[i] === color && tierOf(L.alpha[i]) === tier)
              .map((i) => {
                const x = pct(L.nx[i]);
                const y = pct(L.ny[i]);
                const s = L.size[i];
                switch (L.shape[i]) {
                  case SHAPE.square:
                    return <rect key={i} x={x} y={y} width={s * 2} height={s * 2} />;
                  case SHAPE.tick:
                  case SHAPE.plus: {
                    const vertical =
                      L.rot[i] > Math.PI / 4 && L.rot[i] < (3 * Math.PI) / 4;
                    return (
                      <rect
                        key={i}
                        x={x}
                        y={y}
                        width={vertical ? 1 : s * 2}
                        height={vertical ? s * 2 : 1}
                      />
                    );
                  }
                  default:
                    return <circle key={i} cx={x} cy={y} r={s} />;
                }
              })}
          </g>
        )),
      )}
    </svg>
  );
}
