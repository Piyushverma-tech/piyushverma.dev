import Link from "next/link";
import { Container } from "@/components/layout/container";
import { buttonVariants } from "@/components/ui/button";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Page not found",
  path: "/404",
  noindex: true,
});

export default function NotFound() {
  return (
    <Container className="py-24 sm:py-32">
      <p className="text-fg-muted font-mono text-sm">404</p>
      <h1 className="mt-4 text-4xl font-semibold tracking-[-0.03em] sm:text-5xl">
        This page doesn&apos;t exist.
      </h1>
      <Link href="/" className={`${buttonVariants()} mt-10`}>
        Back home
      </Link>
    </Container>
  );
}
