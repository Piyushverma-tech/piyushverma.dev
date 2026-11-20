"use client";

import { useEffect, useRef, useState } from "react";
import { Check, Copy } from "lucide-react";
import { buttonVariants, type ButtonVariants } from "@/components/ui/button";
import { cn } from "@/lib/cn";

type State = "idle" | "copied" | "error";

export function CopyEmailButton({
  email,
  variant = "secondary",
  className,
}: {
  email: string;
  className?: string;
} & ButtonVariants) {
  const [state, setState] = useState<State>("idle");
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => () => clearTimeout(timer.current), []);

  async function copy() {
    try {
      await navigator.clipboard.writeText(email);
      setState("copied");
    } catch {
      setState("error");
    }
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setState("idle"), 2000);
  }

  return (
    <button
      type="button"
      onClick={copy}
      className={cn(buttonVariants({ variant }), className)}
    >
      {state === "copied" ? (
        <Check aria-hidden className="size-4" />
      ) : (
        <Copy aria-hidden className="size-4" />
      )}
      {state === "copied" ? "Copied" : state === "error" ? "Copy failed" : "Copy email"}
      <span role="status" aria-live="polite" className="sr-only">
        {state === "copied" ? "Email address copied to clipboard" : ""}
      </span>
    </button>
  );
}
