import type { NextConfig } from "next";
import createMDX from "@next/mdx";

const nextConfig: NextConfig = {
  // Static export for Cloudflare Pages (output directory: `out`).
  // Headers/redirects therefore live in public/_headers and public/_redirects.
  output: "export",
  // No image optimizer on a static export: images are pre-optimised at authoring time.
  images: { unoptimized: true },
  pageExtensions: ["ts", "tsx", "md", "mdx"],
  poweredByHeader: false,
  reactStrictMode: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

// Plugins are passed as strings (serialisable) so they work under Turbopack.
const withMDX = createMDX({
  options: {
    remarkPlugins: ["remark-gfm"],
    rehypePlugins: [
      "rehype-slug",
      ["rehype-pretty-code", { theme: "github-dark-dimmed", keepBackground: false }],
    ],
  },
});

export default withMDX(nextConfig);
