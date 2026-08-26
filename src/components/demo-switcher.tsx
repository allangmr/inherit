"use client";

import Link from "next/link";
import { Suspense } from "react";
import { usePathname, useSearchParams } from "next/navigation";

const demos = [
  { href: "/demo/atelier", label: "Appointment" },
  { href: "/demo/studio", label: "Creative brief" },
  { href: "/demo/compare", label: "Compare" },
];

function DemoSwitcherNav() {
  const pathname = usePathname();
  const inspect = useSearchParams().get("inspect") === "1";
  const suffix = inspect ? "?inspect=1" : "";

  return (
    <nav className="inh-switcher" aria-label="Judge demos">
      {demos.map((demo) => (
        <Link key={demo.href} href={`${demo.href}${suffix}`} data-active={pathname === demo.href}>
          {demo.label}
        </Link>
      ))}
      <Link href={`${pathname}?inspect=1`} data-active={inspect}>
        Inspector
      </Link>
    </nav>
  );
}

export function DemoSwitcher() {
  return (
    <Suspense fallback={null}>
      <DemoSwitcherNav />
    </Suspense>
  );
}
