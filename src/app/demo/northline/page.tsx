import Link from "next/link";
import { InheritForm } from "@/components/inherit-form";

export const metadata = {
  title: "Northline · Schedule a consult",
  description: "Sharp SaaS host demo. Inherit picks up hairline radius, electric blue, and dense type.",
};

export default function NorthlinePage() {
  return (
    <div className="northline-page min-h-screen">
      <header className="flex items-center justify-between border-b border-white/10 px-6 py-4 md:px-8">
        <div className="flex items-center gap-3">
          <span className="grid h-7 w-7 place-items-center bg-[#2f6dff] text-[11px] font-semibold">
            N
          </span>
          <div>
            <p className="text-sm font-semibold tracking-tight">Northline</p>
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#8b97a8]">
              Care operations
            </p>
          </div>
        </div>
        <nav className="flex items-center gap-5 font-mono text-[11px] uppercase tracking-[0.14em] text-[#8b97a8]">
          <span>Census</span>
          <span>Slots</span>
          <Link href="/" className="text-[#3ee0c5]">
            Inherit
          </Link>
        </nav>
      </header>

      <main className="mx-auto grid max-w-6xl gap-10 px-6 py-10 md:grid-cols-[0.9fr_1.1fr] md:px-8">
        <section>
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-[#3ee0c5]">
            Clinic / 30:00
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-[-0.04em]">
            Schedule intake without a second UI.
          </h1>
          <p className="mt-4 max-w-md text-sm leading-6 text-[#8b97a8]">
            Northline is the sharp-SaaS twin of Atelier Lumen. Same booking engine, same WebMCP
            tools, different tokens: 2px corners, IBM Plex, and a near-black canvas.
          </p>
          <ul className="mt-8 space-y-3 font-mono text-xs text-[#8b97a8]">
            <li className="flex justify-between border-b border-white/10 py-2">
              <span>Provider</span>
              <span className="text-[#e8eef7]">file calendar</span>
            </li>
            <li className="flex justify-between border-b border-white/10 py-2">
              <span>Slot size</span>
              <span className="text-[#e8eef7]">30 min</span>
            </li>
            <li className="flex justify-between border-b border-white/10 py-2">
              <span>Concurrency</span>
              <span className="text-[#e8eef7]">max 3</span>
            </li>
            <li className="flex justify-between border-b border-white/10 py-2">
              <span>Agent surface</span>
              <span className="text-[#3ee0c5]">5 tools / this document</span>
            </li>
          </ul>
        </section>
        <section>
          <InheritForm preset="northline" compact />
        </section>
      </main>
    </div>
  );
}
