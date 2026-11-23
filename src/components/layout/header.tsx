"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowUpRight, Menu, X } from "lucide-react";
import { Container } from "@/components/layout/container";
import { cn } from "@/lib/cn";
import { site, type NavItem } from "@/content/site";

const linkClass =
  "inline-flex items-center gap-1 text-sm sm:text-base text-fg-muted transition-colors hover:text-fg aria-[current=page]:text-fg";

function NavLink({
  item,
  pathname,
  onNavigate,
  className,
}: {
  item: NavItem;
  pathname: string;
  onNavigate?: () => void;
  className?: string;
}) {
  if (item.external) {
    return (
      <a
        href={item.href}
        target="_blank"
        rel="noopener noreferrer"
        onClick={onNavigate}
        className={cn(linkClass, className)}
      >
        {item.label}
        <ArrowUpRight aria-hidden className="size-3.5" />
        <span className="sr-only"> (PDF, opens in a new tab)</span>
      </a>
    );
  }
  const current = !item.href.startsWith("/#") && pathname.startsWith(item.href);
  return (
    <Link
      href={item.href}
      aria-current={current ? "page" : undefined}
      onClick={onNavigate}
      className={cn(linkClass, className)}
    >
      {item.label}
    </Link>
  );
}

export function Header() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <header className="border-line bg-bg/80 sticky top-0 z-40 border-b backdrop-blur-md">
      <Container className="flex h-14 items-center justify-between">
        <Link
          href="/"
          className="flex items-baseline gap-3"
          onClick={() => setOpen(false)}
        >
          <span className="text-sm font-semibold tracking-tight sm:text-base">
            {site.name}
          </span>
          <span className="text-fg-muted hidden text-sm sm:inline sm:text-base">
            {site.role}
          </span>
        </Link>

        <nav aria-label="Primary" className="hidden items-center gap-7 md:flex">
          {site.nav.map((item) => (
            <NavLink key={item.label} item={item} pathname={pathname} />
          ))}
        </nav>

        <button
          type="button"
          className="text-fg-muted hover:text-fg -mr-2 grid size-10 place-items-center rounded-full md:hidden"
          aria-expanded={open}
          aria-controls="mobile-nav"
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? (
            <X aria-hidden className="size-5" />
          ) : (
            <Menu aria-hidden className="size-5" />
          )}
        </button>
      </Container>

      {open && (
        <nav
          id="mobile-nav"
          aria-label="Primary"
          className="border-line bg-bg border-t md:hidden"
        >
          <Container className="flex flex-col py-2">
            {site.nav.map((item) => (
              <NavLink
                key={item.label}
                item={item}
                pathname={pathname}
                onNavigate={() => setOpen(false)}
                className="h-12 text-base"
              />
            ))}
          </Container>
        </nav>
      )}
    </header>
  );
}
