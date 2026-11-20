"use client";

import { useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { SectionLabel } from "@/components/ui/section-label";
import { cn } from "@/lib/cn";

const views = [
  { id: "development", label: "Development" },
  { id: "design", label: "Design" },
] as const;

type View = (typeof views)[number]["id"];

/**
 * Selected-work section with a minimal Development | Design toggle on the right.
 * Both panels are rendered in the HTML (the inactive one is `hidden`) so crawlers
 * and no-JS visitors still get everything.
 */
export function WorkSwitcher({
  development,
  design,
}: {
  development: ReactNode;
  design: ReactNode;
}) {
  const [view, setView] = useState<View>("development");
  const tabs = useRef<Record<View, HTMLButtonElement | null>>({
    development: null,
    design: null,
  });

  function select(next: View) {
    setView(next);
    tabs.current[next]?.focus();
  }

  function onKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
      e.preventDefault();
      select(view === "development" ? "design" : "development");
    } else if (e.key === "Home") {
      e.preventDefault();
      select("development");
    } else if (e.key === "End") {
      e.preventDefault();
      select("design");
    }
  }

  return (
    <>
      <SectionLabel
        id="work-heading"
        aside={
          <div
            role="tablist"
            aria-label="Project category"
            onKeyDown={onKeyDown}
            className="border-line bg-surface inline-flex rounded-full border p-0.5"
          >
            {views.map((v) => {
              const selected = view === v.id;
              return (
                <button
                  key={v.id}
                  ref={(el) => {
                    tabs.current[v.id] = el;
                  }}
                  type="button"
                  role="tab"
                  id={`work-tab-${v.id}`}
                  aria-selected={selected}
                  aria-controls={`work-panel-${v.id}`}
                  tabIndex={selected ? 0 : -1}
                  onClick={() => setView(v.id)}
                  className={cn(
                    "rounded-full px-3.5 py-1 text-sm transition-colors duration-200",
                    selected ? "text-fg bg-white/10" : "text-fg-muted hover:text-fg",
                  )}
                >
                  {v.label}
                </button>
              );
            })}
          </div>
        }
      >
        Selected work
      </SectionLabel>

      <div className="mt-14">
        {views.map((v) => (
          <div
            key={v.id}
            role="tabpanel"
            id={`work-panel-${v.id}`}
            aria-labelledby={`work-tab-${v.id}`}
            hidden={view !== v.id}
          >
            {v.id === "development" ? development : design}
          </div>
        ))}
      </div>
    </>
  );
}
