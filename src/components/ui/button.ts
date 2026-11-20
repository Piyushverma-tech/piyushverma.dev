import { cva, type VariantProps } from "class-variance-authority";

export const buttonVariants = cva(
  "inline-flex h-11 items-center justify-center gap-2 rounded-full px-5 text-sm font-medium whitespace-nowrap transition-colors duration-200",
  {
    variants: {
      variant: {
        primary: "bg-fg text-bg hover:bg-white",
        secondary: "border border-line bg-surface text-fg hover:border-white/20",
      },
    },
    defaultVariants: { variant: "primary" },
  },
);

export type ButtonVariants = VariantProps<typeof buttonVariants>;
