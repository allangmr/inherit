import Link from "next/link";
import { adjacentDocs } from "@/lib/docs/nav";

export function GuidePager({ href }: { href: string }) {
  const { previous, next } = adjacentDocs(href);
  return (
    <nav className="guide-pager" aria-label="Adjacent pages">
      {previous ? (
        <Link href={previous.href}>
          <span>Previous</span>
          {previous.label}
        </Link>
      ) : (
        <span />
      )}
      {next ? (
        <Link href={next.href} data-dir="next">
          <span>Next</span>
          {next.label}
        </Link>
      ) : (
        <span />
      )}
    </nav>
  );
}
