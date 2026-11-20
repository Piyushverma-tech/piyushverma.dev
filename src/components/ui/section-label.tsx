import type { ReactNode } from "react";

/** Section heading as a small label followed by a hairline; optional control on the right. */
export function SectionLabel({
  id,
  children,
  aside,
}: {
  id?: string;
  children: ReactNode;
  aside?: ReactNode;
}) {
  return (
    <div className="flex items-center gap-5">
      <h2 id={id} className="text-fg-muted text-sm">
        {children}
      </h2>
      <div aria-hidden className="bg-line h-px flex-1" />
      {aside}
    </div>
  );
}
