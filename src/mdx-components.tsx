import type { MDXComponents } from "mdx/types";

// Required by @next/mdx (App Router). Custom case-study components get mapped
// here in a later phase.
export function useMDXComponents(components: MDXComponents): MDXComponents {
  return { ...components };
}
