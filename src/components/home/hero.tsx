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
        <div data-field-quiet className="max-w-[60rem]">
          <h1 className="text-[clamp(2.5rem,6.2vw,2.75rem)] leading-[1.02] font-semibold tracking-[-0.03em] text-balance uppercase">
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
