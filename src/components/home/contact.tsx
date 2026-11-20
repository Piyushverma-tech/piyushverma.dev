import { ArrowUpRight } from "lucide-react";
import { Container } from "@/components/layout/container";
import { CopyEmailButton } from "@/components/home/copy-email-button";
import { buttonVariants } from "@/components/ui/button";
import { SectionLabel } from "@/components/ui/section-label";
import { cn } from "@/lib/cn";
import { site } from "@/content/site";

const linkClass =
  "inline-flex items-center gap-1 text-fg-muted underline decoration-line underline-offset-4 transition-colors hover:text-fg hover:decoration-fg-muted";

export function Contact() {
  const { contact, workWithMe } = site;
  return (
    <section
      id="contact"
      aria-labelledby="contact-heading"
      className="scroll-mt-20 py-24 sm:py-32"
    >
      <Container>
        <SectionLabel id="contact-heading">Contact</SectionLabel>

        <div className="mt-14 grid gap-16 lg:grid-cols-2 lg:gap-24">
          <div>
            <p className="text-3xl leading-tight font-semibold tracking-[-0.02em] text-balance sm:text-4xl">
              {contact.heading}
            </p>
            <p className="text-fg-muted mt-6 max-w-[34rem] text-lg leading-relaxed">
              {contact.body}
            </p>

            <p className="mt-8">
              <a
                href={`mailto:${site.email}`}
                className="text-fg decoration-line hover:decoration-fg-muted text-lg underline underline-offset-4"
              >
                {site.email}
              </a>
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <CopyEmailButton email={site.email} variant="primary" />
              <a
                href={site.calendarUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(buttonVariants({ variant: "secondary" }))}
              >
                Book a call
                <ArrowUpRight aria-hidden className="size-4" />
                <span className="sr-only"> (opens in a new tab)</span>
              </a>
            </div>

            <ul className="mt-10 flex flex-wrap gap-x-6 gap-y-2 text-sm">
              <li>
                <a
                  href={site.socials.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={linkClass}
                >
                  GitHub<span className="sr-only"> (opens in a new tab)</span>
                </a>
              </li>
              <li>
                <a
                  href={site.socials.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={linkClass}
                >
                  LinkedIn<span className="sr-only"> (opens in a new tab)</span>
                </a>
              </li>
              <li>
                <a
                  href={site.resumeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={linkClass}
                >
                  Resume<span className="sr-only"> (PDF, opens in a new tab)</span>
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-fg-muted text-sm">{workWithMe.heading}</h3>
            <ul className="divide-line border-line mt-6 divide-y border-y">
              {workWithMe.offers.map((offer) => (
                <li key={offer.title} className="py-5">
                  <p className="font-medium">{offer.title}</p>
                  <p className="text-fg-muted mt-1">{offer.body}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Container>
    </section>
  );
}
