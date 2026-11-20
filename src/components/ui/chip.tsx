import type { ReactNode } from "react";

export function Chip({ children }: { children: ReactNode }) {
  return (
    <span className="border-line bg-surface text-fg-muted rounded-full border px-2.5 py-0.5 font-mono text-xs">
      {children}
    </span>
  );
}
