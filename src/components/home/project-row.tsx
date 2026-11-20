import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Chip } from "@/components/ui/chip";
import type { Project } from "@/content/projects";

const initials = (title: string) =>
  title
    .split(/\s+/)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

export function ProjectRow({ project }: { project: Project }) {
  return (
    <Link
      href={`/work/${project.slug}`}
      className="group block rounded-xl focus-visible:outline-offset-8"
    >
      <div className="flex items-start justify-between gap-6">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <span
              aria-hidden
              className="border-line bg-surface text-fg-muted grid size-8 place-items-center rounded-lg border font-mono text-xs"
            >
              {initials(project.title)}
            </span>
            <h3 className="text-xl font-semibold tracking-tight sm:text-2xl">
              {project.title}
            </h3>
            <Chip>{project.period}</Chip>
          </div>
          <p className="text-fg-muted mt-3 max-w-[60ch] leading-relaxed">
            {project.outcome}
          </p>
        </div>
        <span className="mt-1.5 inline-flex shrink-0 items-center gap-1.5 text-sm font-medium">
          <span className="hidden sm:inline">Read case study</span>
          <span className="sr-only sm:hidden">Read case study</span>
          <ArrowRight
            aria-hidden
            className="size-4 transition-transform duration-200 group-hover:translate-x-0.5"
          />
        </span>
      </div>

      {/* Cover placeholder. Replaced by a real image per project (Phase 3). */}
      <div
        aria-hidden
        className="border-line bg-surface mt-6 grid aspect-[16/9] place-items-center overflow-hidden rounded-xl border transition-colors duration-200 group-hover:border-white/15"
      >
        <span className="text-fg-subtle font-mono text-6xl select-none">
          {initials(project.title)}
        </span>
      </div>
    </Link>
  );
}
