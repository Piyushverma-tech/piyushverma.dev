import type { MetadataRoute } from "next";
import { projects } from "@/content/projects";
import { absoluteUrl } from "@/lib/seo";

// Required for metadata routes under `output: "export"`.
export const dynamic = "force-static";

// Only indexable pages: the home page and published (non-draft) case studies.
export default function sitemap(): MetadataRoute.Sitemap {
  const published = projects.filter((p) => !p.draft);
  return [
    { url: absoluteUrl("/") },
    ...published.map((p) => ({
      url: absoluteUrl(`/work/${p.slug}`),
      ...(p.dateModified ? { lastModified: p.dateModified } : {}),
    })),
  ];
}
