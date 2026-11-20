import type { Metadata } from "next";
import { site } from "@/content/site";

export const absoluteUrl = (path = "/") => new URL(path, site.url).toString();

type PageMeta = {
  /** Omit on the home page to use the layout's default title. */
  title?: string;
  description?: string;
  path: string;
  noindex?: boolean;
};

/** Per-page metadata. Canonical is always set per page, never in the root layout. */
export function buildMetadata({
  title,
  description = site.description,
  path,
  noindex = false,
}: PageMeta): Metadata {
  return {
    ...(title ? { title } : {}),
    description,
    alternates: { canonical: path },
    openGraph: {
      type: "website",
      siteName: site.name,
      title: title ? `${title} — ${site.name}` : `${site.name} — ${site.role}`,
      description,
      url: path,
    },
    ...(noindex ? { robots: { index: false, follow: false } } : {}),
  };
}

// No address/location fields on purpose (CLAUDE.md §1).
export function personJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    "@id": `${site.url}/#person`,
    name: site.name,
    url: site.url,
    jobTitle: site.role,
    description: site.description,
    sameAs: [site.socials.github, site.socials.linkedin],
  };
}

export function websiteJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${site.url}/#website`,
    url: site.url,
    name: site.name,
    publisher: { "@id": `${site.url}/#person` },
  };
}
