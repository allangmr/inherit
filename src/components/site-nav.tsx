import Link from "next/link";

const links = [
  { href: "/docs", label: "Docs" },
  { href: "/demo/atelier", label: "Appointment" },
  { href: "/demo/studio", label: "Brief" },
  { href: "/book", label: "ChatGPT" },
  { href: "/lab", label: "Lab", wide: true },
  { href: "/demo/compare", label: "Compare", wide: true },
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
          <Link
            key={link.href}
            href={link.href}
            className={`opacity-80 hover:opacity-100${link.wide ? " hidden md:inline" : ""}`}
          >
            {link.label}
          </Link>
        ))}
        <a
          href="https://github.com/allangmr/inherit"
          className="opacity-80 hover:opacity-100"
        >
          GitHub
        </a>
        <Link
          href="/demo/atelier"
          className={`rounded-full px-3.5 py-1.5 no-underline ${
            inverted ? "bg-[#b8431f] text-[#fff8ee]" : "bg-white/10 text-[#f4f1ea]"
          }`}
        >
          Open demo
        </Link>
      </nav>
    </header>
  );
}
