import { Container } from "@/components/layout/container";
import { buildMetadata } from "@/lib/seo";

// Empty state until the first post exists (Phase 4). noindex: no thin pages in search.
export const metadata = buildMetadata({ title: "Blogs", path: "/blogs", noindex: true });

export default function BlogsPage() {
  return (
    <Container className="py-24 sm:py-32">
      <h1 className="text-4xl font-semibold tracking-[-0.03em] sm:text-5xl">Blogs</h1>
      <p className="text-fg-muted mt-6 max-w-[34rem] text-lg">
        Writing is on its way. Nothing published yet.
      </p>
    </Container>
  );
}
