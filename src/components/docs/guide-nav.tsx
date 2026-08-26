"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { DOC_PAGES } from "@/lib/docs/nav";

function isActive(pathname: string, href: string) {
  if (href === "/docs") return pathname === "/docs";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function GuideNav({ variant }: { variant: "side" | "mobile" }) {
  const pathname = usePathname();
  const links = (
    <ul>
      {DOC_PAGES.map((page) => (
        <li key={page.href}>
          <Link href={page.href} aria-current={isActive(pathname, page.href) ? "page" : undefined}>
            {page.label}
          </Link>
        </li>
      ))}
    </ul>
  );

  if (variant === "mobile") {
    const current = DOC_PAGES.find((page) => isActive(pathname, page.href));
    return (
      <details className="guide-mobile">
        <summary>{current?.label ?? "Docs"}</summary>
        {links}
      </details>
    );
  }

  return (
    <nav className="guide-side" aria-label="Documentation">
      <p className="guide-side-label">Docs</p>
      {links}
      <p className="guide-side-label">Elsewhere</p>
      <ul>
        <li>
          <Link href="/">Package landing</Link>
        </li>
        <li>
          <Link href="/book">/book</Link>
        </li>
        <li>
          <a href="https://github.com/allangmr/inherit">GitHub</a>
        </li>
      </ul>
    </nav>
  );
}
