import Link from "next/link";
import { Container } from "@/components/layout/container";
import { CopyEmailButton } from "@/components/home/copy-email-button";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { site } from "@/content/site";

export function Hero() {
  return (
    <section className="relative isolate overflow-hidden">
      {/* Slot for the particle field (Phase 2). Decorative, never carries content. */}
      <div
        aria-hidden
        data-field-slot
        className="pointer-events-none absolute inset-0 -z-10"
      />

      <Container className="flex min-h-[min(calc(100svh_-_3.5rem),820px)] items-center py-24">
        <div className="max-w-[40rem]">
          <h1 className="text-[clamp(2.5rem,6.2vw,4.75rem)] leading-[1.02] font-semibold tracking-[-0.03em] text-balance">
            <span className="text-fg-muted">{site.hero.lead}</span>{" "}
            <span>{site.hero.emphasis}</span>
          </h1>
          <p className="text-fg-muted mt-8 max-w-[34rem] text-lg leading-relaxed">
            {site.hero.intro}
          </p>
          <div className="mt-10 flex flex-wrap gap-3">
            <Link href="#work" className={cn(buttonVariants({ variant: "primary" }))}>
              View work
            </Link>
            <CopyEmailButton email={site.email} />
          </div>
        </div>
      </Container>
    </section>
  );
}
