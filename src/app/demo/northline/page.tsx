import { DemoSwitcher } from "@/components/demo-switcher";
import { InheritForm } from "@/components/inherit-form";
import Link from "next/link";

export const metadata = {
  title: "Northline · Schedule a consult",
  description: "Sharp SaaS host demo. Same Inherit runtime, different tokens.",
};

export default function NorthlinePage() {
  return (
    <div className="northline-page min-h-screen">
      <DemoSwitcher />
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
            Same runtime. This host just happens to book intake.
          </h1>
          <p className="mt-4 max-w-md text-sm leading-6 text-[#8b97a8]">
            Northline is the sharp-SaaS twin of Atelier Lumen. Same workflow engine, same WebMCP
            capabilities, different tokens.
          </p>
        </section>
        <section>
          <InheritForm preset="northline" compact sessionKey="northline-host" />
        </section>
      </main>
    </div>
  );
}
