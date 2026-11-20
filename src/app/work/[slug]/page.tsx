import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Container } from "@/components/layout/container";
import { Chip } from "@/components/ui/chip";
import { getProject, projects } from "@/content/projects";
import { buildMetadata } from "@/lib/seo";

// Every case study is known at build time; anything else is a 404.
export const dynamicParams = false;

export function generateStaticParams() {
  return projects.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata(
  props: PageProps<"/work/[slug]">,
): Promise<Metadata> {
  const { slug } = await props.params;
  const project = getProject(slug);
  if (!project) return {};
  return buildMetadata({
    title: `${project.title}${project.discipline === "design" ? " (design)" : ""} case study`,
    description: project.outcome,
    path: `/work/${project.slug}`,
    noindex: project.draft,
  });
}

export default async function CaseStudyPage(props: PageProps<"/work/[slug]">) {
  const { slug } = await props.params;
  const project = getProject(slug);
  if (!project) notFound();

  const { default: Content } = await import(`@/content/case-studies/${slug}.mdx`);

  return (
    <Container className="py-16 sm:py-24">
      <article className="mx-auto max-w-[44rem]">
        <Link
          href="/#work"
          className="text-fg-muted hover:text-fg inline-flex items-center gap-1.5 text-sm transition-colors"
        >
          <ArrowLeft aria-hidden className="size-4" />
          Selected work
        </Link>

        <header className="mt-10">
          <div className="flex flex-wrap items-center gap-3">
            <Chip>{project.discipline === "design" ? "Design" : "Development"}</Chip>
            <Chip>{project.period}</Chip>
          </div>
          <h1 className="mt-5 text-4xl leading-tight font-semibold tracking-[-0.03em] text-balance sm:text-5xl">
            {project.title}
          </h1>
          <p className="text-fg-muted mt-5 text-lg leading-relaxed">{project.outcome}</p>
        </header>

        <div className="prose prose-invert prose-headings:tracking-tight mt-14 max-w-none">
          <Content />
        </div>
      </article>
    </Container>
  );
}
