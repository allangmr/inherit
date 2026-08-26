import Link from "next/link";

const links = [
  { href: "/book", label: "Book" },
  { href: "/demo/atelier", label: "Atelier" },
  { href: "/demo/northline", label: "Northline" },
];

export function SiteNav({ inverted = false }: { inverted?: boolean }) {
  return (
    <header className="flex items-center justify-between gap-6 px-6 py-5 md:px-10">
      <Link href="/" className="flex items-center gap-2.5 no-underline">
        <span
          aria-hidden="true"
          className={`grid h-8 w-8 place-items-center rounded-lg text-sm font-semibold ${
            inverted ? "bg-[#2b1d12] text-[#fff8ee]" : "bg-[#7c5cff] text-white"
          }`}
        >
          In
        </span>
        <span className="text-sm font-semibold tracking-tight">Inherit</span>
      </Link>
      <nav className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
        {links.map((link) => (
          <Link key={link.href} href={link.href} className="opacity-80 hover:opacity-100">
            {link.label}
          </Link>
        ))}
        <Link
          href="/book"
          className={`rounded-full px-3.5 py-1.5 no-underline ${
            inverted ? "bg-[#b8431f] text-[#fff8ee]" : "bg-white/10 text-[#f4f1ea]"
          }`}
        >
          Open form
        </Link>
      </nav>
    </header>
  );
}
