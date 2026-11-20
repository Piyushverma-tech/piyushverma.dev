// Project registry. Array order = display order on the home page.
// `draft: true` => the case study page is noindex and excluded from the sitemap.
// TODO(owner): replace placeholder titles, outcomes, periods and covers.

export type Discipline = "development" | "design";

export type Project = {
  slug: string;
  discipline: Discipline;
  title: string;
  /** One line, outcome-led. */
  outcome: string;
  /** Shown in the chip, e.g. "2026". */
  period: string;
  draft: boolean;
  datePublished?: string;
  dateModified?: string;
};

export const projects: Project[] = [
  // Development (home shows 4). DRAKON first.
  {
    slug: "drakon",
    discipline: "development",
    title: "DRAKON",
    outcome:
      "An orbital decision system: re-entry prediction, visualisation and the data infrastructure behind it.",
    period: "2026",
    draft: true,
  },
  {
    slug: "dev-project-2",
    discipline: "development",
    title: "Development project 2",
    outcome: "One-line outcome goes here.",
    period: "Draft",
    draft: true,
  },
  {
    slug: "dev-project-3",
    discipline: "development",
    title: "Development project 3",
    outcome: "One-line outcome goes here.",
    period: "Draft",
    draft: true,
  },
  {
    slug: "dev-project-4",
    discipline: "development",
    title: "Development project 4",
    outcome: "One-line outcome goes here.",
    period: "Draft",
    draft: true,
  },

  // Design (home shows 3). DRAKON first.
  {
    slug: "drakon-design",
    discipline: "design",
    title: "DRAKON",
    outcome: "The UX case study and full Figma work behind the DRAKON interface.",
    period: "2026",
    draft: true,
  },
  {
    slug: "design-project-2",
    discipline: "design",
    title: "Design project 2",
    outcome: "One-line outcome goes here.",
    period: "Draft",
    draft: true,
  },
  {
    slug: "design-project-3",
    discipline: "design",
    title: "Design project 3",
    outcome: "One-line outcome goes here.",
    period: "Draft",
    draft: true,
  },
];

export const getProject = (slug: string) => projects.find((p) => p.slug === slug);

export const projectsByDiscipline = (discipline: Discipline) =>
  projects.filter((p) => p.discipline === discipline);
