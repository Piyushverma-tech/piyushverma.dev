import { Container } from "@/components/layout/container";
import { site } from "@/content/site";

export function Footer() {
  return (
    <footer className="border-line border-t">
      <Container className="text-fg-muted flex items-center justify-between py-8 text-sm">
        <p>
          © {new Date().getFullYear()} {site.name}
        </p>
        <a href="#top" className="hover:text-fg transition-colors">
          Back to top
        </a>
      </Container>
    </footer>
  );
}
