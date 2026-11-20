// Single source for site-wide copy and links. The owner edits this file when writing the final copy.
// Everything marked TODO(owner) is a placeholder.

export type NavItem = { label: string; href: string; external?: boolean };

type SiteConfig = {
  name: string;
  role: string;
  url: string;
  description: string;
  hero: { lead: string; emphasis: string; intro: string };
  email: string;
  calendarUrl: string;
  socials: { github: string; linkedin: string };
  resumeUrl: string;
  nav: NavItem[];
  contact: { heading: string; body: string };
  workWithMe: { heading: string; offers: { title: string; body: string }[] };
};

export const site = {
  name: "Piyush Verma",
  role: "Product Engineer",
  url: "https://piyushverma.dev",
  description:
    "Piyush Verma is a product engineer who designs, builds and ships web products, from first sketch to production.",

  hero: {
    lead: "From problem,",
    emphasis: "to production.",
    // TODO(owner): final intro copy
    intro:
      "I'm a product engineer. I frame the problem, design the experience, then build and ship the product, end to end.",
  },

  // TODO(owner): confirm every value below
  email: "hello@piyushverma.dev",
  calendarUrl: "https://cal.com/piyushverma",
  socials: {
    github: "https://github.com/piyushverma",
    linkedin: "https://www.linkedin.com/in/piyushverma",
  },
  resumeUrl: "/resume.pdf",

  nav: [
    { label: "Work", href: "/#work" },
    { label: "About", href: "/about" },
    { label: "Contact", href: "/#contact" },
    { label: "Blogs", href: "/blogs" },
    { label: "Resume", href: "/resume.pdf", external: true },
  ] satisfies NavItem[],

  // TODO(owner): rewrite the contact and work-with-me copy
  contact: {
    heading: "Let's build something that ships.",
    body: "Tell me what you're trying to build. I take on freelance projects and I'm open to full-time roles at product-driven teams.",
  },
  workWithMe: {
    heading: "Work with me",
    offers: [
      {
        title: "Build a product end to end",
        body: "From problem framing and UX to a production-ready web app.",
      },
      {
        title: "Frontend and interface engineering",
        body: "Fast, accessible interfaces for complex, data-heavy products.",
      },
      {
        title: "Design and prototype",
        body: "User research, Figma systems and developer-ready handoff.",
      },
      {
        title: "Join your team",
        body: "Product engineer for startups building in AI, space and climate.",
      },
    ],
  },
} satisfies SiteConfig;
