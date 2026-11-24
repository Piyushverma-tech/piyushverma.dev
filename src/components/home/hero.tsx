import Link from "next/link";
import { Container } from "@/components/layout/container";
import { CopyEmailButton } from "@/components/home/copy-email-button";
import { HeroBackdrop } from "@/components/hero/hero-backdrop";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { site } from "@/content/site";

export function Hero() {
  return (
    <section data-field-host className="relative isolate max-h-[580px] overflow-hidden">
      <HeroBackdrop />

      <Container className="flex min-h-[min(calc(100svh-6rem),820px)] items-center py-24">
        {/* The quiet zone hugs each element (w-fit), not the 60rem wrapper, so the field
            stays visible next to the headline instead of leaving a dead rectangle. */}
        <div className="max-w-[60rem]">
          <h1
            data-field-quiet
            className="w-fit max-w-full text-[clamp(2.5rem,6.2vw,2.75rem)] leading-[1.02] font-semibold tracking-[-0.03em] text-balance uppercase"
          >
            <span className="text-fg-muted">{site.hero.lead}</span>{" "}
            <span>{site.hero.emphasis}</span>
          </h1>
          <p
            data-field-quiet
            className="text-fg-muted mt-8 max-w-[34rem] text-lg leading-relaxed"
          >
            {site.hero.intro}
          </p>
          <div data-field-quiet className="mt-10 flex w-fit max-w-full flex-wrap gap-3">
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
