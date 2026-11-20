import { Container } from "@/components/layout/container";
import { buildMetadata } from "@/lib/seo";

// Stub until Phase 4. noindex so a placeholder never gets into search results.
export const metadata = buildMetadata({ title: "About", path: "/about", noindex: true });

export default function AboutPage() {
  return (
    <Container className="py-24 sm:py-32">
      <h1 className="text-4xl font-semibold tracking-[-0.03em] sm:text-5xl">About</h1>
      <p className="text-fg-muted mt-6 max-w-[34rem] text-lg">Coming soon.</p>
    </Container>
  );
}
